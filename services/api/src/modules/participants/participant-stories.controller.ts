import { Request, Response, NextFunction } from 'express'
import { prisma } from '../../index'
import { ApiResponse } from '../../utils/response'
import { AppError } from '../../utils/errors'
import { uploadToDropbox, getTemporaryLink, getAccessToken } from '../../utils/dropboxUploader'
import axios from 'axios'

const BUCKET_BASE = '/fame-africa/stories'

/**
 * Upload a new daily vlog/story
 * Expects a file upload in req.file and an optional caption in req.body
 */
export async function addStory(req: any, res: Response, next: NextFunction) {
  try {
    const file = req.file
    const { caption } = req.body
    const userId = req.user.id

    if (!file) {
      return next(new AppError('Video file is required', 400))
    }

    const participant = await prisma.participant.findUnique({
      where: { userId }
    })

    if (!participant) {
      return next(new AppError('Only participants can upload stories', 403))
    }

    // 1. Upload to Dropbox Storage
    const fileExt = file.originalname.split('.').pop() || 'mp4'
    const fileName = `${participant.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const dropboxPath = `${BUCKET_BASE}/${fileName}`
    
    let videoUrl = ''
    try {
      await uploadToDropbox(file.buffer, dropboxPath)
      videoUrl = dropboxPath // Store the path, will resolve to link on fetch
    } catch (uploadError: any) {
      console.error('Story upload failed to Dropbox:', uploadError.response?.data || uploadError.message)
      return next(new AppError('Failed to upload video to storage', 500))
    }

    // 2. Save to Database with 24h expiration
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const story = await prisma.participantStory.create({
      data: {
        participantId: participant.id,
        videoUrl,
        caption,
        expiresAt
      }
    })

    return ApiResponse.success(res, story, 'Story uploaded successfully', 201)
  } catch (error) {
    next(error)
  }
}

/**
 * Fetch all active stories grouped by participant for the top of the feed
 */
export async function getActiveStories(req: Request, res: Response, next: NextFunction) {
  try {
    // Find stories that haven't expired yet
    const stories = await prisma.participantStory.findMany({
      where: {
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        participant: {
          select: {
            id: true,
            displayName: true,
            photoUrl: true,
            voteLinkSlug: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc' // Oldest to newest so they play in order
      }
    })

    // Group by participant and resolve Dropbox links
    const grouped: Record<string, any> = {}
    for (const story of stories) {
      if (!grouped[story.participantId]) {
        grouped[story.participantId] = {
          participant: story.participant,
          stories: []
        }
      }
      // Resolve Dropbox path to temporary link
      if (story.videoUrl.startsWith('/')) {
        story.videoUrl = await getTemporaryLink(story.videoUrl)
      }

      // Remove participant payload from the story object itself to keep it clean
      const { participant, ...storyData } = story
      grouped[story.participantId].stories.push(storyData)
    }

    return ApiResponse.success(res, Object.values(grouped))
  } catch (error) {
    next(error)
  }
}

/**
 * Delete a specific story manually before 24h
 */
export async function deleteStory(req: any, res: Response, next: NextFunction) {
  try {
    const { storyId } = req.params
    const userId = req.user.id

    const participant = await prisma.participant.findUnique({
      where: { userId }
    })

    if (!participant) {
      return next(new AppError('Unauthorized', 403))
    }

    const story = await prisma.participantStory.findFirst({
      where: {
        id: storyId,
        participantId: participant.id
      }
    })

    if (!story) {
      return next(new AppError('Story not found', 404))
    }

    // 2. Delete from Storage
    // Delete from Dropbox
    if (story.videoUrl.startsWith('/')) {
      try {
        const token = await getAccessToken()
        await axios.post(
          'https://api.dropboxapi.com/2/files/delete_v2',
          { path: story.videoUrl },
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        )
      } catch (e: any) {
        console.error('Failed to delete Dropbox file for story:', e)
      }
    }

    // Delete from DB
    await prisma.participantStory.delete({
      where: { id: story.id }
    })

    return ApiResponse.success(res, null, 'Story deleted successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Fetch stories for the logged-in participant
 */
export async function getMyStories(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id

    const participant = await prisma.participant.findUnique({
      where: { userId }
    })

    if (!participant) {
      return next(new AppError('Unauthorized', 403))
    }

    const stories = await prisma.participantStory.findMany({
      where: {
        participantId: participant.id,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Resolve Dropbox links
    for (const story of stories) {
      if (story.videoUrl.startsWith('/')) {
        story.videoUrl = await getTemporaryLink(story.videoUrl)
      }
    }

    return ApiResponse.success(res, stories)
  } catch (error) {
    next(error)
  }
}
