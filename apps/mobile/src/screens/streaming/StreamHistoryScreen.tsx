// apps/mobile/src/screens/streaming/StreamHistoryScreen.tsx

import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image,
  Alert
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { streamingApi } from '../../utils/api'
import { format } from 'date-fns'
import { LinearGradient } from 'expo-linear-gradient'

interface StreamLog {
  id: string
  title: string
  status: string
  startTime: string
  endTime?: string
  viewerCount: number
  peakViewers: number
  totalLikes: number
  recordingUrl?: string
  thumbnailUrl?: string
}

export default function StreamHistoryScreen() {
  const router = useRouter()
  const [history, setHistory] = useState<StreamLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchHistory = async () => {
    try {
      const { data } = await streamingApi.getMyHistory()
      setHistory(data.data)
    } catch (error) {
      console.error('Failed to fetch streaming history', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    fetchHistory()
  }

  const renderItem = ({ item }: { item: StreamLog }) => {
    const isRecorded = item.status === 'RECORDED'
    const isLiveNow = item.status === 'LIVE'
    const duration = item.endTime
      ? Math.floor((new Date(item.endTime).getTime() - new Date(item.startTime).getTime()) / 60000)
      : 0

    const handleDelete = (streamId: string) => {
      Alert.alert(
        'Delete Stream',
        'Are you sure you want to delete this stream? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: async () => {
              try {
                await streamingApi.deleteStream(streamId)
                setHistory(prev => prev.filter(s => s.id !== streamId))
              } catch (error) {
                Alert.alert('Error', 'Failed to delete stream. Please try again.')
              }
            }
          }
        ]
      )
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleInfo}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.streamTitle}>{item.title || 'Untitled Stream'}</Text>
                {isLiveNow && (
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>LIVE</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={18} color="#999" />
              </TouchableOpacity>
            </View>
            <Text style={styles.streamDate}>
              {format(new Date(item.startTime), 'MMM do, yyyy • h:mm a')}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={16} color="#666" />
            <Text style={styles.statValue}>{item.peakViewers || 0} Peak</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.statValue}>
              {isLiveNow 
                ? 'Live Now' 
                : duration === 0 
                  ? '< 1 min' 
                  : `${duration} mins`
              }
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={16} color="#666" />
            <Text style={styles.statValue}>{item.totalLikes || 0} Likes</Text>
          </View>
        </View>

        {isRecorded && item.recordingUrl && (
          <TouchableOpacity
            style={styles.watchBtn}
            onPress={() => router.push(`/streaming/watch/${item.id}`)}
          >
            <Ionicons name="play-circle-outline" size={20} color="#FE2C55" />
            <Text style={styles.watchText}>Watch Recording</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FE2C55" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Streaming History ({history.length})</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FE2C55" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="video-off-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>You haven't streamed any sessions yet.</Text>
            <TouchableOpacity style={styles.goLiveBtn} onPress={() => router.push('/streaming/host')}>
              <Text style={styles.goLiveText}>Go Live Now</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  listContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleInfo: { flex: 1 },
  streamTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  streamDate: { fontSize: 12, color: '#666', marginTop: 4 },
  statusBadge: { backgroundColor: '#eee', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  recordedBadge: { backgroundColor: '#e7f5ff' },
  statusText: { fontSize: 10, fontWeight: '700', color: '#666' },
  statsRow: { flexDirection: 'row', marginTop: 16, gap: 20 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValue: { fontSize: 13, color: '#444', fontWeight: '600' },
  watchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1'
  },
  watchText: { color: '#FE2C55', fontWeight: '700', fontSize: 14 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 15, color: '#999', marginTop: 16, textAlign: 'center', paddingHorizontal: 40 },
  goLiveBtn: { backgroundColor: '#FE2C55', marginTop: 24, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24 },
  goLiveText: { color: '#fff', fontWeight: '800' },
  liveBadge: { backgroundColor: '#FE2C55', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  liveBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' }
})
