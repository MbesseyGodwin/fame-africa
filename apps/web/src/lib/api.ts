// apps/web/src/lib/api.ts

import axios from 'axios'

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fameafrica-api.onrender.com/api/v1'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'



export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

// Track refresh state
let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

const onRefreshed = (token: string) => {
  refreshSubscribers.map((callback) => callback(token))
  refreshSubscribers = []
}

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback)
}

// Attach JWT from localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    const original = config

    if (response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken })
        const newAccessToken = data.data.accessToken
        localStorage.setItem('accessToken', newAccessToken)

        isRefreshing = false
        onRefreshed(newAccessToken)

        original.headers.Authorization = `Bearer ${newAccessToken}`
        return api(original)
      } catch (refreshError) {
        isRefreshing = false
        refreshSubscribers = []
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')

        if (typeof window !== 'undefined') {
          const path = window.location.pathname
          const isProtectedRoute = path.startsWith('/dashboard') || path.startsWith('/admin')

          if (isProtectedRoute && path !== '/auth/login') {
            window.location.href = '/auth/login'
          }
        }
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  sendOtp: (data: any) => api.post('/auth/send-otp', data),
  verifyOtp: (data: any) => api.post('/auth/verify-otp', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  changeEmail: (newEmail: string) => api.post('/auth/change-email', { newEmail }),
}

// ── Users ─────────────────────────────────────────────────────
export const usersApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: any) => api.put('/users/me', data),
  updatePhoto: (formData: FormData) => api.post('/users/me/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getPreferences: () => api.get('/users/me/preferences'),
  updatePreferences: (data: any) => api.put('/users/me/preferences', data),
  changePassword: (data: any) => api.post('/users/me/change-password', data),
  updatePhone: (data: any) => api.put('/users/me/phone', data),
  getActivity: (params?: any) => api.get('/users/me/activity', { params }),
}

// ── Competitions ──────────────────────────────────────────────
export const competitionsApi = {
  getCurrent: () => api.get('/competitions/current'),
  getById: (id: string) => api.get(`/competitions/${id}`),
  getStats: (id: string) => api.get(`/competitions/${id}/stats`),
  getArchive: (params?: any) => api.get('/competitions/archive', { params }),
  getWinners: (cycleId: string) => api.get(`/competitions/${cycleId}/winners`),
}

// ── Participants ──────────────────────────────────────────────
export const participantsApi = {
  list: (params: any) => api.get('/participants', { params }),
  search: (query: string) => api.get('/participants/search', { params: { query } }),
  getBySlug: (slug: string) => api.get(`/participants/${slug}`),
  getPublicVotes: (slug: string, params?: any) => api.get(`/participants/${slug}/public-votes`, { params }),
  getPublicStans: (slug: string, params?: any) => api.get(`/participants/${slug}/public-stans`, { params }),
  register: (data: any) => api.post('/participants/register', data),
  getDashboard: () => api.get('/participants/me/dashboard'),
  getAnalytics: () => api.get('/participants/me/analytics'),
  updateProfile: (data: any) => api.put('/participants/me/profile', data),
  requestWithdrawal: () => api.post('/participants/me/withdraw'),
  confirmWithdrawal: (token: string) => api.post('/participants/me/withdraw/confirm', { token }),
  getAiAdvice: () => api.get('/participants/me/ai-advice'),
}

// ── Audit ─────────────────────────────────────────────────────
export const auditApi = {
  verifyVote: (voteId: string) => api.get(`/audit/verify/${voteId}`),
}

// ── Voting ────────────────────────────────────────────────────
export const votingApi = {
  sendOtp: (data: any) => api.post('/votes/send-otp', data),
  castVote: (data: any) => api.post('/votes/cast', data),
  checkVoted: (phone: string, cycleId: string) => api.get(`/votes/check/${phone}`, { params: { cycleId } }),
  getMyHistory: (params?: any) => api.get('/votes/me/history', { params }),
  getPublicStats: (cycleId?: string) => api.get('/votes/public/stats', { params: { cycleId } }),
  getLiveFeed: (cycleId?: string, limit?: number) => api.get('/votes/live-feed', { params: { cycleId, limit } }),
}

// ── Leaderboard ───────────────────────────────────────────────
export const leaderboardApi = {
  getCurrent: (cycleId?: string) => api.get('/leaderboard/current', { params: { cycleId } }),
  getDailyChart: (cycleId?: string) => api.get('/leaderboard/daily-chart', { params: { cycleId } }),
  getHistorical: (cycleId: string, page?: number) => api.get('/leaderboard/historical', { params: { cycleId, page } }),
}

// ── Eliminations ──────────────────────────────────────────────
export const eliminationsApi = {
  getCurrentCycle: () => api.get('/eliminations/current-cycle'),
  getToday: () => api.get('/eliminations/today'),
  getDetails: (id: string) => api.get(`/eliminations/${id}`),
}

