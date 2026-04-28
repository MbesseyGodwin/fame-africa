// services/api/src/modules/battles/battles.controller.ts

import { Request, Response, NextFunction } from 'express'
import { BattlesService } from './battles.service'
import { ApiResponse } from '../../utils/response'

export async function getActiveBattles(req: Request, res: Response, next: NextFunction) {
  try {
    const { cycleId } = req.query as Record<string, string>
    if (!cycleId) return res.status(400).json({ message: 'cycleId is required' })
    const battles = await BattlesService.getActiveBattles(cycleId)
    return ApiResponse.success(res, battles)
  } catch (error) { next(error) }
}

export async function requestBattleOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { battleId } = req.params
    const { participantId, voterEmail, voterPhone } = req.body
    const ip = req.ip
    const result = await BattlesService.sendBattleVoteOtp(battleId, participantId, voterEmail, voterPhone, ip)
    return ApiResponse.success(res, result)
  } catch (error) { next(error) }
}

export async function castBattleVote(req: Request, res: Response, next: NextFunction) {
  try {
    const { battleId } = req.params
    const { participantId, voterEmail, otpCode, voterPhone } = req.body
    const vote = await BattlesService.castBattleVote(battleId, participantId, voterEmail, otpCode, voterPhone)
    return ApiResponse.success(res, vote)
  } catch (error) { next(error) }
}

export async function getPastBattles(req: Request, res: Response, next: NextFunction) {
  try {
    const { cycleId } = req.query as Record<string, string>
    if (!cycleId) return res.status(400).json({ message: 'cycleId is required' })
    const battles = await BattlesService.getPastBattles(cycleId)
    return ApiResponse.success(res, battles)
  } catch (error) { next(error) }
}
