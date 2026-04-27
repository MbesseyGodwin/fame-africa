// services/api/src/modules/security/security.service.ts

import { prisma } from '../../index'
import { emailTransporter } from '../../utils/emailTransporter'
import { logger } from '../../utils/logger'

const SECURITY_RECIPIENT = 'mbesseygodwin@gmail.com'
const FAILED_LOGIN_THRESHOLD = 5
const LOCKOUT_DURATION_MINUTES = 30

export async function trackFailedLogin(email: string, ip: string) {
  try {
    // Record failed login
    await prisma.failedLogin.create({
      data: { email, ipAddress: ip }
    })

    // Count recent failures for this email
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    const failureCount = await prisma.failedLogin.count({
      where: {
        email,
        createdAt: { gte: tenMinutesAgo }
      }
    })

    if (failureCount >= FAILED_LOGIN_THRESHOLD) {
      await lockAccount(email, ip)
    }
  } catch (error) {
    logger.error('[SecurityService] Error tracking failed login:', error)
  }
}

async function lockAccount(email: string, ip: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return

  const lockExpiresAt = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
  
  await prisma.user.update({
    where: { id: user.id },
    data: { 
      isLocked: true, 
      lockExpiresAt 
    }
  })

  await reportSecurityIncident(
    'BRUTE_FORCE',
    'HIGH',
    `Account ${email} has been locked after ${FAILED_LOGIN_THRESHOLD} failed attempts.`,
    { email, ip, lockExpiresAt }
  )
}

export async function reportSecurityIncident(
  type: string,
  severity: string,
  message: string,
  metadata: any = {}
) {
  try {
    const alert = await prisma.securityAlert.create({
      data: {
        type,
        severity,
        message,
        metadata
      }
    })

    if (severity === 'HIGH' || severity === 'CRITICAL') {
      await notifyOwner(
        `🚨 SECURITY ALERT [${severity}]: ${type}`,
        `
        <div style="font-family: Arial, sans-serif; border: 2px solid #A32D2D; padding: 20px; border-radius: 10px;">
          <h2 style="color: #A32D2D;">Security Incident Detected</h2>
          <p><strong>Type:</strong> ${type}</p>
          <p><strong>Severity:</strong> ${severity}</p>
          <p><strong>Message:</strong> ${message}</p>
          <hr />
          <p><strong>Incident Details:</strong></p>
          <pre style="background: #f4f4f4; padding: 10px; border-radius: 5px;">${JSON.stringify(metadata, null, 2)}</pre>
          <p style="font-size: 12px; color: #777;">Alert ID: ${alert.id}</p>
        </div>
        `
      )
    }

    logger.warn(`[SecurityAlert] ${severity}: ${type} - ${message}`, metadata)
  } catch (error) {
    logger.error('[SecurityService] Error reporting incident:', error)
  }
}

async function notifyOwner(subject: string, body: string) {
  try {
    await emailTransporter.sendMail({
      to: SECURITY_RECIPIENT,
      subject,
      html: body
    })
  } catch (error) {
    logger.error('[SecurityService] Error notifying owner:', error)
  }
}
