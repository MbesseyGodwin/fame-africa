// src/modules/competitions/competitions.service.ts

import { prisma } from '../../index'
import { AppError } from '../../utils/errors'
import { logger } from '../../utils/logger'

// ── Settings ─────────────────────────────────────────────────

export async function getCycleSetting(cycleId: string, key: string): Promise<string | null> {
    const setting = await prisma.competitionSetting.findFirst({
        where: { cycleId, key },
    })
    return setting?.value ?? null
}

export async function getGlobalSetting(key: string): Promise<string | null> {
    const setting = await prisma.competitionSetting.findFirst({
        where: { cycleId: null, isGlobal: true, key },
    })
    return setting?.value ?? null
}

export async function getCycleSettingTyped<T = string>(
    cycleId: string,
    key: string,
    fallback: T
): Promise<T> {
    const raw = await getCycleSetting(cycleId, key)
    if (raw === null) return fallback

    // Coerce based on fallback type
    if (typeof fallback === 'boolean') return (raw === 'true') as unknown as T
    if (typeof fallback === 'number') return (parseFloat(raw) as unknown) as T
    return raw as unknown as T
}

// ── Cycle CRUD ────────────────────────────────────────────────

export async function getActiveCycle() {
    return prisma.competitionCycle.findFirst({
        where: { status: { in: ['REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'VOTING_OPEN'] } },
        orderBy: { cycleNumber: 'desc' },
    })
}

export async function getCycleById(id: string) {
    const cycle = await prisma.competitionCycle.findUnique({ where: { id } })
    if (!cycle) throw new AppError('Competition cycle not found', 404)
    return cycle
}

export async function listCycles(page = 1, limit = 10) {
    const skip = (page - 1) * limit
    const [cycles, total] = await Promise.all([
        prisma.competitionCycle.findMany({
            skip,
            take: limit,
            orderBy: { cycleNumber: 'desc' },
        }),
        prisma.competitionCycle.count(),
    ])
    return { cycles, total, page, limit }
}

export async function createCycle(data: {
    cycleName: string
    cycleNumber: number
    description?: string
    bannerImageUrl?: string
    registrationOpen: Date
    registrationClose: Date
    votingOpen: Date
    votingClose: Date
    revealAt: Date
    registrationFee?: number
    feeCurrency?: string
}) {
    return prisma.competitionCycle.create({ data })
}

export async function updateCycleStatus(
    cycleId: string,
    status: 'DRAFT' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'VOTING_OPEN' | 'VOTING_CLOSED' | 'REVEALING' | 'COMPLETED' | 'CANCELLED'
) {
    const cycle = await prisma.competitionCycle.findUnique({ where: { id: cycleId } })
    if (!cycle) throw new AppError('Cycle not found', 404)

    logger.info(`Cycle ${cycleId} status: ${cycle.status} → ${status}`)

    return prisma.competitionCycle.update({
        where: { id: cycleId },
        data: { status },
    })
}

// ── Leaderboard ───────────────────────────────────────────────

export async function getCycleLeaderboard(cycleId: string, limit = 20) {
    return prisma.participant.findMany({
        where: { cycleId, status: { in: ['ACTIVE', 'WINNER'] } },
        orderBy: { totalVotes: 'desc' },
        take: limit,
        select: {
            id: true,
            displayName: true,
            photoUrl: true,
            state: true,
            city: true,
            voteLinkSlug: true,
            totalVotes: true,
            status: true,
        },
    })
}

// ── Stats ─────────────────────────────────────────────────────

export async function getCycleStats(cycleId: string) {
    const [totalParticipants, activeParticipants, totalVotes, todayVotes] = await Promise.all([
        prisma.participant.count({ where: { cycleId } }),
        prisma.participant.count({ where: { cycleId, status: 'ACTIVE' } }),
        prisma.vote.count({ where: { cycleId } }),
        prisma.vote.count({
            where: {
                cycleId,
                voteDate: getTodayDate(),
            },
        }),
    ])

    return { totalParticipants, activeParticipants, totalVotes, todayVotes }
}

function getTodayDate(): Date {
    const now = new Date()
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}