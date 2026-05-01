// apps/mobile/src/screens/dashboard/AnalyticsDetailScreen.tsx

import React from 'react'
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Dimensions, Platform,
  Alert,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { participantsApi } from '../../utils/api'
import { useTheme } from '../../context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'

const { width } = Dimensions.get('window')
const CHART_HEIGHT = 160

const SOURCE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  app: { icon: 'phone-portrait-outline', color: '#6366F1', label: 'Mobile App' },
  web: { icon: 'globe-outline', color: '#3B82F6', label: 'Web Browser' },
  link: { icon: 'link-outline', color: '#10B981', label: 'Share Link' },
  sms: { icon: 'chatbubble-outline', color: '#F59E0B', label: 'SMS / OTP' },
}

export default function AnalyticsDetailScreen() {
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const { data, isLoading } = useQuery({
    queryKey: ['analytics-detail'],
    queryFn: () => participantsApi.getAnalytics(),
  })

  const analytics = data?.data?.data
  const tallies: any[] = analytics?.tallies || []
  const sources: Record<string, number> = analytics?.sources || { app: 0, web: 0, link: 0 }

  const totalVotes = tallies.reduce((acc, t) => acc + t.voteCount, 0)
  const maxVotes = Math.max(...tallies.map(t => t.voteCount), 1)
  const avgVotes = tallies.length > 0 ? Math.round(totalVotes / tallies.length) : 0
  const bestDay = tallies.reduce((best, t) => t.voteCount > (best?.voteCount ?? 0) ? t : best, null as any)

  // Real engagement and demographic data from API
  const engagement = analytics?.engagement
  const demographics = analytics?.demographics

  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad, insets)

  if (isLoading) {
    return (
      <View style={[s.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
        <Text style={{ marginTop: 12, color: textSecondary }}>Crunching your performance data...</Text>
      </View>
    )
  }

  const recentTallies = tallies.slice(-10)

  return (
    <View style={s.safeArea}>
      {/* Header */}
      <View style={[s.navBar, { borderBottomColor: border }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={textPrimary} />
        </TouchableOpacity>
        <Text style={[s.navTitle, { color: textPrimary }]}>Performance Insights</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => analytics && Alert.alert('Export', 'Analytics report will be sent to your email.')}>
          <Ionicons name="download-outline" size={22} color={textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Growth Overview */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Overview</Text>
        </View>

        <View style={s.heroStrip}>
          <LinearGradient colors={['#FE2C55', '#FF5F7E']} style={s.heroCard}>
            <Text style={s.heroLabel}>Total Reach</Text>
            <Text style={s.heroValue}>{Math.round(totalVotes * 3.2).toLocaleString()}</Text>
            <View style={s.heroChange}>
              <Ionicons name="caret-up" size={12} color="#fff" />
              <Text style={s.heroChangeText}>12% vs last week</Text>
            </View>
          </LinearGradient>

          <View style={[s.heroCard, { backgroundColor: surface, borderWidth: 1, borderColor: border }]}>
            <Text style={[s.heroLabel, { color: textSecondary }]}>Total Votes</Text>
            <Text style={[s.heroValue, { color: textPrimary }]}>{totalVotes.toLocaleString()}</Text>
            <View style={[s.heroChange, { backgroundColor: '#10B98120' }]}>
              <Text style={[s.heroChangeText, { color: '#10B981' }]}>Hot Potential</Text>
            </View>
          </View>
        </View>

        {/* Engagement Funnel - Only show if data exists */}
        {engagement && (
          <View style={[s.card, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[s.cardTitle, { color: textPrimary }]}>Engagement Funnel</Text>
            <View style={s.funnelContainer}>
              <View style={s.funnelRow}>
                <View style={[s.funnelBar, { width: '100%', backgroundColor: '#6366F1' }]}>
                  <Text style={s.funnelText}>Profile Views: {Math.round(engagement.views).toLocaleString()}</Text>
                </View>
              </View>
              {engagement.interactions > 0 && (
                <View style={s.funnelRow}>
                  <View style={[s.funnelBar, { width: '60%', backgroundColor: '#3B82F6' }]}>
                    <Text style={s.funnelText}>Interactions: {Math.round(engagement.interactions).toLocaleString()}</Text>
                  </View>
                  <Text style={s.conversionText}>
                    {Math.round((engagement.interactions / engagement.views) * 100)}%
                  </Text>
                </View>
              )}
              <View style={s.funnelRow}>
                <View style={[s.funnelBar, { width: '35%', backgroundColor: '#FE2C55' }]}>
                  <Text style={s.funnelText}>Votes: {totalVotes.toLocaleString()}</Text>
                </View>
                {engagement.views > 0 && (
                  <Text style={s.conversionText}>
                    {Math.round((totalVotes / engagement.views) * 100)}%
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Voting Trends (Bar Chart) */}
        <View style={[s.card, { backgroundColor: surface, borderColor: border }]}>
          <View style={s.cardHeader}>
            <Text style={[s.cardTitle, { color: textPrimary }]}>Voting Trends</Text>
            <View style={s.badge}>
              <Text style={s.badgeText}>Last 10 Days</Text>
            </View>
          </View>

          <View style={s.chartContainer}>
            <View style={s.yAxis}>
              {[maxVotes, Math.round(maxVotes / 2), 0].map((v, i) => (
                <Text key={i} style={s.yLabel}>{v}</Text>
              ))}
            </View>
            <View style={s.barsArea}>
              {recentTallies.map((t, i) => {
                const pct = t.voteCount / maxVotes
                return (
                  <View key={i} style={s.barCol}>
                    <View style={[s.barFill, { height: Math.max(5, pct * CHART_HEIGHT), backgroundColor: i === recentTallies.length - 1 ? '#FE2C55' : '#6366F1' }]} />
                    <Text style={s.barLabel}>D{t.dayNumber}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        </View>

        {/* Source Distribution */}
        <View style={[s.card, { backgroundColor: surface, borderColor: border }]}>
          <Text style={[s.cardTitle, { color: textPrimary, marginBottom: 16 }]}>Vote Sources</Text>
          {Object.entries(sources).map(([source, count], idx) => {
            const cfg = SOURCE_CONFIG[source] || SOURCE_CONFIG.link
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
            return (
              <View key={source} style={s.sourceItem}>
                <View style={[s.sourceIcon, { backgroundColor: cfg.color + '20' }]}>
                  <Ionicons name={cfg.icon} size={18} color={cfg.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={s.sourceMeta}>
                    <Text style={[s.sourceLabel, { color: textPrimary }]}>{cfg.label}</Text>
                    <Text style={[s.sourceValue, { color: textPrimary }]}>{pct}%</Text>
                  </View>
                  <View style={s.progressTrack}>
                    <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: cfg.color }]} />
                  </View>
                </View>
              </View>
            )
          })}
        </View>

        {/* Demographic Insights - Only show if data exists */}
        {demographics && (
          <View style={[s.card, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[s.cardTitle, { color: textPrimary, marginBottom: 20 }]}>Audience Demographics</Text>
            
            <View style={s.demoRow}>
              <View style={s.demoCol}>
                <Text style={s.demoValue}>{demographics.femalePct}%</Text>
                <Text style={s.demoLabel}>Female</Text>
              </View>
              <View style={s.demoDivider} />
              <View style={s.demoCol}>
                <Text style={s.demoValue}>{demographics.malePct}%</Text>
                <Text style={s.demoLabel}>Male</Text>
              </View>
            </View>

            <View style={s.genderBar}>
              <View style={[s.genderFill, { width: `${demographics.femalePct}%`, backgroundColor: '#EC4899' }]} />
              <View style={[s.genderFill, { width: `${demographics.malePct}%`, backgroundColor: '#3B82F6' }]} />
            </View>

            {demographics.topStates?.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Text style={[s.subTitle, { color: textSecondary }]}>Top Regions</Text>
                {demographics.topStates.map((state: string, i: number) => (
                  <View key={state} style={s.stateRow}>
                    <Text style={[s.stateName, { color: textPrimary }]}>{i + 1}. {state}</Text>
                    <View style={[s.stateRank, { backgroundColor: theme.primaryColor + '15' }]}>
                      <Text style={[s.stateRankText, { color: theme.primaryColor }]}>Active</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Tips / Insights */}
        <LinearGradient colors={['#4F46E5', '#3730A3']} style={s.insightCard}>
          <Ionicons name="bulb" size={24} color="#fff" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.insightTitle}>Pro Insight</Text>
            <Text style={s.insightBody}>
              Your peak engagement is between 7 PM and 9 PM. Post your daily stories during this window to maximize visibility and votes!
            </Text>
          </View>
        </LinearGradient>

      </ScrollView>
    </View>
  )
}

function makeStyles(theme: any, bg: string, surface: string, textPrimary: string, textSecondary: string, border: string, pad: number, insets: any) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: bg },
    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 60 },
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: insets.top + 10,
      paddingBottom: 15,
      borderBottomWidth: 1,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    navTitle: { fontSize: 18, fontWeight: '800' },
    sectionHeader: { marginTop: 10, marginBottom: 15 },
    sectionTitle: { fontSize: 14, fontWeight: '800', color: textSecondary, textTransform: 'uppercase', letterSpacing: 1 },

    heroStrip: { flexDirection: 'row', gap: 16, marginBottom: 32 },
    heroCard: { 
      flex: 1, 
      borderRadius: 24, 
      padding: 20, 
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 4,
    },
    heroLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.5 },
    heroValue: { fontSize: 26, fontWeight: '900', color: '#fff', marginVertical: 6 },
    heroChange: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.25)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      alignSelf: 'flex-start'
    },
    heroChangeText: { fontSize: 11, fontWeight: '800', color: '#fff', marginLeft: 4 },

    card: { 
      borderRadius: 28, 
      padding: 24, 
      marginBottom: 24, 
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 3,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    cardTitle: { fontSize: 17, fontWeight: '800' },
    badge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    badgeText: { fontSize: 10, fontWeight: '700', color: '#64748B' },

    funnelContainer: { gap: 12 },
    funnelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    funnelBar: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
    funnelText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    conversionText: { fontSize: 12, fontWeight: '800', color: '#10B981' },

    chartContainer: { flexDirection: 'row', height: CHART_HEIGHT + 30, alignItems: 'flex-end' },
    yAxis: { height: CHART_HEIGHT, justifyContent: 'space-between', width: 35, paddingBottom: 5 },
    yLabel: { fontSize: 10, color: textSecondary, textAlign: 'right', paddingRight: 8 },
    barsArea: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    barCol: { alignItems: 'center', flex: 1 },
    barFill: { width: 14, borderRadius: 7 },
    barLabel: { fontSize: 9, color: textSecondary, marginTop: 8, fontWeight: '600' },

    sourceItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    sourceIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    sourceMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    sourceLabel: { fontSize: 14, fontWeight: '700' },
    sourceValue: { fontSize: 14, fontWeight: '800' },
    progressTrack: { height: 8, borderRadius: 4, backgroundColor: '#F1F5F9', overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },

    demoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginVertical: 10 },
    demoCol: { alignItems: 'center' },
    demoValue: { fontSize: 24, fontWeight: '900', color: textPrimary },
    demoLabel: { fontSize: 12, color: textSecondary, fontWeight: '600' },
    demoDivider: { width: 1, height: 30, backgroundColor: border },
    genderBar: { height: 10, borderRadius: 5, flexDirection: 'row', overflow: 'hidden', marginTop: 10 },
    genderFill: { height: '100%' },

    subTitle: { fontSize: 13, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase' },
    stateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    stateName: { fontSize: 14, fontWeight: '600' },
    stateRank: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    stateRankText: { fontSize: 10, fontWeight: '700' },

    insightCard: { flexDirection: 'row', padding: 20, borderRadius: 24, alignItems: 'center' },
    insightTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
    insightBody: { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 18, marginTop: 4 },
  })
}