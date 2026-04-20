import { Request, Response, NextFunction } from 'express'
import * as SponsorsService from './sponsors.service'
import { ApiResponse } from '../../utils/response'

export async function getCycleSponsors(req: Request, res: Response, next: NextFunction) {
  try {
    const { cycleId } = req.params
    const sponsors = await SponsorsService.listCycleSponsors(cycleId)
    return ApiResponse.success(res, sponsors)
  } catch (error) { next(error) }
}

export async function trackAdClick(req: Request, res: Response, next: NextFunction) {
  try {
    const { sponsorId } = req.body
    await SponsorsService.trackAdImpression(sponsorId, req.ip)
    return ApiResponse.success(res, null, 'Impression tracked')
  } catch (error) { next(error) }
}

export async function getNextAd(req: Request, res: Response, next: NextFunction) {
  try {
    const { prisma } = await import('../../index')
    const cycle = await prisma.competitionCycle.findFirst({
      where: { status: { in: ['VOTING_OPEN', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED'] } },
      orderBy: { createdAt: 'desc' },
    })
    if (!cycle) return ApiResponse.success(res, null)
    const sponsor = await SponsorsService.getActiveSponsorForAd(cycle.id)
    return ApiResponse.success(res, sponsor)
  } catch (error) { next(error) }
}
