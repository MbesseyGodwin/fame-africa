// apps/mobile/src/screens/settings/SettingsScreen.tsx

import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Switch, TextInput,
  ActivityIndicator, Platform, StatusBar,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme, DEFAULT_THEME } from '../../context/ThemeContext'
import { authApi, usersApi } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

const PRESETS = [
  { name: 'Purple', primaryColor: '#534AB7', buttonColor: '#534AB7', headerColor: '#534AB7', accentColor: '#EEEDFE' },
  { name: 'Teal', primaryColor: '#0F6E56', buttonColor: '#0F6E56', headerColor: '#0F6E56', accentColor: '#E1F5EE' },
  { name: 'Coral', primaryColor: '#993C1D', buttonColor: '#D85A30', headerColor: '#993C1D', accentColor: '#FAECE7' },
  { name: 'Blue', primaryColor: '#185FA5', buttonColor: '#378ADD', headerColor: '#185FA5', accentColor: '#E6F1FB' },
  { name: 'Pink', primaryColor: '#993556', buttonColor: '#D4537E', headerColor: '#993556', accentColor: '#FBEAF0' },
  { name: 'Green', primaryColor: '#3B6D11', buttonColor: '#639922', headerColor: '#27500A', accentColor: '#EAF3DE' },
]

const FONT_SIZES = [12, 13, 14, 15, 16, 17]
const RADII = [
  { label: 'Sharp', value: 4 },
  { label: 'Default', value: 8 },
  { label: 'Rounded', value: 14 },
  { label: 'Pill', value: 20 },
]

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { theme, updateTheme, saveTheme, resetTheme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const { user, signOut } = useAuth()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad, insets)

  async function handleSave() {
    setSaving(true)
    try {
      await saveTheme()
      await usersApi.updatePreferences({
        primaryColor: theme.primaryColor,
        buttonColor: theme.buttonColor,
        headerColor: theme.headerColor,
        accentColor: theme.accentColor,
        cardBackground: theme.cardBackground,
        textOnPrimary: theme.textOnPrimary,
        darkMode: theme.darkMode,
        fontFamily: theme.fontFamily,
        fontSize: theme.fontSize,
        lineHeight: theme.lineHeight,
        fontWeight: theme.fontWeight,
        borderRadius: `${theme.borderRadius}px`,
        compactMode: theme.compactMode,
        showAvatars: theme.showAvatars,
        emailNotifications: theme.emailNotifications,
        smsNotifications: theme.smsNotifications,
        pushNotifications: theme.pushNotifications,
      })
      Alert.alert('✓ Saved', 'Your preferences have been saved.')
    } catch {
      Alert.alert('Saved locally', 'Could not sync to server. Changes saved on this device.')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    Alert.alert('Reset preferences', 'This will reset all appearance settings to defaults.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetTheme },
    ])
  }

  async function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently deactivate your account. A security code will be sent to your email to confirm.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Security Code',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true)
              await authApi.requestDeletion(user?.email || '')
              promptForDeletionOtp()
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to request deletion')
            } finally {
              setDeleting(false)
            }
          },
        },
      ]
    )
  }

  function promptForDeletionOtp() {
    Alert.prompt(
      'Verify Deletion',
      'Enter the security code sent to your email to permanently delete your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async (otpCode) => {
            if (!otpCode) return
            try {
              setDeleting(true)
              await authApi.confirmDeletion(otpCode)
              Alert.alert('Account Deleted', 'Your account has been permanently deleted.', [
                { text: 'OK', onPress: signOut },
              ])
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Invalid code. Deletion failed.')
            } finally {
              setDeleting(false)
            }
          },
        },
      ]
    )
  }

  return (
    <View style={s.root}>
      {/* <StatusBar barStyle={theme.darkMode ? 'light-content' : 'dark-content'} /> */}

      {/* ── Fixed Header ─────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={22} color={textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings & Appearance</Text>
        <TouchableOpacity
          style={[s.saveHeaderBtn, saving && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color={theme.textOnPrimary} />
            : <Text style={s.saveHeaderBtnText}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      {/* ── Scrollable content ───────────────────── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ─ Theme presets ───────────────────── */}
        <SectionLabel label="Theme Preset" />
        <View style={s.card}>
          <View style={s.presetRow}>
            {PRESETS.map((preset) => {
              const active = theme.primaryColor === preset.primaryColor
              return (
                <TouchableOpacity
                  key={preset.name}
                  style={[s.presetItem, active && { borderColor: textPrimary, borderWidth: 2 }]}
                  onPress={() => updateTheme(preset)}
                  activeOpacity={0.8}
                >
                  <View style={[s.presetDot, { backgroundColor: preset.primaryColor }]} />
                  <Text style={[s.presetLabel, active && { color: textPrimary, fontWeight: '600' }]}>
                    {preset.name}
                  </Text>
                  {active && (
                    <View style={s.presetCheck}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* ─ Color customization ─────────────── */}
        <SectionLabel label="Colors" />
        <View style={s.card}>
          {[
            { label: 'Primary', key: 'primaryColor' },
            { label: 'Button', key: 'buttonColor' },
            { label: 'Header', key: 'headerColor' },
          ].map(({ label, key }, i, arr) => (
            <View key={key} style={[s.colorRow, i < arr.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: border }]}>
              <Text style={s.colorLabel}>{label}</Text>
              <View style={s.colorInputRow}>
                <View style={[s.colorSwatch, { backgroundColor: (theme as any)[key] }]} />
                <TextInput
                  value={(theme as any)[key]}
                  onChangeText={(v) => v.startsWith('#') && v.length <= 7 && updateTheme({ [key]: v } as any)}
                  style={s.colorInput}
                  maxLength={7}
                  autoCapitalize="characters"
                  placeholderTextColor={textSecondary}
                />
              </View>
            </View>
          ))}
        </View>

        {/* ─ Display ─────────────────────────── */}
        <SectionLabel label="Display" />
        <View style={s.card}>
          {[
            { label: 'Dark Mode', sub: 'Use dark backgrounds throughout the app', key: 'darkMode' },
            { label: 'Compact Mode', sub: 'Reduce spacing and padding in layouts', key: 'compactMode' },
            { label: 'Show Avatars', sub: 'Display profile photos in lists', key: 'showAvatars' },
          ].map((item, i, arr) => (
            <View key={item.key} style={[s.toggleRow, i < arr.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: border }]}>
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={s.toggleLabel}>{item.label}</Text>
                <Text style={s.toggleSub}>{item.sub}</Text>
              </View>
              <Switch
                value={(theme as any)[item.key]}
                onValueChange={(v) => updateTheme({ [item.key]: v } as any)}
                trackColor={{ false: border, true: theme.primaryColor }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        {/* ─ Notifications ───────────────────── */}
        <SectionLabel label="Notifications" />
        <View style={s.card}>
          {[
            { label: 'Email Alerts', sub: 'Get updates delivered to your inbox', key: 'emailNotifications', icon: 'mail-outline' },
            { label: 'SMS Alerts', sub: 'Receive texts for critical events', key: 'smsNotifications', icon: 'chatbubble-ellipses-outline' },
            { label: 'Push Alerts', sub: 'Instant notifications on your device', key: 'pushNotifications', icon: 'notifications-outline' },
          ].map((item, i, arr) => (
            <View key={item.key} style={[s.toggleRow, i < arr.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: border }]}>
              <View style={[s.notifIcon, { backgroundColor: theme.accentColor }]}>
                <Ionicons name={item.icon as any} size={18} color={theme.primaryColor} />
              </View>
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={s.toggleLabel}>{item.label}</Text>
                <Text style={s.toggleSub}>{item.sub}</Text>
              </View>
              <Switch
                value={(theme as any)[item.key]}
                onValueChange={(v) => updateTheme({ [item.key]: v } as any)}
                trackColor={{ false: border, true: theme.primaryColor }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        {/* ─ Font size ───────────────────────── */}
        <SectionLabel label="Text Size" />
        <View style={s.card}>
          <View style={s.chipRow}>
            {FONT_SIZES.map((size) => {
              const active = theme.fontSize === size
              return (
                <TouchableOpacity
                  key={size}
                  style={[s.chip, active && { backgroundColor: theme.primaryColor, borderColor: theme.primaryColor }]}
                  onPress={() => updateTheme({ fontSize: size })}
                >
                  <Text style={[s.chipText, { color: active ? theme.textOnPrimary : textPrimary, fontSize: size }]}>
                    Aa
                  </Text>
                  <Text style={[s.chipSub, { color: active ? theme.textOnPrimary + 'bb' : textSecondary }]}>
                    {size}px
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* ─ Corner style ────────────────────── */}
        <SectionLabel label="Corner Style" />
        <View style={s.card}>
          <View style={s.chipRow}>
            {RADII.map((r) => {
              const active = theme.borderRadius === r.value
              return (
                <TouchableOpacity
                  key={r.value}
                  style={[s.chip, { borderRadius: r.value }, active && { backgroundColor: theme.primaryColor, borderColor: theme.primaryColor }]}
                  onPress={() => updateTheme({ borderRadius: r.value })}
                >
                  <Text style={[s.chipText, { color: active ? theme.textOnPrimary : textPrimary }]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* ─ Live preview ────────────────────── */}
        <SectionLabel label="Live Preview" />
        <View style={[s.previewCard, { backgroundColor: theme.headerColor, borderRadius: theme.borderRadius }]}>
          <Text style={{ color: theme.textOnPrimary, fontSize: theme.fontSize + 4, fontWeight: '700' }}>
            Fame Africa
          </Text>
          <Text style={{ color: theme.textOnPrimary + 'aa', fontSize: theme.fontSize, marginTop: 2 }}>
            Voting is live · Spring 2026
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <View style={[s.previewBtn, { backgroundColor: theme.buttonColor, borderRadius: theme.borderRadius }]}>
              <Text style={{ color: theme.textOnPrimary, fontSize: theme.fontSize - 1, fontWeight: '600' }}>
                Vote Now
              </Text>
            </View>
            <View style={[s.previewBtnOutline, { borderRadius: theme.borderRadius }]}>
              <Text style={{ color: theme.textOnPrimary, fontSize: theme.fontSize - 1, fontWeight: '500' }}>
                View Results
              </Text>
            </View>
          </View>
        </View>

        {/* ─ Reset ───────────────────────────── */}
        <TouchableOpacity style={s.resetBtn} onPress={handleReset}>
          <Ionicons name="refresh-outline" size={16} color={textSecondary} />
          <Text style={s.resetBtnText}>Reset to defaults</Text>
        </TouchableOpacity>

        {/* ─ Danger Zone ─────────────────────── */}
        <SectionLabel label="Danger Zone" color="#D94040" />
        <View style={[s.card, { borderColor: '#D9404033', borderWidth: 1 }]}>
          <Text style={s.dangerText}>
            Permanently deleting your account cannot be undone. You will lose all your voting history and profile data.
          </Text>
          <TouchableOpacity
            style={s.deleteBtn}
            onPress={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting
              ? <ActivityIndicator color="#D94040" size="small" />
              : <>
                <Ionicons name="trash-outline" size={16} color="#D94040" />
                <Text style={s.deleteBtnText}>Delete My Account</Text>
              </>
            }
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />

        <View style={{ alignItems: 'center', paddingBottom: 24, opacity: 0.6 }}>
          <Text style={{ fontSize: 11, color: textSecondary, fontWeight: '600' }}>Fame Africa v1.0.0</Text>
          <Text style={{ fontSize: 10, color: textSecondary, marginTop: 4 }}>A Product of Consolidated Software Solutions Ltd</Text>
        </View>
      </ScrollView>
    </View>
  )
}

// ── Small helpers ─────────────────────────────────────────────
function SectionLabel({ label, color }: { label: string; color?: string }) {
  return (
    <Text style={[sectionLabelStyle.text, color ? { color } : {}]}>{label.toUpperCase()}</Text>
  )
}
const sectionLabelStyle = StyleSheet.create({
  text: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: '#999', marginLeft: 4, marginBottom: 6, marginTop: 20 },
})

// ── Styles ────────────────────────────────────────────────────
function makeStyles(
  theme: any, bg: string, surface: string,
  textPrimary: string, textSecondary: string, border: string, pad: number,
  insets: { top: number; bottom: number }
) {
  const HEADER_H = 56 + insets.top

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: bg },

    // Fixed header
    header: {
      position: 'absolute',
      top: 0, left: 0, right: 0,
      zIndex: 100,
      height: HEADER_H,
      paddingTop: insets.top,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: bg,
      borderBottomWidth: 0.5,
      borderBottomColor: border,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: surface,
      marginRight: 12,
    },
    headerTitle: {
      flex: 1,
      fontSize: 16, fontWeight: '700', color: textPrimary,
    },
    saveHeaderBtn: {
      backgroundColor: theme.primaryColor,
      paddingHorizontal: 16, paddingVertical: 7,
      borderRadius: 20,
      minWidth: 60,
      alignItems: 'center',
    },
    saveHeaderBtnText: { color: theme.textOnPrimary, fontSize: 13, fontWeight: '600' },

    // Scroll
    scroll: { flex: 1, marginTop: HEADER_H },
    content: { paddingHorizontal: 16, paddingBottom: 40 },

    // Card
    card: {
      backgroundColor: surface,
      borderRadius: theme.borderRadius,
      borderWidth: 0.5,
      borderColor: border,
      paddingHorizontal: 16,
      marginBottom: 4,
      overflow: 'hidden',
    },

    // Presets
    presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingVertical: 14 },
    presetItem: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 12, paddingVertical: 8,
      borderRadius: 20, borderWidth: 1, borderColor: border,
      position: 'relative',
    },
    presetDot: { width: 16, height: 16, borderRadius: 8 },
    presetLabel: { fontSize: 12, color: textSecondary },
    presetCheck: {
      position: 'absolute', top: -4, right: -4,
      width: 16, height: 16, borderRadius: 8,
      backgroundColor: '#222', alignItems: 'center', justifyContent: 'center',
    },

    // Color rows
    colorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13 },
    colorLabel: { fontSize: 14, color: textPrimary, fontWeight: '500' },
    colorInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    colorSwatch: { width: 26, height: 26, borderRadius: 6, borderWidth: 0.5, borderColor: border },
    colorInput: {
      borderWidth: 0.5, borderColor: border, borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 5,
      fontSize: 12, color: textPrimary,
      width: 85, letterSpacing: 1,
    },

    // Toggle rows
    toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
    toggleLabel: { fontSize: 14, color: textPrimary, fontWeight: '500', marginBottom: 1 },
    toggleSub: { fontSize: 11, color: textSecondary, lineHeight: 15 },
    notifIcon: {
      width: 34, height: 34, borderRadius: 8,
      alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },

    // Font / radius chips
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 14 },
    chip: {
      borderWidth: 0.5, borderColor: border,
      borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
      alignItems: 'center',
    },
    chipText: { fontWeight: '600' },
    chipSub: { fontSize: 10, marginTop: 2 },

    // Preview
    previewCard: {
      padding: 20, marginBottom: 4,
    },
    previewBtn: { paddingHorizontal: 14, paddingVertical: 9 },
    previewBtnOutline: { paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },

    // Reset
    resetBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, paddingVertical: 16,
    },
    resetBtnText: { fontSize: 13, color: textSecondary },

    // Danger
    dangerText: { fontSize: 13, color: textSecondary, lineHeight: 19, paddingTop: 14, paddingBottom: 12 },
    deleteBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, paddingVertical: 13,
      borderTopWidth: 0.5, borderTopColor: '#D9404033',
    },
    deleteBtnText: { color: '#D94040', fontSize: 14, fontWeight: '600' },
  })
}
