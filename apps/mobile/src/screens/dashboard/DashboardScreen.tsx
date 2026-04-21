// apps/mobile/src/screens/dashboard/DashboardScreen.tsx

import React, { useEffect, useState, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Image, ActivityIndicator,
  Dimensions, StatusBar
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import * as Clipboard from 'expo-clipboard'
import * as Sharing from 'expo-sharing'
import { useTheme } from '../../context/ThemeContext'
import { participantsApi, arenaApi } from '../../utils/api'
import { io } from 'socket.io-client'
import { useRouter } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import QRCode from 'react-native-qrcode-svg'
import ViewShot, { captureRef } from 'react-native-view-shot'
import SponsorTicker from '../../components/SponsorTicker'
import { LinearGradient } from 'expo-linear-gradient'

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000'
const { width, height } = Dimensions.get('window')

// ─────────────────────────────────────────────────────────────
// Design Tokens  (light mode, TikTok energy)
// ─────────────────────────────────────────────────────────────
const C = {
  bg: '#F5F5F7',
  white: '#FFFFFF',
  ink: '#0A0A0B',
  inkMid: '#3D3D3F',
  inkLight: '#8E8E93',
  accent: '#FE2C55',       // FameAfrica red-pink
  accentSoft: '#FFF0F3',
  gold: '#F59E0B',
  green: '#10B981',
  blue: '#3B82F6',
  border: '#E5E5EA',
}

// ─────────────────────────────────────────────────────────────
// Reusable Sub-components
// ─────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[{
      backgroundColor: C.white,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
      padding: 18,
    }, style]}>
      {children}
    </View>
  )
}

