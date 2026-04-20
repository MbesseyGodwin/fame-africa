import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from '../../context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../utils/api'

export default function WinnersScreen() {
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const router = useRouter()
  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad)

  const { data: res, isLoading } = useQuery({
    queryKey: ['winners'],
    queryFn: () => api.get('/winners'),
  })

  const winners = res?.data?.data || []

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Hall of Fame</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.pageSub}>Past Champions of Fame Africa</Text>

        {isLoading ? (
          <ActivityIndicator color={theme.primaryColor} style={{ marginTop: 40 }} />
        ) : winners.length === 0 ? (
          <View style={s.emptyBox}>
            <Ionicons name="trophy-outline" size={48} color={border} />
            <Text style={s.emptyText}>No winners yet. The first champion could be you!</Text>
          </View>
        ) : (
          winners.map((winner: any) => (
            <View key={winner.id} style={s.card}>
              <View style={s.cardHeader}>
                <View>
                  <Text style={s.cycleName}>{winner.cycle.cycleName}</Text>
                  <Text style={s.prizeAmount}>Won ₦{Number(winner.prizeAmount).toLocaleString()}</Text>
                </View>
                <Ionicons name="medal" size={32} color="#D4AF37" />
              </View>
              <View style={s.profileRow}>
                {winner.participant.photoUrl ? (
                  <Image source={{ uri: winner.participant.photoUrl }} style={s.avatar} />
                ) : (
                  <View style={s.avatarPlaceholder}>
                    <Text style={s.avatarText}>{winner.participant.displayName.slice(0, 2).toUpperCase()}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={s.winnerName}>{winner.participant.displayName}</Text>
                  <Text style={s.winnerState}>{winner.participant.state || 'Nigeria'}</Text>
                </View>
              </View>
              {winner.winQuote && (
                <Text style={s.quote}>"{winner.winQuote}"</Text>
              )}
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
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16,
      backgroundColor: surface, borderBottomWidth: 0.5, borderBottomColor: border
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '600', color: textPrimary },
    content: { padding: 20 },
    pageSub: { fontSize: 14, color: textSecondary, marginBottom: 24, textAlign: 'center' },
    emptyBox: { alignItems: 'center', marginTop: 60, padding: 20 },
    emptyText: { color: textSecondary, marginTop: 12, textAlign: 'center', lineHeight: 20 },
    card: { backgroundColor: surface, borderRadius: 16, borderWidth: 1, borderColor: '#D4AF37' + '40', padding: 20, marginBottom: 20, shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 0.5, borderBottomColor: border, paddingBottom: 12 },
    cycleName: { fontSize: 12, color: textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    prizeAmount: { fontSize: 20, fontWeight: 'bold', color: '#D4AF37' },
    profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatar: { width: 60, height: 60, borderRadius: 30 },
    avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: theme.accentColor, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 20, fontWeight: 'bold', color: theme.primaryColor },
    winnerName: { fontSize: 18, fontWeight: '600', color: textPrimary, marginBottom: 4 },
    winnerState: { fontSize: 13, color: textSecondary },
    quote: { marginTop: 16, fontStyle: 'italic', color: textSecondary, lineHeight: 22 }
  })
}
