// services/api/src/modules/participants/participants.service.ts

import { prisma } from '../../index'
import { ParticipantStatus, UserRole } from '@prisma/client'
import * as crypto from 'crypto'
import { emailTransporter } from '../../utils/emailTransporter'
import { AppError } from '../../utils/errors'
import { logger } from '../../utils/logger'
import { getTemporaryLink } from '../../utils/dropboxUploader'
import * as StansService from '../stans/stans.service'


interface RegisterInput {
  userId: string
  cycleId: string
  displayName: string
  bio: string
  state: string
  city: string
  category: string
  photoBuffer?: Buffer
  photoMimeType?: string
  videoBuffer?: Buffer
  videoMimeType?: string
  nationality: string
  instagramUrl?: string
  twitterUrl?: string
  tiktokUrl?: string
  youtubeUrl?: string
}

export async function registerAsParticipant(input: RegisterInput) {
  const {
    userId, cycleId, displayName, bio, state, city, category,
    photoBuffer, photoMimeType, videoBuffer, videoMimeType,
    nationality, instagramUrl, twitterUrl, tiktokUrl, youtubeUrl
  } = input

  const cycle = await prisma.competitionCycle.findUnique({ where: { id: cycleId } })
  if (!cycle) throw new AppError('Competition cycle not found', 404)
  if (cycle.status !== 'REGISTRATION_OPEN') throw new AppError('Registration is not currently open', 400)

  const existing = await prisma.participant.findFirst({ where: { userId, cycleId } })
  if (existing) throw new AppError('You are already registered for this cycle', 409)

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError('User not found', 404)

  const slug = await generateUniqueSlug(displayName)

  // 1. Create participant immediately with 'PROCESSING_MEDIA' status
  const feeAmount = Number(cycle.registrationFee)
  const requiresPayment = feeAmount > 0

  const participant = await prisma.participant.create({
    data: {
      userId,
      cycleId,
      displayName,
      bio,
      state,
      city,
      category,
      nationality,
      instagramUrl,
      twitterUrl,
      tiktokUrl,
      youtubeUrl,
      voteLinkSlug: slug,
      status: ParticipantStatus.PROCESSING_MEDIA,
    },
  })

  // 2. Update user role to PARTICIPANT immediately
  await prisma.user.update({
    where: { id: userId },
    data: { role: UserRole.PARTICIPANT },
  })

  // 3. Dev Bypass Check
  const flwKey = process.env.FLUTTERWAVE_SECRET_KEY || ''
  const isRealKey = flwKey.startsWith('FLWSECK-') && !flwKey.includes('TEST')
  const devBypass = !isRealKey && process.env.NODE_ENV === 'development'

  // 4. Trigger background processing for Dropbox uploads
  processMediaInBackground({
    participantId: participant.id,
    userId,
    cycleId,
    slug,
    photoBuffer,
    photoMimeType,
    videoBuffer,
    videoMimeType,
    existingUserPhoto: user.photoUrl,
    requiresPayment: requiresPayment && !devBypass, // Bypass payment status if in dev
  }).catch(err => {
    logger.error(`[Background Processing] Failed for participant ${participant.id}:`, err)
  })

  // 5. Return response immediately
  if (requiresPayment && !devBypass) {
    try {
      const paymentLink = await initializePayment(user, feeAmount, participant.id, cycleId)
      return { participant, paymentUrl: paymentLink, requiresPayment: true }
    } catch (err) {
      logger.error('Payment initialization failed, but participant was created. Cleaning up...', err)
      throw err 
    }
  }

  if (devBypass && requiresPayment) {
    logger.warn(`DEV MODE: Registration fee of ₦${feeAmount} bypassed for ${displayName}`)
  }

  return { participant, requiresPayment: false, devBypass }
}


/**
 * Handles media uploads to Dropbox and status transitions in the background.
 */
