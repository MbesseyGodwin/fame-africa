// apps/mobile/app/(tabs)/battles.tsx

import React, { useState } from 'react'
import { 
  View, Text, FlatList, Dimensions, ActivityIndicator, 
  TouchableOpacity, StyleSheet, RefreshControl, ImageBackground, Alert, TextInput
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

const { width } = Dimensions.get('window')

export default function BattlesScreen() {
  const { theme, textPrimary, textSecondary, surface, bg, border } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const [voterPhone, setVoterPhone] = useState('')

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

  // 3. Vote Mutation
  const voteMutation = useMutation({
    mutationFn: ({ battleId, participantId }: { battleId: string, participantId: string }) => 
      battlesApi.vote(battleId, { participantId, voterPhone }),
    onSuccess: () => {
      Alert.alert('Success', 'Your battle vote has been recorded!')
      queryClient.invalidateQueries({ queryKey: ['active-battles'] })
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to vote')
    }
  })

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
              onPress={() => {
                if (!voterPhone) return Alert.alert('Required', 'Enter your phone number below first')
                voteMutation.mutate({ battleId: item.id, participantId: item.participantAId })
              }}
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
              onPress={() => {
                if (!voterPhone) return Alert.alert('Required', 'Enter your phone number below first')
                voteMutation.mutate({ battleId: item.id, participantId: item.participantBId })
              }}
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

      <View style={[s.voterSection, { backgroundColor: surface, borderBottomColor: border }]}>
        <Ionicons name="call-outline" size={18} color={textSecondary} />
        <TextInput
          style={[s.voterInput, { color: textPrimary }]}
          placeholder="Enter phone to vote..."
          placeholderTextColor={textSecondary}
          value={voterPhone}
          onChangeText={setVoterPhone}
          keyboardType="phone-pad"
        />
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
          contentContainerStyle={s.listContent}
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
    </View>
  )
}

function makeStyles(theme: any, bg: string, surface: string, textPrimary: string, textSecondary: string, border: string, insets: any) {
  return StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: insets.top || 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -1 },
  headerSub: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  
  voterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  voterInput: { flex: 1, fontSize: 14, fontWeight: '600' },

  listContent: { padding: 16, paddingBottom: 40 },
  battleCard: {
    borderRadius: 24,
    padding: 20,
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
  })
}
