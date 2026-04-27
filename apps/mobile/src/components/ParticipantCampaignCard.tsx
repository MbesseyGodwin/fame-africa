// apps/mobile/src/components/ParticipantCampaignCard.tsx

import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import QRCode from 'react-native-qrcode-svg'
import { useTheme } from '../context/ThemeContext'

const { width } = Dimensions.get('window')
const CARD_WIDTH = width - 40

interface Props {
  participant: {
    displayName: string
    category?: string
    photoUrl: string
    voteLinkSlug: string
  }
}

export const ParticipantCampaignCard: React.FC<Props> = ({ participant }) => {
  const { theme } = useTheme()
  const voteUrl = `https://fame-africa-web.vercel.app/vote/${participant.voteLinkSlug}`

  return (
    <View style={s.container}>
      <View style={s.card}>
        <Image
          source={{ uri: participant.photoUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={s.gradient}
        />
        
        <View style={s.header}>
          <Text style={s.brand}>FAME AFRICA</Text>
          <View style={s.liveBadge}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>VOTE LIVE</Text>
          </View>
        </View>

        <View style={s.footer}>
          <View style={s.info}>
            <Text style={s.name}>{participant.displayName}</Text>
            <Text style={s.category}>{participant.category?.toUpperCase()}</Text>
          </View>
          
          <View style={s.qrContainer}>
            <QRCode
              value={voteUrl}
              size={70}
              backgroundColor="white"
              color="black"
            />
            <Text style={s.qrLabel}>SCAN TO VOTE</Text>
          </View>
        </View>
      </View>
      <Text style={s.footerBranding}>JOIN THE JOURNEY ON FAME AFRICA</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: '#000',
    borderRadius: 24,
    padding: 10,
    alignItems: 'center',
    overflow: 'hidden',
  },
  card: {
    width: '100%',
    aspectRatio: 1, // Square for social stories
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#222',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  header: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0000',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  info: {
    flex: 1,
    paddingRight: 20,
  },
  name: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
    marginBottom: 4,
  },
  category: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  qrLabel: {
    color: '#000',
    fontSize: 8,
    fontWeight: '900',
  },
  footerBranding: {
    color: '#666',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 15,
    marginBottom: 10,
    letterSpacing: 1,
  },
})
