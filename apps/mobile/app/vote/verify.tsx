import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../src/context/ThemeContext'
import { auditApi } from '../../src/utils/api'

export default function VoteVerifyScreen() {
  const { theme, bg, surface, textPrimary, textSecondary } = useTheme()
  const router = useRouter()
  
  const [voteId, setVoteId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async () => {
    if (!voteId.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await auditApi.verifyVote(voteId.trim())
      setResult(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Please check the Vote ID.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={48} color={theme.primaryColor} style={{ marginBottom: 12 }} />
        <Text style={[styles.title, { color: textPrimary }]}>Vote Verification</Text>
        <Text style={[styles.subtitle, { color: textSecondary }]}>
          Independent cryptographic verification. Paste your Vote ID to confirm it is anchored to the public blockchain.
        </Text>
      </View>

      {/* Input Form */}
      <View style={[styles.card, { backgroundColor: surface, borderColor: theme.border }]}>
        <Text style={[styles.inputLabel, { color: textPrimary }]}>Enter Vote ID</Text>
        <TextInput
          style={[styles.input, { color: textPrimary, borderColor: theme.border }]}
          placeholder="e.g. cly...12345"
          placeholderTextColor={textSecondary}
          value={voteId}
          onChangeText={setVoteId}
          autoCapitalize="none"
        />
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.buttonColor, opacity: !voteId.trim() ? 0.6 : 1 }]} 
          onPress={handleVerify}
          disabled={loading || !voteId.trim()}
        >
          {loading ? (
            <ActivityIndicator color={theme.textOnPrimary} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.textOnPrimary }]}>Verify Cryptographic Proof</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Results */}
      {error && (
        <View style={[styles.resultCard, { backgroundColor: '#FCEBEB', borderColor: '#F5C6C6' }]}>
          <Text style={{ color: '#A32D2D', textAlign: 'center' }}>{error}</Text>
        </View>
      )}

      {result && result.status !== 'VERIFIED' && (
        <View style={[styles.resultCard, { backgroundColor: '#FEF9E6', borderColor: '#FBEBBA' }]}>
          <Text style={{ color: '#9E6C00', fontWeight: '600', marginBottom: 4 }}>Vote Recorded</Text>
          <Text style={{ color: '#9E6C00', fontSize: 13 }}>{result.message}</Text>
        </View>
      )}

      {result && result.status === 'VERIFIED' && (
        <View style={[styles.resultCard, { backgroundColor: '#EAF3DE', borderColor: '#D1E6B9' }]}>
          <View style={styles.successHeader}>
            <Ionicons name="checkmark-circle" size={24} color="#3B6D11" />
            <Text style={styles.successTitle}>Verify Success</Text>
          </View>
          
          <View style={styles.dataBox}>
            <Text style={styles.dataLabel}>Your Vote Hash</Text>
            <Text style={styles.dataValue} selectable>{result.voteHash}</Text>
          </View>

          <View style={styles.dataBox}>
            <Text style={styles.dataLabel}>Daily Merkle Root</Text>
            <Text style={[styles.dataValue, { color: '#3B6D11' }]} selectable>{result.merkleRoot}</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Date: {new Date(result.auditDate).toLocaleDateString()}</Text>
            <Text style={styles.infoText}>Inclusion Path: {result.proof.length} sibling hashes</Text>
          </View>

          {result.txHash && (
            <View style={styles.txBox}>
              <Text style={styles.txText}>Anchored to EVM Blockchain</Text>
            </View>
          )}
        </View>
      )}

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 12 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  inputLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 15,
  },
  button: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontWeight: '600', fontSize: 15 },
  resultCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  successHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, justifyContent: 'center' },
  successTitle: { fontSize: 18, fontWeight: '600', color: '#3B6D11' },
  dataBox: { backgroundColor: '#F9FBF6', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#D1E6B9' },
  dataLabel: { fontSize: 11, color: '#3B6D11', textTransform: 'uppercase', marginBottom: 4, fontWeight: '600' },
  dataValue: { fontSize: 11, color: '#2C520C' },
  infoBox: { marginTop: 4 },
  infoText: { fontSize: 12, color: '#555', marginBottom: 4 },
  txBox: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderColor: '#D1E6B9', alignItems: 'center' },
  txText: { fontSize: 12, fontWeight: '600', color: '#3B6D11' },
})
