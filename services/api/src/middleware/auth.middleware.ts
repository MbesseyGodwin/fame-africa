// ── auth.middleware.ts ────────────────────────────────────────
import { Request, Response, NextFunction } from 'express'
import * as jwt from 'jsonwebtoken'
import { prisma } from '../index'
import { ApiResponse } from '../utils/response'

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return ApiResponse.unauthorized(res, 'Authentication required')
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string }
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true },
    })

    if (!user || !user.isActive) return ApiResponse.unauthorized(res, 'User not found or inactive')

    ;(req as any).user = user
    next()
  } catch {
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
  if (!authHeader?.startsWith('Bearer ')) return next()

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string }
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true },
    })
    if (user && user.isActive) {
      ;(req as any).user = user
    }
  } catch {
    // Invalid token — silently ignore and proceed as anonymous
  }
  next()
}
