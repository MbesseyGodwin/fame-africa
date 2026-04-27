import React, { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../utils/api'
import { Ionicons } from '@expo/vector-icons'

export default function VerifyOtpScreen() {
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(60)

  useEffect(() => {
    let timer: any
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [countdown])

  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad, insets)

  async function handleVerify() {
    if (otp.length < 6) {
      Alert.alert('Error', 'Please enter the 6-digit code')
      return
    }
    setLoading(true)
    try {
      await authApi.verifyOtp({ otpCode: otp })
      await refreshUser()
      Alert.alert('Success', 'Phone number verified!', [
        { text: 'Continue', onPress: () => router.replace('/(tabs)/') }
      ])
    } catch (err: any) {
      Alert.alert('Verification failed', err.response?.data?.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    try {
      await authApi.sendOtp({ type: 'verification' })
      setCountdown(60)
      Alert.alert('Sent', 'A new code has been sent to your phone.')
    } catch (err: any) {
      Alert.alert('Error', 'Failed to resend code. Please try again later.')
    } finally {
      setResending(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.container}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>

        <View style={s.header}>
          <Text style={s.title}>Verify your phone</Text>
          <Text style={s.subtitle}>
            We've sent a 6-digit verification code to your registered phone number.
          </Text>
        </View>

        <View style={s.card}>
          <TextInput
            style={s.input}
            value={otp}
            onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            placeholderTextColor={textSecondary}
            keyboardType="numeric"
            maxLength={6}
            autoFocus
          />

          <TouchableOpacity
            style={[s.primaryBtn, (loading || otp.length < 6) && { opacity: 0.6 }]}
            onPress={handleVerify}
            disabled={loading || otp.length < 6}
          >
            <Text style={s.primaryBtnText}>{loading ? 'Verifying...' : 'Verify & Continue'}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Didn't receive code?</Text>
          <TouchableOpacity 
            onPress={handleResend} 
            disabled={countdown > 0 || resending}
          >
            <Text style={[s.link, (countdown > 0 || resending) && { opacity: 0.5 }]}>
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

function makeStyles(theme: any, bg: string, surface: string, textPrimary: string, textSecondary: string, border: string, pad: number, insets: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg, padding: 24, paddingTop: insets.top + 10 },
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
    input: {
      fontSize: 32,
      fontWeight: '700',
      color: textPrimary,
      textAlign: 'center',
      letterSpacing: 12,
      marginBottom: 32,
      paddingVertical: 12,
      borderBottomWidth: 2,
      borderBottomColor: theme.primaryColor,
    },
    primaryBtn: {
      backgroundColor: theme.buttonColor,
      borderRadius: theme.borderRadius,
      padding: 16,
      alignItems: 'center',
    },
    primaryBtnText: { color: theme.textOnPrimary, fontSize: 16, fontWeight: '600' },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32, gap: 8 },
    footerText: { color: textSecondary, fontSize: 14 },
    link: { color: theme.primaryColor, fontSize: 14, fontWeight: '600' },
  })
}
