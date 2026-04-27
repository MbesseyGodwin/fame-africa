// ── auth.middleware.ts ────────────────────────────────────────
import { Request, Response, NextFunction } from 'express'
import * as jwt from 'jsonwebtoken'
import { prisma } from '../index'
import { ApiResponse } from '../utils/response'
import * as SecurityService from '../modules/security/security.service'

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return ApiResponse.unauthorized(res, 'Authentication required')
  }

  // Handle cases with or without "Bearer ", and multiple "Bearer "
  const token = authHeader.replace(/^(Bearer\s+)+/i, '').trim()
  
  if (!token) {
    return ApiResponse.unauthorized(res, 'Invalid token format')
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string; tokenVersion?: number }
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true, tokenVersion: true },
    })

    if (!user) {
      console.warn(`[Auth] User not found for ID: ${payload.userId}`)
      return ApiResponse.unauthorized(res, 'User not found')
    }
    if (!user.isActive) {
      console.warn(`[Auth] User inactive: ${user.email}`)
      return ApiResponse.unauthorized(res, 'User inactive')
    }

    if (payload.tokenVersion !== undefined && user.tokenVersion !== payload.tokenVersion) {
      console.warn(`[Auth] Token version mismatch: ${user.email}`)
      SecurityService.reportSecurityIncident(
        'SESSION_HIJACKING',
        'HIGH',
        `Token version mismatch detected for ${user.email}. Potential session hijacking.`,
        { userId: user.id, email: user.email, ip: req.ip, userAgent: req.headers['user-agent'] }
      ).catch(() => {})
      return ApiResponse.unauthorized(res, 'Session expired')
    }

    ;(req as any).user = user
    next()
  } catch (error: any) {
    console.warn(`[Auth] Token validation failed: ${error.message}`)
    if (error.name === 'JsonWebTokenError') {
      SecurityService.reportSecurityIncident(
        'INVALID_TOKEN',
        'MEDIUM',
        `Invalid JWT detected from IP: ${req.ip}`,
        { ip: req.ip, userAgent: req.headers['user-agent'], error: error.message }
      ).catch(() => {})
    }
    return ApiResponse.unauthorized(res, 'Invalid or expired token')
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user
    if (!user || !roles.includes(user.role)) {
      return ApiResponse.forbidden(res, 'Insufficient permissions')
    }
    next()
  }
}

export const requireAdmin = requireRole('ADMIN', 'SUPER_ADMIN')
export const requireSuperAdmin = requireRole('SUPER_ADMIN')

/**
 * Like `authenticate`, but does NOT block unauthenticated requests.
 * If a valid Bearer token is present, it attaches the user to req.user.
 * If no token (or invalid token) is provided, it simply calls next().
 * Useful for public routes that benefit from knowing who the caller is.
 */
export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader) return next()

  const token = authHeader.replace(/^(Bearer\s+)+/i, '').trim()
  if (!token) return next()

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string; tokenVersion?: number }
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true, tokenVersion: true },
    })
    if (user && user.isActive) {
      if (payload.tokenVersion === undefined || user.tokenVersion === payload.tokenVersion) {
        ;(req as any).user = user
      }
    }
  } catch {
    // Invalid token — silently ignore and proceed as anonymous
  }
  next()
}
