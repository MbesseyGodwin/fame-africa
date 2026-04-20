import { Server } from 'socket.io'
import * as jwt from 'jsonwebtoken'
import { logger } from '../utils/logger'
import { setupArenaHandlers } from './arena.socket'

export function setupRealtimeHandlers(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
        socket.data.userId = payload.userId
        socket.data.role = payload.role
      } catch {
        // Unauthenticated — still allowed for public vote page
      }
    }
    next()
  })

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`)

    // Participant joins their private room to get live vote updates
    socket.on('participant:join', (participantId: string) => {
      if (socket.data.userId) {
        socket.join(`participant:${participantId}`)
        logger.debug(`User joined participant room: ${participantId}`)
      }
    })

    // Admin joins live vote monitoring room
    socket.on('admin:join', () => {
      if (socket.data.role === 'ADMIN' || socket.data.role === 'SUPER_ADMIN') {
        socket.join('admin:votes')
        logger.debug('Admin joined vote monitoring room')
      }
    })

    // Public vote page — joins cycle room for elimination announcements
    socket.on('cycle:join', (cycleId: string) => {
      socket.join(`cycle:${cycleId}`)
    })

    // Arena handlers
    setupArenaHandlers(io, socket)

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`)
    })
  })
}
