// apps/mobile/src/utils/notifications.ts

import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { notificationsApi } from './api'

export async function registerForPushNotificationsAsync() {
  let token

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    })
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!')
      return
    }
    
    // To get the projectId, run 'npx eas project:init' or get it from expo.dev dashboard
    const projectId = 
      Constants?.expoConfig?.extra?.eas?.projectId ?? 
      Constants?.easConfig?.projectId
    
    if (!projectId) {
      console.warn('[Notifications] No EAS projectId found. Push tokens cannot be generated in local development without it.')
      console.warn('[Notifications] Please run "npx eas project:init" or add your projectId to app.json.')
      return
    }

    try {
      // getExpoPushTokenAsync can fail on Android if Firebase is not properly initialized
      // We wrap it in a try-catch to prevent the app from logging a fatal error
      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId,
      })
      token = tokenResponse.data
      console.log('[Notifications] Expo Push Token:', token)

      // Send to backend
      await notificationsApi.registerPushToken(token)
    } catch (e: any) {
      if (e.message?.includes('FirebaseApp is not initialized')) {
        console.warn('[Notifications] Push token fetch skipped: Firebase not initialized. (Normal for development without google-services.json)')
      } else {
        console.warn('[Notifications] Error fetching push token:', e.message)
      }
    }
  } else {
    console.log('Must use physical device for Push Notifications')
  }

  return token
}

export function setupNotificationHandlers() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })
}
