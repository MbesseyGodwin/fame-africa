// services/api/src/modules/streaming/streaming.routes.ts

import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware'
import { streamingController } from './streaming.controller'
import { body, query } from 'express-validator'
import { validateRequest } from '../../middleware/validate.middleware'

export const streamingRouter = Router()

/**
 * GET /api/v1/streaming/token
 * Generates an Agora RTC token for joining a channel.
 * Audience or Host.
 */
streamingRouter.get('/token',
  authenticate,
  [
    query('channelName').notEmpty().withMessage('Channel name required'),
    query('role').optional().isIn(['PUBLISHER', 'SUBSCRIBER'])
  ],
  validateRequest,
  streamingController.getToken
)

/**
 * POST /api/v1/streaming/start
 * Starts a new stream session (Contestants only).
 */
streamingRouter.post('/start',
  authenticate,
  [
    body('participantId').notEmpty().withMessage('Participant ID required'),
    body('title').notEmpty().withMessage('Stream title required')
  ],
  validateRequest,
  streamingController.startStream
)

/**
 * POST /api/v1/streaming/:streamId/end
 * Ends a live stream session.
 */
streamingRouter.post('/:streamId/end',
  authenticate,
  streamingController.endStream
)

/**
 * GET /api/v1/streaming/live
 * Public feed of all current live streams.
 */
streamingRouter.get('/live',
  streamingController.listLive
)

/**
 * POST /api/v1/streaming/webhook/agora
 * Webhook called by Agora when recording finishes.
 */
streamingRouter.post('/webhook/agora',
  streamingController.handleAgoraWebhook
)
