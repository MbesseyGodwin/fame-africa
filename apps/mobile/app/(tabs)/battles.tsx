// apps/mobile/app/(tabs)/battles.tsx

import React, { useState } from 'react'
import {
  View, Text, FlatList, Dimensions, ActivityIndicator,
  TouchableOpacity, StyleSheet, RefreshControl, ImageBackground, Alert, TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from '../../src/context/ThemeContext'
import { battlesApi, competitionsApi } from '../../src/utils/api'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Image } from 'expo-image'
import { InfoTooltip } from '../../src/components/common/InfoTooltip'
import { useRouter } from 'expo-router'

const { width, height } = Dimensions.get('window')

export default function BattlesScreen() {
  const { theme, textPrimary, textSecondary, surface, bg, border } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()

  // Voting State
  const [voterEmail, setVoterEmail] = useState('')
  const [voterPhone, setVoterPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [selectedBattle, setSelectedBattle] = useState<{ id: string, participantId: string, participantName: string } | null>(null)

  // 1. Get current cycle
  const { data: cycleRes } = useQuery({
    queryKey: ['current-cycle'],
    queryFn: () => competitionsApi.getCurrent()
  })
  const cycleId = cycleRes?.data?.data?.id

  // 2. Get active battles
  const { data: battles, isLoading, refetch } = useQuery({
    queryKey: ['active-battles', cycleId],
    queryFn: async () => {
      const res = await battlesApi.getActive(cycleId!)
      return res.data.data
    },
    enabled: !!cycleId
  })

  // 3. OTP Mutation
  const requestOtpMutation = useMutation({
    mutationFn: (data: { battleId: string, participantId: string, voterEmail: string, voterPhone?: string }) =>
      battlesApi.requestOtp(data.battleId, { participantId: data.participantId, voterEmail: data.voterEmail, voterPhone: data.voterPhone }),
    onSuccess: () => {
      setOtpSent(true)
      Alert.alert('Code Sent', 'Please check your email for the verification code.')
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send verification code')
    }
  })

  // 4. Vote Mutation
  const voteMutation = useMutation({
    mutationFn: (data: { battleId: string, participantId: string, voterEmail: string, otpCode: string, voterPhone?: string }) =>
      battlesApi.vote(data.battleId, data),
    onSuccess: () => {
      Alert.alert('Success', 'Your battle vote has been recorded!')
      setIsModalVisible(false)
      setOtpSent(false)
      setOtpCode('')
      setSelectedBattle(null)
      queryClient.invalidateQueries({ queryKey: ['active-battles'] })
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to vote')
    }
  })

  const handleVotePress = (battleId: string, participantId: string, participantName: string) => {
    setSelectedBattle({ id: battleId, participantId, participantName })
    setIsModalVisible(true)
  }

  const handleRequestOtp = () => {
    if (!voterEmail || !voterEmail.includes('@')) {
      return Alert.alert('Invalid Email', 'Please enter a valid email address.')
    }
    requestOtpMutation.mutate({
      battleId: selectedBattle!.id,
      participantId: selectedBattle!.participantId,
      voterEmail,
      voterPhone
    })
  }

  const handleCastVote = () => {
    if (otpCode.length !== 6) {
      return Alert.alert('Invalid Code', 'Please enter the 6-digit code sent to your email.')
    }
    voteMutation.mutate({
      battleId: selectedBattle!.id,
      participantId: selectedBattle!.participantId,
      voterEmail,
      voterPhone,
      otpCode
    })
  }

  const renderGuide = () => (
    <View style={[s.guideCard, { backgroundColor: surface, borderColor: border }]}>
      <Text style={[s.guideTitle, { color: textPrimary }]}>How to Vote in Battles</Text>
      <View style={s.stepRow}>
        <View style={[s.stepNumber, { backgroundColor: theme.primaryColor }]}><Text style={s.stepNumberText}>1</Text></View>
        <Text style={[s.stepText, { color: textSecondary }]}>Choose your favorite participant in any live battle.</Text>
      </View>
      <View style={s.stepRow}>
        <View style={[s.stepNumber, { backgroundColor: theme.primaryColor }]}><Text style={s.stepNumberText}>2</Text></View>
        <Text style={[s.stepText, { color: textSecondary }]}>Enter your <Text style={{fontWeight:'700'}}>Email</Text> (required) and Phone (optional).</Text>
      </View>
      <View style={s.stepRow}>
        <View style={[s.stepNumber, { backgroundColor: theme.primaryColor }]}><Text style={s.stepNumberText}>3</Text></View>
        <Text style={[s.stepText, { color: textSecondary }]}>Check your email for a 6-digit verification code.</Text>
      </View>
      <View style={s.stepRow}>
        <View style={[s.stepNumber, { backgroundColor: theme.primaryColor }]}><Text style={s.stepNumberText}>4</Text></View>
        <Text style={[s.stepText, { color: textSecondary }]}>Enter the code to confirm your vote. You can vote <Text style={{fontWeight:'700'}}>once per battle daily</Text>.</Text>
      </View>
    </View>
  )

  const renderBattle = ({ item }: { item: any }) => {
    const totalVotes = item.votesA + item.votesB
    const pctA = totalVotes > 0 ? (item.votesA / totalVotes) * 100 : 50
    const pctB = totalVotes > 0 ? (item.votesB / totalVotes) * 100 : 50

    return (
      <View style={[s.battleCard, { backgroundColor: surface, borderColor: border }]}>
        <View style={s.battleHeader}>
          <View style={s.liveBadge}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>LIVE BATTLE</Text>
          </View>
          <Text style={[s.timerText, { color: textSecondary }]}>Ends Soon</Text>
        </View>

        <View style={s.contestantsRow}>
          {/* Participant A */}
          <View style={s.contestant}>
            <View style={[s.avatarFrame, { borderColor: theme.primaryColor }]}>
              <Image source={{ uri: item.participantA.photoUrl }} style={s.avatar} />
            </View>
            <Text style={[s.name, { color: textPrimary }]} numberOfLines={1}>{item.participantA.displayName}</Text>
            <Text style={[s.voteCount, { color: theme.primaryColor }]}>{item.votesA} Votes</Text>
            <TouchableOpacity
              style={[s.voteBtn, { backgroundColor: theme.primaryColor }]}
              onPress={() => handleVotePress(item.id, item.participantAId, item.participantA.displayName)}
            >
              <Text style={s.voteBtnText}>VOTE A</Text>
            </TouchableOpacity>
          </View>

          <View style={s.vsContainer}>
            <LinearGradient colors={[theme.primaryColor, '#FF4081']} style={s.vsCircle}>
              <Text style={s.vsText}>VS</Text>
            </LinearGradient>
          </View>

          {/* Participant B */}
          <View style={s.contestant}>
            <View style={[s.avatarFrame, { borderColor: '#FF4081' }]}>
              <Image source={{ uri: item.participantB.photoUrl }} style={s.avatar} />
            </View>
            <Text style={[s.name, { color: textPrimary }]} numberOfLines={1}>{item.participantB.displayName}</Text>
            <Text style={[s.voteCount, { color: '#FF4081' }]}>{item.votesB} Votes</Text>
            <TouchableOpacity
              style={[s.voteBtn, { backgroundColor: '#FF4081' }]}
              onPress={() => handleVotePress(item.id, item.participantBId, item.participantB.displayName)}
            >
              <Text style={s.voteBtnText}>VOTE B</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={s.progressContainer}>
          <View style={[s.progressTrack, { backgroundColor: bg }]}>
            <View style={[s.progressBarA, { width: `${pctA}%`, backgroundColor: theme.primaryColor }]} />
            <View style={[s.progressBarB, { width: `${pctB}%`, backgroundColor: '#FF4081' }]} />
          </View>
          <View style={s.pctRow}>
            <Text style={[s.pctText, { color: theme.primaryColor }]}>{Math.round(pctA)}%</Text>
            <Text style={[s.pctText, { color: '#FF4081' }]}>{Math.round(pctB)}%</Text>
          </View>
        </View>
      </View>
    )
  }

  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, insets)

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <View style={[s.header, { backgroundColor: surface, borderBottomColor: border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={textPrimary} />
            </TouchableOpacity>
            <View>
              <Text style={[s.headerTitle, { color: textPrimary }]}>Participant Battles</Text>
              <Text style={[s.headerSub, { color: textSecondary }]}>1-on-1 Head-to-Head Challenges</Text>
            </View>
          </View>
          <InfoTooltip
            title="How Battles Work"
            content="Contestants are paired in 1-on-1 talent clashes. You can vote for your favorite in each pair! Each battle win gives the participant a 10-vote bonus in the main competition."
            iconSize={28}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={theme.primaryColor} />
        </View>
      ) : (
        <FlatList
          data={battles}
          renderItem={renderBattle}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderGuide}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="flash-outline" size={64} color={textSecondary} />
              <Text style={[s.emptyTitle, { color: textPrimary }]}>No Active Battles</Text>
              <Text style={[s.emptySub, { color: textSecondary }]}>
                Check back later for scheduled 1-on-1 talent clashes!
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.primaryColor} />
          }
        />
      )}

      {/* Voting Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.modalOverlay}
        >
          <View style={[s.modalContent, { backgroundColor: surface }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: textPrimary }]}>
                Voting for {selectedBattle?.participantName}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {!otpSent ? (
                <View style={s.modalBody}>
                  <Text style={[s.inputLabel, { color: textSecondary }]}>Email Address (Required)</Text>
                  <TextInput
                    style={[s.modalInput, { color: textPrimary, borderColor: border }]}
                    placeholder="Enter your email"
                    placeholderTextColor={textSecondary}
                    value={voterEmail}
                    onChangeText={setVoterEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <Text style={[s.inputLabel, { color: textSecondary }]}>Phone Number (Optional)</Text>
                  <TextInput
                    style={[s.modalInput, { color: textPrimary, borderColor: border }]}
                    placeholder="Enter phone (e.g. +234...)"
                    placeholderTextColor={textSecondary}
                    value={voterPhone}
                    onChangeText={setVoterPhone}
                    keyboardType="phone-pad"
                  />

                  <TouchableOpacity
                    style={[s.modalBtn, { backgroundColor: theme.primaryColor }]}
                    onPress={handleRequestOtp}
                    disabled={requestOtpMutation.isPending}
                  >
                    {requestOtpMutation.isPending ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={s.modalBtnText}>GET VERIFICATION CODE</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.modalBody}>
                  <Text style={[s.otpInstruction, { color: textSecondary }]}>
                    A 6-digit code has been sent to <Text style={{fontWeight:'700', color: textPrimary}}>{voterEmail}</Text>
                  </Text>
                  
                  <TextInput
                    style={[s.modalInput, s.otpInput, { color: textPrimary, borderColor: theme.primaryColor }]}
                    placeholder="000000"
                    placeholderTextColor={textSecondary}
                    value={otpCode}
                    onChangeText={setOtpCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />

                  <TouchableOpacity
                    style={[s.modalBtn, { backgroundColor: theme.primaryColor }]}
                    onPress={handleCastVote}
                    disabled={voteMutation.isPending}
                  >
                    {voteMutation.isPending ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={s.modalBtnText}>CONFIRM VOTE</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={s.resendBtn}
                    onPress={() => setOtpSent(false)}
                  >
                    <Text style={[s.resendText, { color: theme.primaryColor }]}>Use different email</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

function makeStyles(theme: any, bg: string, surface: string, textPrimary: string, textSecondary: string, border: string, insets: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingTop: insets.top || 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -1 },
    headerSub: { fontSize: 14, fontWeight: '600', marginTop: 4 },

    guideCard: {
      margin: 16,
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      backgroundColor: surface,
    },
    guideTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 12 },
    stepNumber: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    stepNumberText: { color: '#fff', fontSize: 11, fontWeight: '900' },
    stepText: { fontSize: 13, flex: 1, lineHeight: 18 },

    listContent: { paddingBottom: 40 },
    battleCard: {
      borderRadius: 24,
      padding: 20,
      marginHorizontal: 16,
      marginBottom: 24,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    battleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    liveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FF000015',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      gap: 6,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF0000' },
    liveText: { color: '#FF0000', fontSize: 10, fontWeight: '900' },
    timerText: { fontSize: 12, fontWeight: '700' },

    contestantsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 25,
    },
    contestant: { flex: 1, alignItems: 'center' },
    avatarFrame: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 3,
      padding: 3,
      marginBottom: 10,
    },
    avatar: { width: '100%', height: '100%', borderRadius: 40 },
    name: { fontSize: 14, fontWeight: '800', marginBottom: 4, textAlign: 'center' },
    voteCount: { fontSize: 12, fontWeight: '900', marginBottom: 10 },
    voteBtn: {
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 12,
      width: '100%',
      alignItems: 'center',
    },
    voteBtnText: { color: '#fff', fontSize: 11, fontWeight: '900' },

    vsContainer: { width: 50, alignItems: 'center', justifyContent: 'center' },
    vsCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
    },
    vsText: { color: '#fff', fontSize: 14, fontWeight: '900' },

    progressContainer: { marginTop: 10 },
    progressTrack: {
      height: 12,
      borderRadius: 6,
      flexDirection: 'row',
      overflow: 'hidden',
    },
    progressBarA: { height: '100%' },
    progressBarB: { height: '100%' },
    pctRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    pctText: { fontSize: 12, fontWeight: '900' },

    emptyState: { alignItems: 'center', marginTop: 100, padding: 40 },
    emptyTitle: { fontSize: 20, fontWeight: '900', marginTop: 15 },
    emptySub: { fontSize: 14, textAlign: 'center', marginTop: 8, opacity: 0.7 },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: width - 40,
      maxHeight: height * 0.8,
      borderRadius: 32,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    modalTitle: { fontSize: 18, fontWeight: '900', flex: 1, marginRight: 10 },
    modalBody: { paddingBottom: 20 },
    inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8, marginTop: 16 },
    modalInput: {
      height: 56,
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 16,
      fontSize: 16,
      fontWeight: '600',
    },
    otpInput: {
      textAlign: 'center',
      fontSize: 32,
      letterSpacing: 8,
      height: 80,
      marginTop: 20,
    },
    otpInstruction: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 10 },
    modalBtn: {
      height: 56,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 24,
    },
    modalBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },
    resendBtn: { marginTop: 20, alignItems: 'center' },
    resendText: { fontSize: 14, fontWeight: '700' },
  })
}
