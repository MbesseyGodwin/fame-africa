// services/api/src/modules/streaming/streaming.service.ts

import { PrismaClient, StreamStatus } from '@prisma/client'
const { RtcTokenBuilder, RtcRole } = require('agora-access-token')
import { Dropbox } from 'dropbox'
import axios from 'axios'
import { logger } from '../../utils/logger'
import { notificationService } from '../notifications/notification.service'

const prisma = new PrismaClient()

// Agora Credentials (using placeholders)
const AGORA_APP_ID = process.env.AGORA_APP_ID || 'agora_app_id_placeholder'
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || 'agora_cert_placeholder'
const DROPBOX_TOKEN = process.env.DROPBOX_TOKEN || 'dropbox_token_placeholder'

const dbx = new Dropbox({ accessToken: DROPBOX_TOKEN })

export const streamingService = {
  /**
   * Generates an Agora RTC token for a user to join a channel.
   */
  async generateToken(channelName: string, userId: string, role: 'PUBLISHER' | 'SUBSCRIBER') {
    const expirationTimeInSeconds = 3600 // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

    const agoraRole = role === 'PUBLISHER' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER

    // For Agora, uid can be a number or a string. We'll use a numeric hash of the userId for simplicity
    const uid = 0 // In Agora, 0 means auto-assign if we don't care, but for tokens, consistency is key if needed. 
    // Actually, we'll use a numeric hash or just 0 for testing.
    
    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      uid,
      agoraRole,
      privilegeExpiredTs
    )

    return token
  },

  /**
   * Starts a new live stream record in the database.
   */
  async startStream(participantId: string, title: string) {
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: { cycle: true }
    })

    if (!participant) throw new Error('Participant not found')
    if (participant.status !== 'ACTIVE') throw new Error('Only active participants can stream')

    // Create a unique channel name
    const channelName = `stream_${participant.voteLinkSlug}_${Date.now()}`

    const stream = await prisma.liveStream.create({
      data: {
        hostId: participantId,
        cycleId: participant.cycleId,
        channelName,
        title,
        status: 'LIVE',
        startTime: new Date()
      }
    })

    // ── TRIGGER NOTIFICATIONS ─────────────────────────
    // Notify all Stans that their favorite star is LIVE
    const stans = await prisma.stan.findMany({
      where: { participantId },
      select: { userId: true }
    })

    const userIds = stans.map(s => s.userId)
    if (userIds.length > 0) {
      notificationService.broadcastNotification({
        userIds,
        title: '🎥 House is LIVE!',
        body: `${participant.displayName} just went LIVE in the Virtual House. Come watch now!`,
        type: 'SYSTEM',
        data: { streamId: stream.id, type: 'live_start' }
      }).catch(err => console.error('Broadcast failed', err))
    }

    return stream
  },

  /**
   * Ends a live stream and triggers the recording cloud flow.
   */
  async endStream(streamId: string) {
    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId }
    })

    if (!stream) throw new Error('Stream not found')

    // 1. Trigger STOP on Agora Cloud Recording (Placeholder)
    // await this.stopCloudRecording(stream.channelName)

    return await prisma.liveStream.update({
      where: { id: streamId },
      data: {
        status: 'ENDED',
        endTime: new Date()
      }
    })
  },

  /**
   * Identifies the stream and processes the recording files from Agora.
   */
  async processCloudRecording(channelName: string, fileList: string) {
    const stream = await prisma.liveStream.findFirst({
      where: { channelName, status: 'LIVE' }
    })

    if (!stream) {
      logger.error(`No active stream found for channel ${channelName}`)
      return
    }

    // Usually Agora provides a URL or we construct it based on our S3 bucket path
    // We'll assume 'fileList' is the key/name of the file in the bucket
    const cloudFileUrl = `${process.env.AGORA_RECORDING_BUCKET_URL}/${fileList}`
    
    return await this.handleRecordingComplete(stream.id, cloudFileUrl)
  },

  /**
   * Orchestrates the recording movement from Agora's target bucket to Dropbox.
   */
  async handleRecordingComplete(streamId: string, cloudFileUrl: string) {
    try {
      logger.info(`Starting cloud-to-dropbox transfer for stream ${streamId}`)

      // 1. Fetch file from cloud storage (Mocking actual download if URL is invalid)
      let fileBuffer: Buffer
      try {
        const response = await axios.get(cloudFileUrl, { responseType: 'arraybuffer' })
        fileBuffer = Buffer.from(response.data)
      } catch (e) {
        logger.warn(`Could not reach cloud storage at ${cloudFileUrl}. Recording might be missing or private.`)
        // In a real S3 setup, we would use aws-sdk to get the object
        return
      }

      // 2. Upload to Dropbox
      const { uploadToDropbox } = await import('../../utils/dropboxUploader')
      const dropboxPath = `/fame-africa/recordings/${streamId}.mp4`
      
      await uploadToDropbox(fileBuffer, dropboxPath)

      // 3. Update DB
      await prisma.liveStream.update({
        where: { id: streamId },
        data: {
          status: 'RECORDED',
          recordingUrl: `https://www.dropbox.com/home${dropboxPath}`, // Use actual public link in production
          dropboxPath
        }
      })

      logger.info(`Recording transfer complete for stream ${streamId}`)
    } catch (error) {
      logger.error('Dropbox Upload Failed', error)
      await prisma.liveStream.update({
        where: { id: streamId },
        data: { status: 'ENDED' } 
      })
    }
  },

  /**
   * Gets all currently live streams for the feed.
   */
  async getLiveStreams(cycleId?: string) {
    return await prisma.liveStream.findMany({
      where: {
        status: 'LIVE',
        ...(cycleId ? { cycleId } : {})
      },
      include: {
        host: {
          select: {
            displayName: true,
            photoUrl: true,
            category: true,
            voteLinkSlug: true
          }
        }
      },
      orderBy: { viewerCount: 'desc' }
    })
  },

  /**
   * Saves a chat message to the database.
   */
  async saveChatMessage(streamId: string, userId: string, content: string) {
    return await prisma.liveChatMessage.create({
      data: {
        streamId,
        userId,
        content
      }
    })
  }
}
