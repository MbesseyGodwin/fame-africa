// services/api/src/modules/voting/voting.service.ts

import * as bcrypt from 'bcryptjs'
import { prisma } from '../../index'
import { io } from '../../index'
import { AppError } from '../../utils/errors'
import { hashValue } from '../../utils/crypto'
import { sendSms } from '../../utils/sms'
import { emailTransporter } from '../../utils/emailTransporter'
import { logger } from '../../utils/logger'
import { getActiveSponsorForAd } from '../sponsors/sponsors.service'
import { getCycleSetting } from '../competitions/competitions.service'

interface CastVoteInput {
  participantSlug: string
  voterPhone?: string
  voterEmail: string
  otpCode: string
  deviceFingerprint?: string
  ip: string
  userAgent: string
  source?: string
}

interface SendVoteOtpInput {
  participantSlug: string
  voterPhone?: string
  voterEmail: string
  ip: string
}

export async function sendVoteOtp(input: SendVoteOtpInput) {
  const { participantSlug, voterPhone, voterEmail, ip } = input

  const normalizedPhone = voterPhone ? normalizePhone(voterPhone) : null
  const normalizedEmail = voterEmail.toLowerCase().trim()

  const participant = await prisma.participant.findUnique({
    where: { voteLinkSlug: participantSlug },
    include: { cycle: true },
  })

  if (!participant) throw new AppError('Participant not found', 404)
  if (participant.status !== 'ACTIVE') throw new AppError('This participant is no longer active in the competition', 400)

  const cycle = participant.cycle
  const now = new Date()
  if (now < cycle.votingOpen || now > cycle.votingClose) {
    throw new AppError('Voting is not currently open', 400)
  }

  const today = getTodayDate()
  const phoneHash = normalizedPhone ? hashValue(normalizedPhone) : null
  const emailHash = hashValue(normalizedEmail)

  if (phoneHash) {
    const alreadyVotedPhone = await prisma.vote.findFirst({
      where: { voterPhoneHash: phoneHash, cycleId: cycle.id, voteDate: today },
    })
    if (alreadyVotedPhone) throw new AppError('You have already voted today. Come back tomorrow!', 409)
  }

  const alreadyVotedEmail = await prisma.vote.findFirst({
    where: { voterEmailHash: emailHash, cycleId: cycle.id, voteDate: today },
  })
  if (alreadyVotedEmail) throw new AppError('You have already voted today with this email. Come back tomorrow!', 409)

  const recentOtp = await prisma.otpToken.findFirst({
    where: {
      email: normalizedEmail,
      purpose: 'vote',
      createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      usedAt: null,
    },
  })
  if (recentOtp) throw new AppError('Please wait 60 seconds before requesting another OTP', 429)

  const otpCode = generateNumericOtp(6)
  const expirySeconds = 300

  await prisma.otpToken.create({
    data: {
      phone: (normalizedPhone ?? undefined) as any,
      email: normalizedEmail,
      otpCode: await bcrypt.hash(otpCode, 10),
      purpose: 'vote',
      participantId: participant.id,
      cycleId: cycle.id,
      expiresAt: new Date(Date.now() + expirySeconds * 1000),
      ipAddress: ip,
    },
  })

  const sponsor = await getActiveSponsorForAd(cycle.id)
  const sponsorLine = sponsor ? `<p style="font-size: 13px; color: #666;"><em>This competition is powered by ${sponsor.companyName}.</em></p>` : ''

  // 1. Send OTP via Email (Mandatory)
  try {
    await emailTransporter.sendMail({
      to: normalizedEmail,
      subject: `Your FameAfrica Verification Code: ${otpCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #A32D2D; text-align: center;">Verify Your Vote</h2>
          <p>Hello,</p>
          <p>You requested a verification code to vote for <strong>${participant.displayName}</strong> on <strong>FameAfrica</strong>.</p>
          <div style="background: #f9f9f9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #A32D2D; border-radius: 5px; margin: 20px 0;">
            ${otpCode}
          </div>
          <p>This code is valid for 5 minutes. If you did not request this, please ignore this email.</p>
          ${sponsorLine}
        </div>
      `,
    })
  } catch (err) {
    logger.error('Failed to send vote OTP email', err)
    throw new AppError('Failed to send verification email. Please try again.', 500)
  }

  // 2. Send OTP via SMS (Optional)
  if (normalizedPhone) {
    const smsSponsorLine = sponsor ? ` Powered by ${sponsor.companyName}.` : ''
    await sendSms(
      normalizedPhone,
      `Your FameAfrica code is ${otpCode}. Valid for 5 minutes. Use it to vote for ${participant.displayName}.${smsSponsorLine}`
    ).catch(err => logger.warn('Failed to send vote OTP SMS', err))
  }

  return { message: 'OTP sent via email' + (normalizedPhone ? ' and SMS' : ''), participantName: participant.displayName }
}