function ActionButton({ icon, label, color, onPress }: { icon: any; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: color,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
      }}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={18} color="#fff" />
      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{label}</Text>
    </TouchableOpacity>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { theme } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const viewShotRef = useRef<any>(null)

  const [liveVotes, setLiveVotes] = useState<number | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => participantsApi.getDashboard(),
  })

  const { data: analyticsRes } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => participantsApi.getAnalytics(),
  })

  const dashboard = data?.data?.data
  const tallies = analyticsRes?.data?.data?.tallies || []

  const { data: arenaRes } = useQuery({
    queryKey: ['arena-events', dashboard?.cycle?.id],
    queryFn: () => arenaApi.listEvents(dashboard.cycle.id),
    enabled: !!dashboard?.cycle?.id,
    refetchInterval: 60000,
  })

  const liveArena = arenaRes?.data?.data?.find((e: any) => e.status === 'LIVE')

  useEffect(() => {
    if (!dashboard?.participant?.id) return
    async function connect() {
      const token = await SecureStore.getItemAsync('accessToken')
      const socket = io(API_URL, { auth: { token } })
      socket.emit('participant:join', dashboard.participant.id)
      socket.on('vote:received', (evt: any) => {
        if (evt.participantId === dashboard.participant.id) setLiveVotes(evt.todayCount)
      })
      return () => socket.disconnect()
    }
    connect()
  }, [dashboard?.participant?.id])

  // ── Loading ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={{ color: C.inkMid, fontSize: 14, fontWeight: '600', marginTop: 14 }}>
          Loading your profile...
        </Text>
      </View>
    )
  }

  // ── Empty / not registered ─────────────────────────────────
  if (!dashboard) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="dark-content" />
        <TouchableOpacity
          onPress={() => router.back()}
          style={[s.floatBack, { top: insets.top + 12 }]}
        >
          <Ionicons name="arrow-back" size={22} color={C.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View style={s.emptyIcon}>
            <Ionicons name="trophy" size={56} color={C.gold} />
          </View>
          <Text style={s.emptyTitle}>Join the Arena</Text>
          <Text style={s.emptySub}>
            Register to claim your contestant profile and start mobilizing fans across Africa.
          </Text>
          <TouchableOpacity onPress={() => router.push('/participants/register')} style={s.emptyBtn} activeOpacity={0.85}>
            <LinearGradient colors={[C.accent, '#FF5F7E']} style={s.emptyBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.emptyBtnText}>Register Now</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const { participant, cycle, todayVotes, currentRank, activeParticipants, voteLink } = dashboard
  const displayTodayVotes = liveVotes !== null ? liveVotes : (todayVotes || 0)
  const maxBar = Math.max(...tallies.map((t: any) => t.voteCount), 1)

  const shareQRCard = async () => {
    try {
      setCapturing(true)
      const uri = await captureRef(viewShotRef, { format: 'png', quality: 1 })
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share Contestant Pass', UTI: 'public.png' })
    } catch {
      Alert.alert('Error', 'Could not generate your Pass image. Please try again.')
    } finally {
      setCapturing(false)
    }
  }

  const copyLink = async () => {
    await Clipboard.setStringAsync(voteLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2500)
  }

  const HERO_H = height * 0.60   // avatar hero takes ~50% of screen height

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* ══════════════════════════════════════════════════
            HERO  —  Full-bleed avatar (TikTok profile)
        ══════════════════════════════════════════════════ */}
        <View style={{ height: HERO_H, width }}>

          {/* Full-bleed cover image */}
          {participant.campaignCardUrl ? (
            <Image
              source={{ uri: participant.campaignCardUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={['#1C1C1E', '#2C2C2E', '#3A3A3C']}
              style={StyleSheet.absoluteFill}
            />
          )}

          {/* Dark vignette at the bottom so text is always legible */}
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']}
            locations={[0, 0.3, 0.65, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* ── Top nav: back  |  brand  |  edit ── */}
          <View style={[s.heroNav, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => router.back()} style={s.navPill} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* ── Profile info pinned to bottom of hero ── */}
          <View style={s.heroBottom}>
            {/* Category chip */}
            <View style={s.catChip}>
              <Text style={s.catChipText}>{participant.category?.toUpperCase()}</Text>
            </View>

            {/* Name — large, bold */}
            <Text style={s.heroName}>{participant.displayName}</Text>

            {/* Location */}
            <View style={s.heroLocRow}>
              <Ionicons name="location-sharp" size={12} color="rgba(255,255,255,0.55)" />
              <Text style={s.heroLocText}>
                {[participant.city, participant.state].filter(Boolean).join(', ') || 'Nigeria'}
              </Text>
            </View>

            {/* ── TikTok-style stats strip ── */}
            <View style={s.heroStatsStrip}>
              <View style={s.heroStatCol}>
                <Text style={s.heroStatNum}>{(participant.totalVotes || 0).toLocaleString()}</Text>
                <Text style={s.heroStatLabel}>Votes</Text>
              </View>
              <View style={s.heroStatSep} />
              <View style={s.heroStatCol}>
                <Text style={[s.heroStatNum, { color: C.gold }]}>#{currentRank}</Text>
                <Text style={s.heroStatLabel}>Rank</Text>
              </View>
              <View style={s.heroStatSep} />
              <View style={s.heroStatCol}>
                <Text style={s.heroStatNum}>{(participant.stanCount || 0).toLocaleString()}</Text>
                <Text style={s.heroStatLabel}>Stans</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════
            BODY CONTENT
        ══════════════════════════════════════════════════ */}
        <View style={s.body}>

          {/* Bio */}
          {participant.bio ? (
            <Text style={s.bio} numberOfLines={3}>{participant.bio}</Text>
          ) : (
            <TouchableOpacity onPress={() => router.push('/participants/edit-profile')} style={s.bioCta}>
              <Ionicons name="add-circle-outline" size={16} color={C.accent} />
              <Text style={s.bioCtaText}>Add a bio to attract more voters</Text>
            </TouchableOpacity>
          )}


          {/* ── Top nav: back  |  brand  |  edit ── */}
          <View style={[s.heroNavSection,]}>
            <ActionButton
              icon="videocam"
              label="Go Live (Stream)"
              color="#FE2C55"
              onPress={() => router.push('/streaming/host')}
            />

            <ActionButton
              icon="time"
              label="Stream History"
              color="rgba(0,0,0,0.5)"
              onPress={() => router.push('/streaming/history')}
            />



            <TouchableOpacity
              onPress={() => router.push('/participants/edit-profile')}
              style={s.navPill}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* ── Live Arena Banner ──────────────────────── */}
          {liveArena && (
            <TouchableOpacity
              onPress={() => router.push(`/arena/${liveArena.id}`)}
              style={s.arenaBanner}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={[C.accent, '#FF5F7E']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.arenaBannerInner}
              >
                <View style={s.arenaPulse} />
                <View style={{ flex: 1 }}>
                  <Text style={s.arenaBannerEye}>LIVE ARENA IN PROGRESS</Text>
                  <Text style={s.arenaBannerTitle} numberOfLines={1}>{liveArena.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* ── Today's Votes ──────────────────────────── */}
          <Text style={s.sectionTitle}>Today's Performance</Text>
          <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
            {/* Accent top stripe */}
            <LinearGradient colors={[C.accent, '#FF5F7E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 4 }} />
            <View style={s.todayBody}>
              {/* Big vote number */}
              <View style={s.todayLeft}>
                <View style={s.liveChip}>
                  <View style={s.arenaPulse} />
                  <Text style={s.liveChipText}>LIVE COUNT</Text>
                </View>
                <Text style={s.todayNum}>{displayTodayVotes.toLocaleString()}</Text>
                <Text style={s.todayNumSub}>votes today</Text>
              </View>

              {/* Vertical rule */}
              <View style={s.todaySep} />

              {/* Right-side secondary stats */}
              <View style={s.todayRight}>
                {[
                  { label: 'All-time votes', value: (participant.totalVotes || 0).toLocaleString(), color: C.ink },
                  { label: 'Current rank', value: `#${currentRank}`, color: C.gold },
                  { label: 'Competitors', value: (activeParticipants || 0).toLocaleString(), color: C.ink },
                ].map((stat, i) => (
                  <View key={i} style={s.todayRStat}>
                    <Text style={[s.todayRNum, { color: stat.color }]}>{stat.value}</Text>
                    <Text style={s.todayRLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>

          {/* ── Arena Performance ──────────────────────── */}
          <View style={s.arenaStatRow}>
            {[
              { icon: 'trophy', color: C.gold, bg: '#FFFBEB', value: participant.arenaWins || 0, label: 'Arena Wins' },
              {
                icon: 'warning', color: participant.arenaStrikes > 0 ? '#EF4444' : C.green,
                bg: participant.arenaStrikes > 0 ? '#FEF2F2' : '#F0FDF4',
                value: `${participant.arenaStrikes || 0}/3`, label: 'Strikes'
              },
              { icon: 'people', color: C.blue, bg: '#EFF6FF', value: activeParticipants || '—', label: 'In Arena' },
            ].map((item, i) => (
              <Card key={i} style={[s.arenaCard, i < 2 ? { marginRight: 10 } : {}]}>
                <View style={[s.arenaIconCircle, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                </View>
                <Text style={[s.arenaNum, { color: item.color }]}>{item.value}</Text>
                <Text style={s.arenaLabel}>{item.label}</Text>
              </Card>
            ))}
          </View>

          {/* ── Vote Trend ─────────────────────────────── */}
          {tallies.length > 0 && (
            <>
              <Text style={s.sectionTitle}>7-Day Vote Trend</Text>
              <Card style={{ marginBottom: 24 }}>
                <View style={s.chartBars}>
                  {tallies.slice(-7).map((t: any, i: number, arr: any[]) => {
                    const pct = (t.voteCount / maxBar) * 100
                    const isToday = i === arr.length - 1
                    return (
                      <View key={i} style={s.barCol}>
                        {t.voteCount > 0 && <Text style={s.barCount}>{t.voteCount}</Text>}
                        <View style={s.barTrack}>
                          <LinearGradient
                            colors={isToday ? [C.accent, '#FF8FA3'] : ['#D1D5DB', '#E5E7EB']}
                            style={[s.barFill, { height: `${Math.max(pct, 6)}%` }]}
                          />
                        </View>
                        <Text style={s.barLabel}>
                          {new Date(t.date).toLocaleDateString('en', { weekday: 'short' }).slice(0, 3)}
                        </Text>
                      </View>
                    )
                  })}
                </View>
              </Card>
            </>
          )}

          {/* ── Sponsors ───────────────────────────────── */}
          <SponsorTicker cycleId={participant.cycleId} />

          {/* ── Contestant Pass ────────────────────────── */}
          <Text style={s.sectionTitle}>Official Contestant Pass</Text>
          <Text style={s.sectionSub}>
            Share this card anywhere — scanning the QR takes fans straight to your vote page.
          </Text>

          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
            <View style={s.passCard}>
              {/* Dark header stripe */}
              <LinearGradient colors={[C.ink, '#1C1C2E']} style={s.passHeader}>
                <Text style={s.passHeaderBrand}>FAME AFRICA</Text>
                <View style={s.passStatusPill}>
                  <View style={[s.arenaPulse, { backgroundColor: C.green, width: 6, height: 6 }]} />
                  <Text style={[s.passStatusText, { color: C.green }]}>
                    {cycle?.status?.replace(/_/g, ' ') || 'ACTIVE'}
                  </Text>
                </View>
              </LinearGradient>

              {/* White body */}
              <View style={s.passBody}>
                {/* Left: avatar + name */}
                <View style={s.passLeft}>
                  {participant.campaignCardUrl ? (
                    <Image source={{ uri: participant.campaignCardUrl }} style={s.passAvatar} resizeMode="cover" />
                  ) : (
                    <LinearGradient colors={[C.accent, '#FF8FA3']} style={[s.passAvatar, { justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="person" size={36} color="#fff" />
                    </LinearGradient>
                  )}
                  <Text style={s.passName} numberOfLines={2}>{participant.displayName}</Text>
                  <View style={s.passCatPill}>
                    <Text style={s.passCatText}>{participant.category}</Text>
                  </View>
                  {/* <Text style={[s.passRankText, { color: C.gold }]}>Rank #{currentRank}</Text> */}
                </View>

                {/* Dashed divider */}
                <View style={s.passDivider} />

                {/* Right: QR + meta */}
                <View style={s.passRight}>
                  <View style={s.qrWrap}>
                    <QRCode value={voteLink} size={width * 0.33} color={C.ink} backgroundColor="#fff" />
                  </View>
                  <Text style={s.qrScanLabel}>SCAN TO VOTE</Text>
                  {/* <View style={{ marginTop: 10, gap: 6, width: '100%' }}>
                    {[
                      { k: 'ID', v: participant.voteLinkSlug },
                      { k: 'VOTES', v: (participant.totalVotes || 0).toLocaleString() },
                    ].map(({ k, v }) => (
                      <View key={k} style={s.passMeta}>
                        <Text style={s.passMetaKey}>{k}</Text>
                        <Text style={s.passMetaVal} numberOfLines={1}>{v}</Text>
                      </View>
                    ))}
                  </View> */}
                </View>
              </View>

              {/* Ticket tear perforation */}
              <View style={s.tearLine}>
                <View style={s.tearHole} />
                {Array.from({ length: 22 }).map((_, i) => <View key={i} style={s.tearDot} />)}
                <View style={[s.tearHole, { right: -10, left: undefined }]} />
              </View>

              {/* Footer */}
              <View style={s.passFooter}>
                <Text style={s.passFooterText}>
                  {cycle?.cycleName || 'Active Cycle'} · {(participant.totalVotes || 0).toLocaleString()} total votes
                </Text>
              </View>
            </View>
          </ViewShot>

          <TouchableOpacity onPress={shareQRCard} disabled={capturing} activeOpacity={0.85} style={{ marginTop: 14, marginBottom: 28 }}>
            <LinearGradient colors={[C.ink, '#333']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.shareBtn}>
              {capturing
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                  <Ionicons name="share-social" size={20} color="#fff" />
                  <Text style={s.shareBtnText}>Share Contestant Pass</Text>
                </>
              }
            </LinearGradient>
          </TouchableOpacity>

          {/* ── Mobilization Link ──────────────────────── */}
          <Text style={s.sectionTitle}>Your Mobilization Link</Text>
          <Text style={s.sectionSub}>
            Send this to friends, share on WhatsApp Status, Instagram Stories — every click is a potential vote.
          </Text>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <View style={s.linkRow}>
              <Ionicons name="link-outline" size={16} color={C.inkLight} />
              <Text style={s.linkText} numberOfLines={1}>{voteLink}</Text>
            </View>
            <TouchableOpacity
              onPress={copyLink}
              style={[s.copyRow, { backgroundColor: linkCopied ? '#ECFDF5' : C.accentSoft }]}
              activeOpacity={0.8}
            >
              <Ionicons name={linkCopied ? 'checkmark-circle' : 'copy-outline'} size={18} color={linkCopied ? C.green : C.accent} />
              <Text style={[s.copyText, { color: linkCopied ? C.green : C.accent }]}>
                {linkCopied ? 'Copied to clipboard!' : 'Tap to copy link'}
              </Text>
            </TouchableOpacity>
          </Card>

        </View>
      </ScrollView>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Empty state
  floatBack: {
    position: 'absolute', zIndex: 100, left: 20,
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: C.white, borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  emptyIcon: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#FFFBEB', borderWidth: 2, borderColor: '#FDE68A',
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  emptyTitle: { fontSize: 28, fontWeight: '900', color: C.ink, marginBottom: 10, letterSpacing: -0.5 },
  emptySub: { fontSize: 15, color: C.inkMid, textAlign: 'center', lineHeight: 23, marginBottom: 32 },
  emptyBtn: { width: '100%', borderRadius: 30, overflow: 'hidden' },
  emptyBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  emptyBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Hero nav
  heroNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
  },
  heroNavSection: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  navPill: {
    width: 42, height: 38, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  brandPill: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  brandPillText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 2.5 },

  // Hero bottom
  heroBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 22 },
  catChip: {
    alignSelf: 'flex-start', backgroundColor: C.accent,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8,
  },
  catChipText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  heroName: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -0.8, lineHeight: 36, marginBottom: 5 },
  heroLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  heroLocText: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '500' },

  // TikTok stats strip
  heroStatsStrip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 18, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  heroStatCol: { flex: 1, alignItems: 'center' },
  heroStatNum: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  heroStatLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },
  heroStatSep: { width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Body
  body: { paddingHorizontal: 16, paddingTop: 20 },
  bio: { fontSize: 14, color: C.inkMid, lineHeight: 21, marginBottom: 16 },
  bioCta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  bioCtaText: { color: C.accent, fontSize: 14, fontWeight: '600' },

  // Arena banner
  arenaBanner: { borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  arenaBannerInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  arenaPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent },
  arenaBannerEye: { color: 'rgba(255,255,255,0.65)', fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  arenaBannerTitle: { color: '#fff', fontSize: 14, fontWeight: '800', marginTop: 2 },

  // Section labels
  sectionTitle: { fontSize: 17, fontWeight: '800', color: C.ink, marginBottom: 5, marginTop: 8, letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, color: C.inkLight, lineHeight: 18, marginBottom: 14 },

  // Today card
  todayBody: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  todayLeft: { flex: 1.1 },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.accentSoft, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8,
  },
  liveChipText: { color: C.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  todayNum: { fontSize: 54, fontWeight: '900', color: C.ink, letterSpacing: -2, lineHeight: 60 },
  todayNumSub: { color: C.inkLight, fontSize: 12, fontWeight: '600', marginTop: 2 },
  todaySep: { width: 1, height: 80, backgroundColor: C.border, marginHorizontal: 20 },
  todayRight: { flex: 1, gap: 10 },
  todayRStat: {},
  todayRNum: { fontSize: 18, fontWeight: '900', color: C.ink, letterSpacing: -0.3 },
  todayRLabel: { color: C.inkLight, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 },

  // Arena stat row
  arenaStatRow: { flexDirection: 'row', marginBottom: 24 },
  arenaCard: { flex: 1, alignItems: 'center', padding: 16 },
  arenaIconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  arenaNum: { fontSize: 22, fontWeight: '900', color: C.ink, marginBottom: 3 },
  arenaLabel: { fontSize: 10, color: C.inkLight, fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' },

  // Chart
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 7 },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barCount: { color: C.inkLight, fontSize: 8, fontWeight: '700', marginBottom: 2 },
  barTrack: { flex: 1, width: '100%', borderRadius: 6, backgroundColor: '#F1F5F9', overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { color: C.inkLight, fontSize: 9, fontWeight: '700', marginTop: 4, textTransform: 'uppercase' },

  // Pass card
  passCard: {
    backgroundColor: C.white, borderRadius: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 6,
  },
  passHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 16 },
  passHeaderBrand: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 3 },
  passStatusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  passStatusText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  passBody: { flexDirection: 'row', padding: 20, alignItems: 'flex-start' },
  passLeft: { flex: 0.85, alignItems: 'center', paddingRight: 14 },
  passAvatar: { width: 100, height: 100, borderRadius: 20, marginBottom: 10, borderWidth: 2, borderColor: C.border },
  passName: { fontSize: 14, fontWeight: '800', color: C.ink, textAlign: 'center', marginBottom: 7, lineHeight: 18 },
  passCatPill: { backgroundColor: C.accentSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 7 },
  passCatText: { color: C.accent, fontSize: 10, fontWeight: '800' },
  passRankText: { fontSize: 13, fontWeight: '800' },
  passDivider: {
    width: 1, alignSelf: 'stretch',
    borderLeftWidth: 1, borderLeftColor: C.border, borderStyle: 'dashed', marginRight: 14,
  },
  passRight: { flex: 1, alignItems: 'center' },
  qrWrap: { padding: 8, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: C.border, marginBottom: 6 },
  qrScanLabel: { color: C.inkLight, fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  passMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  passMetaKey: { color: C.inkLight, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  passMetaVal: { color: C.ink, fontSize: 12, fontWeight: '800', flex: 1, textAlign: 'right' },
  tearLine: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, height: 20 },
  tearHole: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.bg, position: 'absolute', left: -10, zIndex: 2 },
  tearDot: { flex: 1, height: 1.5, backgroundColor: C.border, marginHorizontal: 1 },
  passFooter: { paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' },
  passFooterText: { color: C.inkLight, fontSize: 11, fontWeight: '600' },

  // Share
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 28, paddingVertical: 18 },
  shareBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Link
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  linkText: { flex: 1, color: C.inkMid, fontSize: 13 },
  copyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  copyText: { fontSize: 14, fontWeight: '700' },
})