import { Request, Response, NextFunction } from 'express'
import { prisma } from '../../index'
import { ApiResponse } from '../../utils/response'
import { logger } from '../../utils/logger'

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const activeCycle = await prisma.competitionCycle.findFirst({
      where: { status: { in: ['VOTING_OPEN', 'REGISTRATION_OPEN'] } },
      orderBy: { createdAt: 'desc' },
    })

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const [
      totalParticipants, activeParticipants, totalVotesToday,
      totalVotesAllTime, fraudFlags, eliminations,
    ] = await Promise.all([
      activeCycle ? prisma.participant.count({ where: { cycleId: activeCycle.id } }) : 0,
      activeCycle ? prisma.participant.count({ where: { cycleId: activeCycle.id, status: 'ACTIVE' } }) : 0,
      activeCycle ? prisma.vote.count({ where: { cycleId: activeCycle.id, voteDate: today } }) : 0,
      activeCycle ? prisma.vote.count({ where: { cycleId: activeCycle.id } }) : 0,
      prisma.fraudFlag.count({ where: { resolved: false } }),
      activeCycle ? prisma.elimination.count({ where: { cycleId: activeCycle.id } }) : 0,
    ])

    return ApiResponse.success(res, {
      activeCycle,
      stats: {
        totalParticipants, activeParticipants,
        totalVotesToday, totalVotesAllTime,
        fraudFlags, eliminations,
        dayNumber: activeCycle ? getDayNumber(activeCycle.votingOpen) : 0,
      },
    })
  } catch (error) { next(error) }
}

export async function getCycleSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await prisma.competitionSetting.findMany({
      where: { cycleId: req.params.cycleId },
      orderBy: { key: 'asc' },
    })
    return ApiResponse.success(res, settings)
  } catch (error) { next(error) }
}

export async function updateCycleSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { cycleId } = req.params
    const { settings } = req.body
    const adminId = (req as any).user.id

    const updated = []
    for (const setting of settings) {
      const existing = await prisma.competitionSetting.findFirst({
        where: { cycleId, key: setting.key },
      })

      if (existing?.isLocked) {
        logger.warn(`Admin ${adminId} attempted to update locked setting: ${setting.key}`)
        continue
      }

      const result = await prisma.competitionSetting.upsert({
        where: { cycleId_key: { cycleId, key: setting.key } },
        create: { cycleId, key: setting.key, value: String(setting.value), updatedById: adminId },
        update: {
          previousValue: existing?.value,
          value: String(setting.value),
          updatedById: adminId,
        },
      })
      updated.push(result)

      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'UPDATE_SETTING',
          entityType: 'CompetitionSetting',
          entityId: result.id,
          oldValue: existing ? { value: existing.value } : undefined,
          newValue: { value: setting.value },
        },
      })
    }

    return ApiResponse.success(res, updated, 'Settings updated')
  } catch (error) { next(error) }
}

export async function getGlobalSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await prisma.competitionSetting.findMany({
      where: { isGlobal: true },
    })
    return ApiResponse.success(res, settings)
  } catch (error) { next(error) }
}

export async function updateGlobalSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { settings } = req.body // Expects [{ key: string, value: any }]
    const adminId = (req as any).user.id

    const updated = []
    for (const setting of settings) {
      const existing = await prisma.competitionSetting.findFirst({
        where: { cycleId: null, isGlobal: true, key: setting.key },
      })

      if (existing) {
        const res = await prisma.competitionSetting.update({
          where: { id: existing.id },
          data: { 
            value: String(setting.value), 
            updatedById: adminId 
          },
        })
        updated.push(res)
      } else {
        const res = await prisma.competitionSetting.create({
          data: { 
            cycleId: null, 
            isGlobal: true, 
            key: setting.key, 
            value: String(setting.value), 
            updatedById: adminId 
          },
        })
        updated.push(res)
      }
    }

    return ApiResponse.success(res, updated, 'Global settings updated')
  } catch (error) { next(error) }
}

export async function listCycles(req: Request, res: Response, next: NextFunction) {
  try {
    const cycles = await prisma.competitionCycle.findMany({ orderBy: { createdAt: 'desc' } })
    return ApiResponse.success(res, cycles)
  } catch (error) { next(error) }
}

export async function createCycle(req: Request, res: Response, next: NextFunction) {
  try {
    const cycle = await prisma.competitionCycle.create({ data: req.body })
    return ApiResponse.created(res, cycle, 'Cycle created')
  } catch (error) { next(error) }
}

export async function updateCycle(req: Request, res: Response, next: NextFunction) {
  try {
    const cycle = await prisma.competitionCycle.update({
      where: { id: req.params.id },
      data: req.body,
    })
    return ApiResponse.success(res, cycle, 'Cycle updated')
  } catch (error) { next(error) }
}

export async function updateCycleStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const cycle = await prisma.competitionCycle.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    })
    return ApiResponse.success(res, cycle, 'Cycle status updated')
  } catch (error) { next(error) }
}

