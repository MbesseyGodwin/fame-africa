// services/api/src/modules/moderation/moderation.service.ts

import { PrismaClient, ReportStatus } from '@prisma/client'
import { AppError } from '../../utils/errors'

const prisma = new PrismaClient()

export const moderationService = {
  /**
   * Creates a new report from a user.
   */
  async createReport(params: {
    reporterId: string
    targetParticipantId?: string
    targetStreamId?: string
    reason: string
  }) {
    if (!params.targetParticipantId && !params.targetStreamId) {
      throw new AppError('Report must target either a participant or a stream', 400)
    }

    return await prisma.report.create({
      data: {
        reporterId: params.reporterId,
        targetParticipantId: params.targetParticipantId,
        targetStreamId: params.targetStreamId,
        reason: params.reason,
        status: 'PENDING'
      }
    })
  },

  /**
   * Retrieves all reports for admins.
   */
  async getReports(status?: ReportStatus) {
    return await prisma.report.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: { displayName: true, email: true }
        }
      }
    })
  },

  /**
   * Resolves a report with an action taken.
   */
  async resolveReport(reportId: string, actionTaken: string) {
    return await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'RESOLVED',
        actionTaken,
        updatedAt: new Date()
      }
    })
  },

  /**
   * Administrative action to suspend/disqualify a participant.
   */
  async updateParticipantStatus(participantId: string, status: any, adminId: string) {
    // In a real app, verify adminId permissions here
    return await prisma.participant.update({
      where: { id: participantId },
      data: { status }
    })
  }
}
