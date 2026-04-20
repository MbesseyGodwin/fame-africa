// ── eliminations.routes.ts ────────────────────────────────────
import { Router } from 'express'
import { prisma } from '../../index'
import { ApiResponse } from '../../utils/response'

export const eliminationsRouter = Router()

eliminationsRouter.get('/current-cycle', async (req, res, next) => {
  try {
    const cycle = await prisma.competitionCycle.findFirst({
      where: { status: 'VOTING_OPEN' },
    })
    if (!cycle) return ApiResponse.success(res, [])
    const eliminations = await prisma.elimination.findMany({
      where: { cycleId: cycle.id },
      include: { participant: { select: { displayName: true, photoUrl: true, city: true, state: true } } },
      orderBy: { eliminationDate: 'desc' },
    })
    return ApiResponse.success(res, eliminations)
  } catch (error) { next(error) }
})

eliminationsRouter.get('/today', async (req, res, next) => {
  try {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const eliminations = await prisma.elimination.findMany({
      where: { eliminationDate: today },
      include: { participant: { select: { displayName: true, photoUrl: true } } },
    })
    return ApiResponse.success(res, eliminations)
  } catch (error) { next(error) }
})

// GET /eliminations/:id — Single elimination detail
eliminationsRouter.get('/:id', async (req, res, next) => {
  try {
    const elimination = await prisma.elimination.findUnique({
      where: { id: req.params.id },
      include: {
        participant: {
          select: {
            displayName: true, photoUrl: true, category: true,
            state: true, city: true, totalVotes: true, voteLinkSlug: true,
          },
        },
        cycle: { select: { cycleName: true, status: true } },
      },
    })
    if (!elimination) return ApiResponse.notFound(res, 'Elimination not found')
    return ApiResponse.success(res, elimination)
  } catch (error) { next(error) }
})