export async function deleteCycle(req: Request, res: Response, next: NextFunction) {
  try {
    // Check if there are participants mapping to this cycle
    const participantsCount = await prisma.participant.count({
      where: { cycleId: req.params.id }
    })

    if (participantsCount > 0) {
      return ApiResponse.error(res, 'Cannot delete cycle because it already has participants attached.', 400)
    }

    await prisma.competitionCycle.delete({
      where: { id: req.params.id }
    })

    return ApiResponse.success(res, null, 'Cycle deleted successfully')
  } catch (error) { next(error) }
}

export async function listAllParticipants(req: Request, res: Response, next: NextFunction) {
  try {
    const { cycleId, status, page = '1', limit = '50' } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [participants, total] = await Promise.all([
      prisma.participant.findMany({
        where: { ...(cycleId && { cycleId }), ...(status && { status: status as any }) },
        include: { user: { select: { email: true, phone: true } }, dailyTallies: { orderBy: { voteDate: 'desc' }, take: 1 } },
        skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
      }),
      prisma.participant.count({ where: { ...(cycleId && { cycleId }), ...(status && { status: status as any }) } }),
    ])

    const { getTemporaryLink } = await import('../../utils/dropboxUploader')
    const resolved = await Promise.all(participants.map(async (p) => ({
      ...p,
      photoUrl: p.photoUrl ? await getTemporaryLink(p.photoUrl) : null,
      videoUrl: p.videoUrl ? await getTemporaryLink(p.videoUrl) : null,
      campaignCardUrl: p.campaignCardUrl ? await getTemporaryLink(p.campaignCardUrl) : null,
    })))

    return ApiResponse.paginated(res, resolved, total, parseInt(page), parseInt(limit))
  } catch (error) { next(error) }
}

