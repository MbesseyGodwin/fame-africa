import { Router } from 'express';
import * as AiController from './ai-strategist.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// All AI routes require authentication
router.use(authenticate as any);

router.post('/generate-bio', AiController.generateBio as any);

export { router as aiRouter };
