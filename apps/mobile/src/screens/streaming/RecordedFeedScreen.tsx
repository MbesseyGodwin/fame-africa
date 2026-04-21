// apps/mobile/src/screens/streaming/RecordedFeedScreen.tsx

import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Dimensions, TextInput,
  ScrollView
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { streamingApi } from '../../utils/api'
import ReplayCard from '../../components/ReplayCard'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')

export default function RecordedFeedScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  
  // Data State
  const [replays, setReplays] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  
  // Filter/Sort State
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'RECENT' | 'POPULAR'>('RECENT')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchReplays = async (pageNum: number, isNewSearch = false) => {
    try {
      if (pageNum === 1) setLoading(true)
      else setLoadingMore(true)

      const params = {
        search: search.trim() || undefined,
        sortBy,
        page: pageNum,
        limit: 12
      }

      const { data } = await streamingApi.listRecorded(params)
      const newItems = data.data

      if (isNewSearch || pageNum === 1) {
        setReplays(newItems)
      } else {
        setReplays(prev => [...prev, ...newItems])
      }

      setHasMore(newItems.length === 12)
    } catch (error) {
      console.error('Failed to fetch replays', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }

  // Trigger search/filter refresh
  useEffect(() => {
    setPage(1)
    fetchReplays(1, true)
  }, [sortBy])

  // Debounced Search Handler
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchReplays(1, true)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const onRefresh = () => {
    setRefreshing(true)
    setPage(1)
    fetchReplays(1, true)
  }

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchReplays(nextPage)
    }
  }

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or title..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort & Results Bar */}
      <View style={styles.sortBar}>
        <Text style={styles.resultsCount}>{replays.length} results</Text>
        <TouchableOpacity 
          style={styles.sortToggle}
          onPress={() => setSortBy(prev => prev === 'RECENT' ? 'POPULAR' : 'RECENT')}
        >
          <Ionicons name={sortBy === 'RECENT' ? 'time-outline' : 'flame-outline'} size={14} color="#FE2C55" />
          <Text style={styles.sortText}>{sortBy === 'RECENT' ? 'Most Recent' : 'Most Popular'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderFooter = () => (
    loadingMore ? (
      <View style={styles.footerLoader}>
        <ActivityIndicator color="#FE2C55" />
      </View>
    ) : null
  )

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Absolute Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Past Streams</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={replays}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <ReplayCard stream={item} />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FE2C55" />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color="#eee" />
              <Text style={styles.emptyTitle}>No Replays Found</Text>
              <Text style={styles.emptyText}>Try adjusting your search or category filters.</Text>
            </View>
          )
        }
      />
      
      {loading && (
        <View style={styles.fullLoader}>
          <ActivityIndicator color="#FE2C55" size="large" />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8'
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#000' },
  
  // List Header Styles
  listHeader: { backgroundColor: '#fff', paddingBottom: 8 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee'
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#333' },
  
  sortBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8
  },
  resultsCount: { fontSize: 12, color: '#999', fontWeight: '600' },
  sortToggle: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    backgroundColor: 'rgba(254,44,85,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  sortText: { fontSize: 12, fontWeight: '700', color: '#FE2C55' },

  // List Contents
  listContent: { padding: 12, paddingBottom: 40 },
  columnWrapper: { justifyContent: 'space-between' },
  cardWrapper: {
    width: (width - 36) / 2,
    marginBottom: 16,
  },
  
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
  fullLoader: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 40
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: 16, color: '#333' },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8, lineHeight: 20 }
})