export async function updateParticipantStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const participant = await prisma.participant.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    })

    // Notify user of status change
    const { notificationService } = await import('../notifications/notification.service')
    await notificationService.notifyUser({
      userId: participant.userId,
      title: 'Status Updated',
      body: `Your participant status has been updated to ${req.body.status}.`,
      type: 'ADMIN_ACTION',
      emailSubject: `[FameAfrica] Status Update: ${req.body.status}`,
      emailHtml: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2 style="color: #534AB7;">Status Updated</h2>
          <p>Hello,</p>
          <p>Your participant status in the current competition has been updated to <strong>${req.body.status}</strong> by an administrator.</p>
          <p>If you have any questions, please reach out to support.</p>
        </div>
      `,
      cycleId: participant.cycleId
    })

    return ApiResponse.success(res, participant, 'Participant status updated')
  } catch (error) { next(error) }
}

export async function removeParticipant(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.participant.update({
      where: { id: req.params.id },
      data: { status: 'DISQUALIFIED' },
    })
    return ApiResponse.success(res, null, 'Participant removed')
  } catch (error) { next(error) }
}

export async function getLiveVotes(req: Request, res: Response, next: NextFunction) {
  try {
    const { cycleId } = req.query as { cycleId: string }
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const tallies = await prisma.dailyVoteTally.findMany({
      where: { cycleId, voteDate: today },
      include: { participant: { select: { displayName: true, status: true, voteLinkSlug: true } } },
      orderBy: { voteCount: 'desc' },
    })
    return ApiResponse.success(res, tallies)
  } catch (error) { next(error) }
}

export async function listVotes(req: Request, res: Response, next: NextFunction) {
  try {
    const { cycleId, limit = '100' } = req.query as { cycleId: string, limit: string }
    const votes = await prisma.vote.findMany({
      where: { ...(cycleId && { cycleId }) },
      include: { participant: { select: { displayName: true } } },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    })
    return ApiResponse.success(res, votes)
  } catch (error) { next(error) }
}

export async function getVoteStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { cycleId } = req.query as { cycleId: string }
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const total = await prisma.vote.count({ where: { cycleId, voteDate: today } })
    return ApiResponse.success(res, { total })
  } catch (error) { next(error) }
}

export async function getEliminations(req: Request, res: Response, next: NextFunction) {
  try {
    const { cycleId } = req.query as { cycleId: string }
    const eliminations = await prisma.elimination.findMany({
      where: { ...(cycleId && { cycleId }) },
      include: { participant: { select: { displayName: true, photoUrl: true, voteLinkSlug: true, totalVotes: true } } },
      orderBy: { eliminationDate: 'desc' },
    })
    return ApiResponse.success(res, eliminations)
  } catch (error) { next(error) }
}

export async function getEliminationQueue(req: Request, res: Response, next: NextFunction) {
  try {
    const { cycleId } = req.query as { cycleId: string }
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const setting = await prisma.competitionSetting.findFirst({
      where: { cycleId, key: 'eliminations_per_day' },
    })
    const count = parseInt(setting?.value || '1', 10)

    const tallies = await prisma.dailyVoteTally.findMany({
      where: { cycleId, voteDate: today, participant: { status: 'ACTIVE' } },
      include: { participant: { select: { displayName: true, totalVotes: true } } },
      orderBy: { voteCount: 'asc' },
      take: count + 5,
    })

    return ApiResponse.success(res, { queue: tallies, eliminationCount: count })
  } catch (error) { next(error) }
}

export async function triggerElimination(req: Request, res: Response, next: NextFunction) {
  try {
    logger.info(`Manual elimination triggered by admin: ${(req as any).user.id}`)
    return ApiResponse.success(res, null, 'Elimination triggered manually')
  } catch (error) { next(error) }
}

export async function getFraudFlags(req: Request, res: Response, next: NextFunction) {
  try {
    const flags = await prisma.fraudFlag.findMany({
      where: { resolved: false },
      include: { vote: { select: { voterPhone: true, participantId: true, ipAddress: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return ApiResponse.success(res, flags)
  } catch (error) { next(error) }
}

export async function resolveFraudFlag(req: Request, res: Response, next: NextFunction) {
  try {
    const flag = await prisma.fraudFlag.update({
      where: { id: req.params.id },
      data: {
        resolved: true,
        resolvedBy: (req as any).user.id,
        resolvedAt: new Date(),
        resolution: req.body.resolution,
      },
    })
    return ApiResponse.success(res, flag, 'Fraud flag resolved')
  } catch (error) { next(error) }
}

export async function getAuditLog(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '50' } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: { user: { select: { email: true, displayName: true } } },
        orderBy: { createdAt: 'desc' },
        skip, take: parseInt(limit),
      }),
      prisma.auditLog.count(),
    ])
    return ApiResponse.paginated(res, logs, total, parseInt(page), parseInt(limit))
  } catch (error) { next(error) }
}

export async function exportAuditLog(req: Request, res: Response, next: NextFunction) {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' }
    })

    const headers = ['ID', 'Date', 'Admin Email', 'Action', 'Entity Type', 'Entity ID', 'Old Value', 'New Value', 'IP Address']
    
    const rows = logs.map(log => [
      log.id,
      log.createdAt.toISOString(),
      log.user?.email || 'System',
      log.action,
      log.entityType,
      log.entityId || '',
      log.oldValue ? JSON.stringify(log.oldValue).replace(/"/g, '""') : '',
      log.newValue ? JSON.stringify(log.newValue).replace(/"/g, '""') : '',
      log.ipAddress || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs-export.csv')
    return res.send(csvContent)
  } catch (error) { next(error) }
}

export async function getSponsors(req: Request, res: Response, next: NextFunction) {
  try {
    const { cycleId } = req.query as { cycleId: string }
    const sponsors = await prisma.sponsor.findMany({
      where: { ...(cycleId && { cycleId }) },
      orderBy: { displayOrder: 'asc' },
    })
    return ApiResponse.success(res, sponsors)
  } catch (error) { next(error) }
}

export async function createSponsor(req: Request, res: Response, next: NextFunction) {
  try {
    const sponsor = await prisma.sponsor.create({ data: req.body })
    return ApiResponse.created(res, sponsor, 'Sponsor created')
  } catch (error) { next(error) }
}

export async function updateSponsor(req: Request, res: Response, next: NextFunction) {
  try {
    const sponsor = await prisma.sponsor.update({ where: { id: req.params.id }, data: req.body })
    return ApiResponse.success(res, sponsor, 'Sponsor updated')
  } catch (error) { next(error) }
}

export async function deleteSponsor(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.sponsor.delete({ where: { id: req.params.id } })
    return ApiResponse.success(res, null, 'Sponsor deleted')
  } catch (error) { next(error) }
}

// ── User Management ───────────────────────────────────────────

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '50', search, role } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where: any = {}
    if (role) where.role = role
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, phone: true, fullName: true, displayName: true,
          role: true, isActive: true, emailVerified: true, phoneVerified: true,
          lastLoginAt: true, createdAt: true,
          participant: { select: { id: true, status: true, totalVotes: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ])

    return ApiResponse.paginated(res, users, total, parseInt(page), parseInt(limit))
  } catch (error) { next(error) }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, email: true, phone: true, fullName: true, displayName: true,
        bio: true, photoUrl: true, role: true, isActive: true,
        emailVerified: true, phoneVerified: true,
        lastLoginAt: true, createdAt: true, updatedAt: true,
        participant: {
          select: {
            id: true, displayName: true, status: true, totalVotes: true,
            stanCount: true, category: true, voteLinkSlug: true, createdAt: true,
            photoUrl: true, videoUrl: true, campaignCardUrl: true,
          },
        },
        stans: { select: { participantId: true, createdAt: true }, take: 20 },
        notifications: { select: { id: true, type: true, title: true, createdAt: true }, take: 10, orderBy: { createdAt: 'desc' } },
      },
    })

    if (!user) return ApiResponse.notFound(res, 'User not found')

    const { getTemporaryLink } = await import('../../utils/dropboxUploader')
    if (user.photoUrl) user.photoUrl = await getTemporaryLink(user.photoUrl)
    if (user.participant) {
      if (user.participant.photoUrl) user.participant.photoUrl = await getTemporaryLink(user.participant.photoUrl)
      if (user.participant.videoUrl) (user.participant as any).videoUrl = await getTemporaryLink((user.participant as any).videoUrl)
      if (user.participant.campaignCardUrl) (user.participant as any).campaignCardUrl = await getTemporaryLink((user.participant as any).campaignCardUrl)
    }

    return ApiResponse.success(res, user)
  } catch (error) { next(error) }
}

export async function updateUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = req.body
    const adminId = (req as any).user.id

    if (req.params.id === adminId) {
      return ApiResponse.error(res, 'Cannot change your own role')
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, role: true },
    })

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'CHANGE_USER_ROLE',
        entityType: 'User',
        entityId: user.id,
        newValue: { role },
      },
    })

    return ApiResponse.success(res, user, 'User role updated')
  } catch (error) { next(error) }
}

export async function banUser(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = (req as any).user.id
    if (req.params.id === adminId) {
      return ApiResponse.error(res, 'Cannot ban yourself')
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
      select: { id: true, email: true, isActive: true },
    })

    // Send notification/email before they lose access
    const { notificationService } = await import('../notifications/notification.service')
    await notificationService.notifyUser({
      userId: user.id,
      title: 'Account Banned',
      body: 'Your account has been suspended for violating platform policies.',
      type: 'SYSTEM',
      emailSubject: '[FameAfrica] Account Suspension',
      emailHtml: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2 style="color: #DC2626;">Account Suspended</h2>
          <p>Hello,</p>
          <p>We are writing to inform you that your FameAfrica account has been suspended due to violations of our platform policies.</p>
          <p>As a result, you will no longer be able to participate in competitions or use the app.</p>
        </div>
      `
    })

    await prisma.auditLog.create({
      data: { userId: adminId, action: 'BAN_USER', entityType: 'User', entityId: user.id },
    })

    return ApiResponse.success(res, user, 'User has been banned')
  } catch (error) { next(error) }
}

