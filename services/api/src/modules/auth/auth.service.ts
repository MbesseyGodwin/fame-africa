// src/modules/auth/auth.service.ts

import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../../index'
import { AppError } from '../../utils/errors'
import { generateOtp, hashValue } from '../../utils/crypto'
import { sendSms } from '../../utils/sms'
import { emailTransporter } from '../../utils/emailTransporter'
import { logger } from '../../utils/logger'

interface RegisterInput {
  fullName: string
  displayName: string
  email: string
  phone: string
  password: string
}

interface OtpInput {
  phone: string
  purpose: string
  email?: string
  participantId?: string
  cycleId?: string
  ip: string
}

interface VerifyOtpInput {
  phone: string
  otpCode: string
  purpose: string
  email?: string
  participantId?: string
  cycleId?: string
  deviceFingerprint?: string
  ip: string
  userAgent: string
}

export async function registerUser(input: RegisterInput) {
  const { fullName, displayName, email, phone, password } = input
  logger.debug('[AuthService.registerUser] start', { email, phone, displayName })

  const normalizedPhone = phone.startsWith('+') ? phone : `+234${phone.replace(/^0/, '')}`
  logger.debug('[AuthService.registerUser] phone normalized', { original: phone, normalized: normalizedPhone })

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone: normalizedPhone }] },
  })

  if (existing) {
    if (existing.email === email) {
      logger.warn('[AuthService.registerUser] duplicate email', { email })
      throw new AppError('Email already registered', 409)
    }
    logger.warn('[AuthService.registerUser] duplicate phone', { phone: normalizedPhone })
    throw new AppError('Phone number already registered', 409)
  }

  logger.debug('[AuthService.registerUser] hashing password', { email })
  const passwordHash = await bcrypt.hash(password, 12)

  logger.debug('[AuthService.registerUser] creating user in DB', { email, normalizedPhone })
  const user = await prisma.user.create({
    data: {
      fullName,
      displayName,
      email,
      phone: normalizedPhone,
      passwordHash,
      preferences: { create: {} },
    },
    select: {
      id: true, email: true, phone: true,
      fullName: true, displayName: true, role: true,
      emailVerified: true, phoneVerified: true, createdAt: true,
    },
  })
  logger.info('[AuthService.registerUser] user created', { userId: user.id, email })

  const tokens = generateTokens(user.id, user.role)
  logger.debug('[AuthService.registerUser] tokens generated', { userId: user.id })

  logger.debug('[AuthService.registerUser] sending registration OTP', { phone: normalizedPhone, email })
  await sendOtp({ phone: normalizedPhone, purpose: 'register', email, ip: '' })

  // Send Welcome Email
  try {
    await emailTransporter.sendMail({
      to: email,
      subject: 'Welcome to FameAfrica!',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #A32D2D; text-align: center;">Welcome to FameAfrica, ${fullName}!</h2>
          <p>We're thrilled to have you on Africa's digital stage for rising stars.</p>
          <p>Please ensure you verify your phone number using the OTP sent to <strong>${normalizedPhone}</strong> to activate your voting privileges.</p>
          <hr />
          <p style="font-size: 12px; color: #777;">If you did not register for this account, please ignore this email.</p>
        </div>
      `
    })
    logger.info('[AuthService.registerUser] welcome email sent', { email })
  } catch (err) {
    logger.warn('[AuthService.registerUser] failed to send welcome email', { email, error: err })
  }

  return { user, ...tokens }
}

export async function loginUser(email: string, password: string, ip: string) {
  logger.debug('[AuthService.loginUser] lookup user', { email, ip })

  const user = await prisma.user.findUnique({
    where: { email },
    include: { preferences: true },
  })

  if (!user) {
    logger.warn('[AuthService.loginUser] user not found', { email, ip })
    throw new AppError('Invalid credentials', 401)
  }

  if (!user.isActive) {
    logger.warn('[AuthService.loginUser] inactive account', { email, userId: user.id, ip })
    throw new AppError('Invalid credentials', 401)
  }

  logger.debug('[AuthService.loginUser] comparing password', { userId: user.id })
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    logger.warn('[AuthService.loginUser] wrong password', { email, userId: user.id, ip })
    throw new AppError('Invalid credentials', 401)
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })
  logger.debug('[AuthService.loginUser] lastLoginAt updated', { userId: user.id })

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      ipAddress: ip,
    },
  })
  logger.debug('[AuthService.loginUser] audit log written', { userId: user.id, ip })

  const tokens = generateTokens(user.id, user.role)
  logger.info('[AuthService.loginUser] login successful', { userId: user.id, email, role: user.role })

  const { passwordHash, ...safeUser } = user
  return { user: safeUser, ...tokens }
}

export async function sendOtp(input: OtpInput) {
  const { phone, purpose, ip } = input
  logger.debug('[AuthService.sendOtp] start', { phone, purpose, ip })

  const recentOtp = await prisma.otpToken.findFirst({
    where: {
      phone,
      purpose,
      createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      usedAt: null,
    },
  })

  if (recentOtp) {
    logger.warn('[AuthService.sendOtp] rate limited — OTP requested too soon', { phone, purpose, lastOtpId: recentOtp.id })
    throw new AppError('Please wait 60 seconds before requesting another OTP', 429)
  }

  const otpCode = generateOtp(6)
  const expirySeconds = parseInt(process.env.OTP_EXPIRY_SECONDS || '300', 10)
  const expiresAt = new Date(Date.now() + expirySeconds * 1000)

  logger.debug('[AuthService.sendOtp] creating OTP token', { phone, purpose, expiresAt, participantId: input.participantId })
  await prisma.otpToken.create({
    data: {
      phone,
      email: input.email as any, // email is now optional in schema and input
      otpCode: await bcrypt.hash(otpCode, 10),
      purpose,
      participantId: input.participantId,
      cycleId: input.cycleId,
      expiresAt,
      ipAddress: ip,
    },
  })

  const message = purpose === 'vote'
    ? `Your FameAfrica verification code is ${otpCode}. Valid for ${expirySeconds / 60} minutes. Do not share this code.`
    : purpose === 'delete_account'
    ? `Your account deletion security code is ${otpCode}. This code expires in ${expirySeconds / 60} minutes. WARNING: Deleting your account is permanent.`
    : `Your FameAfrica OTP is ${otpCode}. Valid for ${expirySeconds / 60} minutes.`

  logger.debug('[AuthService.sendOtp] sending SMS', { phone, purpose })
  // We don't await SMS so we can attempt Email concurrently or at least not block the whole flow if SMS provider is lagging
  sendSms(phone, message).catch(err => {
    logger.error('[AuthService.sendOtp] SMS delivery failed', { phone, error: err.message })
  })

  // ── Dual Delivery: Email ──────────────────────────────────────────────────
  let targetEmail = input.email
  
  if (!targetEmail) {
    logger.debug('[AuthService.sendOtp] email not provided — looking up user', { phone })
    const user = await prisma.user.findFirst({ where: { phone } })
    targetEmail = user?.email
  }

  if (targetEmail) {
    logger.debug('[AuthService.sendOtp] sending Email fallback/redundancy', { email: targetEmail })
    emailTransporter.sendMail({
      to: targetEmail,
      subject: `Your ${purpose.toUpperCase()} Code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #A32D2D; text-align: center;">Verification Code</h2>
          <p>Hello,</p>
          <p>You requested a verification code for <strong>${purpose}</strong> on FameAfrica.</p>
          <div style="background: #f9f9f9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #A32D2D; border-radius: 5px; margin: 20px 0;">
            ${otpCode}
          </div>
          <p style="font-size: 13px; color: #666; text-align: center;">
            FameAfrica — Africa's Stage for Rising Stars.
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888; text-align: center;">
            FameAfrica — Empowering Voices, Securing Choices.
          </p>
        </div>
      `
    }).catch(err => {
      logger.error('[AuthService.sendOtp] Email delivery failed', { email: targetEmail, error: err.message })
    })
  } else {
    logger.warn('[AuthService.sendOtp] could not determine email for redundant delivery', { phone })
  }

  logger.info('[AuthService.sendOtp] Dual delivery attempted', { phone, email: targetEmail, purpose, expiresAt })
}

export async function verifyOtp(input: VerifyOtpInput) {
  const { phone, otpCode, purpose, ip, userAgent } = input
  const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10)
  logger.debug('[AuthService.verifyOtp] start', { phone, purpose, ip, maxAttempts })

  const token = await prisma.otpToken.findFirst({
    where: {
      phone,
      purpose,
      usedAt: null,
      expiresAt: { gte: new Date() },
      attemptCount: { lt: maxAttempts },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!token) {
    logger.warn('[AuthService.verifyOtp] no valid OTP token found', { phone, purpose })
    throw new AppError('OTP expired or not found. Please request a new one.', 400)
  }

  logger.debug('[AuthService.verifyOtp] incrementing attempt count', { tokenId: token.id, currentAttempts: token.attemptCount })
  await prisma.otpToken.update({
    where: { id: token.id },
    data: { attemptCount: { increment: 1 } },
  })

  const valid = await bcrypt.compare(otpCode, token.otpCode)
  if (!valid) {
    const remaining = maxAttempts - token.attemptCount - 1
    logger.warn('[AuthService.verifyOtp] wrong OTP code', { phone, purpose, tokenId: token.id, attemptsRemaining: remaining })
    throw new AppError(`Invalid OTP. ${remaining} attempt(s) remaining.`, 400)
  }

  logger.debug('[AuthService.verifyOtp] OTP matched — marking used', { tokenId: token.id })
  await prisma.otpToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  })

  if (purpose === 'register') {
    logger.debug('[AuthService.verifyOtp] marking phone as verified', { phone })
    await prisma.user.updateMany({
      where: { phone },
      data: { phoneVerified: true },
    })
    logger.info('[AuthService.verifyOtp] phone verified for registration', { phone })
  }

  if (purpose === 'vote') {
    logger.info('[AuthService.verifyOtp] vote OTP verified', { phone, participantId: token.participantId, cycleId: token.cycleId })
    return { verified: true, participantId: token.participantId, cycleId: token.cycleId }
  }

  logger.info('[AuthService.verifyOtp] OTP verified', { phone, purpose })
  return { verified: true }
}

export async function refreshAccessToken(refreshToken: string) {
  logger.debug('[AuthService.refreshAccessToken] verifying refresh token')
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any
    logger.debug('[AuthService.refreshAccessToken] token decoded', { userId: payload.userId })

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) {
      logger.warn('[AuthService.refreshAccessToken] user not found', { userId: payload.userId })
      throw new AppError('User not found', 401)
    }
    if (!user.isActive) {
      logger.warn('[AuthService.refreshAccessToken] inactive user', { userId: user.id })
      throw new AppError('User not found', 401)
    }

    const tokens = generateTokens(user.id, user.role)
    logger.info('[AuthService.refreshAccessToken] tokens refreshed', { userId: user.id, role: user.role })
    return tokens
  } catch (err: any) {
    if (err instanceof AppError) throw err
    logger.warn('[AuthService.refreshAccessToken] invalid token', { error: err.message })
    throw new AppError('Invalid refresh token', 401)
  }
}

export async function forgotPassword(email: string) {
  logger.debug('[AuthService.forgotPassword] lookup', { email })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    // Intentional: don't reveal existence of account
    logger.info('[AuthService.forgotPassword] email not found — silently skipping', { email })
    return
  }

  const token = uuidv4()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
  await prisma.passwordReset.create({
    data: { userId: user.id, token, expiresAt },
  })
  logger.debug('[AuthService.forgotPassword] reset token created', { userId: user.id, expiresAt })

  const resetUrl = `${process.env.WEB_URL}/auth/reset-password?token=${token}`
  await emailTransporter.sendMail({
    to: email,
    subject: 'Reset your FameAfrica password',
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h3>Password Reset Request</h3>
        <p>You requested a password reset for your FameAfrica account.</p>
        <p>Click the link below to set a new password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #A32D2D; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  })
  logger.info('[AuthService.forgotPassword] reset email sent', { userId: user.id, email })
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenPrefix = token ? `${token.slice(0, 8)}...` : 'missing'
  logger.debug('[AuthService.resetPassword] lookup reset record', { tokenPrefix })

  const reset = await prisma.passwordReset.findFirst({
    where: { token, usedAt: null, expiresAt: { gte: new Date() } },
  })

  if (!reset) {
    logger.warn('[AuthService.resetPassword] invalid or expired token', { tokenPrefix })
    throw new AppError('Invalid or expired reset token', 400)
  }

  logger.debug('[AuthService.resetPassword] hashing new password', { userId: reset.userId })
  const passwordHash = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { id: reset.userId },
    data: { passwordHash },
  })
  await prisma.passwordReset.update({
    where: { id: reset.id },
    data: { usedAt: new Date() },
  })
  logger.info('[AuthService.resetPassword] password updated', { userId: reset.userId })
}

export async function sendEmailVerification(userId: string) {
  logger.debug('[AuthService.sendEmailVerification] start', { userId })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    logger.warn('[AuthService.sendEmailVerification] user not found', { userId })
    throw new AppError('User not found', 404)
  }
  if (user.emailVerified) {
    logger.warn('[AuthService.sendEmailVerification] already verified', { userId, email: user.email })
    throw new AppError('Email already verified', 400)
  }

  const token = uuidv4()
  const verifyUrl = `${process.env.API_URL}/api/v1/auth/confirm-email?token=${token}`

  await emailTransporter.sendMail({
    to: user.email,
    subject: 'Verify your FameAfrica email',
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Verify your Email</h2>
        <p>Welcome to FameAfrica! Please click the button below to verify your email address.</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #A32D2D; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>Welcome aboard!</p>
      </div>
    `,
  })
  logger.info('[AuthService.sendEmailVerification] verification email sent', { userId, email: user.email })
}

