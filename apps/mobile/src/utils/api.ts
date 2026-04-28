// apps/mobile/src/utils/api.ts

import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // Increased to 30s for general metadata
})

/**
 * Specialized instance for large media uploads
 * Increased to 3 minutes to accommodate up to 50MB videos on mobile signals
 */
export const uploadApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 180000,
})


// Apply interceptors to both instances
const instances = [api, uploadApi]

instances.forEach(instance => {
  instance.interceptors.request.use(async (config) => {
    // Log the full URL for debugging
    const fullUrl = `${config.baseURL}${config.url}`
    console.log(`[API Request] ${config.method?.toUpperCase()} ${fullUrl}`)
    
    const token = await SecureStore.getItemAsync('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        const refreshToken = await SecureStore.getItemAsync('refreshToken')
        if (refreshToken) {
          try {
            const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken })
            await SecureStore.setItemAsync('accessToken', data.data.accessToken)
            error.config.headers.Authorization = `Bearer ${data.data.accessToken}`
            return instance(error.config)
          } catch {
            await SecureStore.deleteItemAsync('accessToken')
            await SecureStore.deleteItemAsync('refreshToken')
          }
        }
      }
      return Promise.reject(error)
    }
  )
})


// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  sendOtp: (data: any) => api.post('/auth/send-otp', data),
  verifyOtp: (data: any) => api.post('/auth/verify-otp', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  changeEmail: (newEmail: string) => api.post('/auth/change-email', { newEmail }),
  refreshToken: (refreshToken: string) => api.post('/auth/refresh-token', { refreshToken }),
  logoutAll: () => api.post('/auth/logout-all'),
  requestDeletion: (email: string) => api.post('/auth/request-deletion', { email }),
  confirmDeletion: (otpCode: string) => api.post('/auth/confirm-deletion', { otpCode }),
}

// ── Users ─────────────────────────────────────────────────────
export const usersApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: any) => api.put('/users/me', data),
  updatePhoto: (formData: FormData) => uploadApi.post('/users/me/photo', formData),
  getPreferences: () => api.get('/users/me/preferences'),
  updatePreferences: (data: any) => api.put('/users/me/preferences', data),
  changePassword: (data: any) => api.put('/users/me/password', data),
  updatePhone: (data: any) => api.put('/users/me/phone', data),
  getActivity: (params?: any) => api.get('/users/me/activity', { params }),
}

// ── Competitions ──────────────────────────────────────────────
export const competitionsApi = {
  getCurrent: () => api.get('/competitions/current'),
  getStats: (id: string) => api.get(`/competitions/${id}/stats`),
  getArchive: (params?: any) => api.get('/competitions/archive', { params }),
  getWinners: (cycleId: string) => api.get(`/competitions/${cycleId}/winners`),
}

// ── Participants ──────────────────────────────────────────────
export const participantsApi = {
  list: (params: any) => api.get('/participants', { params }),
  search: (query: string) => api.get('/participants/search', { params: { query } }),
  getBySlug: (slug: string) => api.get(`/participants/${slug}`),
  getDashboard: () => api.get('/participants/me/dashboard'),
  getAnalytics: () => api.get('/participants/me/analytics'),
  register: (data: any) => uploadApi.post('/participants/register', data),
  getPublicVotes: (slug: string, params?: any) => api.get(`/participants/${slug}/public-votes`, { params }),
  getPublicStans: (slug: string, params?: any) => api.get(`/participants/${slug}/public-stans`, { params }),
  getTopFans: (slug: string) => api.get(`/participants/${slug}/top-fans`),
  requestWithdrawal: () => api.post('/participants/me/withdraw'),
  confirmWithdrawal: (token: string) => api.post('/participants/me/withdraw/confirm', { token }),
  getAiAdvice: () => api.get('/participants/me/ai-advice'),
  updateProfile: (data: any) => api.put('/participants/me/profile', data),
  getDiscoveryFeed: (params?: { 
    limit?: number; 
    cursor?: string; 
    category?: string; 
    state?: string; 
    search?: string 
  }) => api.get('/participants/discovery/videos', { params }),
  addVideo: (data: { url: string; title?: string }) => api.post('/participants/me/videos', data),
  updateVideo: (videoId: string, data: { url?: string; title?: string }) => api.put(`/participants/me/videos/${videoId}`, data),
  deleteVideo: (videoId: string) => api.delete(`/participants/me/videos/${videoId}`),
  toggleLike: (videoId: string) => api.post(`/participants/videos/${videoId}/like`),
  addComment: (videoId: string, content: string) => api.post(`/participants/videos/${videoId}/comments`, { content }),
  getComments: (videoId: string) => api.get(`/participants/videos/${videoId}/comments`),
}

// ── Audit ─────────────────────────────────────────────────────
export const auditApi = {
  verifyVote: (voteId: string) => api.get(`/audit/verify/${voteId}`),
}

