// services/api/src/modules/payments/payments.controller.ts

import { Request, Response, NextFunction } from 'express'
import { PaymentsService } from './payments.service'
import { ApiResponse } from '../../utils/response'
import { validateWebhookHash } from '../../utils/flutterwave'

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

export async function verifyPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { transactionId, reference } = req.body
    const result = await PaymentsService.verifyTransaction(transactionId, reference)
    return ApiResponse.success(res, result)
  } catch (error) { next(error) }
}

export async function handleWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers['verif-hash'] as string
    
    if (!validateWebhookHash(signature)) {
      return res.status(401).send('Invalid signature')
    }

    const { event, data } = req.body

    if (event === 'charge.completed' && data.status === 'successful') {
      const { tx_ref, amount } = data
      await PaymentsService.handleSuccessfulPayment(tx_ref, amount)
    }

    return res.status(200).send('Webhook processed')
  } catch (error) { next(error) }
}
