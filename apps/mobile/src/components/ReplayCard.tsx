// apps/mobile/src/components/ReplayCard.tsx

import React from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'

const { width } = Dimensions.get('window')

interface ReplayCardProps {
  stream: {
    id: string
    title: string
    viewerCount: number // peak viewers
    startTime: string
    endTime?: string
    host: {
      displayName: string
      photoUrl: string
      category: string
    }
  }
}

export default function ReplayCard({ stream }: ReplayCardProps) {
  const router = useRouter()
  
  const dateStr = new Date(stream.startTime).toLocaleDateString(undefined, { 
    month: 'short', day: 'numeric' 
  })

  const getDuration = () => {
    if (!stream.startTime || !stream.endTime) return '00:00'
    const start = new Date(stream.startTime).getTime()
    const end = new Date(stream.endTime).getTime()
    const diffMs = end - start
    if (diffMs < 0) return '00:00'

    const totalSeconds = Math.floor(diffMs / 1000)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.9}
      onPress={() => router.push(`/streaming/watch/${stream.id}`)}
    >
      <View style={styles.content}>
        {/* Thumbnail Background */}
        {stream.host.photoUrl ? (
          <Image source={{ uri: stream.host.photoUrl }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, { backgroundColor: '#1C1C1E' }]} />
        )}

        {/* Overlay Vignette */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.overlay}
        >
          <View style={styles.topRow}>
            <View style={styles.replayBadge}>
              <Ionicons name="play-back" size={10} color="#fff" />
              <Text style={styles.replayText}>REPLAY</Text>
            </View>
            <View style={styles.durationBadge}>
              <Ionicons name="time-outline" size={10} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.durationText}>{getDuration()}</Text>
            </View>
          </View>

          <View style={styles.bottomContent}>
            <Text style={styles.category}>{stream.host.category}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>{stream.title || 'Recorded Session'}</Text>
                <Text style={styles.name}>{stream.host.displayName}</Text>
              </View>
              <View style={styles.viewCount}>
                <Ionicons name="eye-outline" size={12} color="rgba(255,255,255,0.7)" />
                <Text style={styles.views}>{stream.viewerCount || 0}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: width * 0.42,
    height: 240,
    marginRight: 12,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  content: { flex: 1 },
  thumbnail: { ...StyleSheet.absoluteFillObject, opacity: 0.8 },
  overlay: { flex: 1, padding: 12, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  replayBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  replayText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  durationBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  durationText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  bottomContent: { gap: 4 },
  category: { color: '#FE2C55', fontSize: 9, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  name: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' },
  viewCount: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  views: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700' }
})
