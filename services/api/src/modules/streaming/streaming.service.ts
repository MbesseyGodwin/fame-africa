const { RtcTokenBuilder, RtcRole } = require('agora-access-token')
import axios from 'axios'
import { logger } from '../../utils/logger'
import { uploadToDropbox, getAccessToken } from '../../utils/dropboxUploader'
import { prisma } from '../../lib/prisma'
import { notificationService } from '../notifications/notification.service'
import { emailTransporter } from '../../utils/emailTransporter'

const AGORA_APP_ID = process.env.AGORA_APP_ID || ''
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || ''

export const streamingService = {
  /**
   * Generates a streaming token for Agora
   */
  async generateToken(channelName: string, userId: string, role: 'PUBLISHER' | 'SUBSCRIBER') {
    logger.info(`[StreamingService] AGORA_APP_ID: ${AGORA_APP_ID.substring(0, 5)}..., CERT_EXISTS: ${!!AGORA_APP_CERTIFICATE}`)
    logger.info(`[StreamingService] RtcRole: ${JSON.stringify(RtcRole)}`)

    const expirationTimeInSeconds = 3600
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

    const agoraRole = role === 'PUBLISHER' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER

    logger.info(`[StreamingService] Generating token: channel=${channelName}, uid=0, role=${role}, agoraRoleValue=${agoraRole}`)

    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      0,
      agoraRole,
      privilegeExpiredTs
    )

    return token
  },

  /**
   * Starts a new live stream using Agora.
   */
  async startStream(participantId: string, title: string) {
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: { cycle: true }
    })

    if (!participant) throw new Error('Participant not found')
    if (participant.status !== 'ACTIVE') throw new Error('Only active participants can stream')

    const channelName = `stream_${participant.voteLinkSlug}_${Date.now()}`

    // 1. Create the stream record
    const stream = await prisma.liveStream.create({
      data: {
        hostId: participantId,
        cycleId: participant.cycleId,
        channelName,
        title,
        status: 'LIVE',
        startTime: new Date(),
      }
    })

    logger.info(`✅ [StreamingService] Agora stream created: ${stream.id}`, { channelName })

    // ── TRIGGER NOTIFICATIONS ─────────────────────────
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

    // ── AUDIT EMAIL ──────────────────────────────────
    const host = await prisma.user.findUnique({
      where: { id: participant.userId }
    })

    if (host?.email) {
      emailTransporter.sendMail({
        to: host.email,
        subject: '🚀 Your Live Stream has Started!',
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h2>Hello ${host.displayName || host.fullName},</h2>
            <p>You are now <b>LIVE</b> on FameAfrica (via Agora)!</p>
            <p><b>Session Title:</b> ${title}</p>
            <p><b>Instructions:</b> Your stream is being broadcast directly from your mobile device.</p>
            <hr />
            <p>Go give them a show! 🌟</p>
          </div>
        `
      }).catch(err => logger.error('Stream Start Email failed', err))
    }

    // ── TRIGGER CLOUD RECORDING ───────────────────────
    // Start recording automatically (Fire and forget)
    this.initiateCloudRecording(stream.id, channelName).catch(err => {
      logger.error(`[StreamingService] Cloud Recording Auto-Start failed for ${stream.id}`, err)
    })

    return stream
  },

  /**
   * Initiates Agora Cloud Recording (Acquire -> Start)
   */
  async initiateCloudRecording(streamId: string, channelName: string) {
    try {
      const customerId = process.env.AGORA_CUSTOMER_ID
      const customerSecret = process.env.AGORA_CUSTOMER_SECRET
      const auth = Buffer.from(`${customerId}:${customerSecret}`).toString('base64')
      const uid = "999" // Recording bot UID

      logger.info(`[AgoraRecording] 🚀 PHASE 1: ACQUIRE - Channel: ${channelName}, UID: ${uid}`)

      // 1. Acquire Resource ID
      const acquireBody = {
        cname: channelName,
        uid: uid,
        clientRequest: { resourceExpiredHour: 24 }
      }
      logger.info(`[AgoraRecording] ACQUIRE Request Body: ${JSON.stringify(acquireBody)}`)

      const acquireRes = await axios.post(
        `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording/acquire`,
        acquireBody,
        { headers: { Authorization: `Basic ${auth}` } }
      )

      logger.info(`[AgoraRecording] ACQUIRE Response: ${JSON.stringify(acquireRes.data)}`)
      const resourceId = acquireRes.data.resourceId

      // 2. Start Recording
      logger.info(`[AgoraRecording] 🚀 PHASE 2: START - ResourceId: ${resourceId}`)

      const recordingToken = await this.generateToken(channelName, uid, 'PUBLISHER')
      logger.info(`[AgoraRecording] Generated Recording Token (999): ${recordingToken.substring(0, 10)}...`)

      const startBody = {
        cname: channelName,
        uid: uid,
        clientRequest: {
          token: recordingToken,
          recordingConfig: {
            maxIdleTime: 30,
            streamTypes: 2,
            audioProfile: 1,
            videoStreamType: 0,
            avOutputStreamType: 1,
            subscribeVideoUids: ["#allstream#"],
            subscribeAudioUids: ["#allstream#"],
            transcodingConfig: {
              width: 720,
              height: 1280,
              fps: 30,
              bitrate: 2000,
              maxResolutionUid: "1",
              mixedVideoLayout: 1
            }
          },
          storageConfig: {
            vendor: 1, // Amazon S3
            region: 0, // Standard for S3-compatible
            bucket: "agora-recordings",
            accessKey: process.env.AGORA_S3_ACCESS_KEY,
            secretKey: process.env.AGORA_S3_SECRET_KEY,
            endpoint: "pkctjqtsisciblmihjvd.supabase.co/storage/v1/s3",
            fileNamePrefix: [channelName]
          }
        }
      }

      logger.info(`[AgoraRecording] START Request Body: ${JSON.stringify(startBody, null, 2)}`)

      const startRes = await axios.post(
        `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording/resourceid/${resourceId}/mode/mix/start`,
        startBody,
        { headers: { Authorization: `Basic ${auth}` } }
      )

      logger.info(`[AgoraRecording] START Response: ${JSON.stringify(startRes.data)}`)
      const sid = startRes.data.sid

      // 3. Save to DB
      await prisma.liveStream.update({
        where: { id: streamId },
        data: {
          agoraResourceId: resourceId,
          agoraSid: sid
        } as any
      })

      logger.info(`✅ [AgoraRecording] SUCCESSFULLY STARTED. SID: ${sid}`)

      // 4. Set 2-minute Auto-Stop Timer
      setTimeout(async () => {
        logger.info(`⏰ [AgoraRecording] 2-Minute Limit Reached for ${channelName}. Triggering STOP.`)
        await this.stopCloudRecording(resourceId, sid, channelName, streamId)
      }, 120000) // 2 minutes

    } catch (error: any) {
      logger.error(`❌ [AgoraRecording] ERROR during initiation:`, {
        message: error.message,
        response: error.response?.data
      })
    }
  },

  async queryCloudRecording(resourceId: string, sid: string) {
    const AGORA_APP_ID = process.env.AGORA_APP_ID
    const auth = Buffer.from(`${process.env.AGORA_CUSTOMER_ID}:${process.env.AGORA_CUSTOMER_SECRET}`).toString('base64')
    const url = `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/query`

    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Basic ${auth}` }
      })
      return response.data
    } catch (error: any) {
      logger.error(`[AgoraRecording] QUERY Error: ${error.message}`, error.response?.data)
      return null
    }
  },

  async startStatusPolling(streamId: string, resourceId: string, sid: string, channelName: string) {
    let attempts = 0
    const maxAttempts = 20

    logger.info(`[AgoraRecording] 🛡️ Starting Defensive Polling for ${channelName}`)

    const interval = setInterval(async () => {
      attempts++
      const data = await this.queryCloudRecording(resourceId, sid)

      if (data && data.serverResponse) {
        const status = data.serverResponse.status
        const fileList = data.serverResponse.fileList

        logger.info(`[AgoraRecording] Polling ${channelName}: Status ${status} (Attempt ${attempts}/${maxAttempts})`)

        if (status === 5) {
          logger.info(`✅ [AgoraRecording] Polling DETECTED SUCCESS for ${channelName}`)
          clearInterval(interval)

          const fullPath = Array.isArray(fileList) ? fileList[0]?.fileName : (typeof fileList === 'string' ? fileList : `${sid}_${channelName}.mp4`)
          const fileName = fullPath.split('/').pop() || fullPath
          const s3Url = `https://pkctjqtsisciblmihjvd.supabase.co/storage/v1/object/public/agora-recordings/${channelName}/${fileName}`

          // Start the Transfer to Dropbox (Background)
          this.transferS3ToDropbox(streamId, s3Url, channelName, fileName)
        }
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval)
        logger.warn(`🛑 [AgoraRecording] Polling TIMEOUT for ${channelName}`)
      }
    }, 30000)
  },

  async stopCloudRecording(resourceId: string, sid: string, channelName: string, streamId?: string) {
    const AGORA_APP_ID = process.env.AGORA_APP_ID
    const auth = Buffer.from(`${process.env.AGORA_CUSTOMER_ID}:${process.env.AGORA_CUSTOMER_SECRET}`).toString('base64')

    try {
      const stopRes = await axios.post(
        `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`,
        { cname: channelName, uid: "999", clientRequest: {} },
        { headers: { Authorization: `Basic ${auth}` } }
      )

      logger.info(`✅ [AgoraRecording] STOP Success: ${JSON.stringify(stopRes.data)}`)

      // If the stop response ALREADY contains the fileList, update the DB immediately
      const fileList = stopRes.data.serverResponse?.fileList
      if (fileList && streamId) {
        const fullPath = Array.isArray(fileList) ? fileList[0]?.fileName : (typeof fileList === 'string' ? fileList : `${sid}_${channelName}.mp4`)
        const fileName = fullPath.split('/').pop() || fullPath
        const s3Url = `https://pkctjqtsisciblmihjvd.supabase.co/storage/v1/object/public/agora-recordings/${channelName}/${fileName}`

        // Start Transfer to Dropbox
        this.transferS3ToDropbox(streamId, s3Url, channelName, fileName)
      } else if (streamId) {
        // Fallback to polling if fileList not in stop response
        this.startStatusPolling(streamId, resourceId, sid, channelName)
      }

      return stopRes.data
    } catch (error: any) {
      logger.error(`❌ [AgoraRecording] STOP Failed:`, error.response?.data || error.message)
    }
  },

  /**
   * Ends a live stream and triggers the recording cloud flow.
   */
  async endStream(streamId: string) {
    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId }
    })

    if (!stream) throw new Error('Stream not found')

    logger.info(`[StreamingService] Ending stream ${streamId}. Status: ${stream.status}`)

    // Stop Cloud Recording if we have the IDs
    if ((stream as any).agoraResourceId && (stream as any).agoraSid) {
      logger.info(`[AgoraRecording] 🚀 PHASE 3: STOP - SID: ${(stream as any).agoraSid}`)
      this.stopCloudRecording((stream as any).agoraResourceId, (stream as any).agoraSid, stream.channelName, stream.id).catch(err => {
        logger.error(`[AgoraRecording] STOP failed for ${streamId}`, err)
      })
    } else {
      logger.warn(`[AgoraRecording] Skipping STOP - Missing resourceId or sid for stream ${streamId}`)
    }

    const updatedStream = await prisma.liveStream.update({
      where: { id: streamId },
      data: {
        status: 'ENDED',
        endTime: new Date()
      },
      include: {
        host: {
          include: { user: true }
        }
      }
    })

    // ── AUDIT EMAIL ──────────────────────────────────
    if (updatedStream.host.user.email) {
      const durationMs = updatedStream.endTime!.getTime() - updatedStream.startTime.getTime()
      const durationMins = Math.floor(durationMs / 60000)
      const durationSecs = Math.floor((durationMs % 60000) / 1000)

      emailTransporter.sendMail({
        to: updatedStream.host.user.email,
        subject: '🎬 Session Summary: Your stream has ended',
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h2>Well done, ${updatedStream.host.user.displayName || updatedStream.host.user.fullName}!</h2>
            <p>Your live session has successfully ended. Here is your audit summary:</p>
            <div style="background: #f4f4f4; padding: 15px; border-radius: 8px;">
              <p><b>Session ID:</b> ${updatedStream.id}</p>
              <p><b>Title:</b> ${updatedStream.title}</p>
              <p><b>Duration:</b> ${durationMins}m ${durationSecs}s</p>
              <p><b>Total Viewers:</b> ${updatedStream.peakViewers}</p>
              <p><b>Started:</b> ${updatedStream.startTime.toLocaleString()}</p>
              <p><b>Ended:</b> ${updatedStream.endTime!.toLocaleString()}</p>
            </div>
            <p>The recording is currently being processed and will be available in your history soon.</p>
            <hr />
            <p>Keep shining! ✨<br />The FameAfrica Team</p>
          </div>
        `
      }).catch(err => logger.error('Stream End Email failed', err))
    }

    return updatedStream
  },


  /**
   * Processes a Mux asset when it becomes ready.
   */
  async processMuxAsset(muxAssetId: string, playbackId: string, muxLiveStreamId: string) {
    const stream = await prisma.liveStream.findFirst({
      where: { muxLiveStreamId },
      orderBy: { startTime: 'desc' }
    })

    if (!stream) {
      logger.error(`❌ [StreamingService] No matching stream found for Mux ID: ${muxLiveStreamId}`)
      return
    }

    const publicUrl = `https://stream.mux.com/${playbackId}.m3u8`
    const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`

    logger.info(`✅ [StreamingService] Mux Recording ready. Public URL: ${publicUrl}`)

    await prisma.liveStream.update({
      where: { id: stream.id },
      data: {
        status: 'RECORDED',
        recordingUrl: publicUrl,
        thumbnailUrl: thumbnailUrl,
        muxAssetId: muxAssetId
      } as any
    })
  },

  /**
   * LEGACY: Agora processing.
   */
  async processCloudRecording(channelName: string, fileList: any) {
    logger.info(`[StreamingService] Agora processing skipped for channel ${channelName}`)
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

      // 2. Set status to PROCESSING to give user feedback
      await prisma.liveStream.update({
        where: { id: streamId },
        data: { status: 'PROCESSING' }
      })

      // 3. Upload to Dropbox
      const { uploadToDropbox } = await import('../../utils/dropboxUploader')
      const dateStr = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      const dropboxPath = `/fame-africa/recordings/${dateStr}/${streamId}.mp4`

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
  },

  /**
   * Gets the streaming history for a specific participant.
   */
  async getParticipantHistory(participantId: string) {
    return await prisma.liveStream.findMany({
      where: { hostId: participantId },
      include: {
        host: {
          select: {
            displayName: true,
            photoUrl: true,
            category: true
          }
        }
      },
      orderBy: { startTime: 'desc' }
    })
  },

  /**
   * Gets global streaming history with advanced filtering, sorting, and pagination.
   */
  async getGlobalHistory(params: {
    cycleId?: string,
    search?: string,
    category?: string,
    sortBy?: 'RECENT' | 'POPULAR',
    page?: number,
    limit?: number
  }) {
    const { cycleId, search, category, sortBy = 'RECENT', page = 1, limit = 20 } = params
    const skip = (page - 1) * limit

    return await prisma.liveStream.findMany({
      where: {
        status: { in: ['ENDED', 'RECORDED'] },
        ...(cycleId ? { cycleId } : {}),
        ...(category ? { host: { category } } : {}),
        ...(search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { host: { displayName: { contains: search, mode: 'insensitive' } } }
          ]
        } : {})
      },
      include: {
        host: {
          select: {
            displayName: true,
            photoUrl: true,
            category: true
          }
        }
      },
      orderBy: sortBy === 'POPULAR' ? { peakViewers: 'desc' } : { endTime: 'desc' },
      skip,
      take: limit
    })
  },

  /**
   * Helper to find a participant record by user ID
   */
  /**
   * Worker to transfer a file from S3 to Dropbox.
   */
  async transferS3ToDropbox(streamId: string, s3Url: string, channelName: string, fileName: string) {
    logger.info(`🚚 [TransferWorker] Starting transfer for stream ${streamId}...`, { s3Url })

    try {
      // 1. Download from S3
      const response = await axios.get(s3Url, { responseType: 'arraybuffer' })
      const buffer = Buffer.from(response.data)

      // 2. Upload to Dropbox
      const dropboxPath = `/votenaija-recordings/recordings/${channelName}/${fileName}`
      await uploadToDropbox(buffer, dropboxPath)

      // 3. Update DB
      await prisma.liveStream.update({
        where: { id: streamId },
        data: {
          status: 'RECORDED' as any,
          dropboxPath: dropboxPath,
          recordingUrl: dropboxPath // Store path, signed by controller
        }
      })

      logger.info(`✅ [TransferWorker] Stream ${streamId} transferred to Dropbox: ${dropboxPath}`)

      // 4. (Optional) Delete from S3 via Supabase Management API if needed
      // For now, we'll keep it as a backup or let it expire

    } catch (error: any) {
      logger.error(`❌ [TransferWorker] FAILED for stream ${streamId}:`, error.message)

      // Fallback: Store the S3 URL if Dropbox fails so the recording isn't lost
      await prisma.liveStream.update({
        where: { id: streamId },
        data: {
          status: 'RECORDED' as any,
          recordingUrl: s3Url
        }
      }).catch(() => { })
    }
  },

  async getParticipantByUserId(userId: string) {
    return await prisma.participant.findUnique({
      where: { userId }
    })
  },

  /**
   * Helper to find a specific stream by ID
   */
  async getStreamById(streamId: string) {
    return await prisma.liveStream.findUnique({
      where: { id: streamId }
    })
  },

  /**
   * Deletes a stream record.
   */
  async deleteStream(streamId: string, participantId: string) {
    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId }
    })

    if (!stream) throw new Error('Stream not found')
    if (stream.hostId !== participantId) throw new Error('Unauthorized to delete this stream')

    return await prisma.liveStream.delete({
      where: { id: streamId }
    })
  },

  /**
   * Deletes multiple stream records at once.
   */
  async deleteMultipleStreams(streamIds: string[], participantId: string) {
    return await prisma.liveStream.deleteMany({
      where: {
        id: { in: streamIds },
        hostId: participantId
      }
    })
  },

  /**
   * Finds a stream by its channel name.
   */
  async getStreamByChannel(channelName: string) {
    return await prisma.liveStream.findFirst({
      where: { channelName },
      orderBy: { startTime: 'desc' }
    })
  },

  /**
   * Updates the recording status and URL of a stream.
   */
  async updateRecordingStatus(streamId: string, recordingUrl: string) {
    return await prisma.liveStream.update({
      where: { id: streamId },
      data: {
        status: 'RECORDED',
        recordingUrl
      }
    })
  },

  /**
   * AUTOMATION: Auto-close streams that have been live for too long (stale)
   */
  async autoCloseStaleStreams() {
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000)
    const staleStreams = await prisma.liveStream.findMany({
      where: {
        status: 'LIVE',
        startTime: { lt: fourHoursAgo }
      }
    })

    for (const stream of staleStreams) {
      logger.info(`Auto-closing stale stream: ${stream.id}`)
      await this.endStream(stream.id)
    }

    return staleStreams.length
  }
}
