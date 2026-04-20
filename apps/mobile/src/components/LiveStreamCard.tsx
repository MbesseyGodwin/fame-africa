// apps/mobile/src/components/LiveStreamCard.tsx

import React from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'

const { width } = Dimensions.get('window')

interface LiveStreamCardProps {
  stream: {
    id: string
    title: string
    viewerCount: number
    channelName: string
    host: {
      displayName: string
      photoUrl: string
      category: string
    }
  }
}

export default function LiveStreamCard({ stream }: LiveStreamCardProps) {
  const router = useRouter()

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.9}
      onPress={() => router.push(`/streaming/viewer/${stream.id}`)}
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
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.overlay}
        >
          <View style={styles.topRow}>
            <View style={styles.liveBadge}>
              <View style={styles.pulse} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <View style={styles.viewerBadge}>
              <Ionicons name="eye" size={10} color="#fff" />
              <Text style={styles.viewerText}>{stream.viewerCount}</Text>
            </View>
          </View>

          <View style={styles.bottomContent}>
            <Text style={styles.category}>{stream.host.category}</Text>
            <Text style={styles.title} numberOfLines={1}>{stream.title || stream.host.displayName}</Text>
            <Text style={styles.name}>{stream.host.displayName}</Text>
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: width * 0.4,
    height: 220,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  content: { flex: 1 },
  thumbnail: { ...StyleSheet.absoluteFillObject },
  overlay: { flex: 1, padding: 12, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  liveBadge: {
    backgroundColor: '#FE2C55',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pulse: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  viewerBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewerText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  bottomContent: { gap: 2 },
  category: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  title: { color: '#fff', fontSize: 13, fontWeight: '800' },
  name: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600' },
})
