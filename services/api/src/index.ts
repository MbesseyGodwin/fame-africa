// services/api/src/index.ts


import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import { PrismaClient } from '@prisma/client'

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

// ── Prisma client (shared singleton) ─────────────────────────
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// ── Middleware ────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
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

app.use(`${API_PREFIX}/auth`, authRouter)
app.use(`${API_PREFIX}/users`, usersRouter)
app.use(`${API_PREFIX}/competitions`, competitionsRouter)
app.use(`${API_PREFIX}/participants`, participantsRouter)
app.use(`${API_PREFIX}/votes`, votingRouter)
app.use(`${API_PREFIX}/eliminations`, eliminationsRouter)
app.use(`${API_PREFIX}/admin`, adminRouter)
app.use(`${API_PREFIX}/sponsors`, sponsorsRouter)
app.use(`${API_PREFIX}/notifications`, notificationsRouter)
app.use(`${API_PREFIX}/stans`, stansRouter)
app.use(`${API_PREFIX}/leaderboard`, leaderboardRouter)
app.use(`${API_PREFIX}/kyc`, kycRouter)
app.use(`${API_PREFIX}/winners`, winnersRouter)
app.use(`${API_PREFIX}/audit`, auditRouter)
app.use(`${API_PREFIX}/arena`, arenaRouter)
app.use(`${API_PREFIX}/streaming`, streamingRouter)
app.use(`${API_PREFIX}/moderation`, moderationRouter)

// ── Swagger UI Documentation ────────────────────────────────────
app.use('/api-docs', swaggerUi.serve as any, swaggerUi.setup(swaggerDocument, {
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
const PORT = parseInt(process.env.API_PORT || '4000', 10)
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
