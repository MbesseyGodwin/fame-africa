// apps/mobile/src/screens/home/HowItWorksScreen.tsx

import React from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useTheme } from '../../context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'

export default function HowItWorksScreen() {
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const router = useRouter()
  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad)

  const steps = [
    {
      icon: "person-add",
      title: "1. Contestants Register",
      desc: "Aspiring contestants enter the competition cycle by paying a single registration fee. This puts them on the live leaderboard for the world to see."
    },
    {
      icon: "megaphone",
      title: "2. Campaign & Stans",
      desc: "Contestants share their unique VoteLink on social media. Fans (Stans) join their clubs and buy votes to push their favorite contestant up the ranks."
    },
    {
      icon: "flash",
      title: "3. The Fame Arena",
      desc: "Every evening between 6:00 PM and 7:00 PM, the 'Arena' opens. Contestants face a real-time IQ Blitz. Missing this window is critical!"
    },
    {
      icon: "trending-down",
      title: "4. The Eliminations",
      desc: "Every few days, the contestants with the lowest amount of votes are permanently eliminated. Consistency is key!"
    },
    {
      icon: "trophy",
      title: "5. The Ultimate Prize",
      desc: "The contestant who survives all eliminations and holds the most votes at the end of the cycle wins the grand cash prize."
    }
  ]

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>How It Works</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.heroBox}>
          <Text style={s.heroTitle}>A Game of True Popularity</Text>
          <Text style={s.heroSub}>Transparent rules. Real eliminations. Huge prizes.</Text>
        </View>

        <View style={s.timeline}>
          {steps.map((step, idx) => (
            <View key={idx} style={s.stepRow}>
              <View style={s.iconWrapper}>
                <Ionicons name={step.icon as any} size={24} color={theme.primaryColor} />
              </View>
              <View style={s.stepContent}>
                <Text style={s.stepTitle}>{step.title}</Text>
                <Text style={s.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Detailed Arena Section */}
        <View style={s.arenaSection}>
          <View style={s.arenaHeader}>
            <Ionicons name="bonfire" size={24} color="#FFD700" />
            <Text style={s.arenaHeaderTitle}>THE ARENA LAWS</Text>
          </View>

          <View style={s.lawRow}>
            <View style={s.lawDot} />
            <Text style={s.lawText}>
              <Text style={s.bold}>Daily Window:</Text> The Arena opens exactly at <Text style={s.bold}>6:00 PM</Text> and closes at <Text style={s.bold}>7:00 PM</Text> (GMT+1). Participation is mandatory for all active contestants.
            </Text>
          </View>

          <View style={s.lawRow}>
            <View style={s.lawDot} />
            <Text style={s.lawText}>
              <Text style={s.bold}>Live Puzzles:</Text> Every contestant receives the same questions at the exact same second. No cheating, just pure speed and intelligence.
            </Text>
          </View>

          <View style={s.lawRow}>
            <View style={[s.lawDot, { backgroundColor: '#FF4C4C' }]} />
            <Text style={s.lawText}>
              <Text style={[s.bold, { color: '#FF4C4C' }]}>The 3-Strike Rule:</Text> If you miss 3 Arena sessions throughout your journey, the system will <Text style={s.bold}>Automatically Disqualify</Text> you. No appeals.
            </Text>
          </View>

          <View style={s.lawRow}>
            <View style={s.lawDot} />
            <Text style={s.lawText}>
              <Text style={s.bold}>Badges & Glory:</Text> Winning an Arena session awards "Battle Medals" to your profile. Large voters look for these medals to decide who is worth their investment.
            </Text>
          </View>
        </View>

        <View style={s.disclaimerBox}>
          <Ionicons name="alert-circle" size={20} color={textSecondary} />
          <Text style={s.disclaimerText}>
            Fame Africa is a competition of grit and influence. All registration fees and votes are final and non-refundable.
          </Text>
        </View>
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
    heroBox: {
      backgroundColor: theme.primaryColor + '10',
      borderRadius: 16, padding: 24, marginBottom: 32, alignItems: 'center'
    },
    heroTitle: { fontSize: 20, fontWeight: 'bold', color: theme.primaryColor, marginBottom: 8, textAlign: 'center' },
    heroSub: { fontSize: 14, color: textSecondary, textAlign: 'center' },
    timeline: { paddingLeft: 8 },
    stepRow: { flexDirection: 'row', marginBottom: 24 },
    iconWrapper: {
      width: 48, height: 48, borderRadius: 24, backgroundColor: theme.primaryColor + '20',
      alignItems: 'center', justifyContent: 'center', marginRight: 16
    },
    stepContent: { flex: 1, paddingTop: 4 },
    stepTitle: { fontSize: 16, fontWeight: '700', color: textPrimary, marginBottom: 6 },
    stepDesc: { fontSize: 14, color: textSecondary, lineHeight: 20 },

    arenaSection: {
      backgroundColor: '#1a1a1a', borderRadius: 24, padding: 24, marginTop: 16, marginBottom: 32,
      borderWidth: 1, borderColor: '#333'
    },
    arenaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    arenaHeaderTitle: { color: '#FFD700', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
    lawRow: { flexDirection: 'row', marginBottom: 16, gap: 12 },
    lawDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)', marginTop: 8 },
    lawText: { flex: 1, color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 20 },
    bold: { fontWeight: 'bold', color: '#fff' },

    disclaimerBox: {
      flexDirection: 'row', gap: 10, padding: 20, backgroundColor: surface,
      borderRadius: 16, borderWidth: 1, borderColor: border, opacity: 0.8
    },
    disclaimerText: { flex: 1, fontSize: 12, color: textSecondary, lineHeight: 18 }
  })
}
