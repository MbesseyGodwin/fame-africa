// packages/database/prisma/seed.ts

import { PrismaClient, CycleStatus, UserRole, SettingType } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ── Admin user ──────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@VoteNaija2026!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@votenaija.ng' },
    update: {},
    create: {
      email: 'admin@votenaija.ng',
      phone: '+2348000000000',
      passwordHash: adminPassword,
      fullName: 'VoteNaija Admin',
      displayName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      emailVerified: true,
      phoneVerified: true,
    },
  })
  console.log('Admin user created:', admin.email)

  // ── Default global platform settings ────────────────────
  const globalSettings = [
    { key: 'platform_name', value: 'VoteNaija', type: SettingType.STRING, label: 'Platform name', isGlobal: true },
    { key: 'platform_tagline', value: "Nigeria's premier voting competition", type: SettingType.STRING, label: 'Tagline', isGlobal: true },
    { key: 'support_email', value: 'support@votenaija.ng', type: SettingType.STRING, label: 'Support email', isGlobal: true },
    { key: 'support_phone', value: '+2348000000001', type: SettingType.STRING, label: 'Support phone', isGlobal: true },
    { key: 'otp_expiry_seconds', value: '300', type: SettingType.NUMBER, label: 'OTP expiry (seconds)', isGlobal: true },
    { key: 'otp_max_attempts', value: '3', type: SettingType.NUMBER, label: 'OTP max attempts', isGlobal: true },
    { key: 'maintenance_mode', value: 'false', type: SettingType.BOOLEAN, label: 'Maintenance mode', isGlobal: true },
    { key: 'minimum_app_version', value: '1.0.0', type: SettingType.STRING, label: 'Min app version', isGlobal: true },
    { key: 'terms_version', value: '1.0', type: SettingType.STRING, label: 'Terms version', isGlobal: true },
  ]

  for (const setting of globalSettings) {
    const existing = await prisma.competitionSetting.findFirst({
      where: { key: setting.key, cycleId: null },
    })

    if (!existing) {
      await prisma.competitionSetting.create({
        data: { ...setting, cycleId: null },
      })
    }
  }
  console.log('Global settings seeded')

  // ── Sample competition cycle ─────────────────────────────
  const now = new Date()
  const cycle = await prisma.competitionCycle.upsert({
    where: { id: 'seed-cycle-spring-2026' },
    update: {},
    create: {
      id: 'seed-cycle-spring-2026',
      cycleName: 'Spring 2026',
      cycleNumber: 1,
      status: CycleStatus.DRAFT,
      description: 'The inaugural VoteNaija competition. Open to all Nigerians.',
      registrationOpen: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      registrationClose: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      votingOpen: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
      votingClose: new Date(now.getTime() + 37 * 24 * 60 * 60 * 1000),
      revealAt: new Date(now.getTime() + 38 * 24 * 60 * 60 * 1000),
      registrationFee: 2000,
      feeCurrency: 'NGN',
    },
  })
  console.log('Sample cycle created:', cycle.cycleName)

  // ── Cycle-specific settings ──────────────────────────────
  const cycleSettings = [
    { key: 'daily_elimination_count', value: '1', type: SettingType.NUMBER, label: 'Eliminations per day' },
    { key: 'elimination_cutoff_time', value: '23:59', type: SettingType.STRING, label: 'Voting cutoff time' },
    { key: 'elimination_announcement_time', value: '00:30', type: SettingType.STRING, label: 'Announcement time' },
    { key: 'tiebreaker_rule_1', value: 'LOWEST_CUMULATIVE_VOTES', type: SettingType.STRING, label: 'Tiebreaker 1' },
    { key: 'tiebreaker_rule_2', value: 'LATEST_REGISTRATION', type: SettingType.STRING, label: 'Tiebreaker 2' },
    { key: 'tiebreaker_rule_3', value: 'RANDOM', type: SettingType.STRING, label: 'Tiebreaker 3' },
    { key: 'finalist_count', value: '5', type: SettingType.NUMBER, label: 'Number of finalists' },
    { key: 'max_participants', value: '0', type: SettingType.NUMBER, label: 'Max participants (0=unlimited)' },
    { key: 'min_participants', value: '10', type: SettingType.NUMBER, label: 'Min participants to proceed' },
    { key: 'participant_can_see_own_votes', value: 'true', type: SettingType.BOOLEAN, label: 'Participants see own votes' },
    { key: 'participant_vote_display_mode', value: 'realtime', type: SettingType.STRING, label: 'Vote display mode' },
    { key: 'voter_verification_method', value: 'phone_otp', type: SettingType.STRING, label: 'Voter verification' },
    { key: 'votes_per_voter_per_day', value: '1', type: SettingType.NUMBER, label: 'Votes per voter per day' },
    { key: 'vote_reset_time', value: '00:00', type: SettingType.STRING, label: 'Daily vote reset time' },
    { key: 'duplicate_check_phone', value: 'true', type: SettingType.BOOLEAN, label: 'Check duplicate phone' },
    { key: 'duplicate_check_email', value: 'true', type: SettingType.BOOLEAN, label: 'Check duplicate email' },
    { key: 'duplicate_check_device', value: 'true', type: SettingType.BOOLEAN, label: 'Check duplicate device' },
    { key: 'ad_display_on_vote_page', value: 'true', type: SettingType.BOOLEAN, label: 'Show ads on vote page' },
    { key: 'ad_position', value: 'TOP', type: SettingType.STRING, label: 'Ad position' },
    { key: 'prize_1st_amount', value: '150000', type: SettingType.NUMBER, label: '1st place prize (NGN)' },
    { key: 'prize_1st_sponsor', value: 'VoteNaija', type: SettingType.STRING, label: '1st place sponsor' },
    { key: 'prize_2nd_amount', value: '10000', type: SettingType.NUMBER, label: '2nd place prize (NGN)' },
    { key: 'prize_2nd_sponsor', value: 'MTN Nigeria', type: SettingType.STRING, label: '2nd place sponsor' },
    { key: 'prize_3rd_amount', value: '5000', type: SettingType.NUMBER, label: '3rd place prize (NGN)' },
    { key: 'prize_3rd_sponsor', value: 'Airtel Nigeria', type: SettingType.STRING, label: '3rd place sponsor' },
  ]

  for (const setting of cycleSettings) {
    await prisma.competitionSetting.upsert({
      where: { cycleId_key: { cycleId: cycle.id, key: setting.key } },
      update: {},
      create: { ...setting, cycleId: cycle.id },
    })
  }
  console.log('Cycle settings seeded')

  // ── Sample sponsors ──────────────────────────────────────
  await prisma.sponsor.createMany({
    skipDuplicates: true,
    data: [
      {
        cycleId: cycle.id,
        companyName: 'MTN Nigeria',
        websiteUrl: 'https://mtn.com.ng',
        prizeDescription: '₦10,000 airtime for 2nd place winner',
        prizeAmount: 10000,
        prizeCurrency: 'NGN',
        prizeRank: 2,
        isActive: true,
        displayOrder: 1,
      },
      {
        cycleId: cycle.id,
        companyName: 'Airtel Nigeria',
        websiteUrl: 'https://airtel.com.ng',
        prizeDescription: '₦5,000 data bundle for 3rd place winner',
        prizeAmount: 5000,
        prizeCurrency: 'NGN',
        prizeRank: 3,
        isActive: true,
        displayOrder: 2,
      },
    ],
  })
  console.log('Sample sponsors seeded')

  console.log('\nDatabase seeded successfully!')
  console.log('Admin login: admin@votenaija.ng / Admin@VoteNaija2026!')
  console.log('CHANGE THE ADMIN PASSWORD IMMEDIATELY after first login.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
