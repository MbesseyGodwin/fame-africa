// services/api/src/modules/arena/arena.routes.ts

import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { validateRequest } from '../../middleware/validate.middleware'
import { authenticate } from '../../middleware/auth.middleware'
import * as ArenaController from './arena.controller'

export const arenaRouter = Router()

arenaRouter.get(
  '/events',
  [query('cycleId').notEmpty().withMessage('Cycle ID is required')],
  validateRequest,
  ArenaController.listEvents
)

/**
 * @route   GET /api/v1/arena/events/:id
 * @desc    Get event detail with questions
 */
arenaRouter.get(
  '/events/:id',
  [param('id').notEmpty().withMessage('Event ID is required')],
  validateRequest,
  ArenaController.getDetail
)

/**
 * @route   POST /api/v1/arena/events
 * @desc    Create a new Arena event (Admin only)
 */
arenaRouter.post(
  '/events',
  authenticate,
  [
    body('cycleId').notEmpty().withMessage('Cycle ID is required'),
    body('title').trim().notEmpty().withMessage('Event title is required'),
    body('scheduledAt').isISO8601().withMessage('Valid ISO8601 date is required'),
  ],
  validateRequest,
  ArenaController.createEvent
)

/**
 * @route   POST /api/v1/arena/events/:id/live
 * @desc    Start the live Arena session (Admin only)
 */
arenaRouter.post(
  '/events/:id/live',
  authenticate,
  [param('id').notEmpty().withMessage('Event ID is required')],
  validateRequest,
  ArenaController.startLive
)

/**
 * @route   POST /api/v1/arena/submit
 * @desc    Submit an answer to an Arena question (Participant only)
 */
arenaRouter.post(
  '/submit',
  authenticate,
  [
    body('eventId').notEmpty().withMessage('Event ID is required'),
    body('questionId').notEmpty().withMessage('Question ID is required'),
    body('selectedOption').isInt({ min: 0 }).withMessage('Selected option index is required'),
    body('timeSpentSeconds').isInt({ min: 0 }).withMessage('Time spent is required'),
  ],
  validateRequest,
  ArenaController.submitAnswer
)

/**
 * @route   POST /api/v1/arena/events/:id/end
 * @desc    End the Arena session and process results (Admin only)
 */
arenaRouter.post(
  '/events/:id/end',
  authenticate,
  [param('id').notEmpty().withMessage('Event ID is required')],
  validateRequest,
  ArenaController.endEvent
)
