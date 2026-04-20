// apps/mobile/app/_layout.tsx

import React, { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '../src/context/ThemeContext'
import { AuthProvider, useAuth } from '../src/context/AuthContext'
import { registerForPushNotificationsAsync, setupNotificationHandlers } from '../src/utils/notifications'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
})

function InitialLayout() {
  const { user, isLoading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    setupNotificationHandlers()
  }, [])

  useEffect(() => {
    if (isLoading) return

    if (user) {
      registerForPushNotificationsAsync().catch(err => {
        console.error('[InitialLayout] Push registration failed', err)
      })
    }

    const inAuthGroup = segments[0] === '(auth)'

    if (!user && !inAuthGroup && segments[0] === 'profile') {
      router.replace('/(auth)/welcome')
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/')
    }
  }, [user, isLoading, segments])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="vote/[slug]" options={{ headerShown: true, title: 'Cast Vote' }} />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <InitialLayout />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
