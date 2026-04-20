import React from 'react'
import {
  View, Text, StyleSheet, FlatList, Image, ActivityIndicator,
  TouchableOpacity, SafeAreaView, Dimensions, RefreshControl
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { leaderboardApi, competitionsApi } from '../../utils/api'

const { width } = Dimensions.get('window')

export default function LeaderboardScreen() {
  const { theme, textPrimary, textSecondary, bg, surface, border } = useTheme()
  const router = useRouter()

  const { data: cycleData, isLoading: cycleLoading } = useQuery({
    queryKey: ['currentCycle'],
    queryFn: async () => {
      const res = await competitionsApi.getCurrent()
      return res.data?.data
    }
  })

  const cycleId = cycleData?.id

  const { data: leaderboard, isLoading: lbLoading, refetch, isRefetching } = useQuery({
    queryKey: ['leaderboard', cycleId],
    queryFn: async () => {
      if (!cycleId) return []
      const res = await leaderboardApi.getCurrent(cycleId)
      return res.data?.data || []
    },
    enabled: !!cycleId
  })

  const isLoading = cycleLoading || lbLoading
  const top3 = leaderboard?.slice(0, 3) || []
  const rest = leaderboard?.slice(3) || []

  const s = styles(theme, bg, surface, textPrimary, textSecondary, border)

  const renderTop3 = () => {
    if (top3.length === 0) return null

    // Helper for podium render
    const renderPodium = (item: any, rank: 1 | 2 | 3) => {
      if (!item) return <View style={s.podiumEmpty} />
      
      const isFirst = rank === 1
      const podiumHeight = isFirst ? 140 : rank === 2 ? 110 : 80
      const podiumColor = isFirst ? '#FBBF24' : rank === 2 ? '#9CA3AF' : '#D97706'
      const textColor = isFirst ? '#78350F' : rank === 2 ? '#374151' : '#78350F'

      return (
        <TouchableOpacity 
          style={s.podiumCol} 
          activeOpacity={0.8}
          onPress={() => router.push(`/participants/${item.slug || item.participantId}`)}
        >
          {isFirst && <Text style={s.crown}>👑</Text>}
          
          <View style={[s.podiumAvatarWrap, { borderColor: isFirst ? podiumColor : surface }]}>
            {item.photoUrl ? (
              <Image source={{ uri: item.photoUrl }} style={s.podiumAvatar} />
            ) : (
               <View style={s.podiumAvatarPlaceholder}>
                 <Text style={s.podiumAvatarInitial}>{item.displayName?.substring(0, 2).toUpperCase()}</Text>
               </View>
            )}
          </View>
          
          <View style={[s.podiumBase, { height: podiumHeight, backgroundColor: podiumColor }]}>
            <Text style={[s.podiumRank, { color: textColor }]}>#{rank}</Text>
            <Text style={[s.podiumName, { color: textColor }]} numberOfLines={1}>{item.displayName}</Text>
            <Text style={[s.podiumVotes, { color: textColor }]}>{item.totalVotes.toLocaleString()} votes</Text>
          </View>
        </TouchableOpacity>
      )
    }

    return (
      <View style={s.top3Container}>
        {renderPodium(top3[1], 2)}
        {renderPodium(top3[0], 1)}
        {renderPodium(top3[2], 3)}
      </View>
    )
  }

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity 
      style={s.rowItem} 
      activeOpacity={0.7}
      onPress={() => router.push(`/participants/${item.slug || item.participantId}`)}
    >
      <Text style={s.rowRank}>#{index + 4}</Text>
      
      {item.photoUrl ? (
        <Image source={{ uri: item.photoUrl }} style={s.rowAvatar} />
      ) : (
        <View style={s.rowAvatarPlaceholder}>
          <Text style={s.rowAvatarInitial}>{item.displayName?.substring(0, 2).toUpperCase()}</Text>
        </View>
      )}

      <View style={s.rowInfo}>
        <Text style={s.rowName}>{item.displayName}</Text>
        <Text style={s.rowCategory}>{item.category || 'Participant'}</Text>
      </View>

      <View style={s.rowVotesWrap}>
        <Text style={s.rowVotes}>{item.totalVotes.toLocaleString()}</Text>
        <Text style={s.rowVotesLabel}>VOTES</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Live Leaderboard</Text>
        <Text style={s.headerSub}>{cycleData?.cycleName || 'Current Cycle'}</Text>
      </View>

      {isLoading && !isRefetching ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={theme.primaryColor} />
          <Text style={s.loadingText}>Loading rankings...</Text>
        </View>
      ) : !leaderboard || leaderboard.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="bar-chart-outline" size={64} color={border} />
          <Text style={s.emptyTitle}>No Rankings Yet</Text>
          <Text style={s.emptySub}>The leaderboard will update once voting begins.</Text>
        </View>
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(item) => item.participantId}
          renderItem={renderItem}
          ListHeaderComponent={renderTop3}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primaryColor} />}
        />
      )}
    </SafeAreaView>
  )
}

