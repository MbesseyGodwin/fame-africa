import { Router } from 'express'
import * as StansController from './stans.controller'
import { authenticate } from '../../middleware/auth.middleware'
import { prisma } from '../../index'
import { ApiResponse } from '../../utils/response'

const stansRouter = Router()

stansRouter.post('/', authenticate, StansController.stanContestant)
stansRouter.get('/me', authenticate, StansController.getMyStans)
stansRouter.delete('/:participantId', authenticate, StansController.unstanContestant)
stansRouter.get('/participant/:participantId', StansController.getParticipantStans)

// Check if current user is stanning a participant (for UI toggle)
stansRouter.get('/check/:participantId', authenticate, async (req: any, res: any, next: any) => {
  try {
    const stan = await prisma.stan.findUnique({
      where: {
        userId_participantId: {
          userId: req.user.id,
          participantId: req.params.participantId,
        },
      },
    })
    return ApiResponse.success(res, { isStanning: !!stan })
  } catch (error) { next(error) }
})

export { stansRouter }
