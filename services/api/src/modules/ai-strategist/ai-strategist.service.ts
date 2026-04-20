import { prisma } from '../../index';
import { logger } from '../../utils/logger';
import { getAiAdvice } from '../../utils/ai-provider';
import { io } from '../../index';

export async function generateDailyAdvice(cycleId?: string) {
  logger.info('Starting daily AI Strategist advice generation...');

  // 1. Find the active cycle if not provided
  const targetCycleId = cycleId || (await prisma.competitionCycle.findFirst({
    where: { status: 'VOTING_OPEN' },
  }))?.id;

  if (!targetCycleId) {
    logger.info('No active voting cycle found for AI advice. Skipping.');
    return;
  }

  const cycle = await prisma.competitionCycle.findUnique({
    where: { id: targetCycleId },
  });

  if (!cycle) return;

  // 2. Get all active participants in this cycle
  const participants = await prisma.participant.findMany({
    where: { cycleId: targetCycleId, status: 'ACTIVE' },
    include: { user: true },
  });

  // Calculate cycle-wide stats for context
  const today = getTodayDate();
  const yesterday = new Date(today);
  yesterday.setUTCDate(today.getUTCDate() - 1);

  const averageTally = await prisma.dailyVoteTally.aggregate({
    where: { cycleId: targetCycleId, voteDate: today },
    _avg: { voteCount: true },
  });

  const avgVotes = averageTally._avg.voteCount || 0;
  const daysRemaining = Math.max(0, Math.ceil((cycle.votingClose.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  logger.info(`Generating advice for ${participants.length} participants in cycle ${cycle.cycleName}`);

  for (const participant of participants) {
    try {
      // Get participant tallies for today and yesterday
      const [todayTally, yesterdayTally] = await Promise.all([
        prisma.dailyVoteTally.findUnique({
          where: { participantId_voteDate: { participantId: participant.id, voteDate: today } },
        }),
        prisma.dailyVoteTally.findUnique({
          where: { participantId_voteDate: { participantId: participant.id, voteDate: yesterday } },
        }),
      ]);

      const adviceText = await getAiAdvice({
        participantName: participant.displayName,
        cycleName: cycle.cycleName,
        totalVotes: participant.totalVotes,
        todayVotes: todayTally?.voteCount || 0,
        yesterdayVotes: yesterdayTally?.voteCount || 0,
        averageVotes: avgVotes,
        daysRemaining,
        tone: 'coach', // Could be made configurable per user preference
      });

      // 3. Save to database
      await prisma.aiAdvice.create({
        data: {
          participantId: participant.id,
          cycleId: targetCycleId,
          adviceText,
          analysisData: {
            todayVotes: todayTally?.voteCount || 0,
            yesterdayVotes: yesterdayTally?.voteCount || 0,
            avgVotes,
          },
          tone: 'coach',
        },
      });

      // 4. Send notification
      await prisma.notification.create({
        data: {
          userId: participant.userId,
          cycleId: targetCycleId,
          type: 'AI_ADVICE',
          title: 'Your AI Campaign Strategy is Ready',
          body: adviceText.length > 100 ? adviceText.substring(0, 97) + '...' : adviceText,
          data: { adviceText },
        },
      });

      // Emit realtime event
      io.to(`user:${participant.userId}`).emit('notification:new', {
        type: 'AI_ADVICE',
        title: 'New AI Advice',
      });

    } catch (error) {
      logger.error(`Failed to generate advice for participant ${participant.id}:`, error);
    }
  }

  logger.info('Daily AI Strategy generation complete.');
}

function getTodayDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