const styles = (theme: any, bg: string, surface: string, textPrimary: string, textSecondary: string, border: string) => StyleSheet.create({
  container: { flex: 1, backgroundColor: bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: textSecondary, fontSize: 15 },
  
  header: { alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: textPrimary },
  headerSub: { fontSize: 13, color: theme.primaryColor, fontWeight: '600', marginTop: 4, textTransform: 'uppercase' },

  emptyTitle: { fontSize: 18, fontWeight: '700', color: textPrimary, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: textSecondary, textAlign: 'center' },

  listContent: { paddingBottom: 100 },

  // Top 3
  top3Container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 24,
    marginBottom: 8,
  },
  podiumCol: {
    alignItems: 'center',
    width: (width - 40) / 3,
  },
  podiumEmpty: { width: (width - 40) / 3 },
  crown: { fontSize: 24, marginBottom: 4 },
  podiumAvatarWrap: {
    width: 64, height: 64, rounded: 32, borderRadius: 32, borderWidth: 3, 
    marginBottom: -16, zIndex: 10, backgroundColor: surface, overflow: 'hidden'
  },
  podiumAvatar: { width: '100%', height: '100%' },
  podiumAvatarPlaceholder: { width: '100%', height: '100%', backgroundColor: surface, justifyContent: 'center', alignItems: 'center' },
  podiumAvatarInitial: { fontSize: 20, fontWeight: 'bold', color: textSecondary },
  podiumBase: {
    width: '90%',
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    alignItems: 'center', paddingTop: 20, paddingHorizontal: 4
  },
  podiumRank: { fontSize: 24, fontWeight: '900', opacity: 0.9 },
  podiumName: { fontSize: 12, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  podiumVotes: { fontSize: 10, fontWeight: '600', opacity: 0.8, marginTop: 2 },

  // List Rows
  rowItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: surface,
    marginHorizontal: 16, marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1, borderColor: border,
  },
  rowRank: { width: 36, fontSize: 16, fontWeight: '800', color: textSecondary },
  rowAvatar: { width: 44, height: 44, borderRadius: 22 },
  rowAvatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: bg, justifyContent: 'center', alignItems: 'center' },
  rowAvatarInitial: { fontSize: 16, fontWeight: 'bold', color: textSecondary },
  rowInfo: { flex: 1, marginLeft: 12 },
  rowName: { fontSize: 15, fontWeight: '700', color: textPrimary, marginBottom: 2 },
  rowCategory: { fontSize: 12, color: textSecondary },
  rowVotesWrap: { alignItems: 'flex-end' },
  rowVotes: { fontSize: 16, fontWeight: '800', color: theme.primaryColor },
  rowVotesLabel: { fontSize: 9, fontWeight: '800', color: textSecondary, marginTop: 1 },
})
