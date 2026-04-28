// apps/mobile/src/screens/eliminations/EliminationsScreen.tsx

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
import { competitionsApi, eliminationsApi } from '../../utils/api'

const { width } = Dimensions.get('window')

export default function EliminationsScreen() {
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

  const { data: eliminations, isLoading: elimLoading, refetch, isRefetching } = useQuery({
    queryKey: ['eliminations_history', cycleId],
    queryFn: async () => {
      if (!cycleId) return []
      const res = await eliminationsApi.getCurrentCycle()
      return res.data?.data || []
    },
    enabled: !!cycleId
  })

  const isLoading = cycleLoading || elimLoading
  const s = styles(theme, bg, surface, textPrimary, textSecondary, border, insets)

  const renderItem = ({ item }: { item: any }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.participantInfo}>
          {item.participant?.photoUrl ? (
            <Image source={{ uri: item.participant.photoUrl }} style={s.avatar} />
          ) : (
            <View style={s.avatarPlaceholder}>
              <Text style={s.avatarInitial}>{(item.participant?.displayName || '??').substring(0, 2).toUpperCase()}</Text>
            </View>
          )}
          <View style={s.nameContainer}>
            <Text style={s.participantName}>{item.participant?.displayName || 'Unknown Participant'}</Text>
            <Text style={s.elimDate}>Eliminated on Day {item.dayNumber}</Text>
          </View>
        </View>
        <View style={s.statusBadge}>
          <Text style={s.statusText}>DROPPED</Text>
        </View>
      </View>

      <View style={s.divider} />

      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Text style={s.statLabel}>VOTES AT DROP</Text>
          <Text style={s.statValue}>{item.votesOnDay?.toLocaleString() || 0}</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statLabel}>TOTAL VOTES</Text>
          <Text style={s.statValue}>{item.cumulativeVotes?.toLocaleString() || 0}</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statLabel}>DATE</Text>
          <Text style={s.statValue}>{new Date(item.eliminationDate).toLocaleDateString()}</Text>
        </View>
      </View>
      
      {item.reason && (
        <View style={s.reasonBox}>
          <Ionicons name="information-circle-outline" size={14} color={textSecondary} />
          <Text style={s.reasonText}>{item.reason}</Text>
        </View>
      )}
    </View>
  )

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <View style={s.headerTitleContainer}>
          <Text style={s.headerTitle}>Elimination History</Text>
          <Text style={s.headerSub}>{cycleData?.cycleName || 'Current Season'}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {isLoading && !isRefetching ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={theme.primaryColor} />
          <Text style={s.loadingText}>Loading history...</Text>
        </View>
      ) : !eliminations || eliminations.length === 0 ? (
        <View style={s.center}>
          <View style={s.emptyIconCircle}>
            <Ionicons name="shield-checkmark-outline" size={48} color={theme.primaryColor} />
          </View>
          <Text style={s.emptyTitle}>Full House!</Text>
          <Text style={s.emptySub}>No participants have been eliminated from this cycle yet.</Text>
        </View>
      ) : (
        <FlatList
          data={eliminations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: border,
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
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: textPrimary },
  headerSub: { fontSize: 12, color: theme.primaryColor, fontWeight: '600', marginTop: 2 },

  listContent: { padding: 16, paddingBottom: 100 },

  card: {
    backgroundColor: surface,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { 
    width: 48, height: 48, borderRadius: 24, 
    backgroundColor: bg, justifyContent: 'center', alignItems: 'center' 
  },
  avatarInitial: { fontSize: 18, fontWeight: '800', color: textSecondary },
  nameContainer: { marginLeft: 12, flex: 1 },
  participantName: { fontSize: 16, fontWeight: '800', color: textPrimary },
  elimDate: { fontSize: 12, color: textSecondary, marginTop: 2 },
  statusBadge: {
    backgroundColor: '#EF444415',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 10, fontWeight: '900', color: '#EF4444' },

  divider: { height: 1, backgroundColor: border, marginBottom: 16 },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: { flex: 1 },
  statLabel: { fontSize: 9, fontWeight: '800', color: textSecondary, marginBottom: 4, letterSpacing: 0.5 },
  statValue: { fontSize: 14, fontWeight: '900', color: textPrimary },

  reasonBox: {
    marginTop: 16,
    padding: 10,
    backgroundColor: bg,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reasonText: { fontSize: 12, color: textSecondary, flex: 1, fontStyle: 'italic' },

  emptyIconCircle: {
    width: 100, height: 100,
    borderRadius: 50,
    backgroundColor: theme.primaryColor + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 40 },
})
