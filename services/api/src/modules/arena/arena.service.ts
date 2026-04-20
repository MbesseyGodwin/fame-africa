// services/api/src/modules/arena/arena.service.ts

import { prisma, io } from '../../index'
import { ArenaEventStatus, ArenaParticipationStatus } from '@prisma/client'
import { AppError } from '../../utils/errors'
import { logger } from '../../utils/logger'

/**
 * Creates a new Arena event for a specific cycle.
 */
export async function createArenaEvent(cycleId: string, title: string, scheduledAt: Date) {
  const event = await prisma.arenaEvent.create({
    data: {
      cycleId,
      title,
      scheduledAt,
      status: 'SCHEDULED',
    },
  })

  // Pre-generate 30 dynamic questions for the IQ Blitz
  await generateArenaQuestions(event.id)
  
  return event
}

/**
 * Lists upcoming and live Arena events for the current cycle.
 */
export async function listArenaEvents(cycleId: string) {
  return await prisma.arenaEvent.findMany({
    where: { 
      cycleId, 
      status: { in: ['SCHEDULED', 'LIVE'] } 
    },
    orderBy: { scheduledAt: 'asc' }
  })
}

/**
 * Fetches full event details, including questions (for the contestant UI).
 */
export async function getEventDetail(eventId: string) {
  return await prisma.arenaEvent.findUnique({
    where: { id: eventId },
    include: { questions: { orderBy: { order: 'asc' } } }
  })
}

/**
 * Generates dynamic, non-repeating questions based on IQ templates.
 * In a real-world scenario, this could pull from an external bank or AI.
 * Here we use a procedural generator for speed and variety.
 */
async function generateArenaQuestions(eventId: string) {
  const questions = [
    {
      text: "Which of these numbers is prime?",
      options: ["12", "15", "17", "21"],
      correct: 2,
    },
    {
      text: "If 'A' = 1, 'B' = 2, what is 'F'?",
      options: ["4", "5", "6", "7"],
      correct: 2,
    },
    // ... we would generate 30 of these
  ]

  // For the purpose of the MVP, we generate 10 dynamic logic/math questions
  for (let i = 0; i < 10; i++) {
    const a = Math.floor(Math.random() * 50) + 1
    const b = Math.floor(Math.random() * 50) + 1
    const result = a + b
    const fakeResults = [result + 2, result - 2, result + 10]
    const options = [...fakeResults, result].sort(() => Math.random() - 0.5)
    
    await prisma.arenaQuestion.create({
      data: {
        eventId,
        questionText: `What is ${a} + ${b}?`,
        options,
        correctOptionIndex: options.indexOf(result),
        order: i,
        timerSeconds: 15, // Users have 15s per question
      },
    })
  }
}

/**
 * Starts the live Arena session. 
 * Broadcasts to all connected participants.
 */
export async function startArenaLive(eventId: string) {
  const event = await prisma.arenaEvent.findUnique({
    where: { id: eventId },
    include: { questions: { orderBy: { order: 'asc' } } }
  })

  if (!event) throw new AppError('Arena event not found', 404)
  if (event.status !== 'SCHEDULED') throw new AppError('Event already started or cancelled', 400)

  await prisma.arenaEvent.update({
    where: { id: eventId },
    data: { status: 'LIVE' },
  })

  // Broadcast to all participating rooms
  io.emit('arena:live_start', {
    eventId,
    title: event.title,
    questionCount: event.questions.length,
  })

  logger.info(`Arena Event ${eventId} is now LIVE`)
  return event
}

/**
 * Record a participant's answer for a question.
 */
