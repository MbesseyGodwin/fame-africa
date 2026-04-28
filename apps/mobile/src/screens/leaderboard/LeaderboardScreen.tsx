// apps/mobile/src/screens/leaderboard/LeaderboardScreen.tsx

import React from 'react'
import {
  View, Text, StyleSheet, FlatList, Image, ActivityIndicator,
  TouchableOpacity, Dimensions, RefreshControl
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { leaderboardApi, competitionsApi } from '../../utils/api'
import { InfoTooltip } from '../../components/common/InfoTooltip'

const { width } = Dimensions.get('window')

export default function LeaderboardScreen() {
  const { theme, textPrimary, textSecondary, bg, surface, border } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()

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
      // Extract the leaderboard array from the data object
      return res.data?.data?.leaderboard || []
    },
    enabled: !!cycleId
  })

  const isLoading = cycleLoading || lbLoading
  const top3 = Array.isArray(leaderboard) ? leaderboard.slice(0, 3) : []
  const rest = Array.isArray(leaderboard) ? leaderboard.slice(3) : []

  const s = styles(theme, bg, surface, textPrimary, textSecondary, border, insets)

  const renderTop3 = () => {
    if (top3.length === 0) return null

    // Helper for podium render
    const renderPodium = (item: any, rank: 1 | 2 | 3) => {
      if (!item) return <View style={s.podiumEmpty} />

      const isFirst = rank === 1
      const podiumHeight = isFirst ? 160 : rank === 2 ? 130 : 100
      const podiumColor = isFirst ? '#FBBF24' : rank === 2 ? '#9CA3AF' : '#D97706'
      const textColor = isFirst ? '#78350F' : rank === 2 ? '#374151' : '#78350F'

      return (
        <TouchableOpacity
          style={s.podiumCol}
          activeOpacity={0.8}
          onPress={() => router.push(`/participants/${item.voteLinkSlug || item.id}`)}
        >
          {isFirst && <Text style={s.crown}>👑</Text>}

          <View style={[s.podiumAvatarWrap, { borderColor: isFirst ? podiumColor : border }]}>
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
      onPress={() => router.push(`/participants/${item.voteLinkSlug || item.id}`)}
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
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color={textPrimary} />
          </TouchableOpacity>

          <View style={s.headerCenter}>
            <View style={s.liveBadge}>
              <View style={s.liveDot} />
              <Text style={s.liveText}>LIVE RANKINGS</Text>
            </View>
            <Text style={s.headerTitle}>Leaderboard</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              onPress={() => refetch()} 
              style={[s.headerActionBtn, { marginRight: 8 }]}
              disabled={isRefetching}
            >
              {isRefetching ? (
                <ActivityIndicator size="small" color={theme.primaryColor} />
              ) : (
                <Ionicons name="refresh" size={22} color={textPrimary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={s.infoBtn}>
              <InfoTooltip
                title="Global Rankings"
                content="Real-time rankings based on cumulative verified votes across Africa. Both free and Mega votes contribute to the total score."
              />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={s.headerSub}>{cycleData?.cycleName || 'Current Season'}</Text>
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
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderTop3}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primaryColor} />}
        />
      )}
    </View>
  )
}

const styles = (theme: any, bg: string, surface: string, textPrimary: string, textSecondary: string, border: string, insets: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: textSecondary, fontSize: 15, fontWeight: '600' },

  header: {
    paddingTop: insets.top + 10,
    paddingBottom: 20,
    backgroundColor: surface,
    borderBottomWidth: 1,
    borderBottomColor: border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: border,
  },
  headerCenter: {
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF444415',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 4,
  },
  liveDot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: textPrimary, letterSpacing: -0.5 },
  headerSub: {
    fontSize: 12,
    color: theme.primaryColor,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 1,
    opacity: 0.8
  },
  infoBtn: {
    width: 44, height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: border,
  },

  emptyTitle: { fontSize: 20, fontWeight: '800', color: textPrimary, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 40 },

  listContent: { paddingBottom: 120 },

  // Top 3 Podium
  top3Container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 30,
    backgroundColor: surface + '80',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 20,
  },
  podiumCol: {
    alignItems: 'center',
    width: (width - 32) / 3,
  },
  podiumEmpty: { width: (width - 32) / 3 },
  crown: { fontSize: 28, marginBottom: 8 },
  podiumAvatarWrap: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 4,
    marginBottom: -20, zIndex: 10, backgroundColor: bg, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 10,
  },
  podiumAvatar: { width: '100%', height: '100%' },
  podiumAvatarPlaceholder: { width: '100%', height: '100%', backgroundColor: bg, justifyContent: 'center', alignItems: 'center' },
  podiumAvatarInitial: { fontSize: 24, fontWeight: '900', color: textSecondary },
  podiumBase: {
    width: '94%',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    alignItems: 'center', paddingTop: 24, paddingHorizontal: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  podiumRank: { fontSize: 28, fontWeight: '900', opacity: 0.1, position: 'absolute', top: 20 },
  podiumName: { fontSize: 13, fontWeight: '800', marginTop: 12, textAlign: 'center' },
  podiumVotes: { fontSize: 11, fontWeight: '700', opacity: 0.7, marginTop: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },

  // List Rows
  rowItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
    backgroundColor: surface,
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 20,
    borderWidth: 1, borderColor: border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5,
    elevation: 2,
  },
  rowRank: { width: 40, fontSize: 16, fontWeight: '900', color: textSecondary, opacity: 0.4 },
  rowAvatar: { width: 48, height: 48, borderRadius: 24 },
  rowAvatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: bg, justifyContent: 'center', alignItems: 'center' },
  rowAvatarInitial: { fontSize: 18, fontWeight: '800', color: textSecondary },
  rowInfo: { flex: 1, marginLeft: 16 },
  rowName: { fontSize: 16, fontWeight: '700', color: textPrimary, marginBottom: 4 },
  rowCategory: { fontSize: 12, color: textSecondary, fontWeight: '500' },
  rowVotesWrap: { alignItems: 'flex-end' },
  rowVotes: { fontSize: 18, fontWeight: '900', color: theme.primaryColor, letterSpacing: -0.5 },
  rowVotesLabel: { fontSize: 9, fontWeight: '900', color: textSecondary, marginTop: 2, letterSpacing: 1 },
})

