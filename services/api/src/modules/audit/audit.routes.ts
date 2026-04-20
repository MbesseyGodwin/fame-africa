import { Router } from 'express';
import * as auditController from './audit.controller';

const router = Router();

// Public verification endpoint
router.get('/verify/:voteId', auditController.verifyVote);

// Admin trigger (should be protected by admin middleware in production)
router.post('/admin/trigger-seal', auditController.triggerSeal);

export { router as auditRouter };