export async function unbanUser(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = (req as any).user.id
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: true },
      select: { id: true, email: true, isActive: true },
    })

    await prisma.auditLog.create({
      data: { userId: adminId, action: 'UNBAN_USER', entityType: 'User', entityId: user.id },
    })

    return ApiResponse.success(res, user, 'User has been reactivated')
  } catch (error) { next(error) }
}

// ── Platform Stats ────────────────────────────────────────────

export async function getPlatformStats(req: Request, res: Response, next: NextFunction) {
  try {
    const [totalUsers, totalVoters, totalParticipants, totalAdmins,
           totalVotesEver, totalCycles, totalSponsors, totalFraudFlags] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'VOTER' } }),
      prisma.user.count({ where: { role: 'PARTICIPANT' } }),
      prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } }),
      prisma.vote.count(),
      prisma.competitionCycle.count(),
      prisma.sponsor.count(),
      prisma.fraudFlag.count(),
    ])

    // New users this month
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    const newUsersThisMonth = await prisma.user.count({ where: { createdAt: { gte: monthAgo } } })

    return ApiResponse.success(res, {
      users: { total: totalUsers, voters: totalVoters, participants: totalParticipants, admins: totalAdmins, newThisMonth: newUsersThisMonth },
      votes: { total: totalVotesEver },
      cycles: { total: totalCycles },
      sponsors: { total: totalSponsors },
      fraudFlags: { total: totalFraudFlags },
    })
  } catch (error) { next(error) }
}

export async function getVoteTrends(req: Request, res: Response, next: NextFunction) {
  try {
    const { days = '14', cycleId } = req.query as Record<string, string>
    const daysBack = parseInt(days)

    const startDate = new Date()
    startDate.setUTCHours(0, 0, 0, 0)
    startDate.setDate(startDate.getDate() - daysBack)

    const where: any = { voteDate: { gte: startDate } }
    if (cycleId) where.cycleId = cycleId

    const tallies = await prisma.dailyVoteTally.groupBy({
      by: ['voteDate'],
      where,
      _sum: { voteCount: true },
      orderBy: { voteDate: 'asc' },
    })

    const trends = tallies.map(t => ({
      date: t.voteDate,
      totalVotes: t._sum.voteCount || 0,
    }))

    return ApiResponse.success(res, trends)
  } catch (error) { next(error) }
}

// ── Broadcast Notifications ───────────────────────────────────