async function processMediaInBackground(params: {
  participantId: string;
  userId: string;
  cycleId: string;
  slug: string;
  photoBuffer?: Buffer;
  photoMimeType?: string;
  videoBuffer?: Buffer;
  videoMimeType?: string;
  existingUserPhoto: string | null;
  requiresPayment: boolean;
}) {
  const { 
    participantId, cycleId, slug, photoBuffer, photoMimeType, 
    videoBuffer, videoMimeType, existingUserPhoto, requiresPayment 
  } = params
  
  try {
    const { uploadToDropbox } = await import('../../utils/dropboxUploader')
    
    // 1. Photo Upload
    let photoPath = existingUserPhoto
    if (photoBuffer && photoMimeType) {
      const ext = photoMimeType.split('/')[1] || 'jpg'
      photoPath = `/contestants/photos/${cycleId}/${slug}_photo.${ext}`
      await uploadToDropbox(photoBuffer, photoPath)
    }

    // 2. Video Upload
    let videoPath = ''
    if (videoBuffer && videoMimeType) {
      const ext = videoMimeType.split('/')[1] || 'mp4'
      videoPath = `/contestants/videos/${cycleId}/${slug}_video.${ext}`
      await uploadToDropbox(videoBuffer, videoPath)
    }

    // 3. Finalize Participant Record
    const finalStatus = requiresPayment ? ParticipantStatus.PENDING_PAYMENT : ParticipantStatus.ACTIVE

    await prisma.participant.update({
      where: { id: participantId },
      data: {
        photoUrl: photoPath,
        videoUrl: videoPath,
        status: finalStatus,
      }
    })


    logger.info(`[Background Processing] Successfully completed for participant ${participantId}`)

    // If active directly (e.g. no fee or dev bypass), generate card
    if (finalStatus === 'ACTIVE') {
      generateParticipantCard(participantId).catch(err => {
        logger.error('[Background Processing] Failed to auto-generate card:', err)
      })
    }

  } catch (error) {
    logger.error(`[Background Processing] CRITICAL FAILURE for ${participantId}:`, error)
    await prisma.participant.update({
      where: { id: participantId },
      data: { status: ParticipantStatus.UPLOAD_FAILED }
    })
  }
}



export async function getParticipantBySlug(slug: string, userId?: string) {
  const participant = await prisma.participant.findUnique({
    where: { voteLinkSlug: slug },
    include: {
      user: { select: { id: true, displayName: true } },
      cycle: { select: { id: true, cycleName: true, status: true, votingOpen: true, votingClose: true } },
    },
  }) as any

  if (!participant) throw new AppError('Participant not found', 404)

  // Resolve Dropbox link if necessary
  if (participant.photoUrl && !participant.photoUrl.startsWith('http')) {
    participant.photoUrl = await getTemporaryLink(participant.photoUrl)
  }

  return {
    id: participant.id,
    displayName: participant.displayName,
    bio: participant.bio,
    photoUrl: participant.photoUrl,
    videoUrl: participant.videoUrl ? await getTemporaryLink(participant.videoUrl) : null,
    category: participant.category,
    campaignCardUrl: participant.campaignCardUrl ? await getTemporaryLink(participant.campaignCardUrl) : null,
    state: participant.state,
    city: participant.city,
    nationality: participant.nationality,
    instagramUrl: participant.instagramUrl,
    twitterUrl: participant.twitterUrl,
    tiktokUrl: participant.tiktokUrl,
    youtubeUrl: participant.youtubeUrl,
    voteLinkSlug: participant.voteLinkSlug,
    status: participant.status,
    cycle: participant.cycle,
    totalVotes: participant.totalVotes,
    stanCount: participant.stanCount,
    isStanning: userId ? await StansService.checkStanningStatus(userId, participant.id) : false,
  }
}

