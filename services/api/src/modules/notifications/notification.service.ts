// services/api/src/modules/notifications/notification.service.ts

import { prisma } from '../../index'
import { NotificationType } from '@prisma/client'
import { logger } from '../../utils/logger'

let expoInstance: any = null
async function getExpo() {
  if (!expoInstance) {
    // Workaround for importing ESM-only expo-server-sdk in a CJS project
    const { Expo } = await (eval('import("expo-server-sdk")') as Promise<any>)
    expoInstance = new Expo()
  }
  return expoInstance
}

export const notificationService = {
  /**
   * Sends a push notification and saves it to the database.
   */
  async sendPushNotification(params: {
    userId: string
    title: string
    body: string
    type: NotificationType
    data?: any
    cycleId?: string
  }) {
    const { userId, title, body, type, data, cycleId } = params

    // 1. Save to DB first
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type,
        data: data || {},
        cycleId: cycleId || null,
      },
    })

    // 2. Fetch user's push token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true },
    })

    const { Expo } = await (eval('import("expo-server-sdk")') as Promise<any>)
    if (!user?.pushToken || !Expo.isExpoPushToken(user.pushToken)) {
      logger.info(`Push token for user ${userId} is missing or invalid. skipping push.`)
      return notification
    }

    // 3. Construct message
    const messages = [
      {
        to: user.pushToken,
        sound: 'default' as const,
        title,
        body,
        data: { ...data, notificationId: notification.id },
      },
    ]

    // 4. Send push
    try {
      const expo = await getExpo()
      const chunks = expo.chunkPushNotifications(messages)
      for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk)
      }
      logger.info(`Push notification sent to user ${userId}`)
    } catch (error) {
      logger.error(`Error sending push notification to user ${userId}:`, error)
    }

    return notification
  },

  /**
   * Broadcasts a notification to multiple users.
   */
  async broadcastNotification(params: {
    userIds: string[]
    title: string
    body: string
    type: NotificationType
    data?: any
  }) {
    const { userIds, title, body, type, data } = params

    // This could be optimized for mass sends, but for V1 we'll iterate
    for (const userId of userIds) {
      await this.sendPushNotification({ userId, title, body, type, data })
    }
  },

  /**
   * Updates a user's push token.
   */
  async updatePushToken(userId: string, pushToken: string) {
    const { Expo } = await (eval('import("expo-server-sdk")') as Promise<any>)
    if (!Expo.isExpoPushToken(pushToken)) {
      throw new Error('Invalid Expo push token')
    }

    return await prisma.user.update({
      where: { id: userId },
      data: { pushToken },
    })
  },

  /**
   * Sends an email notification.
   */
  async sendEmailNotification(params: {
    userId: string
    subject: string
    html: string
    text?: string
  }) {
    const { userId, subject, html, text } = params
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
    
    if (!user?.email) {
      logger.warn(`Cannot send email to user ${userId}: No email found.`)
      return
    }

    const { emailTransporter } = await import('../../utils/emailTransporter')
    await emailTransporter.sendMail({
      to: user.email,
      subject,
      html,
      text
    })
  },

  /**
   * Unified method to send both push and email notifications.
   */
  async notifyUser(params: {
    userId: string
    title: string
    body: string
    type: NotificationType
    data?: any
    emailSubject?: string
    emailHtml?: string
    cycleId?: string
  }) {
    const { userId, title, body, type, data, emailSubject, emailHtml, cycleId } = params

    // 1. Send Push/Save to DB
    await this.sendPushNotification({ userId, title, body, type, data, cycleId })

    // 2. Send Email if content provided
    if (emailSubject && emailHtml) {
      await this.sendEmailNotification({ userId, subject: emailSubject, html: emailHtml })
    }
  }
}
