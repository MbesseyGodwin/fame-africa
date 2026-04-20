import { PrismaClient } from '@prisma/client'
import { AppError } from '../../utils/errors'
import { logger } from '../../utils/logger'

const prisma = new PrismaClient()

export async function stanContestant(userId: string, participantId: string) {
  logger.info('[StansService.stanContestant] request', { userId, participantId })

  const participant = await prisma.participant.findUnique({ where: { id: participantId } })
  if (!participant) throw new AppError('Participant not found', 404)

  const existing = await prisma.stan.findUnique({
    where: { userId_participantId: { userId, participantId } }
  })

  if (existing) return existing

  const [stan] = await prisma.$transaction([
    prisma.stan.create({ data: { userId, participantId } }),
    prisma.participant.update({
      where: { id: participantId },
      data: { stanCount: { increment: 1 } }
    })
  ])

  return stan
}

export async function unstanContestant(userId: string, participantId: string) {
  logger.info('[StansService.unstanContestant] request', { userId, participantId })

  const existing = await prisma.stan.findUnique({
    where: { userId_participantId: { userId, participantId } }
  })

  if (!existing) return

  await prisma.$transaction([
    prisma.stan.delete({ where: { id: existing.id } }),
    prisma.participant.update({
      where: { id: participantId },
      data: { stanCount: { decrement: 1 } }
    })
  ])
}

export async function getParticipantStans(participantId: string) {
  return prisma.stan.findMany({
    where: { participantId },
    include: { user: { select: { id: true, fullName: true, photoUrl: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export async function checkStanningStatus(userId: string, participantId: string) {
  const stan = await prisma.stan.findUnique({
    where: { userId_participantId: { userId, participantId } }
  })
  return !!stan
}

export async function getMyStans(userId: string) {
  return prisma.stan.findMany({
    where: { userId },
    include: { 
      participant: { 
        select: { 
          id: true, 
          displayName: true, 
          photoUrl: true, 
          voteLinkSlug: true,
          category: true,
        } 
      } 
    },
    orderBy: { createdAt: 'desc' },
  })
}
