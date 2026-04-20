import React, { createContext, useContext, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'

export interface ThemePreferences {
  border: string
  primaryColor: string
  buttonColor: string
  headerColor: string
  accentColor: string
  cardBackground: string
  textOnPrimary: string
  darkMode: boolean
  fontFamily: string
  fontSize: number
  lineHeight: number
  fontWeight: string
  borderRadius: number
  compactMode: boolean
  showAvatars: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
}

export const DEFAULT_THEME: ThemePreferences = {
  primaryColor: '#534AB7',
  buttonColor: '#534AB7',
  headerColor: '#534AB7',
  accentColor: '#EEEDFE',
  cardBackground: '#ffffff',
  textOnPrimary: '#ffffff',
  darkMode: false,
  fontFamily: 'System',
  fontSize: 14,
  lineHeight: 1.5,
  fontWeight: '400',
  borderRadius: 8,
  compactMode: false,
  showAvatars: true,
  emailNotifications: true,
  smsNotifications: true,
  pushNotifications: true,
  border: ''
}

interface ThemeContextValue {
  theme: ThemePreferences
  updateTheme: (updates: Partial<ThemePreferences>) => void
  saveTheme: () => Promise<void>
  resetTheme: () => void
  bg: string
  surface: string
  textPrimary: string
  textSecondary: string
  border: string
  pad: number
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemePreferences>(DEFAULT_THEME)

  useEffect(() => {
    loadTheme()
  }, [])

  async function loadTheme() {
    try {
      const stored = await SecureStore.getItemAsync('votenaija_theme')
      if (stored) setTheme({ ...DEFAULT_THEME, ...JSON.parse(stored) })
    } catch { }
  }

  function updateTheme(updates: Partial<ThemePreferences>) {
    setTheme(prev => ({ ...prev, ...updates }))
  }

  async function saveTheme() {
    await SecureStore.setItemAsync('votenaija_theme', JSON.stringify(theme))
  }

  function resetTheme() {
    setTheme(DEFAULT_THEME)
  }

  const isDark = theme.darkMode
  const bg = isDark ? '#0f0f23' : '#f8f8fa'
  const surface = isDark ? '#1a1a2e' : theme.cardBackground
  const textPrimary = isDark ? '#e8e8ff' : '#1a1a1a'
  const textSecondary = isDark ? '#8888aa' : '#666666'
  const border = isDark ? '#2a2a4a' : '#ebebeb'
  const pad = theme.compactMode ? 10 : 14

  return (
    <ThemeContext.Provider value={{
      theme, updateTheme, saveTheme, resetTheme,
      bg, surface, textPrimary, textSecondary, border, pad,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
