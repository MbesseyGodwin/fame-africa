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

export async function voteInBattle(req: Request, res: Response, next: NextFunction) {
  try {
    const { battleId } = req.params
    const { participantId, voterPhone } = req.body
    const vote = await BattlesService.voteInBattle(battleId, participantId, voterPhone)
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
