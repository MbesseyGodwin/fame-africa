import cron from 'node-cron'
import { prisma } from '../index'
import { io } from '../index'
import { logger } from '../utils/logger'
import { sendSms } from '../utils/sms'
import { emailTransporter } from '../utils/emailTransporter'
import { generateDailyAdvice } from '../modules/ai-strategist/ai-strategist.service'
import { sealDailyVotes } from '../modules/audit/audit.service'
import { endArenaEvent } from '../modules/arena/arena.service'
import { notificationService } from '../modules/notifications/notification.service'

export function startCronJobs() {
  const eliminationSchedule = process.env.ELIMINATION_CRON_SCHEDULE || '59 23 * * *'
  const voteResetSchedule = process.env.VOTE_RESET_CRON_SCHEDULE || '0 0 * * *'

  cron.schedule(eliminationSchedule, async () => {
    logger.info('Running daily elimination job...')
    try {
      await runDailyElimination()
    } catch (error) {
      logger.error('Elimination job failed:', error)
    }
  })

  cron.schedule(voteResetSchedule, async () => {
    logger.info('Daily vote reset (votes reset via date-based deduplication — no action needed)')
  })

  cron.schedule('*/5 * * * *', async () => {
    await updateCycleStatuses()
  })

  // Check and close stale Arena events every 10 mins
  cron.schedule('*/10 * * * *', async () => {
    await autoCloseArenaEvents()
  })

  // ── AI & BLOCKCHAIN JOBS ────────────────────────────────────
  
  // Seal yesterday's votes at 00:05 AM daily
  cron.schedule('5 0 * * *', async () => {
    logger.info('Running daily vote audit seal...')
    try {
      await sealDailyVotes()
    } catch (error) {
      logger.error('Vote sealing job failed:', error)
    }
  })

  // Generate morning campaign advice at 08:00 AM daily
  cron.schedule('0 8 * * *', async () => {
    logger.info('Running AI Strategist advice generation...')
    try {
      await generateDailyAdvice()
    } catch (error) {
      logger.error('AI Strategist job failed:', error)
    }
  })

  logger.info(`Elimination cron: ${eliminationSchedule}`)
  logger.info(`Vote reset cron: ${voteResetSchedule}`)
}

