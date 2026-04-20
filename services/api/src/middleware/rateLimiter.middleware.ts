import rateLimit from 'express-rate-limit'
import { RequestHandler } from 'express'

// Cast to RequestHandler to resolve duplicate @types/express-serve-static-core
// conflict between root and api-level node_modules in this monorepo.
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
}) as unknown as RequestHandler

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes.' },
}) as unknown as RequestHandler

export const voteRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.VOTE_RATE_LIMIT_MAX || '5', 10),
  message: { success: false, message: 'Too many vote requests, please slow down.' },
}) as unknown as RequestHandler
