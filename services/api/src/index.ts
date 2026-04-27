// services/api/src/index.ts


import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'

import { authRouter } from './modules/auth/auth.routes'
import { usersRouter } from './modules/users/users.routes'
import { competitionsRouter } from './modules/competitions/competitions.routes'
import { participantsRouter } from './modules/participants/participants.routes'
import { votingRouter } from './modules/voting/voting.routes'
import { eliminationsRouter } from './modules/eliminations/eliminations.routes'
import { adminRouter } from './modules/admin/admin.routes'
import { sponsorsRouter } from './modules/sponsors/sponsors.routes'
import { notificationsRouter } from './modules/notifications/notifications.routes'
import { stansRouter } from './modules/stans/stans.routes'
import { leaderboardRouter } from './modules/leaderboard/leaderboard.routes'
import { kycRouter } from './modules/kyc/kyc.routes'
import { winnersRouter } from './modules/winners/winners.routes'
import { auditRouter } from './modules/audit/audit.routes'
import { arenaRouter } from './modules/arena/arena.routes'
import { streamingRouter } from './modules/streaming/streaming.routes'
import { moderationRouter } from './modules/moderation/moderation.routes'
import { paymentsRouter } from './modules/payments/payments.routes'
import { battlesRouter } from './modules/battles/battles.routes'

import { errorHandler } from './middleware/error.middleware'
import { rateLimiter } from './middleware/rateLimiter.middleware'
import { setupRealtimeHandlers } from './realtime/socket.handlers'
import { startCronJobs } from './jobs/cron.jobs'
import { logger } from './utils/logger'
import swaggerUi from 'swagger-ui-express'
import swaggerDocument from '../swagger-output.json'

const app = express()
const httpServer = createServer(app)

// ── Socket.io for real-time vote updates ─────────────────────
export const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

import { prisma } from './lib/prisma'
export { prisma }

// ── Middleware ────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'https://fame-africa-web.vercel.app',
    'https://fameafrica-api.onrender.com'
  ],
  credentials: true,
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(rateLimiter)

// ── Health check ──────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'connected',
    })
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' })
  }
})

// ── API Routes ────────────────────────────────────────────────
const API_PREFIX = '/api/v1'

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/users', usersRouter)
app.use('/api/v1/competitions', competitionsRouter)
app.use('/api/v1/participants', participantsRouter)
app.use('/api/v1/votes', votingRouter)
app.use('/api/v1/eliminations', eliminationsRouter)
app.use('/api/v1/admin', adminRouter)
app.use('/api/v1/sponsors', sponsorsRouter)
app.use('/api/v1/notifications', notificationsRouter)
app.use('/api/v1/stans', stansRouter)
app.use('/api/v1/leaderboard', leaderboardRouter)
app.use('/api/v1/kyc', kycRouter)
app.use('/api/v1/winners', winnersRouter)
app.use('/api/v1/audit', auditRouter)
app.use('/api/v1/arena', arenaRouter)
app.use('/api/v1/streaming', streamingRouter)
app.use('/api/v1/moderation', moderationRouter)
app.use('/api/v1/payments', paymentsRouter)
app.use('/api/v1/battles', battlesRouter)

// ── Swagger UI Documentation ────────────────────────────────────
const swaggerDocumentModified = { 
  ...swaggerDocument,
  host: process.env.API_URL ? process.env.API_URL.replace(/^https?:\/\//, '') : (swaggerDocument as any).host 
}

app.use('/api-docs', swaggerUi.serve as any, swaggerUi.setup(swaggerDocumentModified, {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { font-size: 2em; color: #534AB7; }
    .swagger-ui .scheme-container { background: #fafafa; padding: 12px; }
  `,
  customSiteTitle: 'FameAfrica API Docs',
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
    persistAuthorization: true,
    deepLinking: true,
    tagsSorter: 'alpha',
  },
}) as any)

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// ── Error handler ─────────────────────────────────────────────
app.use(errorHandler)

// ── Real-time handlers ────────────────────────────────────────
setupRealtimeHandlers(io)

// ── Start server ──────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || process.env.API_PORT || '4000', 10)
const HOST = process.env.API_HOST || '0.0.0.0'

httpServer.listen(PORT, HOST, () => {
  logger.info(`FameAfrica API running on http://${HOST}:${PORT}`)
  logger.info(`Environment: ${process.env.NODE_ENV}`)
  startCronJobs()
  logger.info('Cron jobs started')
})

// ── Graceful shutdown ─────────────────────────────────────────
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

export default app
