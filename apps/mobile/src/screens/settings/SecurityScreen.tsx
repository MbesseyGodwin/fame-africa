import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native'
import { useRouter } from 'expo-router'
import { useTheme } from '../../context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'

import { usersApi } from '../../utils/api'

export default function SecurityScreen() {
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  })

  async function handleUpdatePassword() {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }
    if (passwords.new !== passwords.confirm) {
      Alert.alert('Error', 'New passwords do not match')
      return
    }
    if (passwords.new.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      await usersApi.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new
      })
      Alert.alert('Success', 'Password updated successfully')
      router.back()
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad)

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Security</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={s.content}>
          <View style={s.section}>
            <Text style={s.sectionTitle}>Change Password</Text>
            
            <Text style={s.label}>Current Password</Text>
            <TextInput
              style={s.input}
              value={passwords.current}
              onChangeText={(v) => setPasswords({...passwords, current: v})}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={textSecondary}
            />

            <Text style={s.label}>New Password</Text>
            <TextInput
              style={s.input}
              value={passwords.new}
              onChangeText={(v) => setPasswords({...passwords, new: v})}
              secureTextEntry
              placeholder="Min 8 characters"
              placeholderTextColor={textSecondary}
            />

            <Text style={s.label}>Confirm New Password</Text>
            <TextInput
              style={s.input}
              value={passwords.confirm}
              onChangeText={(v) => setPasswords({...passwords, confirm: v})}
              secureTextEntry
              placeholder="Confirm new password"
              placeholderTextColor={textSecondary}
            />

            <TouchableOpacity 
              style={[s.primaryBtn, loading && { opacity: 0.7 }]} 
              onPress={handleUpdatePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.primaryBtnText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Login Activity</Text>
            <TouchableOpacity style={s.row}>
              <View style={s.iconBox}>
                <Ionicons name="phone-portrait-outline" size={20} color={theme.primaryColor} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.rowTitle}>This Device</Text>
                <Text style={s.rowSub}>Lagos, Nigeria · Active now</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={s.row}>
              <View style={s.iconBox}>
                <Ionicons name="desktop-outline" size={20} color={textSecondary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.rowTitle}>Chrome on Windows</Text>
                <Text style={s.rowSub}>Ibadan, Nigeria · 2 days ago</Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.dangerBtn}>
            <Text style={s.dangerBtnText}>Sign out of all other devices</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
    headerTitle: { fontSize: 18, fontWeight: '700', color: textPrimary },
    content: { padding: 20 },
    section: {
      backgroundColor: surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 0.5,
      borderColor: border,
      marginBottom: 20,
    },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '600', color: textPrimary, marginBottom: 8 },
    input: {
      backgroundColor: bg,
      borderWidth: 1,
      borderColor: border,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      color: textPrimary,
      marginBottom: 20,
    },
    primaryBtn: {
      backgroundColor: theme.buttonColor,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 10,
    },
    primaryBtnText: { color: theme.textOnPrimary, fontSize: 16, fontWeight: '600' },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: border + '20', alignItems: 'center', justifyContent: 'center' },
    rowTitle: { fontSize: 15, fontWeight: '600', color: textPrimary },
    rowSub: { fontSize: 12, color: textSecondary, marginTop: 2 },
    dangerBtn: { padding: 16, alignItems: 'center' },
    dangerBtnText: { color: '#E53935', fontSize: 14, fontWeight: '600' },
  })
}
