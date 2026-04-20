// services/api/src/modules/moderation/moderation.routes.ts

import { Router } from 'express'
import { reportController } from './report.controller'
import { authenticate } from '../../middleware/auth.middleware'

const router = Router()

/**
 * @route POST /api/v1/moderation/reports
 * @desc Submit a new report
 * @access Private
 */
router.post('/reports', authenticate, reportController.submitReport)

/**
 * @route GET /api/v1/moderation/reports
 * @desc Get all reports (Admin only)
 * @access Private/Admin
 */
router.get('/reports', authenticate, reportController.listReports)

/**
 * @route PATCH /api/v1/moderation/reports/:id
 * @desc Resolve a report (Admin only)
 * @access Private/Admin
 */
router.patch('/reports/:id', authenticate, reportController.resolveReport)

export { router as moderationRouter }
