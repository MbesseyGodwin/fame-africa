// services/api/src/modules/audit/audit.controller.ts


import { Request, Response, NextFunction } from 'express';
import * as auditService from './audit.service';

export async function verifyVote(req: Request, res: Response, next: NextFunction) {
  try {
    const { voteId } = req.params;
    const proof = await auditService.getVoteVerificationProof(voteId);

    res.json({
      success: true,
      data: proof,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin only: Manually trigger a seal operation for a specific date
 */
export async function triggerSeal(req: Request, res: Response, next: NextFunction) {
  try {
    const { date, cycleId } = req.body;
    const targetDate = date ? new Date(date) : undefined;

    await auditService.sealDailyVotes(cycleId, targetDate);

    res.json({
      success: true,
      message: 'Seal operation triggered successfully',
    });
  } catch (error) {
    next(error);
  }
}

import { prisma } from '../../lib/prisma';

export async function getLedger(req: Request, res: Response, next: NextFunction) {
  try {
    const proofs = await prisma.auditProof.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json({ success: true, data: proofs });
  } catch (error) {
    next(error);
  }
}
