// services/api/src/modules/streaming/streaming.controller.ts

import { Request, Response } from 'express'
import { streamingService } from './streaming.service'

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
      return res.status(500).json({ success: false, message: error.message })
    }
  },

  /**
   * Webhook called by Agora/Management service when recording is done.
   */
  async handleAgoraWebhook(req: Request, res: Response) {
    try {
      const { event, data } = req.body
      
      // event usually looks like 'recording_finished' or similar depending on Agora config
      if (event === 'recording_finished' || event === '31' /* Agora specific code */) {
        const { channelName, fileList } = data
        // fileList contains the path to the .mp4 or .m3u8 on S3/Storage
        
        await streamingService.processCloudRecording(channelName, fileList)
      }

      return res.json({ success: true })
    } catch (error: any) {
      console.error('Agora Webhook Error:', error.message)
      return res.status(200).json({ success: true, message: 'Acknowledged but failed' })
    }
  }
}
