// services/api/src/modules/auth/auth.routes.ts

import { Router } from 'express'
import { body } from 'express-validator'
import { validateRequest } from '../../middleware/validate.middleware'
import { authenticate } from '../../middleware/auth.middleware'
import * as AuthController from './auth.controller'
import { authRateLimiter } from '../../middleware/rateLimiter.middleware'

export const authRouter = Router()

authRouter.post('/register',
  authRateLimiter,
  [
    body('fullName').trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
    body('displayName').trim().isLength({ min: 2, max: 50 }).withMessage('Display name must be 2-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('phone').matches(/^\+?[0-9]{10,15}$/).withMessage('Valid phone number required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
  ],
  validateRequest,
  AuthController.register
)

authRouter.post('/login',
  authRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validateRequest,
  AuthController.login
)

authRouter.post('/logout', authenticate, AuthController.logout)

authRouter.post('/send-otp',
  authRateLimiter,
  [
    body('phone').matches(/^\+?[0-9]{10,15}$/).withMessage('Valid phone required'),
    body('purpose').isIn(['register', 'login', 'vote', 'reset']).withMessage('Invalid purpose'),
  ],
  validateRequest,
  AuthController.sendOtp
)

authRouter.post('/verify-otp',
  authRateLimiter,
  [
    body('phone').matches(/^\+?[0-9]{10,15}$/).withMessage('Valid phone required'),
    body('otpCode').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits'),
    body('purpose').isIn(['register', 'login', 'vote', 'reset']).withMessage('Invalid purpose'),
  ],
  validateRequest,
  AuthController.verifyOtp
)

authRouter.post('/refresh-token', AuthController.refreshToken)

authRouter.post('/forgot-password',
  authRateLimiter,
  [body('email').isEmail().normalizeEmail()],
  validateRequest,
  AuthController.forgotPassword
)

authRouter.post('/reset-password',
  authRateLimiter,
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  ],
  validateRequest,
  AuthController.resetPassword
)

authRouter.post('/verify-email', authenticate, AuthController.sendEmailVerification)
authRouter.post('/request-deletion', authenticate, AuthController.requestAccountDeletion)
authRouter.post('/confirm-deletion', authenticate, AuthController.confirmAccountDeletion)

// Change email
authRouter.post('/change-email',
  authenticate,
  authRateLimiter,
  [body('newEmail').isEmail().normalizeEmail().withMessage('Valid email required')],
  validateRequest,
  AuthController.changeEmail
)

