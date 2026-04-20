// apps/mobile/src/screens/dashboard/AnalyticsDetailScreen.tsx

import React from 'react'
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Dimensions, Platform,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { participantsApi } from '../../utils/api'
import { useTheme } from '../../context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'



const { width } = Dimensions.get('window')
const CHART_HEIGHT = 140

const SOURCE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  app: { icon: 'phone-portrait-outline', color: '#534AB7', label: 'Mobile App' },
  web: { icon: 'globe-outline', color: '#185FA5', label: 'Web Browser' },
  link: { icon: 'link-outline', color: '#0F6E56', label: 'Share Link' },
  sms: { icon: 'chatbubble-outline', color: '#854F0B', label: 'SMS / OTP' },
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

  const maxVotes = Math.max(...tallies.map(t => t.voteCount), 1)
  const totalVotes = tallies.reduce((acc, t) => acc + t.voteCount, 0)
  const avgVotes = tallies.length > 0 ? Math.round(totalVotes / tallies.length) : 0
  const bestDay = tallies.reduce((best, t) => t.voteCount > (best?.voteCount ?? 0) ? t : best, null as any)

  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad, insets)

  // ── Loading ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[s.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
        <Text style={[s.loadingText, { color: textSecondary }]}>Loading analytics…</Text>
      </View>
    )
  }

  // ── Empty state ──────────────────────────────────────────────
  if (tallies.length === 0) {
    return (
      <View style={s.safeArea}>
        <View style={s.navBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={textPrimary} />
          </TouchableOpacity>
          <Text style={[s.navTitle, { color: textPrimary }]}>Analytics</Text>
          <View style={s.backBtn} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Ionicons name="bar-chart-outline" size={56} color={textSecondary} style={{ opacity: 0.4 }} />
          <Text style={[s.emptyTitle, { color: textPrimary }]}>No data yet</Text>
          <Text style={[s.emptyBody, { color: textSecondary }]}>
            Vote data will appear here once your competition voting period begins.
          </Text>
        </View>
      </View>
    )
  }

  const recentTallies = tallies.slice(-14)

  return (
    <View style={s.safeArea}>

      {/* ── Nav bar ─────────────────────────────────────────── */}
      <View style={{ flex: 1, backgroundColor: bg }}>
        <View style={[s.navBar, { borderBottomColor: border }]}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={textPrimary} />
          </TouchableOpacity>
          <Text style={[s.navTitle, { color: textPrimary }]}>Performance Analytics</Text>
          <View style={s.backBtn} />
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Hero stat strip ──────────────────────────────── */}
          <View style={s.heroStrip}>
            <View style={[s.heroCard, { backgroundColor: theme.primaryColor }]}>
              <Text style={s.heroLabel}>Total Votes</Text>
              <Text style={s.heroValue}>{totalVotes.toLocaleString()}</Text>
            </View>
            <View style={[s.heroCard, { backgroundColor: surface, borderWidth: 0.5, borderColor: border }]}>
              <Text style={[s.heroLabel, { color: textSecondary }]}>Daily Avg</Text>
              <Text style={[s.heroValue, { color: textPrimary }]}>{avgVotes.toLocaleString()}</Text>
            </View>
            <View style={[s.heroCard, { backgroundColor: surface, borderWidth: 0.5, borderColor: border }]}>
              <Text style={[s.heroLabel, { color: textSecondary }]}>Peak Day</Text>
              <Text style={[s.heroValue, { color: textPrimary }]}>{maxVotes.toLocaleString()}</Text>
            </View>
          </View>

          {/* ── Best day callout ─────────────────────────────── */}
          {bestDay && (
            <View style={[s.callout, { backgroundColor: theme.accentColor, borderColor: theme.primaryColor + '30' }]}>
              <View style={[s.calloutIcon, { backgroundColor: theme.primaryColor + '18' }]}>
                <Ionicons name="trophy-outline" size={20} color={theme.primaryColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.calloutTitle, { color: theme.primaryColor }]}>Best day</Text>
                <Text style={[s.calloutBody, { color: textSecondary }]}>
                  Day {bestDay.dayNumber} — {bestDay.voteCount.toLocaleString()} votes
                </Text>
              </View>
            </View>
          )}

          {/* ── Bar chart ────────────────────────────────────── */}
          <View style={[s.card, { backgroundColor: surface, borderColor: border }]}>
            <View style={s.cardHeader}>
              <Text style={[s.cardTitle, { color: textPrimary }]}>Daily Votes</Text>
              <Text style={[s.cardSub, { color: textSecondary }]}>Last {recentTallies.length} days</Text>
            </View>

            <View style={s.chart}>
              {/* Y-axis labels */}
              <View style={s.yAxis}>
                {[maxVotes, Math.round(maxVotes / 2), 0].map((v, i) => (
                  <Text key={i} style={[s.yLabel, { color: textSecondary }]}>{v}</Text>
                ))}
              </View>

              {/* Bars */}
              <View style={s.barsArea}>
                <View style={s.barsRow}>
                  {recentTallies.map((tally, i) => {
                    const heightPct = tally.voteCount / maxVotes
                    const isLast = i === recentTallies.length - 1
                    return (
                      <View key={i} style={s.barCol}>
                        <View style={s.barTrack}>
                          <View
                            style={[
                              s.barFill,
                              {
                                height: Math.max(4, heightPct * CHART_HEIGHT),
                                backgroundColor: isLast ? theme.primaryColor : theme.primaryColor + 'AA',
                                borderRadius: 4,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[s.barDayLabel, { color: textSecondary }]}>
                          D{tally.dayNumber}
                        </Text>
                      </View>
                    )
                  })}
                </View>
                <View style={[s.chartAxisLine, { backgroundColor: border }]} />
              </View>
            </View>

            {/* Mini trend legend */}
            <View style={[s.trendRow, { borderTopColor: border }]}>
              <Ionicons
                name={totalVotes > avgVotes ? 'trending-up' : 'trending-down'}
                size={14}
                color={totalVotes > avgVotes ? '#3B6D11' : '#A32D2D'}
              />
              <Text style={[s.trendText, { color: textSecondary }]}>
                {totalVotes > avgVotes
                  ? `Above average on ${tallies.filter(t => t.voteCount > avgVotes).length} days`
                  : 'Below average on most days — share your link more!'}
              </Text>
            </View>
          </View>

          {/* ── Voting sources ───────────────────────────────── */}
          <View style={[s.card, { backgroundColor: surface, borderColor: border }]}>
            <View style={s.cardHeader}>
              <Text style={[s.cardTitle, { color: textPrimary }]}>Vote Sources</Text>
              <Text style={[s.cardSub, { color: textSecondary }]}>Where votes came from</Text>
            </View>

            {Object.entries(sources).map(([source, count], idx, arr) => {
              const cfg = SOURCE_CONFIG[source] ?? { icon: 'ellipse-outline', color: textSecondary, label: source }
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
              const isLast = idx === arr.length - 1

              return (
                <View
                  key={source}
                  style={[s.sourceRow, !isLast && { borderBottomWidth: 0.5, borderBottomColor: border }]}
                >
                  <View style={[s.sourceIconBox, { backgroundColor: cfg.color + '15' }]}>
                    <Ionicons name={cfg.icon} size={16} color={cfg.color} />
                  </View>
                  <View style={s.sourceBody}>
                    <View style={s.sourceTopRow}>
                      <Text style={[s.sourceLabel, { color: textPrimary }]}>{cfg.label}</Text>
                      <Text style={[s.sourceCount, { color: textPrimary }]}>
                        {count.toLocaleString()} <Text style={{ color: textSecondary, fontWeight: '400' }}>({pct}%)</Text>
                      </Text>
                    </View>
                    <View style={[s.progressBg, { backgroundColor: border + '60' }]}>
                      <View
                        style={[
                          s.progressFill,
                          { width: `${pct}%`, backgroundColor: cfg.color },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              )
            })}
          </View>

          {/* ── Tip card ─────────────────────────────────────── */}
          <View style={[s.tipCard, { backgroundColor: theme.accentColor, borderColor: theme.primaryColor + '25' }]}>
            <View style={[s.tipIconBox, { backgroundColor: theme.primaryColor + '18' }]}>
              <Ionicons name="bulb-outline" size={22} color={theme.primaryColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.tipTitle, { color: theme.primaryColor }]}>Pro tip</Text>
              <Text style={[s.tipBody, { color: textSecondary }]}>
                Participants who share their vote link on WhatsApp see a 40% higher daily vote conversion.
                Post your link every morning for best results.
              </Text>
            </View>
          </View>

        </ScrollView>
      </View>
    </View>
  )
}

function makeStyles(
  theme: any, bg: string, surface: string,
  textPrimary: string, textSecondary: string, border: string, pad: number,
  insets: any,
) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: bg },
    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 48 },

    // Nav
    navBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: insets.top + 12,
      paddingBottom: 12,
      borderBottomWidth: 0.5,
      backgroundColor: bg,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
    },
    navTitle: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },

    // Loading / empty
    loadingText: { marginTop: 12, fontSize: 13 },
    emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 6 },
    emptyBody: { fontSize: 13, textAlign: 'center', lineHeight: 20 },

    // Hero strip
    heroStrip: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    heroCard: {
      flex: 1, borderRadius: 14, padding: 14,
      alignItems: 'center', gap: 4,
    },
    heroLabel: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 0.5 },
    heroValue: { fontSize: 20, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },

    // Callout
    callout: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      borderRadius: 14, borderWidth: 1,
      padding: 14, marginBottom: 12,
    },
    calloutIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    calloutTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    calloutBody: { fontSize: 13, marginTop: 1 },

    // Card
    card: {
      borderRadius: 18, borderWidth: 0.5,
      padding: 18, marginBottom: 12,
      overflow: 'hidden',
    },
    cardHeader: {
      flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
      marginBottom: 20,
    },
    cardTitle: { fontSize: 15, fontWeight: '600' },
    cardSub: { fontSize: 12 },

    // Chart
    chart: { flexDirection: 'row', gap: 8 },
    yAxis: { justifyContent: 'space-between', paddingBottom: 20, height: CHART_HEIGHT + 20, width: 32 },
    yLabel: { fontSize: 9, textAlign: 'right' },
    barsArea: { flex: 1 },
    barsRow: {
      flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
      height: CHART_HEIGHT, marginBottom: 4,
    },
    barCol: { flex: 1, alignItems: 'center', gap: 4 },
    barTrack: { flex: 1, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
    barFill: { width: '65%', minHeight: 4 },
    barDayLabel: { fontSize: 8, marginTop: 4 },
    chartAxisLine: { height: 0.5, width: '100%' },

    trendRow: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      marginTop: 14, paddingTop: 12, borderTopWidth: 0.5,
    },
    trendText: { fontSize: 12, flex: 1 },

    // Sources
    sourceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
    sourceIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    sourceBody: { flex: 1, gap: 6 },
    sourceTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sourceLabel: { fontSize: 13, fontWeight: '500' },
    sourceCount: { fontSize: 12, fontWeight: '600' },
    progressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },

    // Tip
    tipCard: {
      flexDirection: 'row', gap: 12,
      borderRadius: 16, borderWidth: 1, padding: 16,
      alignItems: 'flex-start',
    },
    tipIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    tipTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    tipBody: { fontSize: 13, lineHeight: 19 },
  })
}