export async function generateParticipantCard(participantId: string): Promise<string> {
  logger.info('[ParticipantsService] Generating campaign card', { participantId })

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { cycle: true }
  })

  if (!participant) throw new AppError('Participant not found', 404)

  // 1. Get a temporary photo link
  const photoUrl = await getTemporaryLink(participant.photoUrl || '')
  if (!photoUrl) throw new AppError('No photo available to generate card', 400)

  // 2. Generate the card buffer
  const { generateCampaignCard } = await import('../../utils/cardGenerator')
  const { uploadToDropbox } = await import('../../utils/dropboxUploader')

  const cardBuffer = await generateCampaignCard({
    displayName: participant.displayName,
    photoUrl,
    voteUrl: `${process.env.WEB_URL}/vote/${participant.voteLinkSlug}`
  })

  // 3. Upload to Dropbox
  const dropboxPath = `/campaign_cards/${participant.cycleId}/${participant.voteLinkSlug}_card.jpg`
  await uploadToDropbox(cardBuffer, dropboxPath)

  // 4. Update DB
  await prisma.participant.update({
    where: { id: participantId },
    data: { campaignCardUrl: dropboxPath }
  })

  return dropboxPath
}

export async function listActiveParticipants(cycleId: string, page = 1, limit = 20, search?: string, userId?: string) {
  const skip = (page - 1) * limit

  const where: any = {
    cycleId,
    status: { in: ['ACTIVE', 'WINNER'] },
    ...(search && {
      OR: [
        { displayName: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  const [participants, total] = await Promise.all([
    prisma.participant.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, displayName: true, bio: true,
        photoUrl: true, videoUrl: true, category: true,
        state: true, city: true, nationality: true,
        instagramUrl: true, twitterUrl: true, tiktokUrl: true, youtubeUrl: true,
        voteLinkSlug: true, status: true, createdAt: true,
        stanCount: true,
      } as any,
    }),
    prisma.participant.count({ where }),
  ])

  // Resolve Dropbox links and check stanning status
  const resolvedParticipants = await Promise.all((participants as any[]).map(async (p: any) => {
    if (p.photoUrl && !p.photoUrl.startsWith('http')) {
      p.photoUrl = await getTemporaryLink(p.photoUrl)
    }
    if (p.videoUrl && !p.videoUrl.startsWith('http')) {
      p.videoUrl = await getTemporaryLink(p.videoUrl)
    }

    return {
      ...p,
      isStanning: userId ? await StansService.checkStanningStatus(userId, p.id) : false
    }
  }))

  return { participants: resolvedParticipants, total, page, limit }
}

export async function getParticipantDashboard(userId: string) {
  const participant = await prisma.participant.findFirst({
    where: { userId },
    include: {
      cycle: true,
      dailyTallies: {
        orderBy: { voteDate: 'desc' },
        take: 7,
      },
    },
  }) as any

  if (!participant) throw new AppError('You are not registered as a participant', 404)

  const today = getTodayDate()
  const todayTally = participant.dailyTallies.find(
    (t: any) => t.voteDate.toISOString().split('T')[0] === today.toISOString().split('T')[0]
  )

  const rankResult = await prisma.$queryRaw<{ rank: bigint }[]>`
    SELECT COUNT(*) + 1 as rank
    FROM participants p2
    WHERE p2.cycle_id = ${participant.cycleId}
      AND p2.status = 'ACTIVE'
      AND p2.total_votes > ${participant.totalVotes}
  `

  const currentRank = Number(rankResult[0]?.rank ?? 0)

  const activeCount = await prisma.participant.count({
    where: { cycleId: participant.cycleId, status: 'ACTIVE' },
  })

  // Resolve Dropbox link
  if (participant.photoUrl && !participant.photoUrl.startsWith('http')) {
    participant.photoUrl = await getTemporaryLink(participant.photoUrl)
  }

  return {
    participant: {
      ...participant,
      photoUrl: participant.photoUrl,
      videoUrl: participant.videoUrl ? await getTemporaryLink(participant.videoUrl) : null,
      campaignCardUrl: participant.campaignCardUrl ? await getTemporaryLink(participant.campaignCardUrl) : null,
    },
    cycle: participant.cycle,
    todayVotes: todayTally?.voteCount ?? 0,
    currentRank,
    activeParticipants: activeCount,
    recentTallies: participant.dailyTallies,
    voteLink: `${process.env.WEB_URL}/vote/${participant.voteLinkSlug}`,
    campaignCardUrl: participant.campaignCardUrl ? await getTemporaryLink(participant.campaignCardUrl) : null,
  }
}

export async function getParticipantAnalytics(userId: string) {
  const participant = await prisma.participant.findFirst({ where: { userId } })
  if (!participant) throw new AppError('Not a participant', 404)

  const tallies = await prisma.dailyVoteTally.findMany({
    where: { participantId: participant.id },
    orderBy: { voteDate: 'asc' },
  })

  return { tallies, totalVotes: participant.totalVotes }
}

export async function confirmPaymentAndActivate(participantId: string, paymentReference: string, amount?: number) {
  const participant = await prisma.participant.findUnique({ where: { id: participantId } })
  if (!participant) throw new AppError('Participant not found', 404)

  // Tiered logic:
  // 1k -> APPLIED (Longlist)
  // 10k -> ACTIVE (Official Contestant)
  let newStatus: any = 'ACTIVE'
  if (amount && amount < 5000) {
    newStatus = 'APPLIED'
  }

  await prisma.participant.update({
    where: { id: participantId },
    data: {
      status: newStatus,
      registrationFeePaid: true,
      paymentReference,
      paymentAmount: amount,
      paidAt: new Date(),
    },
  })

  logger.info(`Participant ${participantId} payment confirmed: ${paymentReference}. New Status: ${newStatus}`)

  // Auto-generate campaign card once active or applied
  if (newStatus === 'ACTIVE' || newStatus === 'APPLIED') {
    generateParticipantCard(participantId).catch(err => {
      logger.error('Failed to auto-generate campaign card', { participantId, error: err.message })
    })
  }
}

export async function updateParticipantProfile(userId: string, data: Partial<RegisterInput & { nationality: string, instagramUrl: string, twitterUrl: string, tiktokUrl: string, youtubeUrl: string }>) {
  const participant = await prisma.participant.findFirst({ where: { userId } })
  if (!participant) throw new AppError('Participant record not found', 404)

  // Allowed fields for update
  const allowedUpdates = [
    'displayName', 'bio', 'state', 'city', 'category', 
    'nationality', 'instagramUrl', 'twitterUrl', 'tiktokUrl', 'youtubeUrl'
  ]

  const updateData: any = {}
  Object.keys(data).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updateData[key] = (data as any)[key]
    }
  })

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No valid fields provided for update', 400)
  }

  const updated = await prisma.participant.update({
    where: { id: participant.id },
    data: updateData
  })

  // Re-generate campaign card if name changed
  if (updateData.displayName && updateData.displayName !== participant.displayName && participant.status === 'ACTIVE') {
    generateParticipantCard(updated.id).catch(err => {
      logger.error(`[Profile Update] Failed to re-generate card for ${updated.id}:`, err)
    })
  }

  return updated
}

