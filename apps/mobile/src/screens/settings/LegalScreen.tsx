// apps/mobile/src/screens/settings/LegalScreen.tsx

import React from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useTheme } from '../../context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'

export default function LegalScreen() {
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const router = useRouter()

  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad)

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Privacy & Legal</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={s.scrollView} contentContainerStyle={s.content}>
        <Text style={s.title}>Fame Africa Terms of Service</Text>
        <Text style={s.lastUpdated}>Last Updated: April 2026</Text>

        <View style={s.section}>
          <Text style={s.heading}>1. Nature of the Platform</Text>
          <Text style={s.paragraph}>
            Fame Africa is a premier product of Consolidated Software Solutions Limited ("CSS"). It operates as a Pan-African digital stage and content creation platform for rising stars. It is strictly a game of popularity, talent, and creativity. Contestants compete for public validation, and winners are determined 100% transparently by the highest volume of legitimate user engagement and votes. Fame Africa is not an investment platform, nor do we offer financial returns, gambling, or games of chance.
          </Text>
        </View>

        <View style={s.section}>
          <Text style={s.heading}>2. Registration & Non-Refundable Fees</Text>
          <Text style={s.paragraph}>
            All registration fees paid by contestants, and all funds used by fans to purchase votes, are strictly non-refundable. They are consumed digital goods facilitating active participation within the current competition cycle.
          </Text>
        </View>

        <View style={s.section}>
          <Text style={s.heading}>3. Prize Payouts & Anti-Money Laundering</Text>
          <Text style={s.paragraph}>
            Contestants who win cash prizes are required to undergo standard KYC (Know Your Customer) procedures, including providing a valid government-issued ID linking their true identity to the receiving bank account. We strictly adhere to regional Anti-Money Laundering (AML) regulations across our operational territories. Anonymous payouts are heavily prohibited.
          </Text>
        </View>

        <View style={s.section}>
          <Text style={s.heading}>4. Eliminations & Withdrawal</Text>
          <Text style={s.paragraph}>
            Contestants may be eliminated automatically when their vote counts drop beneath the competitive threshold at predefined elimination intervals. Contestants may also voluntarily withdraw. Upon withdrawal or elimination, accounts cannot be reinstated for the same cycle. Fees remain non-refundable in all cases.
          </Text>
        </View>
        
        <View style={s.section}>
          <Text style={s.heading}>5. Anti-Fraud & Voting Integrity</Text>
          <Text style={s.paragraph}>
            We employ advanced monitoring, device fingerprinting, and OTP verification to ensure voting integrity. Any attempt to manipulate votes using bots, scripts, automated systems, or multiple accounts for a single person is strictly prohibited. Violators will face immediate disqualification, permanent account bans, and forfeiture of all prizes and fees without prior notice.
          </Text>
        </View>

        <View style={s.section}>
          <Text style={s.heading}>6. Limitation of Liability</Text>
          <Text style={s.paragraph}>
            Consolidated Software Solutions Limited (CSS) provides Fame Africa on an "as-is" basis. We are not liable for intermittent service interruptions, network failures, data loss, or server downtime that may affect voting timing or results. In no event shall CSS be liable for indirect, incidental, or consequential damages resulting from your participation.
          </Text>
        </View>

        <View style={s.section}>
          <Text style={s.heading}>7. No Professional Advice</Text>
          <Text style={s.paragraph}>
            Content provided on this platform is for entertainment purposes only and does not constitute financial, legal, or professional advice. The prizes offered are awards for talent and popularity, not financial returns or investment dividends.
          </Text>
        </View>
        <View style={s.footerMeta}>
          <Text style={s.footerText}>A Product of Consolidated Software Solutions Limited</Text>
          <Text style={s.footerText}>Innovation · Transparency · Excellence</Text>
          <Text style={s.footerText}>Lagos, Nigeria | Pan-African Operations</Text>
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
    scrollView: { flex: 1 },
    content: { padding: 20, paddingBottom: 60 },
    title: { fontSize: 24, fontWeight: '700', color: textPrimary, marginBottom: 4 },
    lastUpdated: { fontSize: 13, color: textSecondary, marginBottom: 24 },
    section: { marginBottom: 24 },
    heading: { fontSize: 16, fontWeight: '600', color: theme.primaryColor, marginBottom: 8 },
    paragraph: { fontSize: 14, color: textSecondary, lineHeight: 22 },
    footerMeta: { marginTop: 32, paddingTop: 24, borderTopWidth: 0.5, borderTopColor: border, alignItems: 'center' },
    footerText: { fontSize: 12, color: textSecondary, marginBottom: 4 }
  })
}