export async function broadcastNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, body, type = 'SYSTEM', targetRole, cycleId, channels, scheduledAt } = req.body
    const adminId = (req as any).user.id

    logger.info(`[Broadcast] Received broadcast request. Title: "${title}", Channels: ${channels.join(', ')}, TargetRole: ${targetRole || 'ALL'}, ScheduledAt: ${scheduledAt || 'Immediate'}`)

    const broadcast = await prisma.broadcast.create({
      data: {
        title,
        body,
        type,
        targetRole,
        cycleId,
        channels,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? 'SCHEDULED' : 'PENDING',
        createdBy: adminId
      }
    })

    logger.info(`[Broadcast] Created broadcast record ${broadcast.id} with status ${broadcast.status}`)

    if (!scheduledAt) {
      // Execute immediately in background
      logger.info(`[Broadcast] Executing broadcast ${broadcast.id} immediately in background`)
      executeBroadcast(broadcast.id).catch(err => logger.error(`Immediate broadcast ${broadcast.id} failed:`, err))
    } else {
      logger.info(`[Broadcast] Broadcast ${broadcast.id} scheduled for ${scheduledAt}`)
    }

    return ApiResponse.created(res, broadcast, scheduledAt ? 'Broadcast scheduled' : 'Broadcast started')
  } catch (error) { 
    logger.error(`[Broadcast] Error creating broadcast:`, error)
    next(error) 
  }
}

export async function listBroadcasts(req: Request, res: Response, next: NextFunction) {
  try {
    const broadcasts = await prisma.broadcast.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    return ApiResponse.success(res, broadcasts)
  } catch (error) { next(error) }
}

export async function cancelBroadcast(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const broadcast = await prisma.broadcast.findUnique({ where: { id } })
    if (!broadcast) return ApiResponse.notFound(res, 'Broadcast not found')
    if (broadcast.status !== 'SCHEDULED') return ApiResponse.error(res, 'Only scheduled broadcasts can be cancelled')

    await prisma.broadcast.delete({ where: { id } })
    return ApiResponse.success(res, null, 'Broadcast cancelled')
  } catch (error) { next(error) }
}

/**
 * Background task to process scheduled broadcasts.
 * Called by cron.
 */
export async function processScheduledBroadcasts() {
  const now = new Date()
  const pending = await prisma.broadcast.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: { lte: now }
    }
  })

  for (const b of pending) {
    executeBroadcast(b.id).catch(err => logger.error(`Scheduled broadcast ${b.id} failed:`, err))
  }
}

async function executeBroadcast(broadcastId: string) {
  logger.info(`[Broadcast] executeBroadcast called for ID: ${broadcastId}`)
  const broadcast = await prisma.broadcast.findUnique({ where: { id: broadcastId } })
  if (!broadcast) {
    logger.warn(`[Broadcast] Broadcast ${broadcastId} not found in database.`)
    return
  }

  try {
    await prisma.broadcast.update({
      where: { id: broadcastId },
      data: { status: 'PROCESSING' }
    })
    logger.info(`[Broadcast] Updated status to PROCESSING for ${broadcastId}`)

    const where: any = { isActive: true }
    if (broadcast.targetRole) where.role = broadcast.targetRole

    const users = await prisma.user.findMany({
      where,
      select: { id: true, email: true, phone: true }
    })
    
    logger.info(`[Broadcast] Found ${users.length} active users matching targetRole: ${broadcast.targetRole || 'ALL'}`)

    const { notificationService } = await import('../notifications/notification.service')
    const { sendSms } = await import('../../utils/sms')

    let count = 0
    let pushCount = 0
    let emailCount = 0
    let smsCount = 0

    for (const user of users) {
      try {
        let sentAny = false;
        // 1. Push / In-app
        if (broadcast.channels.includes('PUSH')) {
          await notificationService.notifyUser({
            userId: user.id,
            title: broadcast.title,
            body: broadcast.body,
            type: broadcast.type,
            cycleId: broadcast.cycleId || undefined
          })
          pushCount++;
          sentAny = true;
        }

        // 2. Email
        if (broadcast.channels.includes('EMAIL') && user.email) {
          await notificationService.sendEmailNotification({
            userId: user.id,
            subject: `[FameAfrica] ${broadcast.title}`,
            html: `
              <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                <div style="background: #534AB7; padding: 20px; text-align: center;">
                  <h1 style="color: #fff; margin: 0; font-size: 24px;">Fame Africa</h1>
                </div>
                <div style="padding: 30px;">
                  <h2 style="color: #333; margin-top: 0;">${broadcast.title}</h2>
                  <p style="color: #555; font-size: 16px;">${broadcast.body}</p>
                  <a href="${process.env.WEB_URL}" style="display: inline-block; background: #534AB7; color: #fff; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px;">Open App</a>
                </div>
                <div style="background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888;">
                  © ${new Date().getFullYear()} FameAfrica. All rights reserved.<br/>
                  You are receiving this because you are a registered member of FameAfrica.
                </div>
              </div>
            `
          })
          emailCount++;
          sentAny = true;
        }

        // 3. SMS
        if (broadcast.channels.includes('SMS') && user.phone) {
          await sendSms(user.phone, `${broadcast.title}: ${broadcast.body}`).catch(e => logger.error(`[Broadcast] SMS fail for ${user.id}`, e))
          smsCount++;
          sentAny = true;
        }

        if (sentAny) count++;
      } catch (err) {
        logger.error(`[Broadcast] Failed to process broadcast for user ${user.id}:`, err)
      }
    }

    logger.info(`[Broadcast] Finished sending. Total users reached: ${count}. Breakdown: ${pushCount} Push, ${emailCount} Email, ${smsCount} SMS.`)

    await prisma.broadcast.update({
      where: { id: broadcastId },
      data: {
        status: 'COMPLETED',
        sentAt: new Date(),
        recipientCount: count
      }
    })

    // Audit log for the broadcast
    await prisma.auditLog.create({
      data: {
        userId: broadcast.createdBy,
        action: 'BROADCAST_NOTIFICATION',
        entityType: 'Broadcast',
        entityId: broadcast.id,
        newValue: { 
          title: broadcast.title, 
          channels: broadcast.channels, 
          recipientCount: count,
          breakdown: { push: pushCount, email: emailCount, sms: smsCount }
        },
      },
    })

    logger.info(`[Broadcast] Broadcast ${broadcastId} COMPLETED and logged to audit.`)
  } catch (error: any) {
    logger.error(`[Broadcast] Broadcast ${broadcastId} CRITICAL FAILURE:`, error)
    await prisma.broadcast.update({
      where: { id: broadcastId },
      data: {
        status: 'FAILED',
        error: error.message
      }
    })
  }
}

