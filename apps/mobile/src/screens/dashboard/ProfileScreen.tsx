// apps/mobile/src/screens/dashboard/ProfileScreen.tsx

import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, RefreshControl,
  ActivityIndicator
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { participantsApi } from '../../utils/api'
import { InfoTooltip } from '../../components/common/InfoTooltip'


export default function ProfileScreen() {
  const { user, signOut, isAuthenticated, refreshUser } = useAuth()
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [refreshing, setRefreshing] = useState(false)
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

  React.useEffect(() => {
    if (isAuthenticated) fetchAdvice()
  }, [isAuthenticated, user])

  const handleRefresh = async () => {
    setRefreshing(true)
    if (refreshUser) {
      await refreshUser()
    }
    await fetchAdvice()
    setRefreshing(false)
  }

  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad, insets)

  if (!isAuthenticated) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Ionicons name="person-circle-outline" size={80} color={textSecondary} />
        <Text style={s.title}>Sign in to your account</Text>
        <Text style={s.subtitle}>
          Log in to manage your profile, view your votes, and more.
        </Text>
        <TouchableOpacity style={s.primaryBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={s.primaryBtnText}>Sign In / Register</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const initials = user?.fullName?.slice(0, 2).toUpperCase() || 'U'

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.primaryColor}
        />
      }
    >

      {/* ── Profile header ─────────────────────────── */}
      <View style={s.header}>
        <View style={{ position: 'absolute', left: 2, right: 2, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 }}>
          <TouchableOpacity style={s.backIconBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.primaryColor} />
          </TouchableOpacity>
          <TouchableOpacity style={s.refreshIconBtn} onPress={handleRefresh} disabled={refreshing}>
            <Ionicons name="refresh" size={24} color={refreshing ? theme.primaryColor : textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <Text style={s.userName}>{user?.fullName}</Text>
        <Text style={s.userEmail}>{user?.email}</Text>
        <View style={s.rolePill}>
          <Text style={s.roleText}>{user?.role || 'Voter'}</Text>
        </View>
        <InfoTooltip
          title="Your Profile"
          content="This is your personal dashboard. Participants can see AI-generated campaign advice here. Fans can see their stans and past votes. Make sure your role is correct to access the right features!"
          style={{ marginTop: 10 }}
        />
      </View>

      {/* ── AI Insights ────────────────────────────── */}
      {user?.role === 'PARTICIPANT' && (
        <View style={[s.section, { backgroundColor: '#EEEDFE', borderColor: '#D3D0FB' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 }}>
            {/* <Text style={{ fontSize: 18, marginRight: 8 }}>✨</Text> */}
            <Text style={{ fontSize: 14, fontWeight: '700', color: theme.primaryColor, letterSpacing: 0.5 }}>AI STRATEGIC BRIEFING</Text>
            {aiAdvice && (
              <View style={{ marginLeft: 'auto', backgroundColor: theme.primaryColor, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ fontSize: 8, color: '#fff', fontWeight: '800' }}>LATEST</Text>
              </View>
            )}
          </View>
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {loadingAdvice ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <ActivityIndicator size="small" color={theme.primaryColor} />
                <Text style={{ fontSize: 13, color: '#5C54A4' }}>
                  Analyzing your daily trends, please wait...
                </Text>
              </View>
            ) : aiAdvice ? (
              <>
                {aiAdvice.createdAt && (
                  <Text style={{ fontSize: 11, color: '#8E86DA', marginBottom: 12, fontWeight: '500' }}>
                    Generated: {new Date(aiAdvice.createdAt).toLocaleDateString()} at {new Date(aiAdvice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
                
                <Text style={{ fontSize: 13, color: '#3A3385', lineHeight: 22 }}>
                  {aiAdvice.adviceText}
                </Text>

                <View style={{ marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderColor: '#D3D0FB', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontSize: 10, color: '#5C54A4', textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.5 }}>Analysis Mode: {aiAdvice.tone}</Text>
                    <Text style={{ fontSize: 9, color: '#8E86DA', marginTop: 2 }}>Next reset at 00:00 UTC</Text>
                  </View>
                  {usage && (
                    <View style={{ backgroundColor: '#D3D0FB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                      <Text style={{ fontSize: 10, color: '#3A3385', fontWeight: '800' }}>
                        {usage.attemptsToday}/{usage.dailyLimit} REQUESTS
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={handleGenerateAdvice}
                  disabled={usage?.remaining === 0}
                  style={{
                    marginTop: 16,
                    backgroundColor: usage?.remaining === 0 ? '#C0BBEB' : theme.primaryColor,
                    paddingVertical: 12,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="sparkles" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
                    {usage?.remaining === 0 ? 'Daily Limit Reached' : 'Get New Strategy'}
                  </Text>
                </TouchableOpacity>

                <View style={{ marginTop: 16, backgroundColor: 'rgba(255,255,255,0.5)', padding: 12, borderRadius: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#3A3385', marginBottom: 4 }}>How it works:</Text>
                  <Text style={{ fontSize: 10, color: '#5C54A4', lineHeight: 15 }}>
                    Our AI analyzes your current rank, vote trends, and days remaining to build a custom mobilization plan. Check back often for fresh insights!
                  </Text>
                </View>
              </>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#5C54A4', textAlign: 'center', marginVertical: 8, opacity: 0.7 }}>
                  No campaign advice generated yet. Let the AI help you win!
                </Text>
                <TouchableOpacity
                  onPress={handleGenerateAdvice}
                  style={{
                    marginTop: 8,
                    backgroundColor: theme.primaryColor,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="rocket" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Start Strategy Session</Text>
                </TouchableOpacity>

                <View style={{ marginTop: 16, width: '100%', backgroundColor: 'rgba(255,255,255,0.5)', padding: 12, borderRadius: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#3A3385', marginBottom: 4 }}>How it works:</Text>
                  <Text style={{ fontSize: 10, color: '#5C54A4', lineHeight: 15 }}>
                    Our AI analyzes your current rank, vote trends, and days remaining to build a custom mobilization plan.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* ── Account settings ───────────────────────── */}
      <View style={s.section}>

        <Text style={s.sectionTitle}>Account</Text>

        {user?.role === 'PARTICIPANT' && (
          <MenuItem
            icon="rocket"
            iconBg="#EAF3DE"
            iconColor="#3B6D11"
            label="Mobilize (Dashboard)"
            onPress={() => router.push('/dashboard')}
            border={border}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
          />
        )}


        <MenuItem
          icon="person"
          iconBg="#EEEDFE"
          iconColor={theme.primaryColor}
          label="Edit Profile"
          onPress={() => router.push('/dashboard/edit-profile')}
          border={border}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />

        <MenuItem
          icon="shield-checkmark"
          iconBg="#EEEDFE"
          iconColor={theme.primaryColor}
          label="KYC & Verification"
          onPress={() => router.push('/dashboard/kyc')}
          border={border}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />

        <MenuItem
          icon="notifications"
          iconBg="#EAF3DE"
          iconColor="#3B6D11"
          label="Notifications"
          onPress={() => router.push('/(tabs)/notifications')}
          border={border}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />

        {user?.role === 'VOTER' && (
          <MenuItem
            icon="trophy"
            iconBg="#FBEAF0"
            iconColor="#993556"
            label="Join Competition"
            onPress={() => router.push('/participants/register')}
            border={border}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
          />
        )}

        {user?.role === 'PARTICIPANT' && (
          <>
            <MenuItem
              icon="trophy"
              iconBg="#FFF9C4"
              iconColor="#F57F17"
              label="Edit Competition Bio"
              onPress={() => router.push('/participants/edit-profile')}
              border={border}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
            />
            <MenuItem
              icon="images"
              iconBg="#F5E6FF"
              iconColor="#9C27B0"
              label="Video Portfolio"
              onPress={() => router.push('/participants/gallery')}
              border={border}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
            />
            <MenuItem
              icon="trending-up"
              iconBg="#E6F1FB"
              iconColor="#185FA5"
              label="My Performance"
              onPress={() => router.push('/dashboard/analytics')}
              border={border}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
            />
            <MenuItem
              icon="exit-outline"
              iconBg="#FCEBEB"
              iconColor="#A32D2D"
              label="Withdraw from Competition"
              onPress={() => router.push('/dashboard/withdraw')}
              border={border}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
            />
          </>
        )}
      </View>

      {/* ── App settings ───────────────────────────── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>App</Text>

        <MenuItem
          icon="color-palette"
          iconBg="#EEEDFE"
          iconColor={theme.primaryColor}
          label="Settings & Appearance"
          onPress={() => router.push('/settings')}
          border={border}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />

        <MenuItem
          icon="shield-checkmark"
          iconBg="#FCEBEB"
          iconColor="#A32D2D"
          label="Security & Password"
          onPress={() => router.push('/settings/security')}
          border={border}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />

        <MenuItem
          icon="help-buoy"
          iconBg="#E1F5EE"
          iconColor="#0F6E56"
          label="Help & Support"
          onPress={() => router.push('/settings/support')}
          border={border}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />

        <MenuItem
          icon="document-text"
          iconBg="#F0F0F0"
          iconColor="#555555"
          label="Privacy & Legal"
          onPress={() => router.push('/settings/legal')}
          border={border}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />

        <MenuItem
          icon="information-circle"
          iconBg="#E6F1FB"
          iconColor="#185FA5"
          label="About Fame Africa"
          onPress={() => router.push('/about' as any)}
          border={border}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          last
        />
      </View>

      {/* ── Sign out ───────────────────────────────── */}
      <TouchableOpacity
        style={s.logoutBtn}
        onPress={() => {
          Alert.alert(
            'Sign Out',
            'Are you sure you want to log out?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Log Out', style: 'destructive', onPress: signOut },
            ]
          )
        }}
      >
        <Ionicons name="log-out-outline" size={20} color="#A32D2D" />
        <Text style={s.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={s.version}>Fame Africa v1.0.0</Text>
      <Text style={[s.version, { marginTop: 0 }]}>A Product of Consolidated Software Solutions Ltd</Text>
    </ScrollView>
  )
}

// ── Reusable menu row ─────────────────────────────────────────
interface MenuItemProps {
  icon: any
  iconBg: string
  iconColor: string
  label: string
  onPress: () => void
  border: string
  textPrimary: string
  textSecondary: string
  last?: boolean
}

function MenuItem({ icon, iconBg, iconColor, label, onPress, border, textPrimary, textSecondary, last }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[
        menuStyles.row,
        { borderBottomColor: border, borderBottomWidth: last ? 0 : 0.5 },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[menuStyles.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={[menuStyles.label, { color: textPrimary }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={textSecondary} />
    </TouchableOpacity>
  )
}

const menuStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 12,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  label: { flex: 1, fontSize: 14 },
})

function makeStyles(
  theme: any, bg: string, surface: string,
  textPrimary: string, textSecondary: string, border: string, pad: number, insets: any
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    content: { padding: 16, paddingBottom: 48 },

    // Header
    header: { alignItems: 'center', marginBottom: 24, paddingTop: insets.top + 10, position: 'relative' },
    refreshIconBtn: {
      position: 'absolute', right: 0,
      top: insets.top + 10,
      zIndex: 10,
      backgroundColor: theme.primaryColor + '18',
      marginLeft: 10,
      padding: 8,
      borderRadius: 20,
      marginRight: 10,
      marginTop: 10,
      marginBottom: 10,
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },

    backIconBtn: {
      position: 'absolute', left: 0,
      top: insets.top + 10,
      zIndex: 10,
      backgroundColor: theme.primaryColor + '18',
      marginLeft: 10,
      padding: 8,
      borderRadius: 20,
      marginRight: 10,
      marginTop: 10,
      marginBottom: 10,
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },

    avatar: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: theme.accentColor,
      alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    avatarText: { color: theme.primaryColor, fontSize: 26, fontWeight: '600' },
    userName: { fontSize: 20, fontWeight: '600', color: textPrimary, marginBottom: 2 },
    userEmail: { fontSize: 13, color: textSecondary },
    rolePill: {
      backgroundColor: theme.primaryColor + '18',
      paddingHorizontal: 12, paddingVertical: 4,
      borderRadius: 20, marginTop: 10,
    },
    roleText: {
      color: theme.primaryColor, fontSize: 11,
      fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5,
    },

    // Not-authenticated state
    title: { fontSize: 20, fontWeight: '600', color: textPrimary, marginTop: 16, textAlign: 'center' },
    subtitle: { fontSize: 14, color: textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 20 },

    // Sections
    section: {
      backgroundColor: surface,
      borderRadius: theme.borderRadius,
      borderWidth: 0.5, borderColor: border,
      paddingHorizontal: 4,
      marginBottom: 16,
      overflow: 'hidden',
    },
    sectionTitle: {
      fontSize: 11, fontWeight: '600', color: textSecondary,
      textTransform: 'uppercase', letterSpacing: 0.8,
      marginLeft: 12, marginTop: 12, marginBottom: 4,
    },

    // Buttons
    primaryBtn: {
      backgroundColor: theme.buttonColor,
      paddingHorizontal: 28, paddingVertical: 13,
      borderRadius: theme.borderRadius,
      marginTop: 4,
    },
    primaryBtnText: { color: theme.textOnPrimary, fontSize: 14, fontWeight: '600' },
    logoutBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      paddingVertical: 16, gap: 8,
    },
    logoutText: { color: '#A32D2D', fontSize: 14, fontWeight: '500' },
    version: { textAlign: 'center', fontSize: 11, color: textSecondary, marginTop: 4, marginBottom: 8 },
  })
}