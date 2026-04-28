// services/api/src/modules/payments/payments.routes.ts

import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware'
import * as PaymentsController from './payments.controller'

export const paymentsRouter = Router()

paymentsRouter.get('/mega-vote-packages', PaymentsController.getMegaVotePackages)
paymentsRouter.post('/mega-vote/initialize', authenticate, PaymentsController.initializeMegaVote)
paymentsRouter.post('/verify', authenticate, PaymentsController.verifyPayment)
paymentsRouter.post('/webhook', PaymentsController.handleWebhook)