// ── God Mode Actions ──────────────────────────────────────────

export async function adjustParticipantVotes(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { amount, reason } = req.body
    const adminId = (req as any).user.id

    const participant = await prisma.participant.findUnique({ where: { id } })
    if (!participant) return ApiResponse.notFound(res, 'Participant not found')

    const updatedParticipant = await prisma.participant.update({
      where: { id },
      data: {
        totalVotes: { [amount >= 0 ? 'increment' : 'decrement']: Math.abs(amount) }
      }
    })

    // Notify user of vote adjustment
    const { notificationService } = await import('../notifications/notification.service')
    await notificationService.notifyUser({
      userId: participant.userId,
      title: 'Votes Adjusted',
      body: `An administrator has ${amount >= 0 ? 'added' : 'removed'} ${Math.abs(amount)} votes from your profile. Reason: ${reason}`,
      type: 'ADMIN_ACTION',
      emailSubject: '[FameAfrica] Vote Tally Adjustment',
      emailHtml: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2 style="color: #534AB7;">Vote Adjustment</h2>
          <p>Hello,</p>
          <p>Your total vote tally has been adjusted by an administrator.</p>
          <p><strong>Change:</strong> ${amount >= 0 ? '+' : '-'}${Math.abs(amount)} votes</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>If you believe this is an error, please contact support.</p>
        </div>
      `,
      cycleId: participant.cycleId
    })

    // Create a special vote record to track this adjustment
    await prisma.vote.create({
      data: {
        participantId: id,
        cycleId: participant.cycleId,
        dayNumber: 0,
        voteDate: new Date(),
        source: 'ADMIN_ADJUSTMENT',
        ipAddress: '0.0.0.0',
        voterPhoneHash: `ADMIN_${adminId}_${Date.now()}`
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ADJUST_VOTES',
        entityType: 'Participant',
        entityId: id,
        oldValue: { totalVotes: participant.totalVotes },
        newValue: { totalVotes: updatedParticipant.totalVotes, adjustment: amount, reason }
      }
    })

    return ApiResponse.success(res, updatedParticipant, `Votes adjusted by ${amount}`)
  } catch (error) { next(error) }
}

export async function giveStrike(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { reason } = req.body
    const adminId = (req as any).user.id

    const participant = await prisma.participant.findUnique({
      where: { id },
      include: { user: true }
    })
    if (!participant) return ApiResponse.notFound(res, 'Participant not found')

    const strike = await prisma.participantStrike.create({
      data: {
        participantId: id,
        reason,
        issuedBy: adminId
      }
    })

    const updatedParticipant = await prisma.participant.update({
      where: { id },
      data: { totalStrikes: { increment: 1 } }
    })

    // Notify the user via unified service (Push + Email)
    const { notificationService } = await import('../notifications/notification.service')
    await notificationService.notifyUser({
      userId: participant.userId,
      type: 'ADMIN_ACTION',
      title: 'Strike Issued',
      body: `You have received a strike for: ${reason}. Repeated violations may lead to disqualification.`,
      emailSubject: '[FameAfrica] Formal Strike Warning',
      emailHtml: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2 style="color: #EA580C;">Strike Warning</h2>
          <p>Hello ${participant.displayName},</p>
          <p>We are issuing a formal strike against your account for the following reason:</p>
          <blockquote style="background: #FFF7ED; border-left: 4px solid #EA580C; padding: 10px; margin: 20px 0;">
            ${reason}
          </blockquote>
          <p>Please review our platform guidelines to ensure future compliance. <strong>Repeated violations will result in disqualification from the competition.</strong></p>
        </div>
      `,
      cycleId: participant.cycleId
    })

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'GIVE_STRIKE',
        entityType: 'Participant',
        entityId: id,
        newValue: { strikeId: strike.id, reason }
      }
    })

    return ApiResponse.success(res, updatedParticipant, 'Strike issued successfully')
  } catch (error) { next(error) }
}

