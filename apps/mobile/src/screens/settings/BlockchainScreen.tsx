import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Linking, ActivityIndicator
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../context/ThemeContext'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { auditApi } from '../../utils/api'

export default function BlockchainScreen() {
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [latestTx, setLatestTx] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await auditApi.getLedger()
        const proofs = res.data.data
        if (proofs && proofs.length > 0) {
          // Find the most recent proof with a txHash
          const proofWithTx = proofs.find((p: any) => p.txHash)
          if (proofWithTx) {
            setLatestTx(proofWithTx.txHash)
          }
        }
      } catch (err) {
        console.error('Failed to fetch ledger:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLedger()
  }, [])

  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad, insets)

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={theme.primaryColor} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Blockchain Transparency</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.iconContainer}>
          <Ionicons name="link-outline" size={60} color={theme.primaryColor} />
        </View>
        <Text style={s.title}>Free, Fair, and Immutable</Text>
        <Text style={s.description}>
          Fame Africa is built on cutting-edge blockchain technology to ensure that every single vote is permanently recorded, transparent, and impossible to tamper with.
        </Text>

        <View style={s.featureCard}>
          <View style={s.featureHeader}>
            <Ionicons name="shield-checkmark" size={20} color="#0F6E56" />
            <Text style={s.featureTitle}>100% Immutable</Text>
          </View>
          <Text style={s.featureText}>
            Once a vote is cast, it is cryptographically sealed and stored on a decentralized ledger. Not even the platform administrators can change or delete a vote.
          </Text>
        </View>

        <View style={s.featureCard}>
          <View style={s.featureHeader}>
            <Ionicons name="eye" size={20} color="#185FA5" />
            <Text style={s.featureTitle}>Publicly Verifiable</Text>
          </View>
          <Text style={s.featureText}>
            The voting ledger is completely open. Anyone can audit the smart contract to verify the integrity of the competition and the authenticity of the results in real-time.
          </Text>
        </View>

        <View style={s.featureCard}>
          <View style={s.featureHeader}>
            <Ionicons name="flash" size={20} color="#F57F17" />
            <Text style={s.featureTitle}>Decentralized Trust</Text>
          </View>
          <Text style={s.featureText}>
            By removing the central point of failure, Fame Africa guarantees that the true voice of the fans determines the winner, eliminating any possibility of bias or manipulation.
          </Text>
        </View>

        <View style={[s.featureCard, { borderColor: theme.primaryColor, backgroundColor: theme.primaryColor + '10' }]}>
          <View style={s.featureHeader}>
            <Ionicons name="list" size={20} color={theme.primaryColor} />
            <Text style={[s.featureTitle, { color: theme.primaryColor }]}>Live Public Ledger</Text>
          </View>
          
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <ActivityIndicator size="small" color={theme.primaryColor} />
              <Text style={[s.featureText, { marginLeft: 8 }]}>Fetching latest blockchain anchor...</Text>
            </View>
          ) : latestTx ? (
            <View>
              <Text style={s.featureText}>
                The latest voting block has been successfully anchored to the Ethereum Sepolia network.
              </Text>
              <TouchableOpacity 
                style={s.ledgerBtn}
                onPress={() => Linking.openURL(`https://sepolia.etherscan.io/tx/${latestTx}`)}
              >
                <Ionicons name="open-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={s.ledgerBtnText}>View on Etherscan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[s.featureText, { marginTop: 8 }]}>
              The first daily voting block is currently pending anchor to the blockchain. Check back later!
            </Text>
          )}
        </View>

        <TouchableOpacity 
          style={s.button}
          onPress={() => router.back()}
        >
          <Text style={s.buttonText}>Got It</Text>
        </TouchableOpacity>
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
      padding: 24,
      paddingBottom: 40,
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: textPrimary,
      textAlign: 'center',
      marginBottom: 12,
    },
    description: {
      fontSize: 15,
      color: textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 32,
    },
    featureCard: {
      backgroundColor: surface,
      borderWidth: 1,
      borderColor: border,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    featureHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: textPrimary,
      marginLeft: 8,
    },
    featureText: {
      fontSize: 14,
      color: textSecondary,
      lineHeight: 20,
    },
    button: {
      backgroundColor: theme.primaryColor,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 24,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    ledgerBtn: {
      backgroundColor: theme.primaryColor,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      alignSelf: 'flex-start',
    },
    ledgerBtnText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    }
  })
}
