import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import * as Linking from 'expo-linking'
import { useTheme } from '../../context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'

export default function PaymentScreen() {
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const router = useRouter()
  const { url, amount, planName } = useLocalSearchParams<{ url: string, amount: string, planName: string }>()

  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad)

  async function handlePay() {
    if (url) {
      await Linking.openURL(url)
      router.back()
    }
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Secure Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.iconCircle}>
          <Ionicons name="card" size={48} color={theme.primaryColor} />
        </View>

        <View style={s.card}>
          <Text style={s.planLabel}>Subscription Plan</Text>
          <Text style={s.planName}>{planName || 'Competition Fee'}</Text>
          
          <View style={s.divider} />
          
          <View style={s.row}>
            <Text style={s.label}>Amount to pay</Text>
            <Text style={s.amount}>₦{(Number(amount) || 0).toLocaleString()}</Text>
          </View>
        </View>

        <View style={s.infoBox}>
          <Ionicons name="shield-checkmark" size={20} color="#3B6D11" />
          <Text style={s.infoText}>
            Payments are processed securely via Flutterwave. You will be redirected to their secure portal.
          </Text>
        </View>

        <TouchableOpacity style={s.primaryBtn} onPress={handlePay}>
          <Text style={s.primaryBtnText}>Proceed to Secure Portal</Text>
          <Ionicons name="open-outline" size={18} color="#fff" />
        </TouchableOpacity>

        <Text style={s.footerText}>
          Don't close the app until you've completed the transaction.
        </Text>
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
    headerTitle: { fontSize: 17, fontWeight: '700', color: textPrimary },
    content: { padding: 24, alignItems: 'center' },
    iconCircle: {
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: theme.accentColor,
      justifyContent: 'center', alignItems: 'center',
      marginBottom: 32, marginTop: 20,
    },
    card: {
      width: '100%', backgroundColor: surface,
      borderRadius: 20, padding: 24,
      borderWidth: 0.5, borderColor: border,
      marginBottom: 24,
    },
    planLabel: { fontSize: 13, color: textSecondary, marginBottom: 4 },
    planName: { fontSize: 20, fontWeight: '700', color: textPrimary },
    divider: { height: 1, backgroundColor: border, marginVertical: 20 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontSize: 15, color: textSecondary },
    amount: { fontSize: 22, fontWeight: '800', color: theme.primaryColor },
    infoBox: {
      flexDirection: 'row', backgroundColor: '#EAF3DE',
      padding: 16, borderRadius: 12, marginBottom: 40,
      width: '100%', alignItems: 'center',
    },
    infoText: { flex: 1, marginLeft: 12, fontSize: 13, color: '#3B6D11', lineHeight: 18 },
    primaryBtn: {
      backgroundColor: theme.buttonColor,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      padding: 18, borderRadius: 16, width: '100%', gap: 10,
    },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    footerText: { fontSize: 12, color: textSecondary, marginTop: 16, textAlign: 'center' },
  })
}
