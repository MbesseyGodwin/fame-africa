import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, StatusBar } from 'react-native'
import { useRouter } from 'expo-router'
import { useTheme } from '../../context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'

export default function WelcomeScreen() {
  const router = useRouter()
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()

  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad)

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* Hero Section */}
      <View style={s.hero}>
        <View style={s.logoCircle}>
          <Text style={s.logoText}>FA</Text>
        </View>
        <Text style={s.title}>FameAfrica</Text>
        <Text style={s.tagline}>Africa’s Digital Stage for Rising Stars</Text>
      </View>

      {/* Content Area */}
      <View style={s.footer}>
        <Text style={s.welcomeText}>Focused on Fame and Content Creation. Empowering voices through secure voting.</Text>

        <View style={s.btnGroup}>
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={s.primaryBtnText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.secondaryBtn}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={s.secondaryBtnText}>Sign In to Account</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={s.guestBtn}
          onPress={() => router.replace('/(tabs)/')}
        >
          <Text style={s.guestBtnText}>Continue as guest (voting only)</Text>
        </TouchableOpacity>

        <Text style={s.version}>Version 1.0.0</Text>
      </View>
    </View>
  )
}

function makeStyles(theme: any, bg: string, surface: string, textPrimary: string, textSecondary: string, border: string, pad: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.primaryColor },
    hero: {
      flex: 0.7,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    logoText: {
      color: '#fff',
      fontSize: 32,
      fontWeight: '700',
    },
    title: {
      color: '#fff',
      fontSize: 42,
      fontWeight: '800',
      letterSpacing: -1,
    },
    tagline: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 16,
      marginTop: 8,
      textAlign: 'center',
    },
    footer: {
      flex: 1,
      backgroundColor: bg,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      padding: 32,
      alignItems: 'center',
    },
    welcomeText: {
      fontSize: 18,
      color: textPrimary,
      textAlign: 'center',
      lineHeight: 26,
      marginBottom: 40,
      fontWeight: '500',
    },
    btnGroup: {
      width: '100%',
      gap: 12,
      marginBottom: 32,
    },
    primaryBtn: {
      backgroundColor: theme.buttonColor,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 18,
      borderRadius: 16,
      gap: 8,
      shadowColor: theme.primaryColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    primaryBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryBtn: {
      backgroundColor: surface,
      borderWidth: 1,
      borderColor: border,
      padding: 18,
      borderRadius: 16,
      alignItems: 'center',
    },
    secondaryBtnText: {
      color: textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    guestBtn: {
      padding: 12,
    },
    guestBtnText: {
      color: textSecondary,
      fontSize: 14,
      fontWeight: '500',
      textDecorationLine: 'underline',
    },
    version: {
      position: 'absolute',
      bottom: 12,
      fontSize: 10,
      color: textSecondary,
      opacity: 0.5,
    },
  })
}
