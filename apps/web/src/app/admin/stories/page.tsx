// apps/web/src/app/admin/stories/page.tsx


'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../../lib/api'
import {
  PlayCircle, Trash2, ShieldAlert, CheckCircle,
  Search, Filter, ExternalLink, UserX,
  Clock, X
} from 'lucide-react'

export default function AdminStoriesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin_stories', page, statusFilter, search],
    queryFn: async () => {
      const params: any = { page, limit: 12 }
      if (statusFilter !== 'ALL') params.status = statusFilter
      if (search) params.search = search
      const res = await adminApi.getStories(params)
      return res.data
    }
  })

  // Data mapping from paginated ApiResponse
  const stories = data?.data || []
  const pagination = data?.pagination || { total: 0, totalPages: 1 }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteStory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_stories'] })
      alert("Story permanently removed.")
    }
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveStory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_stories'] })
    }
  })

  const banMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string, reason: string }) => adminApi.banUserFromStories(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_stories'] })
      alert("Participant banned from uploading stories.")
    }
  })

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <PlayCircle className="w-6 h-6" />
            </div>
            <h1 className="text-[24px] font-black text-gray-900 dark:text-white tracking-tight uppercase">Content Moderation <span className="text-primary font-medium">(GOD MODE)</span></h1>
          </div>
          <p className="text-sm text-gray-500 max-w-2xl">
            Live feed of all participant stories. You have full authority to remove content, approve flagged uploads, or ban disruptive accounts from the story ecosystem.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search participant..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/5 rounded-xl text-sm focus:ring-2 focus:ring-primary w-[240px] transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/5 rounded-xl text-sm focus:ring-2 focus:ring-primary font-bold text-gray-700 dark:text-gray-300"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Live Content</option>
            <option value="FLAGGED">Flagged</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-[9/16] bg-gray-100 dark:bg-white/5 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white dark:bg-gray-900 rounded-[40px] border border-dashed border-gray-200 dark:border-white/10">
          <ShieldAlert className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No stories matching your criteria found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stories.map((story: any) => (
            <div key={story.id} className="group relative bg-white dark:bg-gray-900 rounded-[32px] overflow-hidden border border-gray-200 dark:border-white/5 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
              {/* Preview */}
              <div className="aspect-[9/16] relative bg-black cursor-pointer" onClick={() => setSelectedVideo(story.videoUrl)}>
                <video
                  src={story.videoUrl}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  muted
                  onMouseOver={e => (e.target as any).play()}
                  onMouseOut={e => (e.target as any).pause()}
                />
                
                {/* Play Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-2xl">
                    <PlayCircle className="w-8 h-8 text-white fill-white/20" />
                  </div>
                </div>

                {/* Overlay Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg ${story.status === 'APPROVED' ? 'bg-green-500 text-white' :
                    story.status === 'PENDING' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {story.status}
                  </span>
                </div>

                {/* God Controls Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6 gap-4">
                  <div className="flex flex-col gap-2">
                    {story.status === 'PENDING' && (
                      <button
                        onClick={() => approveMutation.mutate(story.id)}
                        className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve Story
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm("Permanently delete this story from the platform?")) {
                          deleteMutation.mutate(story.id)
                        }
                      }}
                      className="w-full bg-white text-red-600 hover:bg-red-50 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl"
                    >
                      <Trash2 className="w-4 h-4" /> Remove Media
                    </button>
                    <button
                      onClick={() => {
                        const reason = window.prompt("Reason for banning this participant from stories?")
                        if (reason) {
                          banMutation.mutate({ id: story.participantId, reason })
                        }
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl"
                    >
                      <UserX className="w-4 h-4" /> Ban Participant
                    </button>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden">
                    {story.participant?.photoUrl ? (
                      <img src={story.participant.photoUrl} className="w-full h-full object-cover" />
                    ) : (
                      story.participant?.displayName?.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{story.participant?.displayName}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">Participant ID: {story.participantId?.substring(0, 8)}</p>
                  </div>
                </div>

                {story.caption && (
                  <p className="text-[13px] text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed italic">
                    "{story.caption ?? 'No caption provided!'}"
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(story.createdAt).toLocaleDateString()}
                  </div>
                  <a
                    href={story.videoUrl}
                    target="_blank"
                    className="p-2 text-gray-400 hover:text-primary transition-colors"
                    title="Open source file"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between py-6 border-t border-gray-100 dark:border-white/5">
        <div className="text-sm font-medium text-gray-500">
          Showing <span className="text-gray-900 dark:text-white font-bold">{stories.length}</span> stories of <span className="text-gray-900 dark:text-white font-bold">{pagination.total}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-bold disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <div className="flex items-center gap-1 px-4">
            <span className="text-sm font-bold text-gray-900 dark:text-white">{page}</span>
            <span className="text-sm font-medium text-gray-400">/</span>
            <span className="text-sm font-medium text-gray-400">{pagination.totalPages}</span>
          </div>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-bold disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setSelectedVideo(null)} />
          
          <div className="relative w-full max-w-sm max-h-[70vh] aspect-[9/16] bg-black rounded-[32px] overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <video 
              src={selectedVideo} 
              className="w-full h-full object-cover"
              controls
              autoPlay
            />
          </div>
        </div>
      )}
    </div>
  )
}
