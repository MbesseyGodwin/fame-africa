// apps/mobile/src/screens/streaming/LiveHostScreen.tsx

import React, { useEffect, useState, useRef } from 'react'
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  ActivityIndicator, Alert, SafeAreaView
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  IRtcEngine,
  RenderModeType
} from 'react-native-agora'
import { useAuth } from '../../context/AuthContext'
import { streamingApi } from '../../utils/api'
import { LinearGradient } from 'expo-linear-gradient'
import { Camera } from 'expo-camera'
import { Audio } from 'expo-av'

const { width, height } = Dimensions.get('window')
const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || 'agora_app_id_placeholder'

export default function LiveHostScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const engine = useRef<IRtcEngine | null>(null)

  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [streamId, setStreamId] = useState<string | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [frontCamera, setFrontCamera] = useState(true)

  useEffect(() => {
    setup()
    return () => {
      engine.current?.leaveChannel()
      engine.current?.release()
    }
  }, [])

  const setup = async () => {
    try {
      // 1. Request Permissions
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync()
      const { status: audioStatus } = await Audio.requestPermissionsAsync()

      if (cameraStatus !== 'granted' || audioStatus !== 'granted') {
        Alert.alert('Permission Required', 'We need camera and microphone access to go live.')
        router.back()
        return
      }

      // 2. Initialize Engine
      engine.current = createAgoraRtcEngine()
      engine.current.initialize({ appId: AGORA_APP_ID })

      engine.current.registerEventHandler({
        onJoinChannelSuccess: (connection, elapsed) => {
          console.log('Host joined channel')
          setIsLive(true)
          setLoading(false)
        },
        onError: (err) => console.error('Agora Error', err)
      })

      engine.current.enableVideo()
      engine.current.startPreview()
      engine.current.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting)
      engine.current.setClientRole(ClientRoleType.ClientRoleBroadcaster)

      setLoading(false)
    } catch (error) {
      console.error('Failed to setup Agora Host', error)
      setLoading(false)
    }
  }

  const goLive = async () => {
    if (!user?.participant?.id) {
      Alert.alert('Error', 'You must be a participant to go live.')
      return
    }

    setLoading(true)
    try {
      // 1. Start Stream on Backend
      const streamRes = await streamingApi.startStream({
        participantId: user.participant.id,
        title: `${user.displayName}'s Live Session`
      })
      const streamData = streamRes.data.data
      setStreamId(streamData.id)

      // 2. Get Token
      const tokenRes = await streamingApi.getToken(streamData.channelName, 'PUBLISHER')
      const token = tokenRes.data.data.token

      // 3. Join Agora Channel
      engine.current?.joinChannel(token, streamData.channelName, 0, {})
    } catch (error: any) {
      Alert.alert('Live Failed', error.message || 'Could not start broadcast')
      setLoading(false)
    }
  }

  const endStream = async () => {
    Alert.alert('End Stream', 'Are you sure you want to end your broadcast?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Now',
        style: 'destructive',
        onPress: async () => {
          if (streamId) {
            await streamingApi.endStream(streamId)
          }
          engine.current?.leaveChannel()
          router.back()
        }
      }
    ])
  }

  const toggleMic = () => {
    setMicOn(!micOn)
    engine.current?.muteLocalAudioStream(micOn)
  }

  const flipCamera = () => {
    setFrontCamera(!frontCamera)
    engine.current?.switchCamera()
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FE2C55" />
        <Text style={styles.loadingText}>Preparing Broadcast...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Local Video Preview */}
      <RtcSurfaceView
        canvas={{ uid: 0, renderMode: RenderModeType.RenderModeHidden }}
        style={StyleSheet.absoluteFill}
      />

      {/* Overlay UI */}
      <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFill}>
        <SafeAreaView style={styles.safeArea}>

          {/* Top Header */}
          <View style={styles.header}>
            <View style={styles.statusBox}>
              <View style={[styles.statusDot, isLive && styles.dotLive]} />
              <Text style={styles.statusText}>{isLive ? 'LIVE' : 'PREVIEW'}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={isLive ? endStream : () => router.back()}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Interaction Area (Viewers/Comments could be here) */}
          <View style={styles.flexArea} />

          {/* Bottom Controls */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.utilBtn} onPress={toggleMic}>
              <Ionicons name={micOn ? "mic" : "mic-off"} size={24} color="#fff" />
            </TouchableOpacity>

            {!isLive ? (
              <TouchableOpacity style={styles.goLiveBtn} onPress={goLive}>
                <Text style={styles.goLiveText}>GO LIVE</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.goLiveBtn, { backgroundColor: '#A32D2D' }]} onPress={endStream}>
                <Text style={styles.goLiveText}>END LIVE</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.utilBtn} onPress={flipCamera}>
              <Ionicons name="camera-reverse" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#fff', marginTop: 16, fontWeight: '600' },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 10
  },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#666' },
  dotLive: { backgroundColor: '#FE2C55' },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  flexArea: { flex: 1 },
  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingBottom: 40, paddingHorizontal: 30
  },
  utilBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  goLiveBtn: { backgroundColor: '#FE2C55', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30 },
  goLiveText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
})