async function initializePayment(user: any, amount: number, participantId: string, cycleId: string) {
  const txRef = `fameafrica-${Date.now()}-${participantId}`
  const redirectUrl = process.env.FLW_REDIRECT_URL || `${process.env.WEB_URL}/register/payment-callback`

  if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
    logger.error('FLW_REDIRECT_URL must be an http/https URL, got: ' + redirectUrl)
    throw new AppError('Payment config error: FLW_REDIRECT_URL must be a web URL', 500)
  }

  const response = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tx_ref: txRef,
      amount,
      currency: 'NGN',
      redirect_url: redirectUrl,
      meta: { participantId, cycleId, userId: user.id },
      customer: {
        email: user.email,
        name: user.fullName || user.displayName || '',
        phonenumber: user.phone || '',
      },
      customizations: {
        title: 'FameAfrica Registration',
        description: 'Participant Registration Fee',
      },
    }),
  })

  const data = await response.json() as any
  if (data.status !== 'success') {
    logger.error('Flutterwave initialization failed: ' + JSON.stringify(data))
    throw new AppError('Payment initialization failed', 500)
  }
  return data.data.link
}

async function generateUniqueSlug(displayName: string): Promise<string> {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 30)

  let slug = base
  let counter = 1

  while (true) {
    const existing = await prisma.participant.findUnique({ where: { voteLinkSlug: slug } })
    if (!existing) break
    slug = `${base}-${counter}`
    counter++
  }

  return slug
}