export async function listStrikes(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const strikes = await prisma.participantStrike.findMany({
      where: { participantId: id },
      orderBy: { createdAt: 'desc' }
    })
    return ApiResponse.success(res, strikes)
  } catch (error) { next(error) }
}

export async function removeStrike(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, strikeId } = req.params
    const adminId = (req as any).user.id

    await prisma.participantStrike.delete({ where: { id: strikeId } })
    
    const updatedParticipant = await prisma.participant.update({
      where: { id },
      data: { totalStrikes: { decrement: 1 } }
    })

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'REMOVE_STRIKE',
        entityType: 'Participant',
        entityId: id,
        oldValue: { strikeId }
      }
    })

    return ApiResponse.success(res, updatedParticipant, 'Strike removed')
  } catch (error) { next(error) }
}

export async function forceWinner(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, participantId } = req.params
    const adminId = (req as any).user.id

    // Check if participant belongs to cycle
    const participant = await prisma.participant.findFirst({
      where: { id: participantId, cycleId: id }
    })
    if (!participant) return ApiResponse.error(res, 'Participant does not belong to this cycle', 400)

    // Mark winner
    await prisma.participant.update({
      where: { id: participantId },
      data: { isWinner: true, status: 'WINNER' }
    })

    // Notify winner
    const { notificationService } = await import('../notifications/notification.service')
    await notificationService.notifyUser({
      userId: participant.userId,
      title: '🎉 Congratulations!',
      body: 'You have been declared the winner of the competition cycle!',
      type: 'WINNER_ANNOUNCED',
      emailSubject: '[FameAfrica] YOU ARE THE WINNER!',
      emailHtml: `
        <div style="font-family: sans-serif; line-height: 1.6; text-align: center; border: 2px solid #534AB7; padding: 40px; border-radius: 20px;">
          <h1 style="color: #534AB7;">🎉 CONGRATULATIONS! 🎉</h1>
          <h2 style="color: #111;">You have been declared the winner!</h2>
          <p style="font-size: 18px;">Your talent and hard work have paid off. You are the official winner of this competition cycle.</p>
          <p>Our team will contact you shortly regarding the prize disbursement and next steps.</p>
          <div style="margin-top: 30px; font-weight: bold; color: #534AB7;">FameAfrica Team</div>
        </div>
      `,
      cycleId: id
    })

    // Force end the cycle
    await prisma.competitionCycle.update({
      where: { id },
      data: { status: 'COMPLETED' }
    })

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'FORCE_WINNER',
        entityType: 'CompetitionCycle',
        entityId: id,
        newValue: { winnerId: participantId }
      }
    })

    return ApiResponse.success(res, null, 'Winner declared and cycle completed')
  } catch (error) { next(error) }
}

export async function forceCycleStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { status } = req.body
    const adminId = (req as any).user.id

    const oldCycle = await prisma.competitionCycle.findUnique({ where: { id } })
    const updatedCycle = await prisma.competitionCycle.update({
      where: { id },
      data: { status }
    })

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'FORCE_CYCLE_STATUS',
        entityType: 'CompetitionCycle',
        entityId: id,
        oldValue: { status: oldCycle?.status },
        newValue: { status }
      }
    })

    return ApiResponse.success(res, updatedCycle, `Cycle status forced to ${status}`)
  } catch (error) { next(error) }
}

export async function getAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [
      totalRevenueRaw,
      dailyVotes,
      categoryDistribution,
      stateDistribution,
      registrationGrowth,
      topParticipants,
      recentAlerts,
      totalUsers,
      totalParticipants
    ] = await Promise.all([
      // 1. Total Revenue
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'SUCCESS' }
      }),
      // 2. Daily Votes Trend (Last 30 days)
      prisma.dailyVoteTally.groupBy({
        by: ['voteDate'],
        _sum: { voteCount: true },
        where: { voteDate: { gte: thirtyDaysAgo } },
        orderBy: { voteDate: 'asc' }
      }),
      // 3. Category Distribution
      prisma.participant.groupBy({
        by: ['category'],
        _count: { id: true },
        where: { status: { not: 'PENDING_PAYMENT' } }
      }),
      // 4. State Distribution
      prisma.participant.groupBy({
        by: ['state'],
        _count: { id: true },
        where: { state: { not: null } }
      }),
      // 5. Registration Growth (Daily for last 30 days)
      prisma.participant.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true }
      }),
      // 6. Top Participants
      prisma.participant.findMany({
        orderBy: { totalVotes: 'desc' },
        take: 10,
        select: { id: true, displayName: true, totalVotes: true, category: true, photoUrl: true }
      }),
      // 7. Recent Security Alerts
      prisma.securityAlert.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      prisma.user.count(),
      prisma.participant.count()
    ])

    // Process growth data
    const growthMap: Record<string, number> = {}
    registrationGrowth.forEach(p => {
      const date = p.createdAt.toISOString().split('T')[0]
      growthMap[date] = (growthMap[date] || 0) + 1
    })
    const growthTrend = Object.entries(growthMap).map(([date, count]) => ({ date, count })).sort((a,b) => a.date.localeCompare(b.date))

    return ApiResponse.success(res, {
      summary: {
        totalRevenue: Number(totalRevenueRaw._sum.amount || 0),
        totalUsers,
        totalParticipants,
        securityAlertsCount: recentAlerts
      },
      dailyVotes: dailyVotes.map(v => ({ 
        date: v.voteDate.toISOString().split('T')[0], 
        votes: v._sum.voteCount || 0 
      })),
      categoryDistribution: categoryDistribution.map(c => ({ 
        name: c.category || 'Unknown', 
        value: c._count.id 
      })),
      stateDistribution: stateDistribution.map(s => ({ 
        name: s.state || 'Unknown', 
        value: s._count.id 
      })),
      growthTrend,
      topParticipants
    })
  } catch (error) { next(error) }
}

