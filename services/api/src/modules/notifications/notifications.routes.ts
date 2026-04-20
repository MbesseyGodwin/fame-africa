import { Router } from 'express'
import { prisma } from '../../index'
import { ApiResponse } from '../../utils/response'
import { authenticate } from '../../middleware/auth.middleware'
import { notificationService } from './notification.service'

export const notificationsRouter = Router()

notificationsRouter.use(authenticate)

// GET /notifications
notificationsRouter.get('/', async (req, res, next) => {
  try {
    const userId = (req as any).user.id
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50
    })

    return ApiResponse.success(res, notifications)
  } catch (error) {
    next(error)
  }
})

// PUT /notifications/read-all
notificationsRouter.put('/read-all', async (req, res, next) => {
  try {
    const userId = (req as any).user.id
    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() }
    })
    return ApiResponse.success(res, null, 'All notifications marked as read')
  } catch (error) {
    next(error)
  }
})

// PUT /notifications/:id/read
notificationsRouter.put('/:id/read', async (req, res, next) => {
  try {
    const userId = (req as any).user.id
    const { id } = req.params

    const notification = await prisma.notification.findFirst({
      where: { id, userId }
    })

    if (!notification) {
      return ApiResponse.error(res, 'Notification not found', 404)
    }

    await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() }
    })

    return ApiResponse.success(res, null, 'Notification marked as read')
  } catch (error) {
    next(error)
  }
})

// GET /notifications/unread-count
notificationsRouter.get('/unread-count', async (req, res, next) => {
  try {
    const userId = (req as any).user.id
    const count = await prisma.notification.count({
      where: { userId, readAt: null },
    })
    return ApiResponse.success(res, { unreadCount: count })
  } catch (error) {
    next(error)
  }
})

// DELETE /notifications/:id
notificationsRouter.delete('/:id', async (req, res, next) => {
  try {
    const userId = (req as any).user.id
    const { id } = req.params

    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    })
    if (!notification) {
      return ApiResponse.error(res, 'Notification not found', 404)
    }

    await prisma.notification.delete({ where: { id } })
    return ApiResponse.success(res, null, 'Notification deleted')
  } catch (error) {
    next(error)
  }
})

// POST /notifications/push-token
notificationsRouter.post('/push-token', async (req, res, next) => {
  try {
    const userId = (req as any).user.id
    const { pushToken } = req.body
    
    if (!pushToken) {
      return ApiResponse.error(res, 'Push token is required', 400)
    }

    await notificationService.updatePushToken(userId, pushToken)
    return ApiResponse.success(res, null, 'Push token registered successfully')
  } catch (error: any) {
    next(error)
  }
})