import { Request, Response, NextFunction } from 'express'
import { ParticipantVideosService } from './participant-videos.service'
import { ApiResponse } from '../../utils/response'
import { prisma } from '../../lib/prisma'

export async function addVideo(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id
    const { url, title } = req.body

    const participant = await prisma.participant.findFirst({ where: { userId } })
    if (!participant) return res.status(404).json({ message: 'Participant not found' })

    const video = await ParticipantVideosService.addVideo(participant.id, url, title)
    return ApiResponse.success(res, video)
  } catch (error) { next(error) }
}

export async function deleteVideo(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id
    const { videoId } = req.params

    const participant = await prisma.participant.findFirst({ where: { userId } })
    if (!participant) return res.status(404).json({ message: 'Participant not found' })

    await ParticipantVideosService.deleteVideo(videoId, participant.id)
    return ApiResponse.success(res, { message: 'Video deleted' })
  } catch (error) { next(error) }
}

export async function updateVideo(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id
    const { videoId } = req.params
    const { url, title } = req.body

    const participant = await prisma.participant.findFirst({ where: { userId } })
    if (!participant) return res.status(404).json({ message: 'Participant not found' })

    const video = await ParticipantVideosService.updateVideo(videoId, participant.id, { url, title })
    return ApiResponse.success(res, video)
  } catch (error) { next(error) }
}

export async function getDiscoveryFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const { limit, cursor, category, state, search } = req.query as Record<string, string>
    const userId = (req as any).user?.id
    const videos = await ParticipantVideosService.getDiscoveryFeed({
      limit: limit ? parseInt(limit) : 20,
      cursor,
      userId,
      category,
      state,
      search
    })
    return ApiResponse.success(res, videos)
  } catch (error) { next(error) }
}

export async function toggleLike(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id
    const { videoId } = req.params
    const result = await ParticipantVideosService.toggleLike(videoId, userId)
    return ApiResponse.success(res, result)
  } catch (error) { next(error) }
}

export async function addComment(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id
    const { videoId } = req.params
    const { content } = req.body
    const comment = await ParticipantVideosService.addComment(videoId, userId, content)
    return ApiResponse.success(res, comment)
  } catch (error) { next(error) }
}

export async function getComments(req: Request, res: Response, next: NextFunction) {
  try {
    const { videoId } = req.params
    const comments = await ParticipantVideosService.getComments(videoId)
    return ApiResponse.success(res, comments)
  } catch (error) { next(error) }
}
