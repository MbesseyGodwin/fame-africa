// apps/mobile/app/(tabs)/_layout.tsx


import React from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../src/context/ThemeContext'

export default function TabsLayout() {
  const { theme, textSecondary } = useTheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primaryColor,
        tabBarInactiveTintColor: textSecondary,
        headerShown: true,
        headerStyle: { backgroundColor: theme.headerColor },
        headerTintColor: '#ffffff',
        tabBarStyle: {
          backgroundColor: theme.cardBackground,
          borderTopColor: theme.accentColor,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discovery"
        options={{
          title: 'FameFeed',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="play-circle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="battles"
        options={{
          title: 'Battles',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="flash" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
      {/* Hidden Tabs */}
      <Tabs.Screen name="participants" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="leaderboard" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="results" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="notifications" options={{ href: null, headerShown: false }} />
    </Tabs>
  )
}
