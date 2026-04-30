// services/api/src/modules/participants/participants.routes.ts

import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { validateRequest } from '../../middleware/validate.middleware'
import { authenticate, optionalAuthenticate } from '../../middleware/auth.middleware'
import { prisma } from '../../index'
import { ApiResponse } from '../../utils/response'
import * as ParticipantsController from './participants.controller'
import * as ParticipantVideosController from './participant-videos.controller'
import { upload } from '../../middleware/upload'

export const participantsRouter = Router()

// Discovery
participantsRouter.get('/discovery/videos', optionalAuthenticate, ParticipantVideosController.getDiscoveryFeed)

// Public Video Interaction
participantsRouter.get('/videos/:videoId/comments', ParticipantVideosController.getComments)
participantsRouter.post('/videos/:videoId/like', authenticate, ParticipantVideosController.toggleLike)
participantsRouter.post('/videos/:videoId/comments', authenticate, ParticipantVideosController.addComment)

// Public
participantsRouter.get('/', ParticipantsController.listParticipants)

// Search participants (must be BEFORE /:slug to avoid path collision)
participantsRouter.get('/search', async (req: any, res: any, next: any) => {
  try {
    const { q, category, state, cycleId, page = '1', limit = '20' } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where: any = { status: { in: ['ACTIVE', 'WINNER'] } }
    if (cycleId) where.cycleId = cycleId
    if (category) where.category = category
    if (state) where.state = { contains: state, mode: 'insensitive' }
    if (q) {
      where.OR = [
        { displayName: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { state: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [participants, total] = await Promise.all([
      prisma.participant.findMany({
        where,
        select: {
          id: true, displayName: true, photoUrl: true, category: true,
          state: true, city: true, totalVotes: true, stanCount: true,
          voteLinkSlug: true, status: true,
        },
        orderBy: { totalVotes: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.participant.count({ where }),
    ])

    return ApiResponse.paginated(res, participants, total, parseInt(page), parseInt(limit))
  } catch (error) { next(error) }
})

participantsRouter.get('/:slug', [param('slug').trim().notEmpty()], optionalAuthenticate, validateRequest, ParticipantsController.getParticipant)

// Public vote info for a participant
participantsRouter.get('/:slug/votes', async (req: any, res: any, next: any) => {
  try {
    const participant = await prisma.participant.findUnique({
      where: { voteLinkSlug: req.params.slug },
      select: { id: true, displayName: true, totalVotes: true, cycleId: true },
    })
    if (!participant) return ApiResponse.notFound(res, 'Participant not found')

    const tallies = await prisma.dailyVoteTally.findMany({
      where: { participantId: participant.id },
      select: { dayNumber: true, voteDate: true, voteCount: true, cumulativeVotes: true },
      orderBy: { voteDate: 'desc' },
      take: 14,
    })

    return ApiResponse.success(res, {
      displayName: participant.displayName,
      totalVotes: participant.totalVotes,
      dailyTrend: tallies,
    })
  } catch (error) { next(error) }
})

// Public stan count for a participant
participantsRouter.get('/:slug/stans', async (req: any, res: any, next: any) => {
  try {
    const participant = await prisma.participant.findUnique({
      where: { voteLinkSlug: req.params.slug },
      select: { id: true, displayName: true, stanCount: true },
    })
    if (!participant) return ApiResponse.notFound(res, 'Participant not found')

    const recentStans = await prisma.stan.findMany({
      where: { participantId: participant.id },
      select: {
        createdAt: true,
        user: { select: { displayName: true, photoUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return ApiResponse.success(res, {
      displayName: participant.displayName,
      stanCount: participant.stanCount,
      recentStans,
    })
  } catch (error) { next(error) }
})

// Public top fans/supporters for a participant
participantsRouter.get('/:slug/top-fans', async (req: any, res: any, next: any) => {
  try {
    const participant = await prisma.participant.findUnique({
      where: { voteLinkSlug: req.params.slug },
      select: { id: true }
    })
    if (!participant) return ApiResponse.notFound(res, 'Participant not found')

    const { getTopSupporters } = await import('./participants.service')
    const supporters = await getTopSupporters(participant.id)

    return ApiResponse.success(res, supporters)
  } catch (error) { next(error) }
})

// Authenticated
participantsRouter.post('/register',
  authenticate,
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]) as any,
  [
    body('cycleId').notEmpty().withMessage('Cycle ID is required'),
    body('displayName').trim().isLength({ min: 2, max: 50 }).withMessage('Display name (2-50 chars) is required'),
    body('bio').trim().isLength({ min: 10, max: 500 }).withMessage('Bio (min 10 chars) is required'),
    body('state').trim().notEmpty().withMessage('State is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
  ],
  validateRequest,
  ParticipantsController.registerAsParticipant
)

participantsRouter.get('/me/dashboard', authenticate, ParticipantsController.getMyDashboard)
participantsRouter.get('/me/analytics', authenticate, ParticipantsController.getMyAnalytics)
participantsRouter.post('/me/generate-card', authenticate, ParticipantsController.generateMyCard)
participantsRouter.put('/me/profile', 
  authenticate, 
  upload.single('photo') as any,
  [
    body('displayName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Display name must be 2-50 characters'),
    body('bio').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('Bio must be at least 10 characters'),
    body('state').optional().trim().notEmpty().withMessage('State is required'),
    body('city').optional().trim().notEmpty().withMessage('City is required'),
    body('nationality').optional().trim().notEmpty().withMessage('Nationality is required'),
    body('instagramUrl').optional().trim().isLength({ max: 100 }),
    body('twitterUrl').optional().trim().isLength({ max: 100 }),
    body('tiktokUrl').optional().trim().isLength({ max: 100 }),
    body('youtubeUrl').optional().trim().isLength({ max: 100 }),
  ],
  validateRequest,
  ParticipantsController.updateMyProfile
)
participantsRouter.get('/me/ai-advice', authenticate, ParticipantsController.getMyAiAdvice)
participantsRouter.post('/me/ai-advice', authenticate, ParticipantsController.generateMyAiAdvice)

// Video Management
participantsRouter.post('/me/videos', authenticate, ParticipantVideosController.addVideo)
participantsRouter.put('/me/videos/:videoId', authenticate, ParticipantVideosController.updateVideo)
participantsRouter.delete('/me/videos/:videoId', authenticate, ParticipantVideosController.deleteVideo)

// ── Withdrawal ────────────────────────────────────────────────
// Step 1: Request a withdrawal token (sends email)
participantsRouter.post('/me/withdraw', authenticate, ParticipantsController.requestWithdrawal)

// Step 2: Confirm withdrawal using the emailed token
participantsRouter.post(
  '/me/withdraw/confirm',
  authenticate,
  body('token').trim().notEmpty().withMessage('Withdrawal token is required'),
  validateRequest,
  ParticipantsController.confirmWithdrawal
)

// Payment webhook
participantsRouter.post('/payment/webhook', ParticipantsController.handlePaymentWebhook)

