// apps/mobile/src/screens/streaming/StreamHistoryScreen.tsx

import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image,
  Alert
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
  const insets = useSafeAreaInsets()
  const [history, setHistory] = useState<StreamLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deletingIds, setDeletingIds] = useState<string[]>([])

  // Multi-select state
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

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

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode)
    setSelectedIds([])
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === history.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(history.map(s => s.id))
    }
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return

    Alert.alert(
      'Bulk Delete',
      `Are you sure you want to delete ${selectedIds.length} selected streams?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingIds(prev => [...prev, ...selectedIds])
              await streamingApi.bulkDeleteStreams(selectedIds)
              setHistory(prev => prev.filter(s => !selectedIds.includes(s.id)))
              setIsSelectMode(false)
              setSelectedIds([])
            } catch (error) {
              Alert.alert('Error', 'Failed to delete some streams. Please try again.')
            } finally {
              setDeletingIds(prev => prev.filter(id => !selectedIds.includes(id)))
            }
          }
        }
      ]
    )
  }

  const renderItem = ({ item }: { item: StreamLog }) => {
    const isRecorded = item.status === 'RECORDED'
    const isLiveNow = item.status === 'LIVE'
    const isUploading = item.status === 'PROCESSING'
    const isProcessing = item.status === 'ENDED'
    const isSelected = selectedIds.includes(item.id)

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
                setDeletingIds(prev => [...prev, streamId])
                await streamingApi.deleteStream(streamId)
                setHistory(prev => prev.filter(s => s.id !== streamId))
              } catch (error) {
                Alert.alert('Error', 'Failed to delete stream. Please try again.')
              } finally {
                setDeletingIds(prev => prev.filter(id => id !== streamId))
              }
            }
          }
        ]
      )
    }

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.selectedCard]}
        onPress={() => isSelectMode ? toggleSelect(item.id) : null}
        activeOpacity={isSelectMode ? 0.7 : 1}
      >
        <View style={styles.cardHeader}>
          {isSelectMode && (
            <View style={styles.checkboxContainer}>
              <Ionicons
                name={isSelected ? "checkbox" : "square-outline"}
                size={24}
                color={isSelected ? "#FE2C55" : "#ccc"}
              />
            </View>
          )}

          <View style={styles.titleInfo}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Text style={styles.streamTitle} numberOfLines={1}>{item.title || 'Untitled Stream'}</Text>
                {isLiveNow && (
                  <View style={[styles.statusBadge, { backgroundColor: '#FE2C55' }]}>
                    <Text style={[styles.statusBadgeText, { color: '#fff' }]}>LIVE</Text>
                  </View>
                )}
              </View>

              {!isSelectMode && (
                deletingIds.includes(item.id) ? (
                  <ActivityIndicator size="small" color="#999" />
                ) : (
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={18} color="#999" />
                  </TouchableOpacity>
                )
              )}
            </View>
            <Text style={styles.streamDate}>
              {format(new Date(item.startTime), 'MMM do, yyyy • h:mm a')}
            </Text>
          </View>
        </View>

        <View style={[styles.statsRow, isSelectMode && { marginLeft: 32 }]}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={16} color="#666" />
            <Text style={styles.statValue}>{item.peakViewers || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.statValue}>
              {isLiveNow
                ? 'Live'
                : duration === 0
                  ? '< 1m'
                  : `${duration}m`
              }
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={16} color="#666" />
            <Text style={styles.statValue}>{item.totalLikes || 0}</Text>
          </View>
        </View>

        {item.status === 'RECORDED' ? (
          <TouchableOpacity
            style={styles.watchBtn}
            onPress={() => !isSelectMode && router.push(`/streaming/watch/${item.id}`)}
          >
            <Ionicons name="play-circle" size={18} color="#2E7D32" />
            <Text style={[styles.watchText, { color: '#2E7D32' }]}>REPLAY READY</Text>
          </TouchableOpacity>
        ) : item.status === 'ENDED' ? (
          <View style={styles.watchBtn}>
            <ActivityIndicator size="small" color="#EF6C00" />
            <Text style={[styles.watchText, { color: '#EF6C00' }]}>SAVING RECORDING...</Text>
          </View>
        ) : null}
      </TouchableOpacity>
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
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {isSelectMode ? `${selectedIds.length} Selected` : 'History'}
          </Text>
          {isSelectMode && history.length > 0 && (
            <TouchableOpacity onPress={handleSelectAll}>
              <Text style={styles.selectAllText}>
                {selectedIds.length === history.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.selectBtn} onPress={() => fetchHistory()}>
          <Ionicons name="refresh" size={20} color="#FE2C55" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.selectBtn} onPress={toggleSelectMode}>
          <Text style={styles.selectBtnText}>{isSelectMode ? 'Done' : 'Select'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, isSelectMode && { paddingBottom: 100 }]}
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

      {isSelectMode && (
        <View style={styles.bulkDeleteContainer}>
          <TouchableOpacity
            style={[styles.bulkDeleteBtn, selectedIds.length === 0 && styles.disabledBtn]}
            onPress={handleBulkDelete}
            disabled={selectedIds.length === 0}
          >
            <Ionicons name="trash" size={20} color="#fff" />
            <Text style={styles.bulkDeleteText}>
              Delete {selectedIds.length > 0 ? `(${selectedIds.length})` : 'Selected'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  selectBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  selectBtnText: { color: '#FE2C55', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  selectAllText: { fontSize: 12, color: '#FE2C55', fontWeight: '600', marginTop: 2 },
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
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  selectedCard: {
    borderColor: '#FE2C55',
    backgroundColor: '#FFF5F7'
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  checkboxContainer: { marginRight: 12 },
  titleInfo: { flex: 1 },
  streamTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  streamDate: { fontSize: 12, color: '#666', marginTop: 4 },
  statusBadge: { backgroundColor: '#eee', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#333'
  },
  statsRow: { flexDirection: 'row', marginTop: 12, gap: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 12, color: '#666', fontWeight: '600' },
  deleteBtn: { padding: 4 },
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
  bulkDeleteContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  bulkDeleteBtn: {
    backgroundColor: '#FE2C55',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#FE2C55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  disabledBtn: {
    backgroundColor: '#ccc',
    shadowOpacity: 0
  },
  bulkDeleteText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16
  }
})
