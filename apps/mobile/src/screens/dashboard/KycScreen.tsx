// apps/mobile/src/screens/dashboard/KycScreen.tsx

import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../utils/api'

export default function KycScreen() {
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const { user } = useAuth()
  const router = useRouter()
  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad)

  const [bvn, setBvn] = useState('')
  const [idType, setIdType] = useState('NIN')
  const [idNumber, setIdNumber] = useState('')
  const [idImageUrl, setIdImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const queryClient = useQueryClient()

  // ── Data Fetching ───────────────────────────────────────────
  const { data: kycRes, isLoading: fetchingKyc } = useQuery({
    queryKey: ['kyc-me'],
    queryFn: async () => {
      const res = await api.get('/kyc/me')
      return res.data?.data
    }
  })

  useEffect(() => {
    if (kycRes) {
      setBvn(kycRes.bvn || '')
      setIdType(kycRes.idType || 'NIN')
      setIdNumber(kycRes.idNumber || '')
      setIdImageUrl(kycRes.idImageUrl || '')
      setStatus(kycRes.status || null)
    }
  }, [kycRes])

  const isApproved = status === 'APPROVED'
  const isPending = status === 'PENDING'

  const submitKyc = async () => {
    if (!bvn || !idType || !idNumber) {
      return Alert.alert('Error', 'Please fill all fields, including your ID number.')
    }
    setLoading(true)
    try {
      await api.post('/kyc/submit', {
        bvn,
        idType,
        idNumber,
        idImageUrl: idImageUrl || 'https://example.com/placeholder-id.jpg'
      })
      queryClient.invalidateQueries({ queryKey: ['kyc-me'] })
      Alert.alert('Success', 'Your identity details have been submitted for verification.')
      router.back()
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to submit KYC')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Identity Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {fetchingKyc ? (
          <View style={s.loaderContainer}>
            <ActivityIndicator color={theme.primaryColor} />
            <Text style={s.loaderText}>Retrieving your records...</Text>
          </View>
        ) : (
          <>
            {/* Status Banner */}
            {status && (
              <View style={[
                s.statusBanner, 
                isApproved ? s.statusApproved : isPending ? s.statusPending : s.statusRejected
              ]}>
                <Ionicons 
                  name={isApproved ? "checkmark-circle" : isPending ? "time" : "alert-circle"} 
                  size={20} 
                  color={isApproved ? "#2E7D32" : isPending ? "#E65100" : "#C62828"} 
                />
                <Text style={[s.statusText, { color: isApproved ? "#2E7D32" : isPending ? "#E65100" : "#C62828" }]}>
                  STATUS: {status}
                </Text>
              </View>
            )}

            <View style={s.warningBox}>
              <Ionicons name="shield-checkmark" size={24} color={theme.primaryColor} />
              <Text style={s.warningText}>
                Compliance check: All prize payouts require a verified identity. Your BVN must match your registered name.
              </Text>
            </View>

            <Text style={s.label}>Bank Verification Number (BVN)</Text>
            <TextInput
              style={[s.input, isApproved && s.inputDisabled]}
              placeholder="11-digit BVN"
              placeholderTextColor={textSecondary}
              keyboardType="numeric"
              maxLength={11}
              value={bvn}
              onChangeText={setBvn}
              editable={!isApproved}
            />

            <Text style={s.label}>Identification Type</Text>
            <View style={s.typeSelector}>
              {['NIN', 'PASSPORT', 'VOTER_CARD'].map(type => (
                <TouchableOpacity 
                  key={type} 
                  style={[s.typeChip, idType === type && s.typeChipActive, isApproved && { opacity: 0.5 }]}
                  onPress={() => setIdType(type)}
                  disabled={isApproved}
                >
                  <Text style={[s.typeChipText, idType === type && s.typeChipTextActive]}>
                    {type.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>{idType.replace('_', ' ')} Number</Text>
            <TextInput
              style={[s.input, isApproved && s.inputDisabled]}
              placeholder={`Enter your ${idType.replace('_', ' ')} number`}
              placeholderTextColor={textSecondary}
              value={idNumber}
              onChangeText={setIdNumber}
              editable={!isApproved}
            />

            {!isApproved && (
              <TouchableOpacity 
                style={[s.submitBtn, loading && { opacity: 0.7 }]} 
                onPress={submitKyc} 
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.submitBtnText}>
                    {status ? 'Update My Details' : 'Submit Securely'}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {isApproved && (
              <View style={s.verifiedLock}>
                <Ionicons name="lock-closed" size={16} color={textSecondary} />
                <Text style={s.verifiedLockText}>This identity is verified and locked.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}

function makeStyles(theme: any, bg: string, surface: string, textPrimary: string, textSecondary: string, border: string, pad: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16,
      backgroundColor: surface, borderBottomWidth: 0.5, borderBottomColor: border
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: textPrimary },
    content: { padding: 20 },
    loaderContainer: { padding: 60, alignItems: 'center' },
    loaderText: { marginTop: 12, color: textSecondary, fontSize: 13 },
    warningBox: {
      backgroundColor: theme.accentColor, borderRadius: 12, padding: 16,
      flexDirection: 'row', gap: 12, marginBottom: 24, alignItems: 'center'
    },
    warningText: { flex: 1, fontSize: 13, color: theme.primaryColor, lineHeight: 20 },
    label: { fontSize: 14, fontWeight: '700', color: textPrimary, marginBottom: 8 },
    input: {
      backgroundColor: surface, borderWidth: 1, borderColor: border, borderRadius: 10,
      padding: 16, fontSize: 16, color: textPrimary, marginBottom: 24
    },
    inputDisabled: { backgroundColor: bg, color: textSecondary },
    typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 32, flexWrap: 'wrap' },
    typeChip: {
      paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
      backgroundColor: surface, borderWidth: 1, borderColor: border
    },
    typeChipActive: { backgroundColor: theme.primaryColor, borderColor: theme.primaryColor },
    typeChipText: { fontSize: 13, color: textSecondary, fontWeight: '600' },
    typeChipTextActive: { color: '#fff' },
    statusBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      padding: 16, borderRadius: 12, marginBottom: 24,
      borderWidth: 1,
    },
    statusPending: { backgroundColor: '#FFF3E0', borderColor: '#FFE0B2' },
    statusApproved: { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' },
    statusRejected: { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' },
    statusText: { fontSize: 14, fontWeight: '800' },
    verifiedLock: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      marginTop: 20, padding: 12,
    },
    verifiedLockText: { color: textSecondary, fontSize: 13, fontWeight: '600' },
    submitBtn: {
      backgroundColor: theme.buttonColor, borderRadius: 10, padding: 18, alignItems: 'center',
      shadowColor: theme.buttonColor, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2, shadowRadius: 8, elevation: 4
    },
    submitBtnText: { color: theme.textOnPrimary, fontSize: 16, fontWeight: '800' }
  })
}