function generateTokens(userId: string, role: string) {
  logger.debug('[AuthService.generateTokens] generating tokens', { userId, role })
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
  )
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as jwt.SignOptions['expiresIn'] }
  )
  return { accessToken, refreshToken }
}

export async function requestAccountDeletion(userId: string, email: string, ip: string) {
  logger.info('[AuthService.requestAccountDeletion] start', { userId, email })
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.email !== email) {
    throw new AppError('Unauthorized or invalid user data', 403)
  }
  await sendOtp({ phone: user.phone, email, purpose: 'delete_account', ip })
}

export async function confirmAccountDeletion(userId: string, otpCode: string, ip: string, userAgent: string) {
  logger.info('[AuthService.confirmAccountDeletion] start', { userId })
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError('User not found', 404)

  await verifyOtp({
    phone: user.phone,
    otpCode,
    purpose: 'delete_account',
    ip,
    userAgent
  })

  // Anonymize and deactivate
  logger.info('[AuthService.confirmAccountDeletion] anonymizing user', { userId })
  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: false,
      fullName: 'Deleted User',
      displayName: 'deleted',
      email: `deleted_${userId}_${Date.now()}@fameafrica.fm`,
      phone: `deleted_${userId}_${Date.now()}`,
      photoUrl: null,
      bio: null,
    }
  })

  logger.info('[AuthService.confirmAccountDeletion] completion success', { userId })
}

export async function changeEmail(userId: string, newEmail: string) {
  logger.debug('[AuthService.changeEmail] start', { userId, newEmail })

  const existing = await prisma.user.findFirst({
    where: { email: newEmail, id: { not: userId } },
  })
  if (existing) {
    logger.warn('[AuthService.changeEmail] email already taken', { newEmail })
    throw new AppError('Email address is already in use', 409)
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { email: newEmail, emailVerified: false },
    select: { id: true, email: true, emailVerified: true },
  })

  // Send verification to new email
  try {
    await sendEmailVerification(userId)
  } catch (err) {
    logger.warn('[AuthService.changeEmail] could not send verification email', { userId, error: err })
  }

  logger.info('[AuthService.changeEmail] email changed', { userId, newEmail })
  return user
}