// ── Voting ────────────────────────────────────────────────────
export const votingApi = {
  sendOtp: (data: any) => api.post('/votes/send-otp', data),
  castVote: (data: any) => api.post('/votes/cast', data),
  getMyHistory: (params?: any) => api.get('/votes/me/history', { params }),
  getPublicStats: (cycleId?: string) => api.get('/votes/public/stats', { params: { cycleId } }),
  getLiveFeed: (cycleId?: string, limit?: number) => api.get('/votes/live-feed', { params: { cycleId, limit } }),
}

// ── Leaderboard ───────────────────────────────────────────────
export const leaderboardApi = {
  getCurrent: (cycleId?: string, page?: number) => api.get('/leaderboard', { params: { cycleId, page } }),
  getDailyChart: (cycleId?: string) => api.get('/leaderboard/daily', { params: { cycleId } }),
  getHistorical: (cycleId: string, page?: number) => api.get('/leaderboard', { params: { cycleId, page } }),
}

// ── Eliminations ──────────────────────────────────────────────
export const eliminationsApi = {
  getCurrentCycle: () => api.get('/eliminations/current-cycle'),
  getToday: () => api.get('/eliminations/today'),
  getDetails: (id: string) => api.get(`/eliminations/${id}`),
}

// ── Sponsors ──────────────────────────────────────────────────
export const sponsorsApi = {
  getForCycle: (cycleId: string) => api.get(`/sponsors/cycle/${cycleId}`),
  trackImpression: (sponsorId: string) => api.post('/sponsors/track-impression', { sponsorId }),
  getNextAd: () => api.get('/sponsors/next-ad'),
}

// ── Notifications ─────────────────────────────────────────────
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id: string) => api.delete(`/notifications/${id}`),
  registerPushToken: (pushToken: string) => api.post('/notifications/push-token', { pushToken }),
}

// ── Stans ─────────────────────────────────────────────────────
export const stansApi = {
  stan: (participantId: string) => api.post('/stans', { participantId }),
  unstan: (participantId: string) => api.delete(`/stans/${participantId}`),
  getStans: (participantId: string) => api.get(`/stans/participant/${participantId}`),
  getMyStans: () => api.get('/stans/me'),
  checkStanning: (participantId: string) => api.get(`/stans/check/${participantId}`),
}

// ── Arena ─────────────────────────────────────────────────────
export const arenaApi = {
  listEvents: (cycleId: string) => api.get('/arena/events', { params: { cycleId } }),
  getEventDetail: (id: string) => api.get(`/arena/events/${id}`),
  submitAnswer: (data: { eventId: string, questionId: string, selectedOption: number, timeSpentSeconds: number }) =>
    api.post('/arena/submit', data),
}

// ── Streaming ─────────────────────────────────────────────────
export const streamingApi = {
  getToken: (channelName: string, role?: 'PUBLISHER' | 'SUBSCRIBER') =>
    api.get('/streaming/token', { params: { channelName, role } }),
  startStream: (data: { participantId: string, title: string }) =>
    api.post('/streaming/start', data),
  endStream: (streamId: string) =>
    api.post(`/streaming/${streamId}/end`),
  bulkDeleteStreams: (streamIds: string[]) =>
    api.post('/streaming/bulk-delete', { streamIds }),
  listLive: (cycleId?: string) =>
    api.get('/streaming/live', { params: { cycleId } }),
  listRecorded: (params?: { cycleId?: string; search?: string; category?: string; sortBy?: string; page?: number; limit?: number }, p0?: number) =>
    api.get('/streaming/recorded', { params }),
  getMyHistory: () =>
    api.get('/streaming/my-history'),
  getRecordingLink: (streamId: string) =>
    api.get(`/streaming/${streamId}/link`),
  deleteStream: (streamId: string) =>
    api.delete(`/streaming/${streamId}`),
  reportStream: (streamId: string, reason: string) =>
    api.post('/moderation/reports', { targetStreamId: streamId, reason }),
}

// ── Moderation ────────────────────────────────────────────────
export const moderationApi = {
  submitReport: (data: { targetParticipantId?: string, targetStreamId?: string, reason: string }) =>
    api.post('/moderation/reports', data),
  listReports: (status?: string) =>
    api.get('/moderation/reports', { params: { status } }),
  resolveReport: (id: string, actionTaken: string) =>
    api.patch(`/moderation/reports/${id}`, { actionTaken }),
}

// ── Battles ───────────────────────────────────────────────────
export const battlesApi = {
  getActive: (cycleId: string) => api.get('/battles/active', { params: { cycleId } }),
  getPast: (cycleId: string) => api.get('/battles/past', { params: { cycleId } }),
  vote: (battleId: string, data: { participantId: string, voterPhone: string }) => 
    api.post(`/battles/${battleId}/vote`, data),
}

// ── Payments ──────────────────────────────────────────────────
export const paymentsApi = {
  getPackages: () => api.get('/payments/mega-vote-packages'),
  initializeMegaVote: (data: { 
    participantId: string, 
    amount: number, 
    currency: string, 
    reference: string, 
    voteCount: number 
  }) => api.post('/payments/mega-vote/initialize', data),
}