export async function castVote(input: CastVoteInput) {
  const { participantSlug, voterPhone, voterEmail, otpCode, deviceFingerprint, ip, userAgent, source } = input

  const normalizedPhone = voterPhone ? normalizePhone(voterPhone) : null
  const normalizedEmail = voterEmail.toLowerCase().trim()
  const maxAttempts = 3

  const participant = await prisma.participant.findUnique({
    where: { voteLinkSlug: participantSlug },
    include: { cycle: true },
  })

  if (!participant) throw new AppError('Participant not found', 404)
  if (participant.status !== 'ACTIVE') throw new AppError('This participant is no longer in the competition', 400)

  const cycle = participant.cycle
  const now = new Date()
  if (now < cycle.votingOpen || now > cycle.votingClose) {
    throw new AppError('Voting is not currently open', 400)
  }

  const token = await prisma.otpToken.findFirst({
    where: {
      email: normalizedEmail,
      purpose: 'vote',
      participantId: participant.id,
      usedAt: null,
      expiresAt: { gte: new Date() },
      attemptCount: { lt: maxAttempts },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!token) throw new AppError('OTP expired or not found. Please request a new one.', 400)

  await prisma.otpToken.update({
    where: { id: token.id },
    data: { attemptCount: { increment: 1 } },
  })

  const valid = await bcrypt.compare(otpCode, token.otpCode)
  if (!valid) {
    const remaining = maxAttempts - token.attemptCount - 1
    throw new AppError(`Invalid OTP. ${remaining} attempt(s) remaining.`, 400)
  }

  const phoneHash = normalizedPhone ? hashValue(normalizedPhone) : null
  const emailHash = hashValue(normalizedEmail)
  const today = getTodayDate()

  const duplicateChecks = await Promise.all([
    phoneHash ? prisma.vote.findFirst({ where: { voterPhoneHash: phoneHash, cycleId: cycle.id, voteDate: today } }) : null,
    prisma.vote.findFirst({ where: { voterEmailHash: emailHash, cycleId: cycle.id, voteDate: today } }),
    deviceFingerprint
      ? prisma.vote.findFirst({ where: { deviceFingerprint, cycleId: cycle.id, voteDate: today } })
      : null,
  ])

  if (phoneHash && duplicateChecks[0]) throw new AppError('You (phone) have already voted today.', 409)
  if (duplicateChecks[1]) throw new AppError('This email has already been used to vote today.', 409)
  if (duplicateChecks[2]) throw new AppError('A vote has already been recorded from this device today.', 409)

  const dayNumber = getDayNumber(cycle.votingOpen)

  const vote = await prisma.$transaction(async (tx) => {
    const newVote = await tx.vote.create({
      data: {
        participantId: participant.id,
        cycleId: cycle.id,
        voterPhone: (normalizedPhone ?? undefined) as any,
        voterPhoneHash: (phoneHash ?? undefined) as any,
        voterEmail: normalizedEmail,
        voterEmailHash: emailHash,
        deviceFingerprint,
        ipAddress: ip,
        userAgent,
        dayNumber,
        voteDate: today,
        verifiedAt: new Date(),
        source: source || 'link',
      },
    })

    await tx.otpToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    })

    await tx.participant.update({
      where: { id: participant.id },
      data: { totalVotes: { increment: 1 } },
    })

    await tx.dailyVoteTally.upsert({
      where: { participantId_voteDate: { participantId: participant.id, voteDate: today } },
      create: {
        participantId: participant.id,
        cycleId: cycle.id,
        dayNumber,
        voteDate: today,
        voteCount: 1,
        cumulativeVotes: participant.totalVotes + 1,
      },
      update: {
        voteCount: { increment: 1 },
        cumulativeVotes: { increment: 1 },
      },
    })

    return newVote
  })

  await detectFraud(vote.id, { phoneHash, emailHash, deviceFingerprint, ip, cycleId: cycle.id })

  const updatedTally = await prisma.dailyVoteTally.findUnique({
    where: { participantId_voteDate: { participantId: participant.id, voteDate: today } },
  })

  io.to(`participant:${participant.id}`).emit('vote:received', {
    participantId: participant.id,
    todayCount: updatedTally?.voteCount ?? 1,
    totalCount: participant.totalVotes + 1,
  })

  io.to(`admin:votes`).emit('vote:cast', {
    participantId: participant.id,
    participantName: participant.displayName,
    cycleId: cycle.id,
    timestamp: new Date(),
  })

  const sponsor = await getActiveSponsorForAd(cycle.id)
  const sponsorLine = sponsor ? ` Powered by ${sponsor.companyName}.` : ''

  if (normalizedPhone) {
    await sendSms(
      normalizedPhone,
      `Your vote for ${participant.displayName} in FameAfrica Spring 2026 has been recorded. Come back tomorrow to vote again!${sponsorLine}`
    ).catch(err => logger.warn('Failed to send vote confirmation SMS', err))
  }

  try {
    await emailTransporter.sendMail({
      to: normalizedEmail,
      subject: `Your FameAfrica vote for ${participant.displayName} is confirmed`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #A32D2D; text-align: center;">Vote confirmed!</h2>
          <p>Your vote for <strong>${participant.displayName}</strong> in the <strong>FameAfrica</strong> competition has been recorded.</p>
          <p>You can vote again tomorrow. Share ${participant.displayName}'s link to get more votes for them!</p>
          <p><a href="${process.env.WEB_URL}/vote/${participant.voteLinkSlug}" style="color: #A32D2D; font-weight: bold;">Vote here again tomorrow</a></p>
          ${sponsor ? `<p style="font-size: 13px; color: #666;"><em>This competition is powered by ${sponsor.companyName}.</em></p>` : ''}
        </div>
      `,
    })
  } catch (e) {
    logger.warn('Failed to send vote confirmation email:', e)
  }

  return {
    success: true,
    participantName: participant.displayName,
    message: 'Your vote has been recorded! Come back tomorrow to vote again.',
  }
}

export async function checkIfVotedToday(phone: string, cycleId: string): Promise<boolean> {
  const normalizedPhone = normalizePhone(phone)
  const phoneHash = hashValue(normalizedPhone)
  const today = getTodayDate()

  const existing = await prisma.vote.findFirst({
    where: { voterPhoneHash: phoneHash, cycleId, voteDate: today },
  })
  return !!existing
}

async function detectFraud(
  voteId: string,
  data: { phoneHash: string | null; emailHash: string; deviceFingerprint?: string; ip: string; cycleId: string }
) {
  const today = getTodayDate()
  const recentWindow = new Date(Date.now() - 5 * 60 * 1000)

  const rapidVotes = await prisma.vote.count({
    where: { ipAddress: data.ip, cycleId: data.cycleId, createdAt: { gte: recentWindow } },
  })

  if (rapidVotes > 5) {
    await prisma.fraudFlag.create({
      data: {
        voteId,
        flagType: 'RAPID_VOTES',
        details: `${rapidVotes} votes from IP ${data.ip} in last 5 minutes`,
      },
    })
    logger.warn(`Fraud flag: rapid votes from IP ${data.ip}`)
  }
}

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '')
  if (cleaned.startsWith('+')) return cleaned
  if (cleaned.startsWith('0')) return `+234${cleaned.slice(1)}`
  if (cleaned.startsWith('234')) return `+${cleaned}`
  return `+234${cleaned}`
}

function getTodayDate(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

function getDayNumber(votingOpen: Date): number {
  const today = getTodayDate()
  const open = new Date(Date.UTC(votingOpen.getUTCFullYear(), votingOpen.getUTCMonth(), votingOpen.getUTCDate()))
  return Math.floor((today.getTime() - open.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

function generateNumericOtp(length: number): string {
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString()
  }
  return otp
}
