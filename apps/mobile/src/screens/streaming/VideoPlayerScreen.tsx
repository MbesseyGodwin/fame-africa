// apps/mobile/src/screens/streaming/VideoPlayerScreen.tsx

import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native'
import { useVideoPlayer, VideoView } from 'expo-video'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { streamingApi } from '../../utils/api'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width, height } = Dimensions.get('window')

export default function VideoPlayerScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams()
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLink = async () => {
      try {
        const { data, status } = await streamingApi.getRecordingLink(id as string)
        if (data.success) {
          setVideoUrl(data.data.url)
        } else if (status === 202 || data.status === 'PROCESSING') {
          setError('Recording is still being processed. Please check back in a few minutes!')
        } else {
          setError(data.message || 'Failed to load recording link.')
        }
      } catch (err: any) {
        console.error('Error fetching recording link', err)
        if (err.response?.status === 202) {
          setError('Recording is still being processed. Please check back soon!')
        } else if (err.response?.status === 404) {
          setError('This recording is missing or failed to process correctly.')
        } else {
          setError('Could not reach the server. Please try again later.')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchLink()
  }, [id])

  const player = useVideoPlayer(videoUrl || '', (player) => {
    player.loop = false
    if (videoUrl) player.play()
  })

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FE2C55" />
        <Text style={styles.loadingText}>Fetching recording...</Text>
      </View>
    )
  }

  if (error || !videoUrl) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>{error || 'Recording not available'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        allowsFullscreen
        allowsPictureInPicture
      />
      
      {/* Overlay - Back button */}
      <TouchableOpacity 
        style={[styles.overlayBack, { top: insets.top + 10 }]} 
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  video: { width: width, height: height },
  center: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 20 },
  loadingText: { color: '#fff', marginTop: 12, fontSize: 16, fontWeight: '600' },
  errorText: { color: '#fff', marginTop: 16, fontSize: 18, textAlign: 'center', fontWeight: '700' },
  backBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#FE2C55', borderRadius: 24 },
  backText: { color: '#fff', fontWeight: '800' },
  overlayBack: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10
  }
})
