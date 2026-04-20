// apps/mobile/src/screens/settings/SupportScreen.tsx

import React from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Linking, Alert
} from 'react-native'
import { useRouter } from 'expo-router'
import { useTheme } from '../../context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'

const FAQS = [
  { q: 'How do I cast a vote?', a: 'To vote, navigate to the Candidates tab, select your preferred contestant, and follow the OTP verification steps. You can vote once per day.' },
  { q: 'Is my phone number private?', a: 'Yes. We use industry-standard hashing to secure your identity. We never share your contact details with contestants or third parties.' },
  { q: 'Why didn\'t I receive my OTP?', a: 'Check your mobile network signal. If the problem persists, wait 60 seconds and tap "Resend Code". Ensure you entered the correct phone number.' },
  { q: 'How are contestants eliminated?', a: 'Eliminations are based on daily cumulative votes. The contestants with the lowest votes at the end of each cycle are eliminated.' },
]

export default function SupportScreen() {
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const router = useRouter()

  function handleEmailSupport() {
    Linking.openURL('mailto:support@fameafrica.fm')
  }

  function handleLiveChat() {
    Alert.alert('Live Chat', 'Connecting you to a representative...')
  }

  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad)

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.hero}>
          <View style={s.iconCircle}>
            <Ionicons name="headset-outline" size={40} color={theme.primaryColor} />
          </View>
          <Text style={s.heroTitle}>How can we help?</Text>
          <Text style={s.heroSub}>Our team is available 24/7 to assist you.</Text>
        </View>

        <View style={s.cardRow}>
          <TouchableOpacity style={s.supportCard} onPress={handleEmailSupport}>
            <Ionicons name="mail" size={24} color={theme.primaryColor} />
            <Text style={s.cardLabel}>Email Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.supportCard} onPress={handleLiveChat}>
            <Ionicons name="chatbubbles" size={24} color="#639922" />
            <Text style={s.cardLabel}>Live Chat</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sectionTitle}>Frequently Asked Questions</Text>
        {FAQS.map((faq, idx) => (
          <View key={idx} style={s.faqItem}>
            <Text style={s.faqQ}>{faq.q}</Text>
            <Text style={s.faqA}>{faq.a}</Text>
          </View>
        ))}

        <View style={s.footer}>
          <Text style={s.footerText}>FameAfrica v1.0.0 (Pan-African Edition)</Text>
        </View>
      </ScrollView>
    </View>
  )
}

function makeStyles(theme: any, bg: string, surface: string, textPrimary: string, textSecondary: string, border: string, pad: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    header: {
      paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20,
      backgroundColor: surface, borderBottomWidth: 0.5, borderBottomColor: border,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: textPrimary },
    content: { padding: 20 },
    hero: { alignItems: 'center', marginBottom: 32 },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.accentColor, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    heroTitle: { fontSize: 22, fontWeight: '700', color: textPrimary },
    heroSub: { fontSize: 14, color: textSecondary, marginTop: 4 },
    cardRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
    supportCard: {
      flex: 1, backgroundColor: surface, padding: 20, borderRadius: 20,
      borderWidth: 0.5, borderColor: border, alignItems: 'center',
    },
    cardLabel: { fontSize: 13, fontWeight: '600', color: textPrimary, marginTop: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: textPrimary, marginBottom: 20 },
    faqItem: { marginBottom: 24, paddingBottom: 20, borderBottomWidth: 0.5, borderBottomColor: border },
    faqQ: { fontSize: 15, fontWeight: '600', color: textPrimary, marginBottom: 8 },
    faqA: { fontSize: 14, color: textSecondary, lineHeight: 20 },
    footer: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
    footerText: { fontSize: 11, color: textSecondary, opacity: 0.6 },
  })
}
