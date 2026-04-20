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
    return ApiResponse.success(res, null, 'Global settings updated')
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
      include: { participant: { select: { displayName: true, photoUrl: true, voteLinkSlug: true } } },
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
      where: { cycleId, key: 'daily_elimination_count' },
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
    const { title, body, type = 'SYSTEM', targetRole, cycleId } = req.body
    const adminId = (req as any).user.id

    const where: any = { isActive: true }
    if (targetRole) where.role = targetRole

    const users = await prisma.user.findMany({
      where,
      select: { id: true },
    })

    const notifications = users.map(u => ({
      userId: u.id,
      title,
      body,
      type: type as any,
      cycleId: cycleId || null,
    }))

    const result = await prisma.notification.createMany({ data: notifications })

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'BROADCAST_NOTIFICATION',
        entityType: 'Notification',
        newValue: { title, targetRole, recipientCount: result.count },
      },
    })

    return ApiResponse.success(res, { sent: result.count }, `Notification sent to ${result.count} users`)
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

