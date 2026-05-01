import React, { useRef, useState, useEffect } from 'react'
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native'
import { useVideoPlayer, VideoView } from 'expo-video'
import { useTheme } from '../context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { cacheDirectory, makeDirectoryAsync, getInfoAsync, downloadAsync } from 'expo-file-system/legacy'

interface VideoPlayerProps {
  uri: string
  posterUri?: string
  style?: any
}

export default function VideoPlayer({ uri, posterUri, style }: VideoPlayerProps) {
  const { theme, textPrimary } = useTheme()
  const ref = useRef<VideoView>(null)

  const [videoUri, setVideoUri] = useState<string>(uri)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  // ── Cache Logic ─────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true

    async function checkCache() {
      if (!uri) return

      try {
        // Create a unique filename based on the URI
        const filename = uri.split('/').pop() || 'temp_video'
        const cacheDir = `${cacheDirectory}video_cache/`
        const localUri = `${cacheDir}${filename}`

        // Ensure directory exists
        const dirInfo = await getInfoAsync(cacheDir)
        if (!dirInfo.exists) {
          await makeDirectoryAsync(cacheDir, { intermediates: true })
        }

        // Check if file is already cached
        const fileInfo = await getInfoAsync(localUri)
        if (fileInfo.exists) {
          console.log('[VideoPlayer] Playing from cache:', localUri)
          if (isMounted) setVideoUri(localUri)
          return
        }

        // If not cached, we play from remote but start a background download
        console.log('[VideoPlayer] Streaming from remote, caching in background...')
        if (isMounted) setVideoUri(uri)

        // Background download (don't await to avoid blocking playback start)
        downloadAsync(uri, localUri)
          .then(({ uri: savedUri }) => {
            console.log('[VideoPlayer] Cached successfully to:', savedUri)
          })
          .catch(err => {
            console.error('[VideoPlayer] Cache download failed:', err)
          })

      } catch (err) {
        console.error('[VideoPlayer] Cache check error:', err)
        if (isMounted) setVideoUri(uri)
      }
    }

    checkCache()
    return () => { isMounted = false }
  }, [uri])

  // ── Player Initialization ──────────────────────────────────
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false
    p.muted = false
  })

  // ── Sync videoUri to player ──────────────────────────────────
  useEffect(() => {
    if (videoUri && videoUri !== uri) {
      player.replaceAsync(videoUri)
    }
  }, [videoUri, player])

  useEffect(() => {
    const subscription = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') setLoading(false)
      if (status === 'error') { setLoading(false); setError(true) }
    })
    return () => {
      subscription.remove()
    }
  }, [player])

  return (
    <View style={[styles.container, style]}>
      {loading && !error && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.primaryColor} />
          <Text style={[styles.loadingText, { color: textPrimary }]}>Preparing Talent Video...</Text>
        </View>
      )}

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color={textPrimary} />
          <Text style={{ color: textPrimary, marginTop: 8 }}>Unable to load video</Text>
        </View>
      ) : (
        <VideoView
          ref={ref}
          style={styles.video}
          player={player}
          nativeControls
          allowsFullscreen={true}
          contentFit="contain"
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    alignSelf: 'stretch',
    flex: 1,
  },
  loader: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
})

