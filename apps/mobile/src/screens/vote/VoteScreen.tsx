// apps/mobile/src/screens/vote/VoteScreen.tsx

import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from '../../context/ThemeContext'
import { participantsApi, votingApi, sponsorsApi, stansApi } from '../../utils/api'
import VideoPlayer from '../../components/VideoPlayer'
import { Ionicons } from '@expo/vector-icons'
import SponsorTicker from '../../components/SponsorTicker'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'

const { width } = Dimensions.get('window')

type Step = 'form' | 'otp' | 'success'

export default function VoteScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [step, setStep] = useState<Step>('form')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ── Data Fetching ───────────────────────────────────────────
  const { data: pRes, isLoading: participantLoading } = useQuery({
    queryKey: ['participant', slug],
    queryFn: () => participantsApi.getBySlug(slug),
    enabled: !!slug && slug !== 'undefined',
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  })

  const { data: fansRes } = useQuery({
    queryKey: ['participant-fans', slug],
    queryFn: () => participantsApi.getTopFans(slug),
    enabled: !!slug
  })

  const participant = pRes?.data?.data
  const fans = fansRes?.data?.data ?? []
  const ad = adRes?.data?.data
  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad)

  // ── Mutations ───────────────────────────────────────────────
  const stanMutation = useMutation({
    mutationFn: ({ id, isStanning }: { id: string, isStanning: boolean }) =>
      isStanning ? stansApi.unstan(id) : stansApi.stan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participant', slug] })
    }
  })

  async function handleSendOtp() {
    if (!phone.trim() || !email.trim()) {
      setError('Please enter your phone number and email')
      return
    }
    setError('')
    setLoading(true)
    try {
      await votingApi.sendOtp({ participantSlug: slug, voterPhone: phone, voterEmail: email })
      setStep('otp')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCastVote() {
    if (otp.length < 6) { setError('Please enter the 6-digit OTP'); return }
    setError('')
    setLoading(true)
    try {
      await votingApi.castVote({
        participantSlug: slug, voterPhone: phone,
        voterEmail: email, otpCode: otp, source: 'app',
      })
      setStep('success')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (participantLoading || !participant) {
    return (
      <View style={s.loaderFull}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
        <Text style={s.loaderText}>Summoning the spotlight...</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={s.container}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Cinematic Hero ───────────────────────────────────── */}
        <View style={s.heroContainer}>
          <Image
            source={{ uri: participant.photoUrl }}
            style={s.heroBg}
            contentFit="cover"
            transition={500}
            cachePolicy="memory-disk"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)', '#000']}
            style={s.heroGradient}
          />

          <TouchableOpacity style={s.backIcon} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>

          <View style={s.heroContent}>
            <View style={s.heroAvatarFrame}>
              <Image
                source={{ uri: participant.photoUrl }}
                style={s.avatarImg}
                cachePolicy="memory-disk"
              />
            </View>
            <Text style={s.heroName}>{participant.displayName}</Text>

            <View style={s.metaRow}>
              {participant.category && (
                <View style={s.categoryTag}>
                  <Text style={s.categoryTagText}>{participant.category}</Text>
                </View>
              )}
              <View style={s.stanBadge}>
                <Ionicons name="heart" size={14} color="#FF4081" />
                <Text style={s.stanText}>{participant.stanCount || 0} stans</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[s.stanActionBtn, participant.isStanning && s.stanActionActive]}
              onPress={() => stanMutation.mutate({ id: participant.id, isStanning: participant.isStanning })}
              disabled={stanMutation.isPending}
            >
              {stanMutation.isPending ? (
                <ActivityIndicator size="small" color={participant.isStanning ? "#FF4081" : "#fff"} />
              ) : (
                <Ionicons name={participant.isStanning ? "heart" : "heart-outline"} size={20} color={participant.isStanning ? "#FF4081" : "#fff"} />
              )}
              <Text style={[s.stanActionText, participant.isStanning && { color: '#FF4081' }]}>
                {participant.isStanning ? 'Contestant Stanned' : 'Stan Contestant'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Talent Video ─────────────────────────────────────── */}
        <View style={s.contentSection}>
          {participant.videoUrl && (
            <View style={s.videoWrapper}>
              <VideoPlayer
                uri={participant.videoUrl}
                posterUri={participant.photoUrl}
              />
              <View style={s.videoOverlay}>
                <Text style={s.videoLabel}>TALENT VIDEO</Text>
              </View>
            </View>
          )}

          <SponsorTicker cycleId={participant.cycleId} />

          {/* Ad banner */}
          {ad && (
            <TouchableOpacity style={s.adBanner} activeOpacity={0.9}>
              <View style={s.adLabel}><Text style={s.adLabelText}>PARTNER</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.adName} numberOfLines={1}>{ad.companyName}</Text>
                {ad.prizeDescription && (
                  <Text style={s.adDesc} numberOfLines={1}>{ad.prizeDescription}</Text>
                )}
              </View>
              <Ionicons name="open-outline" size={18} color={theme.primaryColor} />
            </TouchableOpacity>
          )}

          {/* Error */}
          {!!error && (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#A32D2D" />
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          {/* ── Voting Steps ───────────────────────────────────── */}
          {step === 'form' && (
            <View style={s.card}>
              <Text style={s.cardTitle}>Cast your vote for {participant.displayName}</Text>

              {participant.cycle?.status !== 'VOTING_OPEN' ? (
                <View style={s.lockedContainer}>
                  <View style={s.lockCircle}>
                    <Ionicons name="lock-closed" size={32} color={textSecondary} />
                  </View>
                  <Text style={s.lockedTitle}>Voting is currently closed</Text>
                  <Text style={s.lockedSub}>
                    {participant.cycle?.status === 'REGISTRATION_OPEN'
                      ? 'The competition is in the registration phase. Check back once voting starts!'
                      : 'The voting period for this cycle has ended.'}
                  </Text>
                  <TouchableOpacity
                    style={s.secondaryBtn}
                    onPress={() => router.push('/leaderboard')}
                  >
                    <Text style={s.secondaryBtnText}>View Rankings</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.formContainer}>
                  <Text style={s.instruction}>Enter your details below to verify your identity</Text>

                  <View style={s.inputGroup}>
                    <Text style={s.inputLabel}>Phone Number</Text>
                    <TextInput
                      style={s.input}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="080 0000 0000"
                      placeholderTextColor={textSecondary}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={s.inputGroup}>
                    <Text style={s.inputLabel}>Email Address</Text>
                    <TextInput
                      style={s.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="name@email.com"
                      placeholderTextColor={textSecondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <Text style={{ fontSize: 11, color: textSecondary, textAlign: 'center', marginBottom: 16 }}>
                    By proceeding, you agree to our <Text style={{ color: theme.primaryColor, fontWeight: '600' }}>Terms</Text>. All votes are final and non-refundable.
                  </Text>

                  <TouchableOpacity
                    style={[s.primaryBtn, loading && s.btnDisabled]}
                    onPress={handleSendOtp}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={theme.textOnPrimary} />
                    ) : (
                      <Text style={s.primaryBtnText}>Send Verification OTP</Text>
                    )}
                  </TouchableOpacity>

                  <View style={s.hintBox}>
                    <Ionicons name="shield-checkmark" size={14} color={textSecondary} />
                    <Text style={s.hint}>One vote per day. Your info stays private.</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {step === 'otp' && (
            <View style={s.card}>
              <Text style={s.cardTitle}>Verify your vote</Text>
              <Text style={s.instruction}>Enter the 6-digit code sent to {phone}</Text>

              <TextInput
                style={s.otpInput}
                value={otp}
                onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                placeholderTextColor={border}
                keyboardType="numeric"
                maxLength={6}
                autoFocus
              />

              <TouchableOpacity
                style={[s.primaryBtn, (loading || otp.length < 6) && s.btnDisabled]}
                onPress={handleCastVote}
                disabled={loading || otp.length < 6}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Confirm Vote</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={s.backBtn} onPress={() => setStep('form')}>
                <Text style={s.backBtnText}>Reset details</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'success' && (
            <View style={s.successContainer}>
              <LinearGradient
                colors={['#EAF3DE', '#D4E9B3']}
                style={s.successCard}
              >
                <View style={s.successIconCircle}>
                  <Ionicons name="checkmark-done" size={40} color="#3B6D11" />
                </View>
                <Text style={s.successTitle}>Vote Confirmed!</Text>
                <Text style={s.successText}>
                  Your vote for {participant.displayName} has been successfully recorded. Come back tomorrow!
                </Text>
              </LinearGradient>

              <View style={s.shareCard}>
                <Text style={s.shareTitle}>Help {participant.displayName} Win!</Text>
                <Text style={s.shareSub}>Share their profile and invite others to stan them.</Text>
                <TouchableOpacity style={s.primaryBtn} onPress={() => router.push('/participants')}>
                  <Text style={s.primaryBtnText}>Discover More Talent</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Top Supporters Leaderboard ─────────────────────── */}
          <View style={s.fansSection}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Top Supporters</Text>
              <View style={s.badgeLabel}>
                <Text style={s.badgeLabelText}>TOP STANS</Text>
              </View>
            </View>
            
            {fans.length > 0 ? (
              <View style={s.fansContainer}>
                {fans.slice(0, 5).map((fan: any, index: number) => (
                  <View key={index} style={s.fanRow}>
                    <View style={s.fanRank}>
                      <Text style={s.fanRankText}>{index + 1}</Text>
                    </View>
                    <Image 
                      source={{ uri: fan.photoUrl || 'https://via.placeholder.com/100' }} 
                      style={s.fanAvatar} 
                    />
                    <View style={s.fanInfo}>
                      <Text style={s.fanName}>{fan.displayName}</Text>
                      <Text style={s.fanVotes}>{fan.voteCount} votes cast</Text>
                    </View>
                    {index === 0 && (
                      <Ionicons name="trophy" size={20} color="#FFD700" />
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={s.emptyFans}>
                <Text style={s.emptyFansText}>No supporters yet. Be the first!</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function makeStyles(theme: any, bg: string, surface: string, textPrimary: string, textSecondary: string, border: string, pad: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    loaderFull: { flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' },
    loaderText: { marginTop: 12, color: textSecondary, fontWeight: '600' },

    // ── Hero Section ──────────────────────────────────────────
    heroContainer: {
      height: 420,
      width: '100%',
      position: 'relative',
      justifyContent: 'flex-end',
      backgroundColor: '#000',
    },
    heroBg: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.7,
    },
    heroGradient: {
      ...StyleSheet.absoluteFillObject,
    },
    backIcon: {
      position: 'absolute',
      top: 50,
      left: 16,
      zIndex: 10,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0,0,0,0.3)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroContent: {
      alignItems: 'center',
      paddingBottom: 50,
      paddingHorizontal: 20,
    },
    heroAvatarFrame: {
      width: 90,
      height: 90,
      borderRadius: 45,
      borderWidth: 3,
      borderColor: '#fff',
      padding: 3,
      marginBottom: 16,
    },
    avatarImg: { width: '100%', height: '100%', borderRadius: 45 },
    heroName: { color: '#fff', fontSize: 28, fontWeight: '900', marginBottom: 8, letterSpacing: -1 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    categoryTag: {
      backgroundColor: theme.primaryColor,
      borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4,
    },
    categoryTagText: { color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    stanBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 8
    },
    stanText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    stanActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderRadius: 28,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    stanActionActive: {
      backgroundColor: 'rgba(255,64,129,0.15)',
      borderColor: '#FF4081',
    },
    stanActionText: { color: '#fff', fontSize: 14, fontWeight: '700' },

    // ── Content ───────────────────────────────────────────────
    contentSection: { padding: 16, marginTop: -30 },
    videoWrapper: {
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: '#000',
      marginBottom: 20,
      shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
    },
    videoOverlay: {
      position: 'absolute',
      top: 14,
      left: 14,
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
    },
    videoLabel: { color: '#fff', fontSize: 10, fontWeight: '800' },

    adBanner: {
      backgroundColor: surface,
      height: 64,
      borderRadius: 16,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: border,
    },
    adLabel: {
      backgroundColor: theme.accentColor,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    adLabelText: { color: theme.primaryColor, fontSize: 9, fontWeight: '800' },
    adName: { color: textPrimary, fontSize: 13, fontWeight: '700' },
    adDesc: { color: textSecondary, fontSize: 11, marginTop: 1 },

    // ── Forms ─────────────────────────────────────────────────
    card: {
      backgroundColor: surface,
      borderRadius: 24,
      padding: 24,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    },
    cardTitle: { fontSize: 18, fontWeight: '800', color: textPrimary, marginBottom: 6, letterSpacing: -0.5 },
    instruction: { fontSize: 13, color: textSecondary, marginBottom: 24, lineHeight: 18 },
    formContainer: { width: '100%' },

    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 12, fontWeight: '700', color: textPrimary, marginBottom: 8, marginLeft: 4 },
    input: {
      backgroundColor: bg,
      borderRadius: 14,
      height: 54,
      paddingHorizontal: 16,
      fontSize: 15,
      color: textPrimary,
      borderWidth: 1,
      borderColor: border,
    },
    primaryBtn: {
      backgroundColor: theme.buttonColor,
      height: 54,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      shadowColor: theme.buttonColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    btnDisabled: { opacity: 0.6 },
    primaryBtnText: { color: theme.textOnPrimary, fontSize: 16, fontWeight: '800' },

    hintBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
    hint: { fontSize: 11, color: textSecondary, fontWeight: '500' },

    otpInput: {
      height: 80,
      backgroundColor: bg,
      borderRadius: 16,
      fontSize: 32,
      fontWeight: '800',
      textAlign: 'center',
      letterSpacing: 20,
      color: theme.primaryColor,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.primaryColor + '20',
    },
    backBtn: { marginTop: 16, alignSelf: 'center' },
    backBtnText: { color: textSecondary, fontWeight: '600' },

    // ── Success State ──────────────────────────────────────────
    successContainer: { gap: 16 },
    successCard: {
      borderRadius: 24,
      padding: 30,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#C0DD97',
    },
    successIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    successTitle: { fontSize: 22, fontWeight: '900', color: '#3B6D11', marginBottom: 8 },
    successText: { fontSize: 14, color: '#4A7A1B', textAlign: 'center', lineHeight: 22 },

    shareCard: {
      backgroundColor: surface,
      borderRadius: 24,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: border,
    },
    shareTitle: { fontSize: 16, fontWeight: '800', color: textPrimary, marginBottom: 4 },
    shareSub: { fontSize: 13, color: textSecondary, textAlign: 'center', marginBottom: 20 },

    // ── Locked State ──────────────────────────────────────────
    lockedContainer: { alignItems: 'center', paddingVertical: 20 },
    lockCircle: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: bg, alignItems: 'center', justifyContent: 'center',
      marginBottom: 16, borderWidth: 1, borderColor: border,
    },
    lockedTitle: { fontSize: 18, fontWeight: '800', color: textPrimary, marginBottom: 8 },
    lockedSub: { fontSize: 14, color: textSecondary, textAlign: 'center', marginBottom: 24, paddingHorizontal: 10 },
    secondaryBtn: {
      backgroundColor: bg,
      borderWidth: 1,
      borderColor: border,
      borderRadius: 14,
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    secondaryBtnText: { color: textPrimary, fontWeight: '700' },

    errorBox: {
      backgroundColor: '#FCEBEB',
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderColor: '#F1A9A9',
    },
    errorText: { color: '#A32D2D', fontSize: 13, fontWeight: '600', flex: 1 },

    // ── Fans Section ──────────────────────────────────────────
    fansSection: { marginTop: 10, marginBottom: 40 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: textPrimary },
    badgeLabel: { backgroundColor: theme.accentColor, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
    badgeLabelText: { color: theme.primaryColor, fontSize: 10, fontWeight: '800' },
    fansContainer: { backgroundColor: surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: border },
    fanRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    fanRank: { width: 24, alignItems: 'center' },
    fanRankText: { fontSize: 14, fontWeight: '800', color: textSecondary, opacity: 0.5 },
    fanAvatar: { width: 40, height: 40, borderRadius: 20, marginHorizontal: 12, backgroundColor: bg },
    fanInfo: { flex: 1 },
    fanName: { fontSize: 14, fontWeight: '700', color: textPrimary },
    fanVotes: { fontSize: 12, color: textSecondary, marginTop: 2 },
    emptyFans: { padding: 30, backgroundColor: surface, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: border },
    emptyFansText: { color: textSecondary, fontSize: 14, fontWeight: '600' }
  })
}
