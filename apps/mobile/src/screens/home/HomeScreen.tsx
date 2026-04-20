// apps/mobile/src/screens/home/HomeScreen.tsx

import React, { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator, Dimensions
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useTheme } from '../../context/ThemeContext'
import { competitionsApi, eliminationsApi, sponsorsApi } from '../../utils/api'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../context/AuthContext'
import { streamingApi } from '../../utils/api'
import LiveStreamCard from '../../components/LiveStreamCard'

const { width } = Dimensions.get('window')

export default function HomeScreen() {
  const { theme, updateTheme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const { user } = useAuth()
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  const { data: cycleRes, refetch: refetchCycle } = useQuery({
    queryKey: ['currentCycle'],
    queryFn: () => competitionsApi.getCurrent(),
  })

  const { data: eliminationsRes, refetch: refetchElims } = useQuery({
    queryKey: ['eliminations'],
    queryFn: () => eliminationsApi.getCurrentCycle(),
  })

  const { data: adRes } = useQuery({
    queryKey: ['nextAd'],
    queryFn: () => sponsorsApi.getNextAd(),
  })

  const { data: liveRes, refetch: refetchLive } = useQuery({
    queryKey: ['liveStreams'],
    queryFn: () => streamingApi.listLive(),
    refetchInterval: 30000, // Poll every 30s
  })

  // const cycle = cycleRes?.data?.data
  // const cycle = cycleRes?.data?.data
  // console.log("📦 API RESPONSE:", {
  //   success: cycle?.data?.success,
  //   message: cycle?.data?.message,
  //   data: cycle?.data?.data,
  //   status: cycle?.status,
  // });


  // After — correct
  const cycle = cycleRes?.data?.data  // this IS correct: axios .data → API wrapper .data
  console.log("📦 cycle:", cycle)     // just log cycle directly


  const eliminations = eliminationsRes?.data?.data || []
  const ad = adRes?.data?.data

  async function onRefresh() {
    setRefreshing(true)
    await Promise.all([refetchCycle(), refetchElims(), refetchLive()])
    setRefreshing(false)
  }

  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Dynamic Header */}
      <View style={s.topHeader}>
        <View>
          <Text style={s.greeting}>{getGreeting()}{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ','}</Text>
          <Text style={s.brand}>FameAfrica</Text>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity
            style={s.topBtn}
            onPress={() => updateTheme({ darkMode: !theme.darkMode })}
          >
            <Ionicons name={theme.darkMode ? "sunny-outline" : "moon-outline"} size={22} color={textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.topBtn}
            onPress={() => router.push('/(tabs)/notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color={textPrimary} />
            <View style={s.notiBadge} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primaryColor} />}
      >
        
        {/* Live Now Carousel */}
        {liveRes?.data?.data?.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <View style={s.livePulse} />
              <Text style={s.sectionTitle}>LIVE NOW</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={width * 0.4 + 12}>
              {liveRes.data.data.map((stream: any) => (
                <LiveStreamCard key={stream.id} stream={stream} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Cycle hero card */}
        {cycle ? (
          <View style={s.heroCard}>
            <Text style={s.heroSub}>{cycle.cycleName}</Text>
            <Text style={s.heroTitle}>
              {cycle.status === 'VOTING_OPEN' ? 'Voting is live' :
                cycle.status === 'REGISTRATION_OPEN' ? 'Registration open' :
                  cycle.status === 'DRAFT' ? 'Coming soon (Draft)' :
                    cycle.status === 'COMPLETED' ? 'Competition ended' :
                      cycle.status === 'CANCELLED' ? 'Competition cancelled' :
                        cycle.status}
            </Text>

            {cycle.status === 'DRAFT' && (
              <View style={s.draftBanner}>
                <Ionicons name="time-outline" size={13} color="#92400E" />
                <Text style={s.draftBannerText}>
                  This competition is not open yet. Check back soon!
                </Text>
              </View>
            )}

            <View style={s.heroTags}>
              <View style={[s.tag, cycle.status === 'DRAFT' && s.tagMuted]}>
                <Text style={s.tagText}>
                  {cycle.status === 'VOTING_OPEN' ? 'Vote now' :
                    cycle.status === 'REGISTRATION_OPEN' ? 'Register' :
                      cycle.status === 'DRAFT' ? 'Not open' :
                        cycle.status}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[s.heroBtn, cycle.status === 'DRAFT' && s.heroBtnDisabled]}
              disabled={cycle.status === 'DRAFT'}
              onPress={() => {
                if (cycle.status === 'DRAFT') return
                router.push(
                  cycle.status === 'VOTING_OPEN'
                    ? '/(tabs)/participants'
                    : '/participants/register'
                )
              }}
            >
              <Text style={[
                s.heroBtnText,
                { color: cycle.status === 'DRAFT' ? '#9CA3AF' : theme.primaryColor }
              ]}>
                {cycle.status === 'VOTING_OPEN' ? 'Vote for someone' :
                  cycle.status === 'REGISTRATION_OPEN' ? 'Enter competition' :
                    cycle.status === 'DRAFT' ? 'Registration not open' :
                      'View competition'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[s.heroCard, { alignItems: 'center', justifyContent: 'center' }]}>
            <ActivityIndicator color={theme.textOnPrimary} />
          </View>
        )}

        {/* Sponsor banner */}
        {ad && (
          <View style={s.adBanner}>
            <View style={s.adLabel}><Text style={s.adLabelText}>AD</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.adName}>{ad.companyName}</Text>
              {ad.prizeDescription && (
                <Text style={s.adDesc} numberOfLines={1}>{ad.prizeDescription}</Text>
              )}
            </View>
          </View>
        )}

        {/* Quick Links */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <TouchableOpacity style={[s.card, { flex: 1, alignItems: 'center', marginBottom: 0 }]} onPress={() => router.push('/how-it-works')}>
            <Ionicons name="information-circle-outline" size={24} color={theme.primaryColor} />
            <Text style={{ fontSize: 13, fontWeight: '600', marginTop: 8, color: textPrimary }}>How it works</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.card, { flex: 1, alignItems: 'center', marginBottom: 0 }]} onPress={() => router.push('/winners')}>
            <Ionicons name="trophy-outline" size={24} color="#D4AF37" />
            <Text style={{ fontSize: 13, fontWeight: '600', marginTop: 8, color: textPrimary }}>Past Winners</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <TouchableOpacity style={[s.card, { flex: 1, alignItems: 'center', marginBottom: 0 }]} onPress={() => router.push('/about/faq' as any)}>
            <Ionicons name="help-circle-outline" size={24} color="#15803D" />
            <Text style={{ fontSize: 13, fontWeight: '600', marginTop: 8, color: textPrimary }}>Help & FAQ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.card, { flex: 1, alignItems: 'center', marginBottom: 0 }]} onPress={() => router.push('/about')}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#0369A1" />
            <Text style={{ fontSize: 13, fontWeight: '600', marginTop: 8, color: textPrimary }}>Arena Rules</Text>
          </TouchableOpacity>
        </View>

        {/* Recent eliminations */}
        <Text style={s.sectionTitle}>Recent eliminations</Text>
        {eliminations.length === 0 ? (
          <View style={[s.card, { alignItems: 'center', padding: 24 }]}>
            <Text style={{ color: textSecondary, fontSize: 13 }}>No eliminations yet</Text>
          </View>
        ) : (
          eliminations.slice(0, 5).map((elim: any) => (
            <View key={elim.id} style={s.elimRow}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>
                  {elim.participant.displayName.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.elimName}>{elim.participant.displayName}</Text>
                <Text style={s.elimSub}>Day {elim.dayNumber} · {elim.votesOnDay} votes</Text>
              </View>
              <View style={s.outPill}><Text style={s.outPillText}>out</Text></View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

function makeStyles(theme: any, bg: string, surface: string, textPrimary: string, textSecondary: string, border: string, pad: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    content: { padding: 16, paddingBottom: 32 },
    heroCard: {
      backgroundColor: theme.headerColor,
      borderRadius: theme.borderRadius,
      padding: pad + 4,
      marginBottom: 12,
    },
    heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4 },
    heroTitle: { color: '#fff', fontSize: 20, fontWeight: '500', marginBottom: 10 },
    heroTags: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    tag: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
    tagText: { color: '#fff', fontSize: 11 },
    heroBtn: {
      backgroundColor: '#fff',
      borderRadius: theme.borderRadius,
      paddingVertical: 10,
      alignItems: 'center',
    },
    heroBtnText: { fontSize: 13, fontWeight: '500' },
    adBanner: {
      backgroundColor: theme.accentColor,
      borderRadius: theme.borderRadius,
      borderWidth: 0.5,
      borderColor: theme.primaryColor + '40',
      padding: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
    },
    adLabel: {
      borderWidth: 0.5,
      borderColor: theme.primaryColor,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    adLabelText: { color: theme.primaryColor, fontSize: 10, fontWeight: '500' },
    adName: { color: theme.primaryColor, fontSize: 12, fontWeight: '500' },
    adDesc: { color: textSecondary, fontSize: 11 },
    sectionTitle: { fontSize: 13, fontWeight: '500', color: textPrimary, marginBottom: 8 },
    card: {
      backgroundColor: surface,
      borderRadius: theme.borderRadius,
      borderWidth: 0.5,
      borderColor: border,
      padding: pad,
      marginBottom: 8,
    },
    livePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FE2C55' },
    elimRow: {
      backgroundColor: surface,
      borderRadius: theme.borderRadius,
      borderWidth: 0.5,
      borderColor: border,
      padding: pad,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.accentColor,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: theme.primaryColor, fontSize: 12, fontWeight: '500' },
    elimName: { color: textPrimary, fontSize: 13, fontWeight: '500' },
    elimSub: { color: textSecondary, fontSize: 11, marginTop: 1 },
    outPill: {
      backgroundColor: '#FCEBEB',
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    outPillText: { color: '#A32D2D', fontSize: 10, fontWeight: '500' },
    topHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
      backgroundColor: surface,
    },
    brand: { fontSize: 22, fontWeight: '700', color: theme.primaryColor },
    greeting: { fontSize: 12, color: textSecondary },
    headerActions: { flexDirection: 'row', gap: 10 },
    topBtn: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: border + '20',
    },
    notiBadge: {
      position: 'absolute', top: 10, right: 10,
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: '#D85A30', borderWidth: 2, borderColor: surface,
    },

    draftBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#FEF3C7',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 7,
      marginBottom: 12,
    },
    draftBannerText: {
      color: '#92400E',
      fontSize: 11,
      flexShrink: 1,
    },
    heroBtnDisabled: {
      backgroundColor: '#F3F4F6',
    },
    tagMuted: {
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
  })
}
