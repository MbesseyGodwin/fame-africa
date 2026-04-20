import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { participantsApi } from '../../utils/api'

export default function WithdrawScreen() {
  const router = useRouter()
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const { user } = useAuth()

  const [step, setStep] = useState<1 | 2>(1)
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)

  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad)

  const handleRequestWithdrawal = async () => {
    setLoading(true)
    try {
      await participantsApi.requestWithdrawal()
      setStep(2)
      Alert.alert('Email Sent', 'Check your inbox for the withdrawal token.')
    } catch (error: any) {
      console.log(error)
      Alert.alert('Error', error.response?.data?.message || 'Failed to request withdrawal.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmWithdrawal = async () => {
    if (!token || token.length < 4) {
      Alert.alert('Invalid Token', 'Please enter a valid withdrawal token.')
      return
    }

    setLoading(true)
    try {
      await participantsApi.confirmWithdrawal(token)
      Alert.alert(
        'Withdrawn',
        'You have successfully withdrawn from the competition.',
        [{ text: 'OK', onPress: () => router.push('/(tabs)/profile') }]
      )
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Invalid or expired token.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.iconContainer}>
          <Ionicons name="warning" size={64} color="#C0392B" />
        </View>

        <Text style={s.title}>Withdrawal Request</Text>

        {step === 1 ? (
          <>
            <Text style={s.description}>
              Warning: Withdrawing from the competition means you will be permanently
              disqualified and removed from the active participants list. This action
              cannot be undone.
            </Text>

            <Text style={s.subWarning}>
              To proceed, we will send a temporary token to your registered email
              address ({user?.email}) to confirm your identity.
            </Text>

            <TouchableOpacity
              style={s.destructiveBtn}
              onPress={handleRequestWithdrawal}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Request Withdrawal</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={s.cancelBtn}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={s.description}>
              We have sent a withdrawal token to your email. Please enter it below
              to confirm your withdrawal.
            </Text>

            <TextInput
              style={s.input}
              placeholder="Enter Token (e.g. A3F8K2P9)"
              placeholderTextColor={textSecondary}
              value={token}
              onChangeText={setToken}
              autoCapitalize="characters"
              editable={!loading}
            />

            <TouchableOpacity
              style={s.destructiveBtn}
              onPress={handleConfirmWithdrawal}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Confirm Withdrawal</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={s.cancelBtn}
              onPress={() => setStep(1)}
              disabled={loading}
            >
              <Text style={s.cancelBtnText}>Back</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function makeStyles(
  theme: any, bg: string, surface: string,
  textPrimary: string, textSecondary: string, border: string, pad: number
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    content: { padding: 24, paddingVertical: 48, alignItems: 'center' },
    iconContainer: {
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: '#FCEBEB',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: 24, fontWeight: '700',
      color: textPrimary, marginBottom: 16,
      textAlign: 'center'
    },
    description: {
      fontSize: 16, color: textPrimary,
      textAlign: 'center', lineHeight: 24,
      marginBottom: 16,
    },
    subWarning: {
      fontSize: 14, color: textSecondary,
      textAlign: 'center', lineHeight: 22,
      marginBottom: 32, fontStyle: 'italic'
    },
    input: {
      width: '100%',
      height: 56,
      borderWidth: 1, borderColor: border,
      borderRadius: pad,
      backgroundColor: surface,
      color: textPrimary,
      paddingHorizontal: 16,
      fontSize: 18,
      textAlign: 'center',
      letterSpacing: 2,
      marginBottom: 32,
    },
    destructiveBtn: {
      backgroundColor: '#C0392B',
      width: '100%', paddingVertical: 16,
      borderRadius: pad,
      alignItems: 'center',
      marginBottom: 16,
    },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    cancelBtn: {
      width: '100%', paddingVertical: 16,
      borderRadius: pad,
      alignItems: 'center',
      backgroundColor: surface,
      borderWidth: 1, borderColor: border
    },
    cancelBtnText: { color: textPrimary, fontSize: 16, fontWeight: '600' }
  })
}
