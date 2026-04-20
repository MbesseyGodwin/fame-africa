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
      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data
      console.log('Expo Push Token:', token)

      // Send to backend
      await notificationsApi.registerPushToken(token)
    } catch (e) {
      console.error('Error fetching push token', e)
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
