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
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="participants"
        options={{
          title: 'Candidates',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Rankings',
          tabBarIcon: ({ color, size }) => <Ionicons name="trophy" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          title: 'Results',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
