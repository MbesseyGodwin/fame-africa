// services/api/src/modules/battles/battles.service.ts

import { prisma } from '../../lib/prisma'
import { AppError } from '../../utils/errors'

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

  static async voteInBattle(battleId: string, participantId: string, voterPhone: string) {
    const battle = await prisma.battle.findUnique({ where: { id: battleId } })
    if (!battle) throw new AppError('Battle not found', 404)
    
    const now = new Date()
    if (now < battle.startTime || now > battle.endTime) {
      throw new AppError('Battle is not active', 400)
    }

    if (participantId !== battle.participantAId && participantId !== battle.participantBId) {
      throw new AppError('Participant not in this battle', 400)
    }

    // Check for daily vote limit in this battle (optional, but good for fairness)
    const existing = await prisma.battleVote.findFirst({
      where: {
        battleId,
        voterPhone,
        createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) }
      }
    })
    
    if (existing) throw new AppError('You have already voted in this battle today', 400)

    return prisma.$transaction(async (tx) => {
      const vote = await tx.battleVote.create({
        data: { battleId, participantId, voterPhone }
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
