// services/api/src/modules/winners/winners.routes.ts

import { Router } from 'express'
import { prisma } from '../../index'

export const winnersRouter = Router()

winnersRouter.get('/', async (req, res) => {
  try {
    const winners = await prisma.pastWinner.findMany({
      include: {
        participant: {
          select: { displayName: true, photoUrl: true, state: true, category: true }
        },
        cycle: {
          select: { cycleName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ success: true, data: winners })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching winners' })
  }
})
