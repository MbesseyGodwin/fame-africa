import { Request, Response } from 'express';
import { generateAiBio } from '../../utils/ai-provider';
import { logger } from '../../utils/logger';
import { prisma } from '../../index';
import * as CompetitionService from '../competitions/competitions.service';

export async function generateBio(req: Request, res: Response) {
  try {
    const { name, draftBio } = req.body;
    const userId = (req as any).user?.id;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // --- Cycle-Aware Dynamic Settings ---
    const activeCycle = await CompetitionService.getActiveCycle();
    const cycleId = activeCycle?.id;

    let dailyLimit = 2;
    let wordLimit = 80;
    let isAiEnabled = true;

    if (cycleId) {
      dailyLimit = await CompetitionService.getCycleSettingTyped(cycleId, 'AI_BIO_DAILY_LIMIT', 2);
      wordLimit = await CompetitionService.getCycleSettingTyped(cycleId, 'AI_BIO_MAX_WORDS', 80);
      isAiEnabled = await CompetitionService.getCycleSettingTyped(cycleId, 'ai_agent_enabled', true);
    } else {
      dailyLimit = await CompetitionService.getGlobalSetting('AI_BIO_DAILY_LIMIT').then(v => parseInt(v || '2', 10));
      wordLimit = await CompetitionService.getGlobalSetting('AI_BIO_MAX_WORDS').then(v => parseInt(v || '80', 10));
      isAiEnabled = await CompetitionService.getGlobalSetting('ai_agent_enabled').then(v => v !== 'false');
    }

    if (!isAiEnabled) {
      logger.warn(`AI bio generation requested but AI Agent is disabled (User: ${userId})`);
      return res.status(403).json({ success: false, message: 'AI bio generation is currently disabled by administrators.' });
    }

    // --- Daily Rate Limit check ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const generationCount = await prisma.auditLog.count({
      where: {
        userId,
        action: 'GENERATE_AI_BIO',
        createdAt: { gte: today }
      }
    });

    if (generationCount >= dailyLimit) {
      logger.warn(`User ${userId} reached daily AI bio limit (${dailyLimit})`);
      return res.status(429).json({ 
        success: false, 
        message: `You've reached your daily limit of ${dailyLimit} AI bio generations. Please try again tomorrow!` 
      });
    }

    logger.info(`Generating AI bio for: ${name} (User: ${userId}, Attempt: ${generationCount + 1}, MaxWords: ${wordLimit})`);
    const bio = await generateAiBio(name, draftBio || '', wordLimit);

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'GENERATE_AI_BIO',
        entityType: 'Participant',
        entityId: userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    return res.json({
      success: true,
      data: bio
    });
  } catch (error: any) {
    logger.error('Error in generateBio controller:', {
      message: error.message,
      stack: error.stack,
      details: error.response?.data || error
    });
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate bio'
    });
  }
}
