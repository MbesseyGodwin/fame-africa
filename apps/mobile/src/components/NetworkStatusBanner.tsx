// apps/mobile/src/components/NetworkStatusBanner.tsx

import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { Ionicons } from '@expo/vector-icons'

export const NetworkStatusBanner: React.FC = () => {
  const insets = useSafeAreaInsets()
  const { status, isOffline } = useNetworkStatus()
  const [slideAnim] = useState(new Animated.Value(-100))
  const [visible, setVisible] = useState(false)
  const [manualDismiss, setManualDismiss] = useState(false)
  const [lastStatus, setLastStatus] = useState(status)

  useEffect(() => {
    // If status changed, reset manual dismiss
    if (status !== lastStatus) {
      setManualDismiss(false)
      setLastStatus(status)
    }

    const shouldBeVisible = (status === 'poor' || status === 'offline') && !manualDismiss
    
    if (shouldBeVisible) {
      setVisible(true)
      Animated.spring(slideAnim, {
        toValue: insets.top,
        useNativeDriver: true,
        bounciness: 4
      }).start()
    } else if (visible) {
      const timer = setTimeout(() => {
        hideBanner()
      }, status === 'excellent' || status === 'good' ? 2000 : 0)
      return () => clearTimeout(timer)
    }
  }, [status, insets.top, manualDismiss])

  const hideBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true
    }).start(() => setVisible(false))
  }

  const handleDismiss = () => {
    setManualDismiss(true)
    hideBanner()
  }

  if (!visible) return null

  const getTheme = () => {
    if (status === 'offline') return { bg: '#475569', text: 'No Internet Connection', icon: 'cloud-offline' }
    if (status === 'poor') return { bg: '#F59E0B', text: 'Slow Connection Detected', icon: 'cellular-outline' }
    return { bg: '#10B981', text: 'Back Online', icon: 'checkmark-circle' }
  }

  const theme = getTheme()

  return (
    <Animated.View style={[
      s.banner, 
      { transform: [{ translateY: slideAnim }], backgroundColor: theme.bg }
    ]}>
      <View style={s.content}>
        <View style={s.mainInfo}>
          <Ionicons name={theme.icon as any} size={16} color="#fff" style={s.icon} />
          <Text style={s.text}>{theme.text}</Text>
        </View>
        
        <TouchableOpacity onPress={handleDismiss} style={s.closeBtn}>
          <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 20,
    right: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  closeBtn: {
    marginLeft: 12,
    padding: 2,
  }
})
