import { Router } from 'express'
import { body, param } from 'express-validator'
import { authenticate, requireAdmin } from '../../middleware/auth.middleware'
import { validateRequest } from '../../middleware/validate.middleware'
import * as AdminController from './admin.controller'

export const adminRouter = Router()

adminRouter.use(authenticate, requireAdmin)

// Dashboard
adminRouter.get('/dashboard', AdminController.getDashboard)

// Cycles
adminRouter.get('/cycles', AdminController.listCycles)
adminRouter.post('/cycles', [
  body('cycleName').trim().notEmpty(),
  body('cycleNumber').isInt({ min: 1 }),
  body('registrationOpen').isISO8601(),
  body('registrationClose').isISO8601(),
  body('votingOpen').isISO8601(),
  body('votingClose').isISO8601(),
  body('revealAt').isISO8601(),
  body('registrationFee').isFloat({ min: 0 }),
], validateRequest, AdminController.createCycle)
adminRouter.put('/cycles/:id', AdminController.updateCycle)
adminRouter.put('/cycles/:id/status', AdminController.updateCycleStatus)
adminRouter.delete('/cycles/:id', AdminController.deleteCycle)

// Settings
adminRouter.get('/settings/:cycleId', AdminController.getCycleSettings)
adminRouter.put('/settings/:cycleId', [
  body('settings').isArray(),
  body('settings.*.key').notEmpty(),
  body('settings.*.value').notEmpty(),
], validateRequest, AdminController.updateCycleSettings)
adminRouter.get('/settings/global', AdminController.getGlobalSettings)
adminRouter.put('/settings/global', AdminController.updateGlobalSettings)

// Participants
adminRouter.get('/participants', AdminController.listAllParticipants)
adminRouter.put('/participants/:id/status', AdminController.updateParticipantStatus)
adminRouter.post('/participants/:id/votes/adjust', [
  body('amount').isInt(),
  body('reason').trim().notEmpty(),
], validateRequest, AdminController.adjustParticipantVotes)
adminRouter.post('/participants/:id/strikes', [
  body('reason').trim().notEmpty(),
], validateRequest, AdminController.giveStrike)
adminRouter.get('/participants/:id/strikes', AdminController.listStrikes)
adminRouter.delete('/participants/:id/strikes/:strikeId', AdminController.removeStrike)
adminRouter.delete('/participants/:id', AdminController.removeParticipant)

// Cycles
adminRouter.get('/cycles', AdminController.listCycles)
adminRouter.post('/cycles/:id/force-winner/:participantId', AdminController.forceWinner)
adminRouter.post('/cycles/:id/force-status', [
  body('status').isIn(['DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'VOTING_OPEN', 'VOTING_CLOSED', 'REVEALING', 'COMPLETED', 'CANCELLED']),
], validateRequest, AdminController.forceCycleStatus)

// Votes
adminRouter.get('/votes/live', AdminController.getLiveVotes)
adminRouter.get('/votes/ledger', AdminController.listVotes)
adminRouter.get('/votes/stats', AdminController.getVoteStats)

// Eliminations
adminRouter.get('/eliminations', AdminController.getEliminations)
adminRouter.get('/eliminations/queue', AdminController.getEliminationQueue)
adminRouter.post('/eliminations/run', AdminController.triggerElimination)

// Fraud
adminRouter.put('/fraud-flags/:id/resolve', AdminController.resolveFraudFlag)
adminRouter.get('/security/alerts', AdminController.getSecurityAlerts)
adminRouter.put('/security/alerts/:id/resolve', AdminController.resolveSecurityAlert)

// Audit log
adminRouter.get('/audit-log/export', AdminController.exportAuditLog)
adminRouter.get('/audit-log', AdminController.getAuditLog)

// Sponsors
adminRouter.get('/sponsors', AdminController.getSponsors)
adminRouter.post('/sponsors', AdminController.createSponsor)
adminRouter.put('/sponsors/:id', AdminController.updateSponsor)
adminRouter.delete('/sponsors/:id', AdminController.deleteSponsor)
adminRouter.get('/transactions', AdminController.listTransactions)
adminRouter.get('/kyc', AdminController.listKycRecords)
adminRouter.put('/kyc/:id/status', [
  body('status').isIn(['PENDING', 'APPROVED', 'REJECTED']),
], validateRequest, AdminController.updateKycStatus)

// Users
adminRouter.get('/users', AdminController.listUsers)
adminRouter.get('/users/:id', AdminController.getUser)
adminRouter.put('/users/:id/role', [
  body('role').isIn(['VOTER', 'PARTICIPANT', 'ADMIN', 'SUPER_ADMIN']).withMessage('Invalid role'),
], validateRequest, AdminController.updateUserRole)
adminRouter.put('/users/:id/ban', AdminController.banUser)
adminRouter.put('/users/:id/unban', AdminController.unbanUser)
adminRouter.post('/users/:id/logout', AdminController.forceLogout)
adminRouter.get('/users/:id/login-history', AdminController.getUserLoginHistory)

// Stories
adminRouter.get('/stories', AdminController.listAllStories)
adminRouter.delete('/stories/:id', AdminController.removeStory)
adminRouter.put('/stories/:id/approve', AdminController.approveStory)
adminRouter.post('/participants/:id/stories/ban', AdminController.banFromStories)
adminRouter.post('/participants/:id/stories/unban', AdminController.unbanFromStories)

// Platform stats
adminRouter.get('/stats/overview', AdminController.getPlatformStats)
adminRouter.get('/stats/votes-over-time', AdminController.getVoteTrends)
adminRouter.get('/analytics', AdminController.getAnalytics)

// Broadcast
adminRouter.get('/notifications/broadcasts', AdminController.listBroadcasts)
adminRouter.post('/notifications/broadcast', [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('body').trim().notEmpty().withMessage('Body required'),
  body('channels').isArray().withMessage('Channels must be an array'),
  body('channels.*').isIn(['PUSH', 'EMAIL', 'SMS']).withMessage('Invalid channel'),
  body('scheduledAt').optional({ nullable: true }).isISO8601().withMessage('Invalid schedule date'),
], validateRequest, AdminController.broadcastNotification)
adminRouter.delete('/notifications/broadcasts/:id', AdminController.cancelBroadcast)
