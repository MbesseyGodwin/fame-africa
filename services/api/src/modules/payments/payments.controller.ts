// services/api/src/modules/payments/payments.controller.ts

import { Request, Response, NextFunction } from 'express'
import { PaymentsService } from './payments.service'
import { ApiResponse } from '../../utils/response'

export async function getMegaVotePackages(req: Request, res: Response, next: NextFunction) {
  try {
    const packages = await PaymentsService.getMegaVotePackages()
    return ApiResponse.success(res, packages)
  } catch (error) { next(error) }
}

export async function initializeMegaVote(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id
    const { participantId, amount, currency, reference, voteCount } = req.body

    const transaction = await PaymentsService.initializeTransaction({
      userId,
      participantId,
      amount,
      currency,
      type: 'MEGA_VOTE',
      reference,
      metadata: { voteCount }
    })

    return ApiResponse.success(res, transaction)
  } catch (error) { next(error) }
}
