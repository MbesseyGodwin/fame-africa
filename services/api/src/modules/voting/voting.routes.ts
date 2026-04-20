// services/api/src/modules/voting/voting.routes.ts

import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { validateRequest } from '../../middleware/validate.middleware'
import { voteRateLimiter } from '../../middleware/rateLimiter.middleware'
import { authenticate } from '../../middleware/auth.middleware'
import { prisma } from '../../index'
import { ApiResponse } from '../../utils/response'
import * as VotingController from './voting.controller'

export const votingRouter = Router()

votingRouter.post('/send-otp',
  voteRateLimiter,
  [
    body('participantSlug').trim().notEmpty().withMessage('Participant slug required'),
    body('voterPhone').matches(/^\+?[0-9]{10,15}$/).withMessage('Valid phone required'),
    body('voterEmail').isEmail().normalizeEmail().withMessage('Valid email required'),
  ],
  validateRequest,
  VotingController.sendVoteOtp
)

votingRouter.post('/cast',
  voteRateLimiter,
  [
    body('participantSlug').trim().notEmpty(),
    body('voterPhone').matches(/^\+?[0-9]{10,15}$/),
    body('voterEmail').isEmail().normalizeEmail(),
    body('otpCode').isLength({ min: 6, max: 6 }).isNumeric(),
    body('deviceFingerprint').optional().isString(),
    body('source').optional().isIn(['link', 'app', 'web']),
  ],
  validateRequest,
  VotingController.castVote
)

votingRouter.get('/check/:phone',
  [param('phone').matches(/^\+?[0-9]{10,15}$/)],
  validateRequest,
  VotingController.checkVoted
)

// GET /votes/my-history — Authenticated user's vote history
votingRouter.get('/my-history', authenticate, async (req: any, res: any, next: any) => {
  try {
    const { page = '1', limit = '20' } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const userEmail = req.user.email
    const [votes, total] = await Promise.all([
      prisma.vote.findMany({
        where: { voterEmail: userEmail },
        select: {
          id: true,
          dayNumber: true,
          voteDate: true,
          source: true,
          createdAt: true,
          participant: { select: { displayName: true, photoUrl: true, voteLinkSlug: true, category: true } },
          cycle: { select: { cycleName: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.vote.count({ where: { voterEmail: userEmail } }),
    ])

    return ApiResponse.paginated(res, votes, total, parseInt(page), parseInt(limit))
  } catch (error) { next(error) }
})

// GET /votes/stats — Public vote statistics for current cycle
votingRouter.get('/stats', async (req: any, res: any, next: any) => {
  try {
    const cycle = await prisma.competitionCycle.findFirst({
      where: { status: { in: ['VOTING_OPEN'] } },
      orderBy: { createdAt: 'desc' },
    })
    if (!cycle) return ApiResponse.success(res, { totalVotes: 0, votesToday: 0, activeParticipants: 0 })

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const [totalVotes, votesToday, activeParticipants, uniqueVoters] = await Promise.all([
      prisma.vote.count({ where: { cycleId: cycle.id } }),
      prisma.vote.count({ where: { cycleId: cycle.id, voteDate: today } }),
      prisma.participant.count({ where: { cycleId: cycle.id, status: 'ACTIVE' } }),
      prisma.vote.groupBy({
        by: ['voterPhoneHash'],
        where: { cycleId: cycle.id },
      }),
    ])

    return ApiResponse.success(res, {
      cycleName: cycle.cycleName,
      totalVotes,
      votesToday,
      activeParticipants,
      uniqueVoters: uniqueVoters.length,
    })
  } catch (error) { next(error) }
})

// GET /votes/recent — Recent votes feed (anonymized)
votingRouter.get('/recent', async (req: any, res: any, next: any) => {
  try {
    const { limit = '15' } = req.query as Record<string, string>

    const votes = await prisma.vote.findMany({
      select: {
        id: true,
        source: true,
        createdAt: true,
        participant: { select: { displayName: true, voteLinkSlug: true, photoUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit), 50),
    })

    // Anonymize — just show "Someone voted for X"
    const feed = votes.map(v => ({
      id: v.id,
      message: `Someone voted for ${v.participant.displayName}`,
      participant: v.participant,
      source: v.source,
      time: v.createdAt,
    }))

    return ApiResponse.success(res, feed)
  } catch (error) { next(error) }
})

