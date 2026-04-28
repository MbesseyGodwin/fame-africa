// apps/mobile/src/screens/results/ResultsScreen.tsx

import React from 'react'
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { eliminationsApi, competitionsApi } from '../../utils/api'
import { useTheme } from '../../context/ThemeContext'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { InfoTooltip } from '../../components/common/InfoTooltip'

export default function ResultsScreen() {
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const { data: statsRes, isLoading } = useQuery({
    queryKey: ['standings'],
    queryFn: () => eliminationsApi.getCurrentCycle(),
  })

  const results = statsRes?.data?.data || []
  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad, insets)

  function renderResultItem({ item, index }: { item: any, index: number }) {
    const isOut = !!item.eliminatedAt

    return (
      <View style={[s.row, isOut && { opacity: 0.6 }]}>
        <View style={s.rankBox}>
          <Text style={s.rankText}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.name}>{item.participant.displayName}</Text>
          <Text style={s.subText}>{item.votesReceived || 0} total votes</Text>
        </View>
        {isOut ? (
          <View style={s.outPill}><Text style={s.outPillText}>Eliminated</Text></View>
        ) : (
          <View style={s.safePill}><Text style={s.safePillText}>Safe</Text></View>
        )}
      </View>
    )
  }

  return (
    <View style={s.container}>
      <View style={s.headerCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Live Standings</Text>
          </View>
          <InfoTooltip
            title="What are Standings?"
            content="Standings show the current position of all participants. Those in the bottom positions are at risk of elimination during the daily reset. Vote for your favorites to keep them safe!"
            color="#fff"
          />
        </View>
        <Text style={s.headerSub}>Updated in real-time. Keep voting to save your favorite!</Text>
        
        <TouchableOpacity 
          style={s.elimHistoryBtn}
          onPress={() => router.push('/eliminations')}
        >
          <Ionicons name="skull-outline" size={16} color="#fff" />
          <Text style={s.elimHistoryText}>View Elimination History</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator color={theme.primaryColor} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderResultItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 100 }}>
              <Ionicons name="stats-chart-outline" size={48} color={textSecondary} />
              <Text style={{ color: textSecondary, marginTop: 12 }}>No rankings available yet</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

function makeStyles(theme: any, bg: string, surface: string, textPrimary: string, textSecondary: string, border: string, pad: number, insets: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    headerCard: {
      backgroundColor: theme.headerColor,
      paddingHorizontal: 24,
      paddingTop: insets.top + 10,
      paddingBottom: 24,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '600' },
    headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
    elimHistoryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      marginTop: 16,
      gap: 6,
    },
    elimHistoryText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
    },
    row: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: surface,
      padding: 14, borderRadius: theme.borderRadius,
      marginBottom: 10, borderWidth: 0.5, borderColor: border,
    },
    rankBox: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: theme.accentColor,
      alignItems: 'center', justifyContent: 'center',
    },
    rankText: { color: theme.primaryColor, fontWeight: '600', fontSize: 13 },
    name: { fontSize: 14, fontWeight: '600', color: textPrimary },
    subText: { fontSize: 11, color: textSecondary, marginTop: 2 },
    outPill: { backgroundColor: '#FCEBEB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    outPillText: { color: '#A32D2D', fontSize: 10, fontWeight: '600' },
    safePill: { backgroundColor: '#EAF3DE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    safePillText: { color: '#3B6D11', fontSize: 10, fontWeight: '600' },
  })
}
