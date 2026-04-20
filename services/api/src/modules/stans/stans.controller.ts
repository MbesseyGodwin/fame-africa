import { Request, Response, NextFunction } from 'express'
import * as StansService from './stans.service'
import { ApiResponse } from '../../utils/response'
import { logger } from '../../utils/logger'

export async function stanContestant(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user.id
  const { participantId } = req.body
  
  try {
    const stan = await StansService.stanContestant(userId, participantId)
    return ApiResponse.success(res, stan, 'You are now stanning this contestant!')
  } catch (error) { next(error) }
}

export async function unstanContestant(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user.id
  const { participantId } = req.params
  
  try {
    await StansService.unstanContestant(userId, participantId)
    return ApiResponse.success(res, null, 'Unstanned successfully')
  } catch (error) { next(error) }
}

export async function getParticipantStans(req: Request, res: Response, next: NextFunction) {
  const { participantId } = req.params
  
  try {
    const stans = await StansService.getParticipantStans(participantId)
    return ApiResponse.success(res, stans)
  } catch (error) { next(error) }
}

export async function getMyStans(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user.id
  
  try {
    const stans = await StansService.getMyStans(userId)
    return ApiResponse.success(res, stans)
  } catch (error) { next(error) }
}