function getTodayDate(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

// ── Withdrawal Flow ────────────────────────────────────────────

/**
 * Step 1: Request withdrawal.
 * Generates a secure 8‑character token, stores a hash of it with a 24‑hour
 * expiry on the participant record, and sends a confirmation email.
 */
export async function requestWithdrawal(userId: string): Promise<void> {
  const participant = await prisma.participant.findFirst({
    where: { userId },
    include: { user: { select: { email: true, fullName: true } } },
  }) as any

  if (!participant) throw new AppError('You are not a registered participant', 404)
  if (participant.status !== 'ACTIVE') {
    throw new AppError('Only active participants can request a withdrawal', 400)
  }

  // Generate a human‑readable 8‑char token (e.g. "A3F8K2P9")
  const rawToken = crypto.randomBytes(4).toString('hex').toUpperCase()
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await (prisma.participant.update as any)({
    where: { id: participant.id },
    data: {
      withdrawalToken: tokenHash,
      withdrawalTokenExpiresAt: expiresAt,
    },
  })

  const recipientName = participant.user.fullName || participant.displayName
  const recipientEmail = participant.user.email

  await emailTransporter.sendMail({
    to: { email: recipientEmail, name: recipientName },
    subject: '⚠️ Confirm Your Withdrawal — FameAfrica',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family:Arial,sans-serif;background:#f9f9f9;margin:0;padding:0;">
        <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <div style="background:#C0392B;padding:28px 32px;">
            <h1 style="color:#fff;margin:0;font-size:22px;">⚠️ Withdrawal Request</h1>
          </div>
          <div style="padding:32px;">
            <p style="font-size:15px;color:#333;">Hi <strong>${recipientName}</strong>,</p>
            <p style="font-size:15px;color:#333;">
              We received a request to withdraw <strong>${participant.displayName}</strong> from the
              current FameAfrica competition. 
            </p>
            <p style="font-size:15px;color:#555;">
              To confirm, enter this token in the app. It will expire in <strong>24 hours</strong>.
            </p>
            <div style="text-align:center;margin:28px 0;">
              <span style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:8px;
                color:#C0392B;background:#FDF0EF;padding:16px 28px;border-radius:8px;
                border:2px solid #FADBD8;">
                ${rawToken}
              </span>
            </div>
            <p style="font-size:13px;color:#888;">
              If you did NOT request this withdrawal, please ignore this email — your account is safe.
              Your participation will not be affected.
            </p>
          </div>
          <div style="background:#f4f4f4;padding:16px 32px;font-size:12px;color:#aaa;text-align:center;">
            © ${new Date().getFullYear()} FameAfrica. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `,
  })

  logger.info(`Withdrawal request sent for participant ${participant.id} to ${recipientEmail}`)
}

/**
 * Step 2: Confirm withdrawal using the token from the email.
 * Validates the token and marks the participant as WITHDRAWN.
 */
export async function confirmWithdrawal(userId: string, token: string): Promise<void> {
  const participant = await prisma.participant.findFirst({
    where: { userId },
    include: { user: { select: { email: true, fullName: true } } },
  }) as any

  if (!participant) throw new AppError('You are not a registered participant', 404)
  if (participant.status !== 'ACTIVE') {
    throw new AppError('Only active participants can withdraw', 400)
  }
  if (!participant.withdrawalToken || !participant.withdrawalTokenExpiresAt) {
    throw new AppError('No pending withdrawal request found. Please request a new withdrawal.', 400)
  }
  if (new Date() > participant.withdrawalTokenExpiresAt) {
    throw new AppError('Your withdrawal token has expired. Please request a new one.', 400)
  }

  const tokenHash = crypto.createHash('sha256').update(token.trim().toUpperCase()).digest('hex')
  if (tokenHash !== participant.withdrawalToken) {
    throw new AppError('Invalid withdrawal token. Please check the code sent to your email.', 400)
  }

  await (prisma.participant.update as any)({
    where: { id: participant.id },
    data: {
      status: 'WITHDRAWN',
      withdrawalToken: null,
      withdrawalTokenExpiresAt: null,
      eliminatedAt: new Date(),
    },
  })

  // Revert user role back to default 'VOTER'
  await prisma.user.update({
    where: { id: userId },
    data: { role: 'VOTER' },
  })

  // Send a goodbye / confirmation email
  const recipientName = participant.user.fullName || participant.displayName
  await emailTransporter.sendMail({
    to: { email: participant.user.email, name: recipientName },
    subject: 'You have been withdrawn — FameAfrica',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family:Arial,sans-serif;background:#f9f9f9;margin:0;padding:0;">
        <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <div style="background:#333;padding:28px 32px;">
            <h1 style="color:#fff;margin:0;font-size:22px;">Withdrawal Confirmed</h1>
          </div>
          <div style="padding:32px;">
            <p style="font-size:15px;color:#333;">Hi <strong>${recipientName}</strong>,</p>
            <p style="font-size:15px;color:#333;">
              Your withdrawal from FameAfrica has been confirmed. 
              <strong>${participant.displayName}</strong> has been removed from the competition.
            </p>
            <p style="font-size:14px;color:#555;">
              We are sorry to see you go. If this was a mistake or you change your mind,
              please contact our support team as soon as possible.
            </p>
          </div>
          <div style="background:#f4f4f4;padding:16px 32px;font-size:12px;color:#aaa;text-align:center;">
            © ${new Date().getFullYear()} FameAfrica. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `,
  })

  logger.info(`Participant ${participant.id} successfully withdrew from competition`)
}

export async function getAiAdvice(userId: string) {
  const participant = await prisma.participant.findFirst({
    where: { userId },
    select: { id: true, cycleId: true },
  })
  if (!participant) throw new AppError('Participant not found', 404)

  const advice = await prisma.aiAdvice.findFirst({
    where: { participantId: participant.id },
    orderBy: { createdAt: 'desc' },
  })

  return advice
}

/**
 * Gets the top supporters (fans) for a specific participant.
 */
export async function getTopSupporters(participantId: string, limit: number = 20) {
  // Group by voter email or phone to find top identities
  const topVotes = await prisma.vote.groupBy({
    by: ['voterEmail', 'voterPhone'],
    where: {
      participantId,
      verifiedAt: { not: null }
    },
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: limit
  })

  // Enhance with user profiles if they exist
  const supporters = await Promise.all(topVotes.map(async (v) => {
    let profile = null
    const count = v._count?.id || 0
    
    if (v.voterEmail) {
      profile = await prisma.user.findUnique({
        where: { email: v.voterEmail },
        select: { displayName: true, photoUrl: true }
      })
    } else if (v.voterPhone) {
      profile = await prisma.user.findUnique({
        where: { phone: v.voterPhone },
        select: { displayName: true, photoUrl: true }
      })
    }

    return {
      identity: v.voterEmail || v.voterPhone || 'Anonymous',
      voteCount: count,
      displayName: profile?.displayName || 'Voter',
      photoUrl: profile?.photoUrl || null
    }
  }))

  return supporters
}