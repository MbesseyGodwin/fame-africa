'use client'

import { useEffect } from 'react'
import { useAuthStore } from '../../hooks/useAuthStore'
import { usePreferencesStore } from '../../hooks/usePreferencesStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const { preferences, loadPreferences } = usePreferencesStore()

  useEffect(() => {
    if (user) loadPreferences()
  }, [user])

  useEffect(() => {
    if (!preferences) return

    const root = document.documentElement

    root.style.setProperty('--color-primary', preferences.primaryColor)
    root.style.setProperty('--color-primary-light', hexToRgba(preferences.primaryColor, 0.12))
    root.style.setProperty('--color-accent', preferences.accentColor)
    root.style.setProperty('--color-btn-bg', preferences.buttonColor)
    root.style.setProperty('--color-btn-text', preferences.textOnPrimary)
    root.style.setProperty('--color-header-bg', preferences.headerColor)
    root.style.setProperty('--color-card-bg', preferences.cardBackground)
    root.style.setProperty('--font-family', preferences.fontFamily)
    root.style.setProperty('--font-size-base', `${preferences.fontSize}px`)
    root.style.setProperty('--line-height-base', String(preferences.lineHeight))
    root.style.setProperty('--font-weight-base', preferences.fontWeight)
    root.style.setProperty('--border-radius', preferences.borderRadius)

    if (preferences.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    if (preferences.compactMode) {
      document.body.classList.add('compact')
    } else {
      document.body.classList.remove('compact')
    }
  }, [preferences])

  return <>{children}</>
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
