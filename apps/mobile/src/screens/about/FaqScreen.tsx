// apps/mobile/src/screens/about/FaqScreen.tsx

import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

export default function FaqScreen() {
  const { theme, bg, surface, textPrimary, textSecondary, border } = useTheme()
  const router = useRouter()

  const faqs = [
    {
      q: "How do I vote?",
      a: "Select a contestant from the Participants tab, enter your info, and verify with the OTP sent to you."
    },
    {
      q: "Is there a registration fee?",
      a: "Yes, a small fee is required during registration to support competition infrastructure."
    },
    {
      q: "What is the Virtual House?",
      a: "It's the LIVE area where contestants perform 24/7. Watch them in the 'Direct Feed' sections."
    },
    {
      q: "When are eliminations?",
      a: "Every day at 23:59 GMT/UTC. Check the 'Eliminated' tab to see who was cut."
    }
  ]

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textPrimary }]}>Knowledge Center</Text>
      </View>

      <View style={styles.content}>
        {faqs.map((faq, index) => (
          <View key={index} style={[styles.faqCard, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.qHeader}>
              <Text style={[styles.qText, { color: theme.primaryColor }]}>Q:</Text>
              <Text style={[styles.question, { color: textPrimary }]}>{faq.q}</Text>
            </View>
            <Text style={[styles.answer, { color: textSecondary }]}>{faq.a}</Text>
          </View>
        ))}
      </View>
      
      <View style={[styles.footer, { borderColor: border }]}>
        <Text style={[styles.footerText, { color: textSecondary }]}>More details available at fameafrica.tv/rules</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60 },
  backBtn: { marginRight: 15 },
  title: { fontSize: 24, fontWeight: '900' },
  content: { padding: 20 },
  faqCard: { padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 15 },
  qHeader: { flexDirection: 'row', marginBottom: 10, gap: 8 },
  qText: { fontSize: 18, fontWeight: '900' },
  question: { fontSize: 16, fontWeight: '800', flex: 1 },
  answer: { fontSize: 14, lineHeight: 22, fontWeight: '500' },
  footer: { padding: 40, alignItems: 'center', borderTopWidth: 1 },
  footerText: { fontSize: 12, fontWeight: '600' }
})