async function runDailyElimination() {
  const activeCycle = await prisma.competitionCycle.findFirst({
    where: { status: 'VOTING_OPEN' },
  })

  if (!activeCycle) {
    logger.info('No active voting cycle. Skipping elimination.')
    return
  }

  const eliminationCountSetting = await prisma.competitionSetting.findFirst({
    where: { cycleId: activeCycle.id, key: 'daily_elimination_count' },
  })
  const eliminationCount = parseInt(eliminationCountSetting?.value || '1', 10)

  const finalistCountSetting = await prisma.competitionSetting.findFirst({
    where: { cycleId: activeCycle.id, key: 'finalist_count' },
  })
  const finalistCount = parseInt(finalistCountSetting?.value || '5', 10)

  const activeParticipants = await prisma.participant.findMany({
    where: { cycleId: activeCycle.id, status: 'ACTIVE' },
    include: { user: true },
  })

  if (activeParticipants.length <= finalistCount) {
    logger.info(`Only ${activeParticipants.length} participants left. Final voting phase — no elimination today.`)
    return
  }

  if (activeParticipants.length - eliminationCount < finalistCount) {
    logger.info('Skipping — elimination would reduce below finalist count')
    return
  }

  const today = getTodayDate()
  const dayNumber = getDayNumber(activeCycle.votingOpen)

  const tallies = await prisma.dailyVoteTally.findMany({
    where: {
      cycleId: activeCycle.id,
      voteDate: today,
      participant: { status: 'ACTIVE' },
    },
    include: { participant: { include: { user: true } } },
    orderBy: { voteCount: 'asc' },
  })

  const participantsWithTallies = activeParticipants.map((p) => {
    const tally = tallies.find((t) => t.participantId === p.id)
    return {
      participant: p,
      todayVotes: tally?.voteCount ?? 0,
      cumulativeVotes: p.totalVotes,
    }
  })

  participantsWithTallies.sort((a, b) => {
    if (a.todayVotes !== b.todayVotes) return a.todayVotes - b.todayVotes
    if (a.cumulativeVotes !== b.cumulativeVotes) return a.cumulativeVotes - b.cumulativeVotes
    return new Date(b.participant.createdAt).getTime() - new Date(a.participant.createdAt).getTime()
  })

  const toEliminate = participantsWithTallies.slice(0, eliminationCount)

  logger.info(`Eliminating ${toEliminate.length} participant(s) today:`)

  for (const entry of toEliminate) {
    const { participant, todayVotes, cumulativeVotes } = entry

    const isTiebroken = participantsWithTallies.filter(p => p.todayVotes === todayVotes).length > 1

    await prisma.$transaction(async (tx) => {
      await tx.participant.update({
        where: { id: participant.id },
        data: {
          status: 'ELIMINATED',
          eliminatedAt: new Date(),
          eliminationDay: dayNumber,
        },
      })

      await tx.elimination.create({
        data: {
          cycleId: activeCycle.id,
          participantId: participant.id,
          dayNumber,
          eliminationDate: today,
          votesOnDay: todayVotes,
          cumulativeVotes,
          totalParticipantsLeft: activeParticipants.length - 1,
          tiebreakerUsed: isTiebroken,
          tiebreakerRule: isTiebroken
            ? cumulativeVotes === entry.cumulativeVotes ? 'LATEST_REGISTRATION' : 'LOWEST_CUMULATIVE_VOTES'
            : undefined,
          notificationSent: true,
          announcedAt: new Date(),
        },
      })

      await tx.dailyVoteTally.updateMany({
        where: { participantId: participant.id, voteDate: today },
        data: { isEliminationDay: true, wasEliminated: true },
      })

      await notificationService.sendPushNotification({
        userId: participant.userId,
        title: '💔 You have been eliminated',
        body: `You received ${todayVotes} votes today and has been eliminated from the FameAfrica competition. Thank you for participating!`,
        type: 'ELIMINATED',
        data: { participantId: participant.id }
      })
    })

    await sendSms(
      participant.user.phone,
      `FameAfrica: You received ${todayVotes} votes today and have been eliminated from the competition. Thank you for participating! Check out the leaderboard for the latest updates.`
    )

    try {
      await emailTransporter.sendMail({
        to: participant.user.email,
        subject: 'Your FameAfrica journey has ended',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #A32D2D;">Thank you for participating, ${participant.displayName}!</h2>
            <p>You received <strong>${todayVotes} votes</strong> today and have been eliminated from the competition.</p>
            <p>Your total votes across the competition: <strong>${cumulativeVotes}</strong></p>
            <p>We hope to see you in the next cycle!</p>
            <hr />
            <p style="font-size: 12px; color: #777;">Best regards,<br/>The FameAfrica Team</p>
          </div>
        `,
      })
    } catch (e) {
      logger.warn('Failed to send elimination email:', e)
    }

    io.emit('elimination:announced', {
      participantId: participant.id,
      displayName: participant.displayName,
      dayNumber,
      todayVotes,
    })

    logger.info(`Eliminated: ${participant.displayName} (${todayVotes} votes today, ${cumulativeVotes} total)`)
  }

  const remaining = await prisma.participant.count({
    where: { cycleId: activeCycle.id, status: 'ACTIVE' },
  })

  io.emit('elimination:daily_complete', {
    cycleId: activeCycle.id,
    dayNumber,
    eliminated: toEliminate.map(e => e.participant.displayName),
    remaining,
  })

  logger.info(`Elimination complete. ${remaining} participants remain.`)

  if (remaining <= 1) {
    await crownWinner(activeCycle.id)
  }
}

async function crownWinner(cycleId: string) {
  const winner = await prisma.participant.findFirst({
    where: { cycleId, status: 'ACTIVE' },
    include: { user: true },
    orderBy: { totalVotes: 'desc' },
  })

  if (!winner) return

  await prisma.$transaction(async (tx) => {
    await tx.participant.update({
      where: { id: winner.id },
      data: { status: 'WINNER', finalRank: 1 },
    })
    await tx.competitionCycle.update({
      where: { id: cycleId },
      data: { status: 'VOTING_CLOSED' },
    })
    await notificationService.sendPushNotification({
      userId: winner.userId,
      title: '👑 Congratulations! You won!',
      body: `You are the FameAfrica winner with ${winner.totalVotes} total votes! Congratulations!`,
      type: 'WINNER_ANNOUNCED',
      data: { cycleId, type: 'winner' }
    })
  })

  io.emit('winner:crowned', {
    participantId: winner.id,
    displayName: winner.displayName,
    totalVotes: winner.totalVotes,
  })

  logger.info(`Winner: ${winner.displayName} with ${winner.totalVotes} votes`)
}

async function updateCycleStatuses() {
  const now = new Date()

  await prisma.competitionCycle.updateMany({
    where: { status: 'DRAFT', registrationOpen: { lte: now } },
    data: { status: 'REGISTRATION_OPEN' },
  })

  await prisma.competitionCycle.updateMany({
    where: { status: 'REGISTRATION_OPEN', registrationClose: { lte: now } },
    data: { status: 'REGISTRATION_CLOSED' },
  })

  await prisma.competitionCycle.updateMany({
    where: { status: 'REGISTRATION_CLOSED', votingOpen: { lte: now } },
    data: { status: 'VOTING_OPEN' },
  })
}

async function autoCloseArenaEvents() {
  const now = new Date()
  const liveEvents = await prisma.arenaEvent.findMany({
    where: { status: 'LIVE' },
  })

  for (const event of liveEvents) {
    const eventEndTime = new Date(event.scheduledAt.getTime() + event.durationMinutes * 60 * 1000)
    // If current time is 15 mins past the expected end time, auto-close
    if (now > new Date(eventEndTime.getTime() + 15 * 60 * 1000)) {
      logger.info(`Auto-closing stale Arena event: ${event.id}`)
      await endArenaEvent(event.id)
    }
  }
}

function getTodayDate(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

function getDayNumber(votingOpen: Date): number {
  const today = getTodayDate()
  const open = new Date(Date.UTC(votingOpen.getUTCFullYear(), votingOpen.getUTCMonth(), votingOpen.getUTCDate()))
  return Math.floor((today.getTime() - open.getTime()) / (1000 * 60 * 60 * 24)) + 1
}
