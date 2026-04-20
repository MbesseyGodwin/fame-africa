import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { usersApi } from '../lib/api'

export interface UserPreferences {
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
  borderRadius: string
  compactMode: boolean
  showAvatars: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
}

const DEFAULT_PREFS: UserPreferences = {
  primaryColor: '#534AB7',
  buttonColor: '#534AB7',
  headerColor: '#534AB7',
  accentColor: '#EEEDFE',
  cardBackground: '#ffffff',
  textOnPrimary: '#ffffff',
  darkMode: false,
  fontFamily: 'system-ui,sans-serif',
  fontSize: 14,
  lineHeight: 1.5,
  fontWeight: '400',
  borderRadius: '8px',
  compactMode: false,
  showAvatars: true,
  emailNotifications: true,
  smsNotifications: true,
  pushNotifications: true,
}

interface PreferencesState {
  preferences: UserPreferences
  isSaving: boolean
  loadPreferences: () => Promise<void>
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void
  savePreferences: () => Promise<void>
  resetToDefaults: () => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      preferences: DEFAULT_PREFS,
      isSaving: false,

      loadPreferences: async () => {
        try {
          const { data } = await usersApi.getPreferences()
          if (data.data) {
            set({ preferences: { ...DEFAULT_PREFS, ...data.data } })
          }
        } catch {
          // Use local defaults if API fails
        }
      },

      updatePreference: (key, value) => {
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        }))
      },

      savePreferences: async () => {
        set({ isSaving: true })
        try {
          await usersApi.updatePreferences(get().preferences)
        } finally {
          set({ isSaving: false })
        }
      },

      resetToDefaults: () => {
        set({ preferences: DEFAULT_PREFS })
      },
    }),
    {
      name: 'votenaija-preferences',
    }
  )
)
