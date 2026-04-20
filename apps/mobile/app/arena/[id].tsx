// apps/mobile/app/arena/[id].tsx

import React from 'react'
import { useLocalSearchParams, Stack } from 'expo-router'
import { ArenaLiveScreen } from '../../src/screens/arena/ArenaLiveScreen'

export default function ArenaRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <ArenaLiveScreen eventId={id!} />
    </>
  )
}
