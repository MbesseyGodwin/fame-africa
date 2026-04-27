// src/modules/auth/auth.controller.ts

import { Request, Response, NextFunction } from 'express'
import * as AuthService from './auth.service'
import { ApiResponse } from '../../utils/response'
import { logger } from '../../utils/logger'

export async function register(req: Request, res: Response, next: NextFunction) {
  const { email, phone, fullName, displayName } = req.body
  logger.info('[AUTH] register attempt', { email, phone, fullName, displayName, ip: req.ip })

  try {
    const result = await AuthService.registerUser(req.body)
    logger.info('[AUTH] register success', { email, userId: result.user.id })
    return ApiResponse.created(res, result, 'Registration successful. Please verify your phone number.')
  } catch (error: any) {
    logger.warn('[AUTH] register failed', { email, phone, reason: error.message, status: error.statusCode })
    next(error)
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  const { email } = req.body
  logger.info('[AUTH] login attempt', { email, ip: req.ip, userAgent: req.headers['user-agent'] })

  try {
    const result = await AuthService.loginUser(email, req.body.password, req.ip || '')
    logger.info('[AUTH] login success', { email, userId: result.user.id, role: result.user.role })
    return ApiResponse.success(res, result, 'Login successful')
  } catch (error: any) {
    logger.warn('[AUTH] login failed', { email, ip: req.ip, reason: error.message, status: error.statusCode })
    next(error)
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.id
  logger.info('[AUTH] logout', { userId, ip: req.ip })

  try {
    return ApiResponse.success(res, null, 'Logged out successfully')
  } catch (error: any) {
    logger.error('[AUTH] logout error', { userId, error: error.message })
    next(error)
  }
}

export async function logoutAll(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user.id
  logger.info('[AUTH] logoutAll', { userId, ip: req.ip })

  try {
    await AuthService.logoutAllDevices(userId)
    return ApiResponse.success(res, null, 'Signed out of all devices successfully')
  } catch (error: any) {
    logger.error('[AUTH] logoutAll error', { userId, error: error.message })
    next(error)
  }
}

export async function sendOtp(req: Request, res: Response, next: NextFunction) {
  const { phone, purpose, email, participantId, cycleId } = req.body
  logger.info('[AUTH] sendOtp request', { phone, email, purpose, participantId, cycleId, ip: req.ip })

  try {
    await AuthService.sendOtp({ phone, purpose, email, participantId, cycleId, ip: req.ip || '' })
    logger.info('[AUTH] sendOtp success', { phone, email, purpose })
    return ApiResponse.success(res, null, 'OTP sent successfully')
  } catch (error: any) {
    logger.warn('[AUTH] sendOtp failed', { phone, email, purpose, reason: error.message, status: error.statusCode })
    next(error)
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  const { phone, purpose, email, participantId, cycleId, deviceFingerprint } = req.body
  logger.info('[AUTH] verifyOtp attempt', { phone, purpose, participantId, cycleId, ip: req.ip })

  try {
    const result = await AuthService.verifyOtp({
      phone,
      otpCode: req.body.otpCode,
      purpose,
      email,
      participantId,
      cycleId,
      deviceFingerprint,
      ip: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    })
    logger.info('[AUTH] verifyOtp success', { phone, purpose, verified: result.verified, participantId: result.participantId })
    return ApiResponse.success(res, result, 'OTP verified successfully')
  } catch (error: any) {
    logger.warn('[AUTH] verifyOtp failed', { phone, purpose, reason: error.message, status: error.statusCode })
    next(error)
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  logger.info('[AUTH] refreshToken attempt', { ip: req.ip })

  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      logger.warn('[AUTH] refreshToken missing token', { ip: req.ip })
      return ApiResponse.unauthorized(res, 'Refresh token required')
    }
    const result = await AuthService.refreshAccessToken(refreshToken)
    logger.info('[AUTH] refreshToken success', { ip: req.ip })
    return ApiResponse.success(res, result, 'Token refreshed')
  } catch (error: any) {
    logger.warn('[AUTH] refreshToken failed', { ip: req.ip, reason: error.message })
    next(error)
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  const { email } = req.body
  logger.info('[AUTH] forgotPassword request', { email, ip: req.ip })

  try {
    await AuthService.forgotPassword(email)
    // Always log at info even if user not found — intentional ambiguous response to caller
    logger.info('[AUTH] forgotPassword processed (email may or may not exist)', { email })
    return ApiResponse.success(res, null, 'If that email exists, a reset link has been sent.')
  } catch (error: any) {
    logger.error('[AUTH] forgotPassword error', { email, error: error.message })
    next(error)
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  const { token } = req.body
  // Never log the full token — log only a prefix for traceability
  const tokenPrefix = token ? `${token.slice(0, 8)}...` : 'missing'
  logger.info('[AUTH] resetPassword attempt', { tokenPrefix, ip: req.ip })

  try {
    await AuthService.resetPassword(token, req.body.password)
    logger.info('[AUTH] resetPassword success', { tokenPrefix })
    return ApiResponse.success(res, null, 'Password reset successful')
  } catch (error: any) {
    logger.warn('[AUTH] resetPassword failed', { tokenPrefix, reason: error.message, status: error.statusCode })
    next(error)
  }
}

export async function sendEmailVerification(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.id
  logger.info('[AUTH] sendEmailVerification request', { userId, ip: req.ip })

  try {
    await AuthService.sendEmailVerification(userId)
    logger.info('[AUTH] sendEmailVerification success', { userId })
    return ApiResponse.success(res, null, 'Verification email sent')
  } catch (error: any) {
    logger.warn('[AUTH] sendEmailVerification failed', { userId, reason: error.message, status: error.statusCode })
    next(error)
  }
}

export async function requestAccountDeletion(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user.id
  const { email } = req.body
  logger.info('[AUTH] requestAccountDeletion', { userId, email, ip: req.ip })

  try {
    await AuthService.requestAccountDeletion(userId, email, req.ip || '')
    return ApiResponse.success(res, null, 'Security code sent to your email')
  } catch (error) { next(error) }
}

export async function confirmAccountDeletion(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user.id
  const { otpCode } = req.body
  logger.info('[AUTH] confirmAccountDeletion attempt', { userId, ip: req.ip })

  try {
    await AuthService.confirmAccountDeletion(userId, otpCode, req.ip || '', req.headers['user-agent'] || '')
    return ApiResponse.success(res, null, 'Account deleted successfully')
  } catch (error) { next(error) }
}

export async function changeEmail(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user.id
  const { newEmail } = req.body
  logger.info('[AUTH] changeEmail request', { userId, newEmail, ip: req.ip })

  try {
    const result = await AuthService.changeEmail(userId, newEmail)
    logger.info('[AUTH] changeEmail success', { userId, newEmail })
    return ApiResponse.success(res, result, 'Email updated. Please verify your new email address.')
  } catch (error: any) {
    logger.warn('[AUTH] changeEmail failed', { userId, newEmail, reason: error.message })
    next(error)
  }
}