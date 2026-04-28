// packages/database/prisma/seed.ts

import { PrismaClient, CycleStatus, UserRole, SettingType, ParticipantStatus, BattleStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting comprehensive simulation seed...')

  // Clear existing data
  console.log('🧹 Cleaning old data...')
  try {
    // Delete in reverse order of dependencies
    await prisma.auditLog.deleteMany({})
    await prisma.fraudFlag.deleteMany({})
    await prisma.battleVote.deleteMany({})
    await prisma.battle.deleteMany({})
    await prisma.vote.deleteMany({})
    await prisma.dailyVoteTally.deleteMany({})
    await prisma.elimination.deleteMany({})
    await prisma.transaction.deleteMany({})
    await prisma.kycRecord.deleteMany({})
    await prisma.stan.deleteMany({})
    await prisma.participantStrike.deleteMany({})
    await prisma.participantVideoLike.deleteMany({})
    await prisma.participantVideoComment.deleteMany({})
    await prisma.participantVideo.deleteMany({})
    await prisma.participant.deleteMany({})
    await prisma.sponsor.deleteMany({})
    await prisma.competitionSetting.deleteMany({})
    await prisma.competitionCycle.deleteMany({})
    await prisma.userPreference.deleteMany({})
    await prisma.user.deleteMany({})
  } catch (err: any) {
    console.log('⚠️ Cleanup warning:', err.message)
  }

  const commonPassword = await bcrypt.hash('Password123!', 12)
  const adminPassword = await bcrypt.hash('Admin@FameAfrica2026!', 12)

  // ── 1. ADMIN USER ──────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: 'admin@fameafrica.ng',
      phone: '+2348000000000',
      passwordHash: adminPassword,
      fullName: 'System Administrator',
      displayName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      emailVerified: true,
      phoneVerified: true,
      isActive: true,
    },
  })
  console.log('✅ Admin created')

  // ── 2. COMPETITION CYCLES ───────────────────────────────
  const now = new Date()
  
  // Cycle 2: Summer Heat (Active)
  const cycle2 = await prisma.competitionCycle.create({
    data: {
      cycleName: 'Summer Heat 2026',
      cycleNumber: 2,
      status: CycleStatus.VOTING_OPEN,
      description: 'Africa’s biggest digital talent hunt continues.',
      registrationOpen: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      registrationClose: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      votingOpen: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
      votingClose: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      revealAt: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      registrationFee: 2000,
      feeCurrency: 'NGN',
    }
  })
  console.log('✅ Active cycle created')

  // ── 3. SETTINGS ──────────────────────────────────────────
  const settings = [
    { key: 'eliminations_per_day', value: '2', type: SettingType.NUMBER, cycleId: cycle2.id },
    { key: 'elimination_cutoff_time', value: '19:00', type: SettingType.STRING, cycleId: cycle2.id },
    { key: 'elimination_frequency', value: 'DAILY', type: SettingType.STRING, cycleId: cycle2.id },
    { key: 'min_votes_to_avoid_elimination', value: '50', type: SettingType.NUMBER, cycleId: cycle2.id },
    { key: 'tiebreaker_rule', value: 'LOWEST_CUMULATIVE_VOTES', type: SettingType.STRING, cycleId: cycle2.id },
    { key: 'finalist_count', value: '10', type: SettingType.NUMBER, cycleId: cycle2.id },
    { key: 'platform_name', value: 'FameAfrica', type: SettingType.STRING, isGlobal: true },
  ]

  for (const s of settings) {
    await prisma.competitionSetting.create({ data: s as any })
  }
  console.log('✅ Settings seeded')

  // ── 4. USERS & PARTICIPANTS (CYCLE 2) ───────────────────
  const participantNames = [
    'Amina Bello', 'Chidi Okafor', 'Kemi Adeyemi', 'Tunde Folawiyo', 
    'Zainab Musa', 'Olumide Bakare', 'Fatima Yusuf', 'Ibrahim Danjuma',
    'Ngozi Eze', 'Segun Arinze', 'Bilikisu Sule', 'Musa Garba'
  ]

  const participants = []
  for (let i = 0; i < participantNames.length; i++) {
    const name = participantNames[i]
    const email = `contestant${i + 1}@fameafrica.ng`
    const phone = `+234803000000${i.toString().padStart(2, '0')}`
    
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash: commonPassword,
        fullName: name,
        displayName: name.split(' ')[0],
        role: UserRole.PARTICIPANT,
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
        preferences: { create: {} }
      }
    })

    const participant = await prisma.participant.create({
      data: {
        userId: user.id,
        cycleId: cycle2.id,
        displayName: user.displayName as string,
        voteLinkSlug: `vote-${user.displayName?.toLowerCase()}-${i}`,
        bio: `I am ${name}, a rising star from ${i % 2 === 0 ? 'Lagos' : 'Abuja'}. Vote for me!`,
        status: i > 9 ? ParticipantStatus.ELIMINATED : ParticipantStatus.ACTIVE,
        totalVotes: 0,
        nationality: 'Nigeria',
        state: i % 2 === 0 ? 'Lagos' : 'FCT',
        city: i % 2 === 0 ? 'Ikeja' : 'Garki',
        photoUrl: `https://i.pravatar.cc/300?u=${user.id}`,
        registrationFeePaid: true,
      }
    })
    participants.push(participant)
  }
  console.log('✅ Participants created')

  // ── 5. VOTERS ──────────────────────────────────────────
  const voters = []
  for (let i = 0; i < 30; i++) {
    const user = await prisma.user.create({
      data: {
        email: `voter${i + 1}@gmail.com`,
        phone: `+23470100000${i.toString().padStart(2, '0')}`,
        passwordHash: commonPassword,
        fullName: `Voter ${i + 1}`,
        displayName: `User${i + 1}`,
        role: UserRole.VOTER,
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
        preferences: { create: {} }
      }
    })
    voters.push(user)
  }
  console.log('✅ Voters created')

  // ── 6. VOTES & ELIMINATIONS SIMULATION ─────────────────────
  console.log('🗳️ Simulating votes and eliminations...')
  const startDate = new Date(cycle2.votingOpen)
  
  for (let i = 0; i < participants.length; i++) {
    const p = participants[i]
    let cumulative = 0
    const isEliminated = p.status === ParticipantStatus.ELIMINATED
    const daysActive = isEliminated ? 2 : 5 

    for (let dayOffset = 0; dayOffset < daysActive; dayOffset++) {
      const voteDate = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000)
      const dailyVotes = isEliminated ? Math.floor(Math.random() * 20) + 2 : Math.floor(Math.random() * 100) + 10
      cumulative += dailyVotes

      for (let v = 0; v < Math.min(dailyVotes, 3); v++) {
        const voter = voters[(p.id.length + v) % voters.length]
        const voterPhone = voter.phone || `+234900000${v}`
        await prisma.vote.create({
          data: {
            participantId: p.id,
            cycleId: cycle2.id,
            voterPhone: voterPhone,
            voterPhoneHash: await bcrypt.hash(voterPhone, 4),
            dayNumber: dayOffset + 1,
            voteDate: voteDate,
            ipAddress: `192.168.1.${v}`,
            verifiedAt: new Date(),
          }
        })
      }

      await prisma.dailyVoteTally.create({
        data: {
          participantId: p.id,
          cycleId: cycle2.id,
          dayNumber: dayOffset + 1,
          voteDate: voteDate,
          voteCount: dailyVotes,
          cumulativeVotes: cumulative,
          wasEliminated: isEliminated && (dayOffset === daysActive - 1),
          isEliminationDay: isEliminated && (dayOffset === daysActive - 1)
        }
      })

      if (isEliminated && dayOffset === daysActive - 1) {
        await prisma.elimination.create({
          data: {
            cycleId: cycle2.id,
            participantId: p.id,
            dayNumber: dayOffset + 1,
            eliminationDate: voteDate,
            votesOnDay: dailyVotes,
            cumulativeVotes: cumulative,
            totalParticipantsLeft: participants.length - (i - 9),
            tiebreakerUsed: false,
          }
        })
      }
    }

    await prisma.participant.update({
      where: { id: p.id },
      data: { 
        totalVotes: cumulative,
        eliminatedAt: isEliminated ? new Date(startDate.getTime() + (daysActive - 1) * 24 * 60 * 60 * 1000) : null,
        eliminationDay: isEliminated ? daysActive : null,
      }
    })
  }
  console.log('✅ Votes and Eliminations seeded')

  // ── 7. BATTLES ───────────────────────────────────────────
  console.log('⚔️ Simulating Battles...')
  const activeParticipants = participants.filter(p => p.status === ParticipantStatus.ACTIVE)
  
  if (activeParticipants.length >= 4) {
    // Battle 1: COMPLETED
    await prisma.battle.create({
      data: {
        cycleId: cycle2.id,
        participantAId: activeParticipants[0].id,
        participantBId: activeParticipants[1].id,
        status: BattleStatus.COMPLETED,
        startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() - 23 * 60 * 60 * 1000),
        votesA: 450,
        votesB: 320,
        winnerId: activeParticipants[0].id,
      }
    })

    // Battle 2: LIVE
    await prisma.battle.create({
      data: {
        cycleId: cycle2.id,
        participantAId: activeParticipants[2].id,
        participantBId: activeParticipants[3].id,
        status: BattleStatus.LIVE,
        startTime: new Date(now.getTime() - 30 * 60 * 1000),
        endTime: new Date(now.getTime() + 30 * 60 * 1000),
        votesA: 120,
        votesB: 145,
      }
    })

    // Battle 3: UPCOMING
    await prisma.battle.create({
      data: {
        cycleId: cycle2.id,
        participantAId: activeParticipants[4].id,
        participantBId: activeParticipants[5].id,
        status: BattleStatus.UPCOMING,
        startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 3 * 60 * 60 * 1000),
        votesA: 0,
        votesB: 0,
      }
    })
  }
  console.log('✅ Battles seeded')

  // ── 8. TRANSACTIONS ──────────────────────────────────────
  console.log('💰 Simulating transactions...')
  for (let i = 0; i < 5; i++) {
    await prisma.transaction.create({
      data: {
        userId: voters[i].id,
        amount: 5000,
        currency: 'NGN',
        status: 'SUCCESS',
        reference: `FLW-SIM-${Math.random().toString(36).substring(7).toUpperCase()}`,
        provider: 'FLUTTERWAVE',
        type: 'MEGA_VOTE',
        isFulfilled: true,
      }
    })
  }
  console.log('✅ Transactions seeded')

  console.log('\n🌟 SIMULATION SEED COMPLETE 🌟')
  console.log(`Admin: admin@fameafrica.ng / Admin@FameAfrica2026!`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
