// services/api/src/modules/competitions/competitions.routes.ts

// ── competitions.routes.ts ────────────────────────────────────
import { Router } from 'express'
import { prisma } from '../../index'
import { ApiResponse } from '../../utils/response'

export const competitionsRouter = Router()

competitionsRouter.get('/current', async (req, res, next) => {
  try {
    const cycle = await prisma.competitionCycle.findFirst({
      where: { status: { in: ['DRAFT', 'REGISTRATION_OPEN', 'VOTING_OPEN', 'REGISTRATION_CLOSED'] } },
      orderBy: { createdAt: 'desc' },
    })
    return ApiResponse.success(res, cycle)
  } catch (error) { next(error) }
})

competitionsRouter.get('/:id', async (req, res, next) => {
  try {
    const cycle = await prisma.competitionCycle.findUnique({ where: { id: req.params.id } })
    return ApiResponse.success(res, cycle)
  } catch (error) { next(error) }
})

competitionsRouter.get('/:id/stats', async (req, res, next) => {
  try {
    const { id } = req.params
    const [total, active, eliminated, totalVotes] = await Promise.all([
      prisma.participant.count({ where: { cycleId: id } }),
      prisma.participant.count({ where: { cycleId: id, status: 'ACTIVE' } }),
      prisma.participant.count({ where: { cycleId: id, status: 'ELIMINATED' } }),
      prisma.vote.count({ where: { cycleId: id } }),
    ])
    return ApiResponse.success(res, { total, active, eliminated, totalVotes })
  } catch (error) { next(error) }
})

// GET /competitions — List all competition cycles (public archive)
competitionsRouter.get('/all', async (req, res, next) => {
  try {
    const cycles = await prisma.competitionCycle.findMany({
      select: {
        id: true,
        cycleName: true,
        cycleNumber: true,
        status: true,
        description: true,
        bannerImageUrl: true,
        registrationOpen: true,
        votingOpen: true,
        votingClose: true,
        createdAt: true,
        _count: { select: { participants: true, votes: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return ApiResponse.success(res, cycles)
  } catch (error) { next(error) }
})

// GET /competitions/:id/winners — Get winners of a completed competition
competitionsRouter.get('/:id/winners', async (req, res, next) => {
  try {
    const { id } = req.params

    const cycle = await prisma.competitionCycle.findUnique({ where: { id } })
    if (!cycle) return ApiResponse.notFound(res, 'Cycle not found')

    const winners = await prisma.participant.findMany({
      where: {
        cycleId: id,
        status: { in: ['WINNER', 'ACTIVE'] },
      },
      select: {
        id: true,
        displayName: true,
        photoUrl: true,
        category: true,
        totalVotes: true,
        stanCount: true,
        finalRank: true,
        voteLinkSlug: true,
        state: true,
        city: true,
      },
      orderBy: [
        { finalRank: 'asc' },
        { totalVotes: 'desc' },
      ],
      take: 10,
    })

    return ApiResponse.success(res, { cycle: { id: cycle.id, cycleName: cycle.cycleName, status: cycle.status }, winners })
  } catch (error) { next(error) }
})

export async function getCycleSetting(cycleId: string, key: string): Promise<string | null> {
  const setting = await prisma.competitionSetting.findFirst({ where: { cycleId, key } })
  return setting?.value ?? null
}
