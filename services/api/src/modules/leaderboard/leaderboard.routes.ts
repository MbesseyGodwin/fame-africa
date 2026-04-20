// services/api/src/modules/leaderboard/leaderboard.routes.ts

import { Router } from 'express'
import { Request, Response, NextFunction } from 'express'
import { prisma } from '../../index'
import { ApiResponse } from '../../utils/response'

export const leaderboardRouter = Router()

// GET /leaderboard — Current cycle leaderboard
leaderboardRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '50' } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const cycle = await prisma.competitionCycle.findFirst({
      where: { status: { in: ['VOTING_OPEN', 'REGISTRATION_OPEN'] } },
      orderBy: { createdAt: 'desc' },
    })
    if (!cycle) return ApiResponse.success(res, { leaderboard: [], cycle: null })

    const [participants, total] = await Promise.all([
      prisma.participant.findMany({
        where: { cycleId: cycle.id, status: { in: ['ACTIVE', 'ELIMINATED', 'WINNER'] } },
        select: {
          id: true,
          displayName: true,
          photoUrl: true,
          category: true,
          state: true,
          city: true,
          totalVotes: true,
          stanCount: true,
          status: true,
          voteLinkSlug: true,
        },
        orderBy: { totalVotes: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.participant.count({
        where: { cycleId: cycle.id, status: { in: ['ACTIVE', 'ELIMINATED', 'WINNER'] } },
      }),
    ])

    const leaderboard = participants.map((p, i) => ({
      rank: skip + i + 1,
      ...p,
    }))

    return res.json({
      success: true,
      message: 'Success',
      data: { leaderboard, cycle: { id: cycle.id, cycleName: cycle.cycleName, status: cycle.status } },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    })
  } catch (error) { next(error) }
})

// GET /leaderboard/daily — Today's vote rankings
leaderboardRouter.get('/daily', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cycle = await prisma.competitionCycle.findFirst({
      where: { status: 'VOTING_OPEN' },
      orderBy: { createdAt: 'desc' },
    })
    if (!cycle) return ApiResponse.success(res, [])

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const tallies = await prisma.dailyVoteTally.findMany({
      where: { cycleId: cycle.id, voteDate: today, participant: { status: 'ACTIVE' } },
      include: {
        participant: {
          select: {
            displayName: true,
            photoUrl: true,
            category: true,
            voteLinkSlug: true,
            totalVotes: true,
            stanCount: true,
          },
        },
      },
      orderBy: { voteCount: 'desc' },
    })

    const leaderboard = tallies.map((t, i) => ({
      rank: i + 1,
      participantId: t.participantId,
      todayVotes: t.voteCount,
      cumulativeVotes: t.cumulativeVotes,
      ...t.participant,
    }))

    return ApiResponse.success(res, leaderboard)
  } catch (error) { next(error) }
})

// GET /leaderboard/:cycleId — Leaderboard for a specific cycle
leaderboardRouter.get('/:cycleId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cycleId } = req.params
    const { page = '1', limit = '50' } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const cycle = await prisma.competitionCycle.findUnique({ where: { id: cycleId } })
    if (!cycle) return ApiResponse.notFound(res, 'Cycle not found')

    const [participants, total] = await Promise.all([
      prisma.participant.findMany({
        where: { cycleId, status: { in: ['ACTIVE', 'ELIMINATED', 'WINNER'] } },
        select: {
          id: true,
          displayName: true,
          photoUrl: true,
          category: true,
          state: true,
          city: true,
          totalVotes: true,
          stanCount: true,
          status: true,
          voteLinkSlug: true,
          finalRank: true,
        },
        orderBy: { totalVotes: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.participant.count({
        where: { cycleId, status: { in: ['ACTIVE', 'ELIMINATED', 'WINNER'] } },
      }),
    ])

    const leaderboard = participants.map((p, i) => ({
      rank: p.finalRank || skip + i + 1,
      ...p,
    }))

    return res.json({
      success: true,
      message: 'Success',
      data: { leaderboard, cycle: { id: cycle.id, cycleName: cycle.cycleName, status: cycle.status } },
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
    })
  } catch (error) { next(error) }
})