// ── Sponsors ──────────────────────────────────────────────────
export const sponsorsApi = {
  getActive: () => api.get('/sponsors/active'),
  getNextAd: () => api.get('/sponsors/next-ad'),
}

// ── Notifications ─────────────────────────────────────────────
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id: string) => api.delete(`/notifications/${id}`),
}

// ── Stans ─────────────────────────────────────────────────────
export const stansApi = {
  stan: (participantId: string) => api.post('/stans', { participantId }),
  unstan: (participantId: string) => api.delete(`/stans/${participantId}`),
  getStans: (participantId: string) => api.get(`/stans/participant/${participantId}`),
  getMyStans: () => api.get('/stans/me'),
  checkStanning: (participantId: string) => api.get(`/stans/check/${participantId}`),
}

// ── Admin ─────────────────────────────────────────────────────
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getCycles: () => api.get('/admin/cycles'),
  createCycle: (data: any) => api.post('/admin/cycles', data),
  updateCycle: (id: string, data: any) => api.put(`/admin/cycles/${id}`, data),
  deleteCycle: (id: string) => api.delete(`/admin/cycles/${id}`),
  updateCycleStatus: (id: string, status: string) => api.put(`/admin/cycles/${id}/status`, { status }),
  getSettings: (cycleId: string) => api.get(`/admin/settings/${cycleId}`),
  updateSettings: (cycleId: string, settings: any[]) => api.put(`/admin/settings/${cycleId}`, { settings }),
  getParticipants: (params: any) => api.get('/admin/participants', { params }),
  updateParticipantStatus: (id: string, status: string) => api.put(`/admin/participants/${id}/status`, { status }),
  getLiveVotes: (cycleId: string) => api.get('/admin/votes/live', { params: { cycleId } }),
  getVoteLedger: (params: any) => api.get('/admin/votes/ledger', { params }),
  getEliminationQueue: (cycleId: string) => api.get('/admin/eliminations/queue', { params: { cycleId } }),
  getEliminations: (cycleId: string) => api.get('/admin/eliminations', { params: { cycleId } }),
  getFraudFlags: () => api.get('/admin/fraud-flags'),
  resolveFraudFlag: (id: string, resolution: string) => api.put(`/admin/fraud-flags/${id}/resolve`, { resolution }),
  getAuditLog: (params: any) => api.get('/admin/audit-log', { params }),
  exportAuditLog: () => api.get('/admin/audit-log/export', { responseType: 'blob' }),
  getSponsors: (cycleId: string) => api.get('/admin/sponsors', { params: { cycleId } }),
  createSponsor: (data: any) => api.post('/admin/sponsors', data),
  updateSponsor: (id: string, data: any) => api.put(`/admin/sponsors/${id}`, data),
  deleteSponsor: (id: string) => api.delete(`/admin/sponsors/${id}`),
  
  // God Mode Actions
  adjustVotes: (id: string, amount: number, reason: string) => 
    api.post(`/admin/participants/${id}/votes/adjust`, { amount, reason }),
  giveStrike: (id: string, reason: string) => 
    api.post(`/admin/participants/${id}/strikes`, { reason }),
  getStrikes: (id: string) => 
    api.get(`/admin/participants/${id}/strikes`),
  removeStrike: (id: string, strikeId: string) => 
    api.delete(`/admin/participants/${id}/strikes/${strikeId}`),
  forceWinner: (cycleId: string, participantId: string) => 
    api.post(`/admin/cycles/${cycleId}/force-winner/${participantId}`),
  forceCycleStatus: (cycleId: string, status: string) => 
    api.post(`/admin/cycles/${cycleId}/force-status`, { status }),
}

export const adminUsersApi = {
  listUsers: (params?: any) => api.get('/admin/users', { params }),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  updateRole: (id: string, role: string) => api.put(`/admin/users/${id}/role`, { role }),
  banUser: (id: string, reason: string) => api.put(`/admin/users/${id}/ban`, { reason }),
  unbanUser: (id: string) => api.put(`/admin/users/${id}/unban`),
}

export const adminStatsApi = {
  getOverview: (cycleId?: string) => api.get('/admin/stats/overview', { params: { cycleId } }),
  getVoteTrends: (cycleId?: string, days?: number) => api.get('/admin/stats/votes-over-time', { params: { cycleId, days } }),
}

export const adminBroadcastApi = {
  getBroadcasts: () => api.get('/admin/notifications/broadcasts'),
  sendBroadcast: (data: any) => api.post('/admin/notifications/broadcast', data),
  cancelBroadcast: (id: string) => api.delete(`/admin/notifications/broadcasts/${id}`),
}
