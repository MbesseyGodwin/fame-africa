// services/api/src/modules/moderation/report.controller.ts

import { Request, Response } from 'express'
import { moderationService } from './moderation.service'

export const reportController = {
  /**
   * Submits a new report.
   */
  async submitReport(req: Request, res: Response) {
    try {
      const { targetParticipantId, targetStreamId, reason } = req.body
      const reporterId = (req as any).user.id

      const report = await moderationService.createReport({
        reporterId,
        targetParticipantId,
        targetStreamId,
        reason
      })

      return res.status(201).json({
        success: true,
        data: report,
        message: 'Report submitted successfully for review'
      })
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message
      })
    }
  },

  /**
   * Admin: List all reports.
   */
  async listReports(req: Request, res: Response) {
    try {
      // Logic for checking admin role would go in a middleware
      const { status } = req.query as any
      const reports = await moderationService.getReports(status)

      return res.json({
        success: true,
        data: reports
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      })
    }
  },

  /**
   * Admin: Take action on a report.
   */
  async resolveReport(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { actionTaken } = req.body

      const report = await moderationService.resolveReport(id, actionTaken)

      return res.json({
        success: true,
        data: report,
        message: 'Report resolved'
      })
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message
      })
    }
  }
}
