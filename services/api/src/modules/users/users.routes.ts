// services/api/src/modules/users/users.routes.ts

// ── users.routes.ts ───────────────────────────────────────────
import { Router } from 'express'
import { body } from 'express-validator'
import { authenticate } from '../../middleware/auth.middleware'
import { validateRequest } from '../../middleware/validate.middleware'
import { prisma } from '../../index'
import { ApiResponse } from '../../utils/response'
import { upload } from '../../middleware/upload'
import { uploadToDropbox, getTemporaryLink } from '../../utils/dropboxUploader'
import { v4 as uuidv4 } from 'uuid'

export const usersRouter = Router()

usersRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.id },
      include: {
        preferences: true,
        participant: {
          select: {
            id: true,
            status: true,
            voteLinkSlug: true,
            cycleId: true,
          },
        },
      },
    })

    if (!user) return ApiResponse.error(res, 'User not found', 404)

    // Generate fresh temporary link if photoUrl is a Dropbox path
    if (user.photoUrl && !user.photoUrl.startsWith('http')) {
      user.photoUrl = await getTemporaryLink(user.photoUrl)
    }

    // Strip sensitive field before sending
    const { passwordHash, ...safeUser } = user
    return ApiResponse.success(res, safeUser)
  } catch (error) {
    next(error)
  }
})

usersRouter.put('/me', authenticate,
  [
    body('fullName').optional().trim().isLength({ min: 2, max: 100 }),
    body('displayName').optional().trim().isLength({ min: 2, max: 50 }),
    body('bio').optional().isLength({ max: 500 }),
  ],
  validateRequest,
  async (req: any, res: any, next: any) => {
    try {
      const oldUser = await prisma.user.findUnique({ where: { id: req.user.id } })
      const { fullName, displayName, bio } = req.body
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { ...(fullName && { fullName }), ...(displayName && { displayName }), ...(bio !== undefined && { bio }) },
        select: { id: true, email: true, fullName: true, displayName: true, bio: true, photoUrl: true },
      })
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'UPDATE_PROFILE',
          entityType: 'User',
          entityId: user.id,
          oldValue: { fullName: oldUser?.fullName, displayName: oldUser?.displayName, bio: oldUser?.bio },
          newValue: { fullName: user.fullName, displayName: user.displayName, bio: user.bio },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      })
      return ApiResponse.success(res, user, 'Profile updated')
    } catch (error) { next(error) }
  }
)

usersRouter.put('/me/preferences', authenticate, async (req: any, res: any, next: any) => {
  try {
    const {
      id, userId, createdAt, updatedAt,
      ...allowedPrefs
    } = req.body

    const prefs = await prisma.userPreference.upsert({
      where: { userId: req.user.id },
      create: { userId: req.user.id, ...allowedPrefs },
      update: allowedPrefs,
    })
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_PREFERENCES',
        entityType: 'UserPreference',
        entityId: prefs.id,
        newValue: allowedPrefs,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    })
    return ApiResponse.success(res, prefs, 'Preferences saved')
  } catch (error) { next(error) }
})

usersRouter.get('/me/preferences', authenticate, async (req: any, res: any, next: any) => {
  try {
    const prefs = await prisma.userPreference.findUnique({ where: { userId: req.user.id } })
    return ApiResponse.success(res, prefs)
  } catch (error) { next(error) }
})

// ── Photo Upload (Dropbox Integration) ────────────────────────
usersRouter.post('/me/photo', authenticate, upload.single('photo') as any, async (req: any, res: any, next: any) => {
  try {
    if (!req.file) {
      return ApiResponse.error(res, 'No file uploaded', 400)
    }

    const fileExt = req.file.originalname.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const dropboxPath = `/fameafrica/profiles/${req.user.id}/${fileName}`

    // Upload to Dropbox
    await uploadToDropbox(req.file.buffer, dropboxPath)

    // Update user record with Dropbox path
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { photoUrl: dropboxPath },
      select: { id: true, photoUrl: true }
    })

    // Return fresh temp link for immediate UI update
    const tempUrl = await getTemporaryLink(dropboxPath)
    
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_PHOTO',
        entityType: 'User',
        entityId: user.id,
        newValue: { photoUrl: dropboxPath },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    })

    return ApiResponse.success(res, { photoUrl: tempUrl }, 'Photo uploaded successfully')
  } catch (error) {
    next(error)
  }
})

// ── Password Change ───────────────────────────────────────────
usersRouter.put('/me/password', authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Must contain uppercase, lowercase, and number'),
  ],
  validateRequest,
  async (req: any, res: any, next: any) => {
    try {
      const bcrypt = require('bcryptjs')
      const user = await prisma.user.findUnique({ where: { id: req.user.id } })
      if (!user) return ApiResponse.error(res, 'User not found', 404)

      const isMatch = await bcrypt.compare(req.body.currentPassword, user.passwordHash)
      if (!isMatch) return ApiResponse.error(res, 'Current password is incorrect', 400)

      const hashedPassword = await bcrypt.hash(req.body.newPassword, 12)
      await prisma.user.update({
        where: { id: req.user.id },
        data: { passwordHash: hashedPassword },
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'CHANGE_PASSWORD',
          entityType: 'User',
          entityId: user.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      })

      return ApiResponse.success(res, null, 'Password changed successfully')
    } catch (error) { next(error) }
  }
)

// ── Phone Update ──────────────────────────────────────────────
usersRouter.put('/me/phone', authenticate,
  [
    body('phone').matches(/^\+?[0-9]{10,15}$/).withMessage('Valid phone required'),
  ],
  validateRequest,
  async (req: any, res: any, next: any) => {
    try {
      const { phone } = req.body

      // Check if phone already taken
      const existing = await prisma.user.findFirst({ where: { phone, id: { not: req.user.id } } })
      if (existing) return ApiResponse.error(res, 'Phone number already in use', 409)

      const oldUser = await prisma.user.findUnique({ where: { id: req.user.id } })
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { phone, phoneVerified: false },
        select: { id: true, phone: true, phoneVerified: true },
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'UPDATE_PHONE',
          entityType: 'User',
          entityId: user.id,
          oldValue: { phone: oldUser?.phone },
          newValue: { phone: user.phone },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      })

      return ApiResponse.success(res, user, 'Phone number updated. Please verify your new number.')
    } catch (error) { next(error) }
  }
)

// ── Activity History ──────────────────────────────────────────
usersRouter.get('/me/activity', authenticate, async (req: any, res: any, next: any) => {
  try {
    const userId = req.user.id

    const [voteCount, stans, recentNotifications] = await Promise.all([
      prisma.vote.count({ where: { voterEmail: req.user.email } }),
      prisma.stan.findMany({
        where: { userId },
        include: { participant: { select: { displayName: true, photoUrl: true, voteLinkSlug: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, type: true, title: true, body: true, readAt: true, createdAt: true },
      }),
    ])

    return ApiResponse.success(res, {
      totalVotesCast: voteCount,
      stannedContestants: stans,
      recentNotifications,
    })
  } catch (error) { next(error) }
})

