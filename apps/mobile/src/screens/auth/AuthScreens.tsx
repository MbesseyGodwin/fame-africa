//  apps/mobile/src/screens/auth/AuthScreens.tsx


import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../utils/api'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[0-9]{10,15}$/

function validateEmail(email: string) {
  return EMAIL_REGEX.test(email.trim())
}

function validatePassword(password: string) {
  return password.length >= 8
}

export function LoginScreen() {
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const { signIn } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const s = authStyles(theme, bg, surface, textPrimary, textSecondary, border, pad)

  async function handleLogin() {
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      Alert.alert('Validation Error', 'Please enter your email address')
      return
    }
    if (!validateEmail(trimmedEmail)) {
      Alert.alert('Validation Error', 'Please enter a valid email address')
      return
    }
    if (!password) {
      Alert.alert('Validation Error', 'Please enter your password')
      return
    }

    setLoading(true)
    try {
      const { data } = await authApi.login(trimmedEmail, password)
      await signIn(
        { accessToken: data.data.accessToken, refreshToken: data.data.refreshToken },
        data.data.user
      )
      router.replace('/(tabs)/')
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid credentials. Please try again.'
      Alert.alert('Login failed', msg)
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setEmail('')
    setPassword('')
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <View style={s.logoArea}>
          <Text style={s.logo}>Fame Africa</Text>
          <Text style={s.tagline}>Nigeria's premier voting competition</Text>
        </View>

        <View style={s.card}>
          <Text style={s.formTitle}>Sign in to your account</Text>

          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={s.label}>Password</Text>
          <View style={s.passwordWrapper}>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor={textSecondary}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity style={s.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={s.formActions}>
            <TouchableOpacity style={s.forgotBtn} onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={s.link}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.resetBtn} onPress={handleReset}>
              <Text style={s.resetText}>Reset Form</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.primaryBtn, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={s.primaryBtnText}>{loading ? 'Signing in...' : 'Sign in'}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.bottomRow}>
          <Text style={{ color: textSecondary, fontSize: 13 }}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={s.link}>Register</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.guestBtn}
          onPress={() => router.replace('/(tabs)/')}
        >
          <Text style={{ color: textSecondary, fontSize: 13 }}>Continue as guest (voting only)</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export function RegisterScreen() {
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const { signIn } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ fullName: '', displayName: '', email: '', phone: '', password: '' })
  const [acceptedOath, setAcceptedOath] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const s = authStyles(theme, bg, surface, textPrimary, textSecondary, border, pad)

  function update(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleRegister() {
    const { fullName, email, phone, password } = form
    const trimmedEmail = email.trim()
    const trimmedPhone = phone.trim()
    const trimmedFullName = fullName.trim()

    if (!trimmedFullName || !trimmedEmail || !trimmedPhone || !password) {
      Alert.alert('Error', 'Please fill in all mandatory fields')
      return
    }

    if (!agreedToTerms) {
      Alert.alert('Agreement Required', 'You must agree to the Terms of Service and Privacy Policy to create an account.')
      return
    }

    if (trimmedFullName.length < 3) {
      Alert.alert('Validation Error', 'Full name must be at least 3 characters')
      return
    }

    if (!validateEmail(trimmedEmail)) {
      Alert.alert('Validation Error', 'Please enter a valid email address')
      return
    }

    if (!PHONE_REGEX.test(trimmedPhone)) {
      Alert.alert('Validation Error', 'Please enter a valid phone number')
      return
    }

    if (!validatePassword(password)) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters long')
      return
    }

    setLoading(true)
    try {
      const { data } = await authApi.register({
        ...form,
        email: trimmedEmail,
        phone: trimmedPhone,
        fullName: trimmedFullName,
        displayName: form.displayName.trim() || trimmedFullName.split(' ')[0]
      })
      await signIn(
        { accessToken: data.data.accessToken, refreshToken: data.data.refreshToken },
        data.data.user
      )
      Alert.alert('Welcome!', 'Account created successfully.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/') },
      ])
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.'
      Alert.alert('Registration failed', msg)
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setForm({ fullName: '', displayName: '', email: '', phone: '', password: '' })
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <View style={s.logoArea}>
          <Text style={s.logo}>Fame Africa</Text>
          <Text style={s.tagline}>Create your account</Text>
        </View>

        {!acceptedOath ? (
          <View style={s.oathCard}>
            <View style={s.oathHeader}>
              <View style={s.oathIconCircle}>
                <Ionicons name="shield-checkmark" size={28} color={theme.primaryColor} />
              </View>
              <Text style={s.oathTitle}>The Transparency Oath</Text>
            </View>
            
            <Text style={s.oathSub}>Fame Africa is a professional digital stage. To enter, you must acknowledge our transparency standards:</Text>

            <View style={s.oathList}>
              {[
                { icon: 'trending-up', text: 'Results = Hustle', sub: 'Winning requires active mobilization of your fans. Registration is just the start.' },
                { icon: 'card', text: 'Non-Refundable', sub: 'All fees are digital goods used to power prizes and the platform. No refunds.' },
                { icon: 'person-add', text: 'Identity Verification', sub: 'Government ID matching your account name is mandatory for prize redemption.' },
              ].map((item, i) => (
                <View key={i} style={s.oathItem}>
                  <Ionicons name={item.icon as any} size={20} color={theme.primaryColor} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.oathItemTitle}>{item.text}</Text>
                    <Text style={s.oathItemSub}>{item.sub}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity style={s.primaryBtn} onPress={() => setAcceptedOath(true)}>
              <Text style={s.primaryBtnText}>I Understand & Accept</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.card}>
            {[{ label: 'Full name *', key: 'fullName', placeholder: 'Tunde Idowu', type: 'default' },
            { label: 'Display name', key: 'displayName', placeholder: 'Tunde', type: 'default' },
            { label: 'Email *', key: 'email', placeholder: 'you@example.com', type: 'email-address' },
            { label: 'Phone number *', key: 'phone', placeholder: '08012345678', type: 'phone-pad' },
            { label: 'Password *', key: 'password', placeholder: 'Min 8 characters', type: 'default', secure: true },
            ].map(({ label, key, placeholder, type, secure }) => (
              <View key={key}>
                <Text style={s.label}>{label}</Text>
                <View style={secure ? s.passwordWrapper : null}>
                  <TextInput
                    style={[s.input, secure && { flex: 1, marginBottom: 0 }]}
                    value={(form as any)[key]}
                    onChangeText={(v) => update(key, v)}
                    placeholder={placeholder}
                    placeholderTextColor={textSecondary}
                    keyboardType={type as any}
                    secureTextEntry={secure && !showPassword}
                    autoCapitalize={key === 'email' ? 'none' : 'words'}
                  />
                  {secure && (
                    <TouchableOpacity style={s.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, marginTop: 4 }}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
            >
              <View style={{
                width: 20, height: 20, borderRadius: 4, borderWidth: 1,
                borderColor: agreedToTerms ? theme.primaryColor : border,
                backgroundColor: agreedToTerms ? theme.primaryColor : 'transparent',
                alignItems: 'center', justifyContent: 'center'
              }}>
                {agreedToTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={{ fontSize: 12, color: textSecondary, flex: 1 }}>
                I agree to the <Text style={{ color: theme.primaryColor, fontWeight: '600' }}>Terms of Service</Text> and <Text style={{ color: theme.primaryColor, fontWeight: '600' }}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[s.resetBtn, { alignSelf: 'flex-end', marginTop: -4, marginBottom: 12 }]} onPress={handleReset}>
              <Text style={s.resetText}>Clear All Fields</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.primaryBtn, loading && { opacity: 0.6 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={s.primaryBtnText}>{loading ? 'Creating account...' : 'Create account'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={s.bottomRow}>
          <Text style={{ color: textSecondary, fontSize: 13 }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={s.link}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function authStyles(theme: any, bg: string, surface: string, textPrimary: string, textSecondary: string, border: string, pad: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
    logoArea: { alignItems: 'center', marginBottom: 32 },
    logo: { fontSize: 28, fontWeight: '500', color: theme.primaryColor },
    tagline: { fontSize: 13, color: textSecondary, marginTop: 4 },
    card: {
      backgroundColor: surface,
      borderRadius: theme.borderRadius,
      borderWidth: 0.5, borderColor: border,
      padding: pad + 4, marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    formTitle: { fontSize: 16, fontWeight: '500', color: textPrimary, marginBottom: 16 },
    label: { fontSize: 11, color: textSecondary, marginBottom: 4 },
    input: {
      borderWidth: 0.5, borderColor: border,
      borderRadius: theme.borderRadius / 2,
      padding: 12, fontSize: 13, color: textPrimary,
      backgroundColor: bg, marginBottom: 12,
    },
    primaryBtn: {
      backgroundColor: theme.buttonColor,
      borderRadius: theme.borderRadius, padding: 14, alignItems: 'center', marginTop: 4,
    },
    primaryBtnText: { color: theme.textOnPrimary, fontSize: 14, fontWeight: '500' },
    forgotBtn: { marginBottom: 8 },
    link: { color: theme.primaryColor, fontSize: 13, fontWeight: '500' },
    bottomRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
    guestBtn: { alignItems: 'center', padding: 8 },
    passwordWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 0.5, borderColor: border,
      borderRadius: theme.borderRadius / 2,
      backgroundColor: bg,
      marginBottom: 12,
    },
    eyeIcon: { paddingHorizontal: 12 },
    formActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    resetBtn: { padding: 4 },
    resetText: { color: textSecondary, fontSize: 12, fontStyle: 'italic' },
    
    // Oath Card Styles
    oathCard: {
      backgroundColor: surface,
      borderRadius: theme.borderRadius,
      borderWidth: 1, borderColor: theme.primaryColor + '33',
      padding: 24, marginBottom: 16,
      shadowColor: theme.primaryColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    },
    oathHeader: { alignItems: 'center', marginBottom: 20 },
    oathIconCircle: {
      width: 60, height: 60, borderRadius: 30,
      backgroundColor: theme.primaryColor + '10',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 12,
    },
    oathTitle: { fontSize: 22, fontWeight: '700', color: textPrimary, textAlign: 'center' },
    oathSub: { fontSize: 13, color: textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    oathList: { gap: 16, marginBottom: 30 },
    oathItem: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
    oathItemTitle: { fontSize: 15, fontWeight: '600', color: textPrimary, marginBottom: 2 },
    oathItemSub: { fontSize: 12, color: textSecondary, lineHeight: 18 },
  })
}
