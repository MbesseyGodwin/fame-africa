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
 * POST /api/v1/streaming/bulk-delete
 * Deletes multiple stream sessions at once.
 */
streamingRouter.post('/bulk-delete',
  authenticate,
  [
    body('streamIds').isArray().withMessage('streamIds must be an array'),
    body('streamIds.*').isString().withMessage('Each streamId must be a string')
  ],
  validateRequest,
  streamingController.bulkDelete
)

/**
 * GET /api/v1/streaming/live
 * Public feed of all current live streams.
 */
streamingRouter.get('/live',
  streamingController.listLive
)

/**
 * POST /api/v1/streaming/webhook/mux
 * Webhook called by Mux when stream status or assets change.
 */
streamingRouter.post('/webhook/mux',
  streamingController.handleMuxWebhook
)

/**
 * POST /api/v1/streaming/webhook/agora
 * Webhook called by Agora when recording finishes (LEGACY).
 */
streamingRouter.post('/webhook/agora',
  streamingController.handleAgoraWebhook
)

/**
 * GET /api/v1/streaming/my-history
 * Gets streaming history for the logged-in contestant.
 */
streamingRouter.get('/my-history',
  authenticate,
  streamingController.getMyHistory
)

/**
 * GET /api/v1/streaming/participant/:participantId/history
 * Gets public stream history for a specific participant.
 */
streamingRouter.get('/participant/:participantId/history',
  streamingController.getParticipantHistory
)

/**
 * GET /api/v1/streaming/recorded
 * Public feed of all past recorded streams.
 */
streamingRouter.get('/recorded',
  streamingController.listRecorded
)

/**
 * GET /api/v1/streaming/:streamId/link
 * Gets a temporary Dropbox playback link for a recording.
 */
streamingRouter.get('/:streamId/link',
  streamingController.getRecordingLink
)

/**
 * DELETE /api/v1/streaming/:streamId
 * Deletes a specific stream session (Owner only).
 */
streamingRouter.delete('/:streamId',
  authenticate,
  streamingController.deleteStream
)
