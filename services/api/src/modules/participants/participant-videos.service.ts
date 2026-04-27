import { prisma } from '../../lib/prisma'
import { AppError } from '../../utils/errors'

export class ParticipantVideosService {
  static async addVideo(participantId: string, url: string, title?: string) {
    const platform = this.detectPlatform(url)
    return prisma.participantVideo.create({
      data: {
        participantId,
        url,
        title,
        platform
      }
    })
  }

  static async getParticipantVideos(participantId: string) {
    return prisma.participantVideo.findMany({
      where: { participantId },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async deleteVideo(videoId: string, participantId: string) {
    const video = await prisma.participantVideo.findFirst({
      where: { id: videoId, participantId }
    })
    if (!video) throw new AppError('Video not found or unauthorized', 404)

    return prisma.participantVideo.delete({
      where: { id: videoId }
    })
  }

  static async updateVideo(videoId: string, participantId: string, data: { title?: string, url?: string }) {
    const video = await prisma.participantVideo.findFirst({
      where: { id: videoId, participantId }
    })
    if (!video) throw new AppError('Video not found or unauthorized', 404)

    return prisma.participantVideo.update({
      where: { id: videoId },
      data: {
        title: data.title,
        url: data.url,
        platform: data.url ? this.detectPlatform(data.url) : undefined
      }
    })
  }

  static async getDiscoveryFeed(params: {
    limit?: number,
    cursor?: string,
    userId?: string,
    category?: string,
    state?: string,
    search?: string
  }) {
    const { limit = 20, cursor, userId, category, state, search } = params

    const where: any = {}
    if (category) where.participant = { ...where.participant, category }
    if (state) where.participant = { ...where.participant, state: { contains: state, mode: 'insensitive' } }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { participant: { displayName: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const videos = await prisma.participantVideo.findMany({
      where,
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        participant: {
          select: {
            id: true,
            displayName: true,
            photoUrl: true,
            voteLinkSlug: true,
            totalVotes: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        },
        likes: userId ? {
          where: { userId }
        } : false
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return videos.map(v => ({
      ...v,
      likeCount: v._count.likes,
      commentCount: v._count.comments,
      isLiked: userId ? v.likes.length > 0 : false
    }))
  }

  static async toggleLike(videoId: string, userId: string) {
    const existing = await prisma.participantVideoLike.findUnique({
      where: { videoId_userId: { videoId, userId } }
    })

    if (existing) {
      await prisma.participantVideoLike.delete({
        where: { id: existing.id }
      })
      return { liked: false }
    } else {
      await prisma.participantVideoLike.create({
        data: { videoId, userId }
      })
      return { liked: true }
    }
  }

  static async addComment(videoId: string, userId: string, content: string) {
    return prisma.participantVideoComment.create({
      data: { videoId, userId, content },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            photoUrl: true
          }
        }
      }
    })
  }

  static async getComments(videoId: string, limit = 50) {
    return prisma.participantVideoComment.findMany({
      where: { videoId },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            photoUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  private static detectPlatform(url: string) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
    if (url.includes('tiktok.com')) return 'tiktok'
    if (url.includes('instagram.com')) return 'instagram'
    return 'other'
  }
}
