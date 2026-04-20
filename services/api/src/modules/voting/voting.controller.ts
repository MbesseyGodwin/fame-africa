import { Request, Response, NextFunction } from 'express'
import * as VotingService from './voting.service'
import { ApiResponse } from '../../utils/response'

export async function sendVoteOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await VotingService.sendVoteOtp({
      ...req.body,
      ip: req.ip || '',
    })
    return ApiResponse.success(res, result, 'OTP sent to your phone')
  } catch (error) {
    next(error)
  }
}

export async function castVote(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await VotingService.castVote({
      ...req.body,
      ip: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    })
    return ApiResponse.success(res, result, 'Vote cast successfully')
  } catch (error) {
    next(error)
  }
}

export async function checkVoted(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone } = req.params
    const { cycleId } = req.query as { cycleId: string }
    const voted = await VotingService.checkIfVotedToday(phone, cycleId)
    return ApiResponse.success(res, { voted }, voted ? 'Already voted today' : 'Has not voted today')
  } catch (error) {
    next(error)
  }
}