function getDayNumber(votingOpen: Date): number {
  if (!votingOpen) return 0
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const open = new Date(votingOpen)
  open.setUTCHours(0, 0, 0, 0)
  return Math.max(0, Math.floor((today.getTime() - open.getTime()) / (1000 * 60 * 60 * 24)) + 1)
}

// ── Session & Security ──────────────────────────────────────────

export async function forceLogout(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const adminId = (req as any).user.id

    const user = await prisma.user.update({
      where: { id },
      data: { tokenVersion: { increment: 1 } },
      select: { id: true, email: true }
    })

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'FORCE_LOGOUT',
        entityType: 'User',
        entityId: id,
        newValue: { description: 'All sessions invalidated by admin' }
      }
    })

    return ApiResponse.success(res, null, `User ${user.email} has been logged out from all devices.`)
  } catch (error) { next(error) }
}

export async function getUserLoginHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const user = await prisma.user.findUnique({ where: { id }, select: { email: true } })
    if (!user) return ApiResponse.notFound(res, 'User not found')

    const [auditLogs, failedLogins] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId: id, action: { in: ['LOGIN', 'LOGOUT', 'REFRESH_TOKEN'] } },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.failedLogin.findMany({
        where: { email: user.email },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ])

    return ApiResponse.success(res, { auditLogs, failedLogins })
  } catch (error) { next(error) }
}

// ── KYC Management ──────────────────────────────────────────────

export async function listKycRecords(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, page = '1', limit = '50' } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where: any = {}
    if (status) where.status = status

    const [records, total] = await Promise.all([
      prisma.kycRecord.findMany({
        where,
        include: { user: { select: { fullName: true, email: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.kycRecord.count({ where })
    ])

    const { getTemporaryLink } = await import('../../utils/dropboxUploader')
    const resolved = await Promise.all(records.map(async (r) => ({
      ...r,
      idImageUrl: r.idImageUrl ? await getTemporaryLink(r.idImageUrl) : null
    })))

    return ApiResponse.paginated(res, resolved, total, parseInt(page), parseInt(limit))
  } catch (error) { next(error) }
}

export async function updateKycStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { status, reason } = req.body
    const adminId = (req as any).user.id

    const record = await prisma.kycRecord.update({
      where: { id },
      data: { status, rejectionReason: reason },
      include: { user: true }
    })

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'UPDATE_KYC_STATUS',
        entityType: 'KycRecord',
        entityId: id,
        newValue: { status, reason }
      }
    })

    // Notify user
    const { notificationService } = await import('../notifications/notification.service')
    await notificationService.notifyUser({
      userId: record.userId,
      title: status === 'APPROVED' ? 'KYC Approved' : 'KYC Rejected',
      body: status === 'APPROVED' ? 'Your identity verification has been approved.' : `Your KYC was rejected: ${reason}`,
      type: 'ADMIN_ACTION'
    })

    return ApiResponse.success(res, record, `KYC status updated to ${status}`)
  } catch (error) { next(error) }
}

// ── Transactions ────────────────────────────────────────────────

export async function listTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, type, page = '1', limit = '50' } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where: any = {}
    if (status) where.status = status
    if (type) where.type = type

    const [txs, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { user: { select: { email: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.transaction.count({ where })
    ])

    return ApiResponse.paginated(res, txs, total, parseInt(page), parseInt(limit))
  } catch (error) { next(error) }
}

// ── Security Alerts ─────────────────────────────────────────────

export async function getSecurityAlerts(req: Request, res: Response, next: NextFunction) {
  try {
    const { resolved = 'false', page = '1', limit = '50' } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where: any = { isResolved: resolved === 'true' }

    const [alerts, total] = await Promise.all([
      prisma.securityAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.securityAlert.count({ where })
    ])

    return ApiResponse.paginated(res, alerts, total, parseInt(page), parseInt(limit))
  } catch (error) { next(error) }
}

export async function resolveSecurityAlert(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const alert = await prisma.securityAlert.update({
      where: { id },
      data: { isResolved: true, resolvedAt: new Date() }
    })
    return ApiResponse.success(res, alert, 'Security alert marked as resolved')
  } catch (error) { next(error) }
}


