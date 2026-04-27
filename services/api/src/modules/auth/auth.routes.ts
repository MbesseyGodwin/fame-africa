// services/api/src/modules/auth/auth.routes.ts

import { Router } from 'express'
import { body } from 'express-validator'
import { validateRequest } from '../../middleware/validate.middleware'
import { authenticate } from '../../middleware/auth.middleware'
import * as AuthController from './auth.controller'
import { authRateLimiter } from '../../middleware/rateLimiter.middleware'

export const authRouter = Router()

authRouter.post('/register',
  /* 
    #swagger.tags = ['Auth']
    #swagger.summary = 'Register a new user'
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Registration payload',
      schema: {
        $fullName: 'John Doe',
        $displayName: 'Johnny',
        $email: 'john@example.com',
        $phone: '+2348012345678',
        $password: 'Password123'
      }
    }
  */
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
  /* 
    #swagger.tags = ['Auth']
    #swagger.summary = 'Login to your account'
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Login credentials',
      schema: {
        $email: 'admin@votenaija.ng',
        $password: 'Admin@VoteNaija2026!'
      }
    }
  */
  authRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validateRequest,
  AuthController.login
)

authRouter.post('/logout',
  /* #swagger.tags = ['Auth'] #swagger.summary = 'Logout user' */
  authenticate, AuthController.logout)

authRouter.post('/logout-all',
  /* #swagger.tags = ['Auth'] #swagger.summary = 'Logout from all devices' */
  authenticate, AuthController.logoutAll)

authRouter.post('/send-otp',
  /* 
    #swagger.tags = ['Auth'] 
    #swagger.summary = 'Send an OTP to phone'
    #swagger.parameters['body'] = {
      in: 'body',
      schema: {
        $phone: '+2348012345678',
        $purpose: 'register'
      }
    }
  */
  authRateLimiter,
  [
    body('phone').matches(/^\+?[0-9]{10,15}$/).withMessage('Valid phone required'),
    body('purpose').isIn(['register', 'login', 'vote', 'reset']).withMessage('Invalid purpose'),
  ],
  validateRequest,
  AuthController.sendOtp
)

authRouter.post('/verify-otp',
  /* 
    #swagger.tags = ['Auth']
    #swagger.summary = 'Verify OTP'
    #swagger.parameters['body'] = {
      in: 'body',
      schema: {
        $phone: '+2348012345678',
        $otpCode: '123456',
        $purpose: 'register'
      }
    }
  */
  authRateLimiter,
  [
    body('phone').matches(/^\+?[0-9]{10,15}$/).withMessage('Valid phone required'),
    body('otpCode').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits'),
    body('purpose').isIn(['register', 'login', 'vote', 'reset']).withMessage('Invalid purpose'),
  ],
  validateRequest,
  AuthController.verifyOtp
)

authRouter.post('/refresh-token',
  /* #swagger.tags = ['Auth'] #swagger.summary = 'Refresh Access Token' */
  AuthController.refreshToken)

authRouter.post('/forgot-password',
  /* 
    #swagger.tags = ['Auth']
    #swagger.summary = 'Forgot password link request'
  */
  authRateLimiter,
  [body('email').isEmail().normalizeEmail()],
  validateRequest,
  AuthController.forgotPassword
)

authRouter.post('/reset-password',
  /* 
    #swagger.tags = ['Auth']
    #swagger.summary = 'Reset password'
  */
  authRateLimiter,
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  ],
  validateRequest,
  AuthController.resetPassword
)

authRouter.post('/verify-email', authenticate, /* #swagger.tags = ['Auth'] */ AuthController.sendEmailVerification)
authRouter.post('/request-deletion', authenticate, /* #swagger.tags = ['Auth'] */ AuthController.requestAccountDeletion)
authRouter.post('/confirm-deletion', authenticate, /* #swagger.tags = ['Auth'] */ AuthController.confirmAccountDeletion)

// Change email
authRouter.post('/change-email',
  /* #swagger.tags = ['Auth'] */
  authenticate,
  authRateLimiter,
  [body('newEmail').isEmail().normalizeEmail().withMessage('Valid email required')],
  validateRequest,
  AuthController.changeEmail
)

