import React, { createContext, useContext, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import { usersApi } from '../utils/api'

interface User {
  participant: any
  emailVerified: any
  phoneVerified: any
  lastLoginAt: any
  createdAt: string | number | Date
  updatedAt: string | number | Date
  isActive: any
  photoUrl: any
  bio: string
  id: string
  email: string
  phone: string
  fullName: string
  displayName?: string
  role: string
}

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (tokens: { accessToken: string; refreshToken: string }, userData: User) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSession()
  }, [])

  async function loadSession() {
    try {
      const storedUser = await SecureStore.getItemAsync('user')
      const token = await SecureStore.getItemAsync('accessToken')

      if (storedUser && token) {
        setUser(JSON.parse(storedUser))
        // Optionally verify token/refresh user info here
      }
    } catch (err) {
      console.error('[AuthContext] Error loading session:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function signIn(tokens: { accessToken: string; refreshToken: string }, userData: User) {
    await SecureStore.setItemAsync('accessToken', tokens.accessToken)
    await SecureStore.setItemAsync('refreshToken', tokens.refreshToken)
    await SecureStore.setItemAsync('user', JSON.stringify(userData))
    setUser(userData)
  }

  async function signOut() {
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('refreshToken')
    await SecureStore.deleteItemAsync('user')
    setUser(null)
  }

  async function refreshUser() {
    try {
      const { data } = await usersApi.getMe()
      const userData = data.data
      await SecureStore.setItemAsync('user', JSON.stringify(userData))
      setUser(userData)
    } catch (err) {
      console.error('[AuthContext] Error refreshing user:', err)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      signIn,
      signOut,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
