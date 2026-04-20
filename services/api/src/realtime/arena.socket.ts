// services/api/src/realtime/arena.socket.ts

import { Socket, Server } from 'socket.io'
import { logger } from '../utils/logger'

export function setupArenaHandlers(io: Server, socket: Socket) {
  /**
   * Participant joins the live Arena room for real-time game updates.
   */
  socket.on('arena:join', (eventId: string) => {
    // Only allow if authenticated (authenticated logic is in socket.handlers middleware)
    if (socket.data.userId) {
      socket.join(`arena:${eventId}`)
      logger.info(`Participant ${socket.data.userId} joined Arena room: ${eventId}`)
      
      // Notify the participant they are successfully synced
      socket.emit('arena:sync_status', { synced: true, eventId })
    }
  })

  /**
   * Leave Arena room
   */
  socket.on('arena:leave', (eventId: string) => {
    socket.leave(`arena:${eventId}`)
    logger.info(`Participant ${socket.data.userId} left Arena room: ${eventId}`)
  })
  
  /**
   * Spectator (public) joins to watch the live scoreboard
   */
  socket.on('arena:spectate', (eventId: string) => {
    socket.join(`arena:${eventId}:spectators`)
    logger.debug(`Spectator joined Arena: ${eventId}`)
  })
}
