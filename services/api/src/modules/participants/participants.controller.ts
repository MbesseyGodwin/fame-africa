import { Request, Response, NextFunction } from 'express'
import * as crypto from 'crypto'
import * as ParticipantsService from './participants.service'
import { ApiResponse } from '../../utils/response'
import { logger } from '../../utils/logger'

export async function listParticipants(req: Request, res: Response, next: NextFunction) {
  try {
    const { cycleId, page = '1', limit = '20', search } = req.query as Record<string, string>
    const userId = (req as any).user?.id
    const result = await ParticipantsService.listActiveParticipants(
      cycleId, parseInt(page), parseInt(limit), search, userId
    )
    return ApiResponse.paginated(res, result.participants, result.total, result.page, result.limit)
  } catch (error) { next(error) }
}

export async function getParticipant(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params
    const userId = (req as any).user?.id // Extract if available
    
    if (!slug || slug === 'undefined') {
      return res.status(400).json({ message: 'Invalid slug' })
    }
    const participant = await ParticipantsService.getParticipantBySlug(slug, userId)
    return ApiResponse.success(res, participant)
  } catch (error) { next(error) }
}

export async function registerAsParticipant(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user.id
  logger.info(`[Registration] Starting for user: ${userId}`)
  
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[]
    
    let photoBuffer: Buffer | undefined
    let photoMimeType: string | undefined
    let videoBuffer: Buffer | undefined
    let videoMimeType: string | undefined

    if (files) {
      if (Array.isArray(files)) {
        logger.warn(`[Registration] Multi-file array format received (unexpected)`)
      } else {
        if (files['photo'] && files['photo'][0]) {
          photoBuffer = files['photo'][0].buffer
          photoMimeType = files['photo'][0].mimetype
          logger.info(`[Registration] Photo received: ${files['photo'][0].size} bytes`)
        }
        if (files['video'] && files['video'][0]) {
          videoBuffer = files['video'][0].buffer
          videoMimeType = files['video'][0].mimetype
          logger.info(`[Registration] Video received: ${files['video'][0].size} bytes`)
        }
      }
    }

    const result = await ParticipantsService.registerAsParticipant({ 
      userId, 
      ...req.body,
      photoBuffer,
      photoMimeType,
      videoBuffer,
      videoMimeType
    })
    
    logger.info(`[Registration] Success for user: ${userId}`)
    return ApiResponse.created(res, result, 'Registration successful')
  } catch (error: any) { 
    logger.error(`[Registration] Failed for user: ${userId}`, { error: error.message })
    next(error) 
  }
}


export async function getMyDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id
    const dashboard = await ParticipantsService.getParticipantDashboard(userId)
    return ApiResponse.success(res, dashboard)
  } catch (error) { next(error) }
}

export async function getMyAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id
    const analytics = await ParticipantsService.getParticipantAnalytics(userId)
    return ApiResponse.success(res, analytics)
  } catch (error) { next(error) }
}

export async function generateMyCard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id
    const participant = await ParticipantsService.getParticipantDashboard(userId)
    const cardPath = await ParticipantsService.generateParticipantCard(participant.participant.id)
    return ApiResponse.success(res, { campaignCardUrl: cardPath }, 'Campaign card generated successfully')
  } catch (error) { next(error) }
}

export async function updateMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id
    const updated = await ParticipantsService.updateParticipantProfile(userId, req.body)
    return ApiResponse.success(res, updated, 'Profile updated successfully')
  } catch (error) { next(error) }
}

export async function handlePaymentWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers['verif-hash'] as string
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET || process.env.FLUTTERWAVE_SECRET_HASH

    if (!signature || signature !== secretHash) {
      logger.warn('Invalid Flutterwave webhook signature/hash')
      return res.status(401).json({ message: 'Invalid signature' })
    }

    const { event, data } = req.body

    // Flutterwave commonly sends "charge.completed"
    if (event === 'charge.completed' && data.status === 'successful') {
      const participantId = data.meta?.participantId || data.customer?.metadata?.participantId
      const reference = data.tx_ref || data.flw_ref
      const amount = data.amount

      if (participantId) {
        await ParticipantsService.confirmPaymentAndActivate(participantId, reference, amount)
        logger.info(`Payment of ₦${amount} confirmed for participant ${participantId}`)
      }
    }

    return res.status(200).json({ received: true })
  } catch (error) { next(error) }
}

export async function requestWithdrawal(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id
    await ParticipantsService.requestWithdrawal(userId)
    return ApiResponse.success(res, null, 'Withdrawal email sent. Check your inbox for the confirmation token.')
  } catch (error) { next(error) }
}

export async function confirmWithdrawal(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id
    const { token } = req.body
    await ParticipantsService.confirmWithdrawal(userId, token)
    return ApiResponse.success(res, null, 'You have been successfully withdrawn from the competition.')
  } catch (error) { next(error) }
}

export async function getMyAiAdvice(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id
    const advice = await ParticipantsService.getAiAdvice(userId)
    return ApiResponse.success(res, advice)
  } catch (error) { next(error) }
}
