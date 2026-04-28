// services/api/src/modules/battles/battles.service.ts

import { prisma } from '../../lib/prisma'
import { AppError } from '../../utils/errors'
import * as bcrypt from 'bcryptjs'
import { emailTransporter } from '../../utils/emailTransporter'

export class BattlesService {
  static async getActiveBattles(cycleId: string) {
    const now = new Date()
    return prisma.battle.findMany({
      where: {
        cycleId,
        startTime: { lte: now },
        endTime: { gte: now }
      },
      include: {
        participantA: {
          select: { id: true, displayName: true, photoUrl: true, voteLinkSlug: true }
        },
        participantB: {
          select: { id: true, displayName: true, photoUrl: true, voteLinkSlug: true }
        }
      }
    })
  }

  static async sendBattleVoteOtp(battleId: string, participantId: string, voterEmail: string, voterPhone?: string, ip?: string) {
    const battle = await prisma.battle.findUnique({ where: { id: battleId } })
    if (!battle) throw new AppError('Battle not found', 404)
    
    const now = new Date()
    if (now < battle.startTime || now > battle.endTime) {
      throw new AppError('Battle is not active', 400)
    }

    if (participantId !== battle.participantAId && participantId !== battle.participantBId) {
      throw new AppError('Participant not in this battle', 400)
    }

    const normalizedEmail = voterEmail.toLowerCase().trim()
    const today = new Date(new Date().setHours(0,0,0,0))

    // Check for daily vote limit
    const existing = await prisma.battleVote.findFirst({
      where: {
        battleId,
        voterEmail: normalizedEmail,
        createdAt: { gte: today }
      }
    })
    if (existing) throw new AppError('You have already voted in this battle today', 400)

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiry = new Date(Date.now() + 5 * 60 * 1000) // 5 mins

    await prisma.otpToken.create({
      data: {
        email: normalizedEmail,
        phone: voterPhone || null,
        otpCode: await bcrypt.hash(otpCode, 10),
        purpose: 'battle_vote',
        participantId,
        cycleId: battle.cycleId,
        expiresAt: expiry,
        ipAddress: ip || null
      }
    })

    // Send Email
    await emailTransporter.sendMail({
      to: normalizedEmail,
      subject: `Battle Verification Code: ${otpCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #FF4081;">Battle Verification</h2>
          <p>Your verification code for the FameAfrica Battle is:</p>
          <div style="background: #f9f9f9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #FF4081; border-radius: 5px; margin: 20px 0;">
            ${otpCode}
          </div>
          <p>This code expires in 5 minutes. Use it to confirm your vote!</p>
        </div>
      `
    }).catch(err => {
      console.error('Failed to send battle OTP email', err)
      throw new AppError('Failed to send verification email. Please try again.', 500)
    })

    return { message: 'Verification code sent to your email' }
  }

  static async castBattleVote(battleId: string, participantId: string, voterEmail: string, otpCode: string, voterPhone?: string) {
    const battle = await prisma.battle.findUnique({ where: { id: battleId } })
    if (!battle) throw new AppError('Battle not found', 404)
    
    const now = new Date()
    if (now < battle.startTime || now > battle.endTime) {
      throw new AppError('Battle is not active', 400)
    }

    const normalizedEmail = voterEmail.toLowerCase().trim()

    // Verify OTP
    const token = await prisma.otpToken.findFirst({
      where: {
        email: normalizedEmail,
        purpose: 'battle_vote',
        expiresAt: { gte: now },
        usedAt: null
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!token) throw new AppError('Invalid or expired verification code', 400)

    const valid = await bcrypt.compare(otpCode, token.otpCode)
    if (!valid) throw new AppError('Invalid verification code', 400)

    // Final check for double voting (to be safe)
    const today = new Date(new Date().setHours(0,0,0,0))
    const existing = await prisma.battleVote.findFirst({
      where: { battleId, voterEmail: normalizedEmail, createdAt: { gte: today } }
    })
    if (existing) throw new AppError('You have already voted in this battle today', 400)

    return prisma.$transaction(async (tx) => {
      const vote = await tx.battleVote.create({
        data: { 
          battleId, 
          participantId, 
          voterEmail: normalizedEmail, 
          voterPhone: voterPhone || null 
        }
      })

      await tx.otpToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() }
      })

      if (participantId === battle.participantAId) {
        await tx.battle.update({
          where: { id: battleId },
          data: { votesA: { increment: 1 } }
        })
      } else {
        await tx.battle.update({
          where: { id: battleId },
          data: { votesB: { increment: 1 } }
        })
      }

      return vote
    })
  }

  static async getPastBattles(cycleId: string, limit = 20) {
    return prisma.battle.findMany({
      where: {
        cycleId,
        endTime: { lt: new Date() }
      },
      include: {
        participantA: true,
        participantB: true
      },
      orderBy: { endTime: 'desc' },
      take: limit
    })
  }

  /**
   * AUTOMATION: Match active participants who aren't currently battling
   */
  static async generateAutomaticBattles() {
    const cycle = await prisma.competitionCycle.findFirst({
      where: { status: 'VOTING_OPEN' }
    })
    if (!cycle) return

    // Find active participants who aren't in a LIVE battle
    const now = new Date()
    const battlingIds = await prisma.battle.findMany({
      where: {
        cycleId: cycle.id,
        endTime: { gt: now }
      },
      select: { participantAId: true, participantBId: true }
    })

    const excludedIds = new Set<string>()
    battlingIds.forEach(b => {
      excludedIds.add(b.participantAId)
      excludedIds.add(b.participantBId)
    })

    const available = await prisma.participant.findMany({
      where: {
        cycleId: cycle.id,
        status: 'ACTIVE',
        id: { notIn: Array.from(excludedIds) }
      },
      orderBy: { totalVotes: 'desc' }
    })

    if (available.length < 2) return

    // Pair them up (shuffling for variety)
    const shuffled = available.sort(() => Math.random() - 0.5)
    const pairs: [string, string][] = []
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      pairs.push([shuffled[i].id, shuffled[i+1].id])
    }

    const durationHrs = 6
    const startTime = new Date()
    const endTime = new Date(startTime.getTime() + durationHrs * 60 * 60 * 1000)

    for (const [pA, pB] of pairs) {
      await prisma.battle.create({
        data: {
          cycleId: cycle.id,
          participantAId: pA,
          participantBId: pB,
          startTime,
          endTime,
          votesA: 0,
          votesB: 0
        }
      })
    }

    return pairs.length
  }

  /**
   * AUTOMATION: Settle finished battles
   */
  static async resolveExpiredBattles() {
    const now = new Date()
    const expired = await prisma.battle.findMany({
      where: {
        endTime: { lt: now },
        winnerId: null
      }
    })

    for (const battle of expired) {
      let winnerId: string | null = null
      if (battle.votesA > battle.votesB) winnerId = battle.participantAId
      else if (battle.votesB > battle.votesA) winnerId = battle.participantBId
      // In case of tie, no winner or random? Let's stay with null or first one.
      
      await prisma.battle.update({
        where: { id: battle.id },
        data: { winnerId }
      })

      // Bonus: Winner gets 10 votes in main competition
      if (winnerId) {
        await prisma.participant.update({
          where: { id: winnerId },
          data: { totalVotes: { increment: 10 } }
        })
      }
    }

    return expired.length
  }
}
