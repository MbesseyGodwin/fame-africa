import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { participantsApi } from '../../utils/api'

export default function AIBriefingScreen() {
  const { user, isAuthenticated } = useAuth()
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [aiAdvice, setAiAdvice] = useState<any>(null)
  const [usage, setUsage] = useState<any>(null)
  const [loadingAdvice, setLoadingAdvice] = useState(true)

  const fetchAdvice = async () => {
    if (user?.role === 'PARTICIPANT') {
      try {
        setLoadingAdvice(true)
        const res = await participantsApi.getAiAdvice()
        const data = res.data.data
        if (data) {
          setAiAdvice(data.advice)
          setUsage(data.usage)
        }
      } catch (err) {
        setAiAdvice(null)
      } finally {
        setLoadingAdvice(false)
      }
    } else {
      setLoadingAdvice(false)
    }
  }

  const handleGenerateAdvice = async () => {
    try {
      setLoadingAdvice(true)
      const res = await participantsApi.generateAiAdvice()
      const data = res.data.data
      setAiAdvice(data.advice)
      setUsage(data.usage)
      Alert.alert('✨ New Strategy Generated', 'Your new campaign plan is ready! We also sent a copy to your email.')
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to generate advice. Try again later.'
      Alert.alert('Limit Reached', msg)
    } finally {
      setLoadingAdvice(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) fetchAdvice()
  }, [isAuthenticated, user])

  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad, insets)

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={theme.primaryColor} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>AI Strategic Briefing</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="sparkles" size={20} color={theme.primaryColor} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.primaryColor }}>DAILY CAMPAIGN PLAN</Text>
          </View>

          {loadingAdvice ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40 }}>
              <ActivityIndicator size="small" color={theme.primaryColor} />
              <Text style={{ fontSize: 14, color: '#5C54A4' }}>
                Analyzing your daily trends, please wait...
              </Text>
            </View>
          ) : aiAdvice ? (
            <>
              {aiAdvice.createdAt && (
                <Text style={{ fontSize: 12, color: '#8E86DA', marginBottom: 16, fontWeight: '500' }}>
                  Generated: {new Date(aiAdvice.createdAt).toLocaleDateString()} at {new Date(aiAdvice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
              
              <Text style={{ fontSize: 15, color: '#3A3385', lineHeight: 24 }}>
                {aiAdvice.adviceText}
              </Text>

              <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderColor: '#D3D0FB', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontSize: 11, color: '#5C54A4', textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.5 }}>Analysis Mode: {aiAdvice.tone}</Text>
                  <Text style={{ fontSize: 10, color: '#8E86DA', marginTop: 4 }}>Next reset at 00:00 UTC</Text>
                </View>
                {usage && (
                  <View style={{ backgroundColor: '#D3D0FB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                    <Text style={{ fontSize: 11, color: '#3A3385', fontWeight: '800' }}>
                      {usage.attemptsToday}/{usage.dailyLimit} REQUESTS
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={handleGenerateAdvice}
                disabled={usage?.remaining === 0}
                style={{
                  marginTop: 24,
                  backgroundColor: usage?.remaining === 0 ? '#C0BBEB' : theme.primaryColor,
                  paddingVertical: 14,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="sparkles" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
                  {usage?.remaining === 0 ? 'Daily Limit Reached' : 'Get New Strategy'}
                </Text>
              </TouchableOpacity>

              <View style={{ marginTop: 20, backgroundColor: 'rgba(255,255,255,0.5)', padding: 16, borderRadius: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#3A3385', marginBottom: 6 }}>How it works:</Text>
                <Text style={{ fontSize: 12, color: '#5C54A4', lineHeight: 18 }}>
                  Our AI analyzes your current rank, vote trends, and days remaining to build a custom mobilization plan. Check back often for fresh insights!
                </Text>
              </View>
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ fontSize: 15, color: '#5C54A4', textAlign: 'center', marginVertical: 16, opacity: 0.8, lineHeight: 22 }}>
                No campaign advice generated yet. Let the AI analyze your stats and help you win!
              </Text>
              <TouchableOpacity
                onPress={handleGenerateAdvice}
                style={{
                  marginTop: 8,
                  backgroundColor: theme.primaryColor,
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="rocket" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Start Strategy Session</Text>
              </TouchableOpacity>

              <View style={{ marginTop: 24, width: '100%', backgroundColor: 'rgba(255,255,255,0.5)', padding: 16, borderRadius: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#3A3385', marginBottom: 6 }}>How it works:</Text>
                <Text style={{ fontSize: 12, color: '#5C54A4', lineHeight: 18 }}>
                  Our AI analyzes your current rank, vote trends, and days remaining to build a custom mobilization plan.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

function makeStyles(theme: any, bg: string, surface: string, textPrimary: string, textSecondary: string, border: string, pad: number, insets: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: insets.top + 10,
      paddingBottom: 16,
      paddingHorizontal: 16,
      backgroundColor: surface,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    backBtn: {
      padding: 8,
      marginLeft: -8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: textPrimary,
    },
    content: {
      padding: 16,
      paddingBottom: 40,
    },
    card: {
      backgroundColor: '#EEEDFE',
      borderColor: '#D3D0FB',
      borderWidth: 1,
      borderRadius: 12,
      padding: 20,
    }
  })
}
