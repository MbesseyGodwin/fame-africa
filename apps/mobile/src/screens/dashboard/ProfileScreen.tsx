// apps/mobile/src/screens/dashboard/ProfileScreen.tsx

import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, RefreshControl
} from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { participantsApi } from '../../utils/api'


export default function ProfileScreen() {
  const { user, signOut, isAuthenticated, refreshUser } = useAuth()
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [aiAdvice, setAiAdvice] = useState<any>(null)
  const [loadingAdvice, setLoadingAdvice] = useState(true)

  const fetchAdvice = async () => {
    if (user?.role === 'PARTICIPANT') {
      try {
        setLoadingAdvice(true)
        const res = await participantsApi.getAiAdvice()
        setAiAdvice(res.data.data)
      } catch (err) {
        setAiAdvice(null)
      } finally {
        setLoadingAdvice(false)
      }
    } else {
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

  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad)

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
        <TouchableOpacity style={s.refreshIconBtn} onPress={handleRefresh} disabled={refreshing}>
          <Ionicons name="refresh" size={24} color={refreshing ? theme.primaryColor : textSecondary} />
        </TouchableOpacity>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <Text style={s.userName}>{user?.fullName}</Text>
        <Text style={s.userEmail}>{user?.email}</Text>
        <View style={s.rolePill}>
          <Text style={s.roleText}>{user?.role || 'Voter'}</Text>
        </View>
      </View>

      {/* ── AI Insights ────────────────────────────── */}
      {user?.role === 'PARTICIPANT' && (
        <View style={[s.section, { backgroundColor: '#EEEDFE', borderColor: '#D3D0FB' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 }}>
            <Text style={{ fontSize: 18, marginRight: 8 }}>✨</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.primaryColor }}>AI Campaign Strategist</Text>
          </View>
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {loadingAdvice ? (
              <Text style={{ fontSize: 13, color: '#5C54A4', textAlign: 'center', marginVertical: 8 }}>
                Analyzing your daily trends...
              </Text>
            ) : aiAdvice ? (
              <>
                <Text style={{ fontSize: 13, color: '#3A3385', lineHeight: 20 }}>
                  {aiAdvice.adviceText}
                </Text>
                <View style={{ marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderColor: '#D3D0FB', flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 10, color: '#5C54A4', textTransform: 'uppercase', fontWeight: '600' }}>Tone: {aiAdvice.tone}</Text>
                  <Text style={{ fontSize: 10, color: '#5C54A4', textTransform: 'uppercase', fontWeight: '600' }}>Generated Today</Text>
                </View>
              </>
            ) : (
              <Text style={{ fontSize: 13, color: '#5C54A4', textAlign: 'center', marginVertical: 8, opacity: 0.7 }}>
                No campaign advice for today. Keep pushing for votes!
              </Text>
            )}
          </View>
        </View>
      )}

      {/* ── Account settings ───────────────────────── */}
      <View style={s.section}>

        <Text style={s.sectionTitle}>Account</Text>


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
              icon="exit-run"
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
  textPrimary: string, textSecondary: string, border: string, pad: number
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    content: { padding: 16, paddingBottom: 48 },

    // Header
    header: { alignItems: 'center', marginBottom: 24, paddingTop: 16, position: 'relative' },
    refreshIconBtn: { position: 'absolute', right: 0, top: 16, padding: 8 },
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