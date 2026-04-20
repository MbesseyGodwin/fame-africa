import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useTheme } from '../../context/ThemeContext'
import { authApi } from '../../utils/api'
import { Ionicons } from '@expo/vector-icons'

export default function ForgotPasswordScreen() {
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'success'>('email')

  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad)

  async function handleSubmit() {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }
    setLoading(true)
    try {
      await authApi.forgotPassword(email.trim())
      setStep('success')
    } catch (err: any) {
      // The backend always returns 200 even if email not found (security)
      // So if we get here, it's a real network/server error
      Alert.alert('Error', err.response?.data?.message || 'Failed to send recovery email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.container}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>

        {step === 'email' ? (
          <View>
            <View style={s.header}>
              <Text style={s.title}>Reset Password</Text>
              <Text style={s.subtitle}>
                Enter your email address and we'll send you instructions to reset your password.
              </Text>
            </View>

            <View style={s.card}>
              <Text style={s.label}>Email Address</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[s.primaryBtn, loading && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={s.primaryBtnText}>{loading ? 'Sending...' : 'Send Reset Link'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={s.successArea}>
            <View style={s.iconCircle}>
              <Ionicons name="mail-open" size={40} color={theme.primaryColor} />
            </View>
            <Text style={s.successTitle}>Check your email</Text>
            <Text style={s.successSub}>
              We've sent a password recovery link to {email}. Please check your inbox and follow the instructions.
            </Text>
            <TouchableOpacity style={s.primaryBtn} onPress={() => router.replace('/(auth)/login')}>
              <Text style={s.primaryBtnText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

function makeStyles(theme: any, bg: string, surface: string, textPrimary: string, textSecondary: string, border: string, pad: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg, padding: 24, paddingTop: 60 },
    backBtn: { marginBottom: 32 },
    header: { marginBottom: 32 },
    title: { fontSize: 28, fontWeight: '700', color: textPrimary, marginBottom: 8 },
    subtitle: { fontSize: 15, color: textSecondary, lineHeight: 22 },
    card: {
      backgroundColor: surface,
      borderRadius: theme.borderRadius,
      padding: 24,
      borderWidth: 0.5, borderColor: border,
    },
    label: { fontSize: 13, fontWeight: '600', color: textSecondary, marginBottom: 8 },
    input: {
      backgroundColor: bg,
      borderWidth: 1, borderColor: border,
      borderRadius: 12, padding: 14,
      fontSize: 15, color: textPrimary,
      marginBottom: 24,
    },
    primaryBtn: {
      backgroundColor: theme.buttonColor,
      borderRadius: theme.borderRadius,
      padding: 16,
      alignItems: 'center',
      width: '100%',
    },
    primaryBtnText: { color: theme.textOnPrimary, fontSize: 16, fontWeight: '600' },
    successArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100 },
    iconCircle: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: theme.accentColor,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 24,
    },
    successTitle: { fontSize: 24, fontWeight: '700', color: textPrimary, marginBottom: 12 },
    successSub: { fontSize: 15, color: textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  })
}