export async function submitArenaAnswer(params: {
  participantId: string;
  eventId: string;
  questionId: string;
  selectedOption: number;
  timeSpentSeconds: number;
}) {
  const { participantId, eventId, questionId, selectedOption, timeSpentSeconds } = params

  const question = await prisma.arenaQuestion.findUnique({ where: { id: questionId } })
  if (!question) throw new AppError('Question not found', 404)

  const isCorrect = selectedOption === question.correctOptionIndex

  // Upsert participation record
  const participation = await prisma.arenaParticipation.upsert({
    where: { eventId_participantId: { eventId, participantId } },
    update: {
      status: 'ATTENDED',
      score: { increment: isCorrect ? 100 : 0 },
      correctAnswers: { increment: isCorrect ? 1 : 0 },
      wrongAnswers: { increment: !isCorrect ? 1 : 0 },
      totalTimeSeconds: { increment: timeSpentSeconds },
      joinedAt: new Date(),
    },
    create: {
      eventId,
      participantId,
      status: 'ATTENDED',
      score: isCorrect ? 100 : 0,
      correctAnswers: isCorrect ? 1 : 0,
      wrongAnswers: !isCorrect ? 1 : 0,
      totalTimeSeconds: timeSpentSeconds,
      joinedAt: new Date(),
    },
  })

  // Broadcast updated leaderboard to spectators
  const topParticipants = await prisma.arenaParticipation.findMany({
    where: { eventId, status: 'ATTENDED' },
    orderBy: [
      { score: 'desc' },
      { totalTimeSeconds: 'asc' }
    ],
    take: 10,
    include: { participant: { select: { displayName: true, photoUrl: true } } }
  })

  io.to(`arena:${eventId}:spectators`).emit('arena:leaderboard_update', {
    eventId,
    leaderboard: topParticipants.map(tp => ({
      name: tp.participant.displayName,
      photo: tp.participant.photoUrl,
      score: tp.score,
    }))
  })

  return { isCorrect, currentScore: participation.score }
}

/**
 * Finalizes the event: Mark absentees, increment strikes, crown winners.
 */
export async function endArenaEvent(eventId: string) {
  const event = await prisma.arenaEvent.findUnique({
    where: { id: eventId },
    include: { cycle: true }
  })

  if (!event) throw new AppError('Event not found', 404)

  // 1. Mark status as completed
  await prisma.arenaEvent.update({
    where: { id: eventId },
    data: { status: 'COMPLETED' },
  })

  // 2. Identify all ACTIVE participants in this cycle who DID NOT attend
  const activeParticipants = await prisma.participant.findMany({
    where: { cycleId: event.cycleId, status: 'ACTIVE' },
  })

  const attendees = await prisma.arenaParticipation.findMany({
    where: { eventId, status: 'ATTENDED' },
    select: { participantId: true }
  })

  const attendeeIds = new Set(attendees.map(a => a.participantId))
  const absentees = activeParticipants.filter(p => !attendeeIds.has(p.id))

  // 3. Mark absentees and increment strikes (for the 3-strike rule)
  for (const absentee of absentees) {
    await prisma.arenaParticipation.create({
      data: {
        eventId,
        participantId: absentee.id,
        status: 'ABSENT',
      }
    })

    const updatedParticipant = await prisma.participant.update({
      where: { id: absentee.id },
      data: { arenaStrikes: { increment: 1 } },
    })

    // Automatic Disqualification Check
    if (updatedParticipant.arenaStrikes >= 3) {
      await prisma.participant.update({
        where: { id: absentee.id },
        data: { status: 'DISQUALIFIED' }
      })
      logger.warn(`Participant ${absentee.displayName} DISQUALIFIED for missing 3 Arena events.`)
    }
  }

  // 4. Update the winner of this specific arena event
  const topPerformer = await prisma.arenaParticipation.findFirst({
    where: { eventId, status: 'ATTENDED' },
    orderBy: [
      { score: 'desc' },
      { totalTimeSeconds: 'asc' }
    ]
  })

  if (topPerformer) {
    await prisma.participant.update({
      where: { id: topPerformer.participantId },
      data: { arenaWins: { increment: 1 } }
    })
  }

  io.emit('arena:completed', { eventId, winnersUpdated: !!topPerformer })
  
  return { processedAbsentees: absentees.length }
}
