// services/api/src/modules/arena/arena.controller.ts

import { Request, Response, NextFunction } from 'express'
import * as ArenaService from './arena.service'

export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { cycleId, title, scheduledAt } = req.body
    const event = await ArenaService.createArenaEvent(cycleId, title, new Date(scheduledAt))
    res.status(201).json({ success: true, data: event })
  } catch (err) {
    next(err)
  }
}

export async function listEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const { cycleId } = req.query
    const events = await ArenaService.listArenaEvents(cycleId as string)
    res.json({ success: true, data: events })
  } catch (err) {
    next(err)
  }
}

export async function getDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const event = await ArenaService.getEventDetail(id)
    res.json({ success: true, data: event })
  } catch (err) {
    next(err)
  }
}

export async function startLive(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const event = await ArenaService.startArenaLive(id)
    res.json({ success: true, data: event })
  } catch (err) {
    next(err)
  }
}

export async function submitAnswer(req: Request, res: Response, next: NextFunction) {
  try {
    const { eventId, questionId, selectedOption, timeSpentSeconds } = req.body
    const participantId = (req as any).user?.participantId // Provided by auth/participant middleware
    
    if (!participantId) {
      return res.status(403).json({ success: false, message: 'Only participants can submit answers' })
    }

    const result = await ArenaService.submitArenaAnswer({
      participantId,
      eventId,
      questionId,
      selectedOption: parseInt(selectedOption, 10),
      timeSpentSeconds: parseInt(timeSpentSeconds, 10),
    })

    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function endEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const result = await ArenaService.endArenaEvent(id)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}
