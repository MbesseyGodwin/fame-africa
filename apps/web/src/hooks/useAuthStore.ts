import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi, usersApi } from '../lib/api'

interface User {
  id: string
  email: string
  phone: string
  fullName: string
  displayName: string
  bio: string
  role: string
  emailVerified: boolean
  phoneVerified: boolean
  participant?: {
    id: string
    status: string
    voteLinkSlug: string
    cycleId: string
  } | null
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  setUser: (user: User) => void
  setAuth: (user: User, accessToken: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await authApi.login(email, password)
          const { user, accessToken, refreshToken } = data.data
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', refreshToken)
          set({ user, accessToken, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await authApi.logout()
        } catch (error) {
          console.error('Backend logout failed:', error)
        } finally {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          set({ user: null, accessToken: null })
          window.location.href = '/auth/login'
        }
      },

      refreshUser: async () => {
        try {
          const { data } = await usersApi.getMe()
          set({ user: data.data })
        } catch {
          get().logout()
        }
      },

      setUser: (user) => set({ user }),
      setAuth: (user, accessToken) => set({ user, accessToken }),
    }),
    {
      name: 'votenaija-auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    }
  )
)
