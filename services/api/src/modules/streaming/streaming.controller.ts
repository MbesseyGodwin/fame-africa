// services/api/src/modules/streaming/streaming.controller.ts

import { Request, Response } from 'express'
import { streamingService } from './streaming.service'
import { logger } from '../../utils/logger'
import { prisma } from '../../lib/prisma'

export const streamingController = {
  /**
   * Generates a token for joining a stream.
   */
  async getToken(req: Request, res: Response) {
    try {
      const { channelName, role } = req.query as any
      const userId = (req as any).user?.id
      
      const token = await streamingService.generateToken(channelName, userId, role || 'SUBSCRIBER')
      
      return res.json({
        success: true,
        data: { token }
      })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  },

  /**
   * Starts a stream (Host only).
   */
  async startStream(req: Request, res: Response) {
    try {
      const { title, participantId } = req.body
      const stream = await streamingService.startStream(participantId, title)
      
      return res.json({
        success: true,
        data: stream
      })
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message })
    }
  },

  /**
   * Ends a stream.
   */
  async endStream(req: Request, res: Response) {
    try {
      const { streamId } = req.params
      const stream = await streamingService.endStream(streamId)
      
      return res.json({
        success: true,
        data: stream
      })
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message })
    }
  },

  /**
   * Lists all currently live streams.
   */
  async listLive(req: Request, res: Response) {
    try {
      const { cycleId } = req.query as any
      const streams = await streamingService.getLiveStreams(cycleId)
      
      return res.json({
        success: true,
        data: streams
      })
    } catch (error: any) {
      console.error(`[StreamingController] listLive failed: ${error.message}`)
      return res.status(500).json({ success: false, message: error.message })
    }
  },

  /**
   * Webhook called by Mux when stream status or assets change.
   */
  async handleMuxWebhook(req: Request, res: Response) {
    const { type, data } = req.body
    logger.info(`🔔 [MUX WEBHOOK] Received event ${type}:`, JSON.stringify(req.body, null, 2))

    try {
      // Asset is ready (Recording finalized)
      if (type === 'video.asset.ready') {
        const assetId = data.id
        const playbackId = data.playback_ids?.[0]?.id
        const liveStreamId = data.live_stream_id
        
        if (liveStreamId && playbackId) {
          await streamingService.processMuxAsset(assetId, playbackId, liveStreamId)
        }
      } 
      // Live stream went active
      else if (type === 'video.live_stream.active') {
        logger.info(`📺 [MUX WEBHOOK] Stream is now LIVE: ${data.id}`)
      }
      // Live stream went idle (Ended)
      else if (type === 'video.live_stream.idle') {
        logger.info(`🏁 [MUX WEBHOOK] Stream is now IDLE: ${data.id}`)
      }

      return res.json({ success: true })
    } catch (error: any) {
      logger.error('❌ [MUX WEBHOOK] Error handling Mux webhook:', error)
      return res.json({ success: true, message: 'Acknowledged with error' })
    }
  },

  /**
   * Webhook called by Agora when recording status changes.
   */
  async handleAgoraWebhook(req: Request, res: Response) {
    const { eventType, payload } = req.body
    logger.info(`🔔 [AGORA WEBHOOK] EVENT ${eventType} RECEIVED. Full Payload: ${JSON.stringify(req.body, null, 2)}`)

    try {
      // eventType 31: cloud_recording_callback
      if (eventType === 31) {
        const { channelName, sid, fileList, status } = payload
        logger.info(`[AGORA WEBHOOK] Processing Type 31 (Callback). Status: ${status}, Channel: ${channelName}`)

        if (status === 4 || status === 5) {
          logger.info(`✅ [AGORA WEBHOOK] Recording finished/uploaded for ${channelName}. SID: ${sid}`)
          
          const stream = await streamingService.getStreamByChannel(channelName)
          if (stream) {
            // Agora produces .mp4 in S3 mix mode with avOutputStreamType: 1
            const fullPath = fileList?.[0]?.fileName || `${sid}_${channelName}.mp4`
            const fileName = fullPath.split('/').pop() || fullPath
            
            // Determine if this is S3 or Dropbox based on fileList or default to current config
            const isS3 = fileName.includes('supabase') || (process.env.AGORA_S3_ACCESS_KEY && !process.env.AGORA_S3_ACCESS_KEY.includes('error')) // Simple check
            
            if (isS3) {
              const recordingUrl = `https://pkctjqtsisciblmihjvd.supabase.co/storage/v1/object/public/agora-recordings/${channelName}/${fileName}`
              logger.info(`🔗 [AGORA WEBHOOK] Updating stream ${stream.id} with S3 URL: ${recordingUrl}`)
              
              await prisma.liveStream.update({
                where: { id: stream.id },
                data: { 
                  status: 'RECORDED',
                  recordingUrl: recordingUrl,
                  dropboxPath: null
                }
              })
            } else {
              const dropboxPath = `/votenaija-recordings/recordings/${channelName}/${fileName}`
              logger.info(`🔗 [AGORA WEBHOOK] Updating stream ${stream.id} with Dropbox path: ${dropboxPath}`)
              
              await prisma.liveStream.update({
                where: { id: stream.id },
                data: { 
                  status: 'RECORDED',
                  dropboxPath: dropboxPath,
                  recordingUrl: dropboxPath
                }
              })
            }
          } else {
            logger.warn(`⚠️ [AGORA WEBHOOK] No stream found in DB for channel ${channelName}`)
          }
        } else if (status === 3) {
          logger.error(`❌ [AGORA WEBHOOK] Recording UPLOAD FAILED for ${channelName}. SID: ${sid}. Check S3 credentials!`)
        } else {
          logger.info(`ℹ️ [AGORA WEBHOOK] Status ${status} received. No action taken yet.`)
        }
      } else if (eventType === 30) {
        logger.info(`📤 [AGORA WEBHOOK] Uploader started for ${payload.cname}`)
      } else if (eventType === 40) {
        logger.info(`⏺️ [AGORA WEBHOOK] Recorder started for ${payload.cname}`)
      } else if (eventType === 11) {
        logger.info(`🏁 [AGORA WEBHOOK] Session exit for ${payload.cname}`)
      }

      return res.json({ success: true })
    } catch (error: any) {
      logger.error('❌ [AGORA WEBHOOK] Fatal error during webhook processing:', error)
      return res.json({ success: true, message: 'Acknowledged with error' })
    }
  },

  /**
   * Gets history for the current authenticated participant.
   */
  async getMyHistory(req: Request, res: Response) {
    try {
      const user = (req as any).user
      const participant = await streamingService.getParticipantByUserId(user.id)
      if (!participant) {
        return res.status(404).json({ success: false, message: 'Participant profile not found' })
      }
      
      const history = await streamingService.getParticipantHistory(participant.id)
      return res.json({ success: true, data: history })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  },

  /**
   * Gets public history for any participant.
   */
  async getParticipantHistory(req: Request, res: Response) {
    try {
      const { participantId } = req.params
      const history = await streamingService.getParticipantHistory(participantId)
      return res.json({ success: true, data: history })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  },

  /**
   * Lists all past recorded streams for the public feed.
   */
  async listRecorded(req: Request, res: Response) {
    try {
      const { cycleId, search, category, sortBy, page, limit } = req.query as any
      const streams = await streamingService.getGlobalHistory({
        cycleId,
        search,
        category,
        sortBy,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20
      })
      
      return res.json({
        success: true,
        data: streams
      })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  },

  /**
   * Generates a temporary link for video playback from Dropbox.
   */
  async getRecordingLink(req: Request, res: Response) {
    try {
      const { streamId } = req.params
      const stream = await streamingService.getStreamById(streamId)
      
      if (!stream) {
        return res.status(404).json({ success: false, message: 'Stream record not found' })
      }

      if (stream.recordingUrl) {
        return res.json({
          success: true,
          data: { url: stream.recordingUrl }
        })
      }

      if (!stream.dropboxPath) {
        // If stream is older than 30 minutes and still no dropboxPath, it likely failed
        const streamAgeMinutes = (Date.now() - new Date(stream.startTime).getTime()) / (1000 * 60)
        
        if (streamAgeMinutes > 30) {
          return res.status(404).json({ 
            success: false, 
            message: 'This recording is currently unavailable or failed to process.' 
          })
        }

        return res.status(202).json({ 
          success: false, 
          status: 'PROCESSING',
          message: 'Recording is still being processed. Please check back in a few minutes.' 
        })
      }

      const { getTemporaryLink } = await import('../../utils/dropboxUploader')
      const temporaryLink = await getTemporaryLink(stream.dropboxPath)
      
      return res.json({
        success: true,
        data: { url: temporaryLink }
      })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  },

  /**
   * Deletes a stream (Participant only).
   */
  async deleteStream(req: Request, res: Response) {
    try {
      const { streamId } = req.params
      const user = (req as any).user
      const participant = await streamingService.getParticipantByUserId(user.id)
      
      if (!participant) {
        return res.status(404).json({ success: false, message: 'Participant profile not found' })
      }

      await streamingService.deleteStream(streamId, participant.id)
      
      return res.json({
        success: true,
        message: 'Stream deleted successfully'
      })
    } catch (error: any) {
      return res.status(error.message === 'Unauthorized to delete this stream' ? 403 : 400).json({ 
        success: false, 
        message: error.message 
      })
    }
  },

  /**
   * Deletes multiple streams at once (Participant only).
   */
  async bulkDelete(req: Request, res: Response) {
    try {
      const { streamIds } = req.body
      if (!Array.isArray(streamIds) || streamIds.length === 0) {
        return res.status(400).json({ success: false, message: 'Stream IDs array required' })
      }

      const user = (req as any).user
      const participant = await streamingService.getParticipantByUserId(user.id)
      
      if (!participant) {
        return res.status(404).json({ success: false, message: 'Participant profile not found' })
      }

      await streamingService.deleteMultipleStreams(streamIds, participant.id)
      
      return res.json({
        success: true,
        message: `${streamIds.length} streams deleted successfully`
      })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }
}
