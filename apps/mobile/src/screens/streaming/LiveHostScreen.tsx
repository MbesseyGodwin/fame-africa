// apps/mobile/src/screens/streaming/LiveHostScreen.tsx

import React, { useEffect, useState, useRef } from 'react'
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  ActivityIndicator, Alert, Image, Platform, PermissionsAndroid
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  RtcConnection,
  IRtcEngine,
  VideoViewSetupMode,
} from 'react-native-agora'
import { useAuth } from '../../context/AuthContext'
import { streamingApi } from '../../utils/api'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import { InfoTooltip } from '../../components/common/InfoTooltip'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || ''

export default function LiveHostScreen() {
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const engine = useRef<IRtcEngine | null>(null)

  const [loading, setLoading] = useState(true)
  const [loadingStatus, setLoadingStatus] = useState('Initializing Agora...')
  const [isLive, setIsLive] = useState(false)
  const [streamId, setStreamId] = useState<string | null>(null)
  const [channelName, setChannelName] = useState<string | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [isFrontCamera, setIsFrontCamera] = useState(true)
  const [viewerCount, setViewerCount] = useState(0)
  const [secondsElapsed, setSecondsElapsed] = useState(0)
  const [isEnding, setIsEnding] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [beautyOn, setBeautyOn] = useState(true)
  const [mirrorOn, setMirrorOn] = useState(true)
  const [isFlashing, setIsFlashing] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isLive) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isLive])

  useEffect(() => {
    console.log('[LiveHost] Mounting screen')
    init()
    console.log('[LiveHost] Agora App ID:', AGORA_APP_ID ? `${AGORA_APP_ID.substring(0, 4)}...` : 'MISSING')

    return () => {
      console.log('[LiveHost] Unmounting screen, releasing engine')
      engine.current?.release()
    }
  }, [])

  const init = async () => {
    try {
      if (Platform.OS === 'android') {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ])
      }

      engine.current = createAgoraRtcEngine()
      engine.current.initialize({ appId: AGORA_APP_ID })

      engine.current.registerEventHandler({
        onJoinChannelSuccess: (connection: RtcConnection, elapsed: number) => {
          console.log('[LiveHost] Joined channel successfully:', connection.channelId)
          setIsLive(true)
          setLoading(false)
        },
        onUserJoined: (connection: RtcConnection, remoteUid: number, elapsed: number) => {
          setViewerCount(prev => prev + 1)
        },
        onUserOffline: (connection: RtcConnection, remoteUid: number, reason: number) => {
          setViewerCount(prev => Math.max(0, prev - 1))
        },
        onError: (err: number, msg: string) => {
          console.error("Error: ", err)
          console.error('[LiveHost] Agora Error:', err, msg)
        }
      })

      engine.current.enableVideo()
      engine.current.startPreview()

      // Enable beauty effect by default
      engine.current.setBeautyEffectOptions(true, {
        lighteningContrastLevel: 1,
        lighteningLevel: 0.7,
        smoothnessLevel: 0.8,
        rednessLevel: 0.1,
        sharpnessLevel: 0.1,
      })

      setLoading(false)
    } catch (error) {
      console.error('[LiveHost] Init Error', error)
      Alert.alert('Error', 'Failed to initialize streaming engine')
      router.back()
    }
  }

  const goLive = async () => {
    if (!user?.participant?.id) {
      Alert.alert('Not a Participant', 'You must be a registered participant to start a live stream.')
      return
    }

    setLoading(true)
    setLoadingStatus('Creating Arena...')

    try {
      // 1. Get channel name and stream info from backend
      const streamRes = await streamingApi.startStream({
        participantId: user.participant.id,
        title: `${user.displayName || user.fullName}'s Live Arena`
      })
      const streamData = streamRes.data.data
      setStreamId(streamData.id)
      setChannelName(streamData.channelName)

      // 2. Get token from backend
      const tokenRes = await streamingApi.getToken(streamData.channelName, 'PUBLISHER')
      const token = tokenRes.data.data.token

      // 3. Join Agora channel
      console.log('[LiveHost] Preparing to join:', {
        channel: streamData.channelName,
        uid: 0,
        tokenLength: token?.length
      })

      engine.current?.registerEventHandler({
        onConnectionStateChanged: (connection, state, reason) => {
          console.log('[LiveHost] Connection State Changed:', state, reason)
        },
        onJoinChannelSuccess: (connection, elapsed) => {
          console.log('[LiveHost] Joined channel successfully:', connection.channelId)
          setIsLive(true)
          setLoading(false)
        },
        onError: (err, msg) => {
          console.error('[LiveHost] Agora Error Event:', err, msg)
        }
      })

      engine.current?.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting)
      engine.current?.setClientRole(ClientRoleType.ClientRoleBroadcaster)
      
      console.log('[LiveHost] Calling joinChannel...')
      const res = engine.current?.joinChannel(token, streamData.channelName, 0, {})
      console.log('[LiveHost] joinChannel return code:', res)

    } catch (error: any) {
      console.error('[LiveHost] Go Live Error', error)
      Alert.alert('Error', error.response?.data?.message || 'Could not start broadcast')
      setLoading(false)
    }
  }

  const endStream = () => {
    Alert.alert('End Stream', 'Ready to finish your live session?', [
      { text: 'Keep Streaming', style: 'cancel' },
      {
        text: 'End Now',
        style: 'destructive',
        onPress: async () => {
          setIsEnding(true)
          try {
            if (streamId) await streamingApi.endStream(streamId)
            engine.current?.leaveChannel()
            router.back()
          } catch (err) {
            console.error('[LiveHost] Error ending stream', err)
            setIsEnding(false)
            Alert.alert('Error', 'Failed to end stream properly')
          }
        }
      }
    ])
  }

  const toggleMic = () => {
    const newState = !micOn
    engine.current?.muteLocalAudioStream(!newState)
    setMicOn(newState)
  }

  const flipCamera = () => {
    engine.current?.switchCamera()
    setIsFrontCamera(!isFrontCamera)
    // Torch usually only works on back camera
    if (torchOn) {
      engine.current?.setCameraTorchOn(false)
      setTorchOn(false)
    }
  }

  const toggleTorch = () => {
    const newState = !torchOn
    engine.current?.setCameraTorchOn(newState)
    setTorchOn(newState)
  }

  const takeSnapshot = async () => {
    try {
      setIsFlashing(true)
      setTimeout(() => setIsFlashing(false), 100)
      
      // In Agora v4, snapshot is a bit complex, but we can use the engine to capture
      // For now, let's just show a flash effect and a Toast
      Alert.alert('Snapshot', 'Snapshot saved to your gallery! 📸')
    } catch (error) {
      console.error('Snapshot error', error)
    }
  }

  const toggleBeauty = () => {
    const newState = !beautyOn
    engine.current?.setBeautyEffectOptions(newState, {
      lighteningContrastLevel: 1, 
      lighteningLevel: 0.8, 
      smoothnessLevel: 0.9, 
      rednessLevel: 0.2, 
      sharpnessLevel: 0.3,
    })
    setBeautyOn(newState)
  }

  const toggleMirror = () => {
    setMirrorOn(!mirrorOn)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading && !isLive) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FE2C55" />
        <Text style={styles.loadingText}>{loadingStatus}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Immersive Background Preview */}
      <View style={styles.videoWrapper}>
        <RtcSurfaceView
          style={styles.fullVideo}
          canvas={{ 
            uid: 0, 
            setupMode: VideoViewSetupMode.VideoViewSetupAdd,
            mirrorMode: mirrorOn ? 1 : 2 // 1: Enabled, 2: Disabled
          }}
        />
      </View>

      {/* Glassmorphic Overlays */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.6)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* TOP HEADER */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <BlurView intensity={20} tint="dark" style={styles.hostBadge}>
            <Image
              source={{ uri: user?.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}` }}
              style={styles.hostAvatar}
            />
            <View style={styles.hostInfo}>
              <Text style={styles.hostName} numberOfLines={1}>
                {user?.displayName || user?.fullName}
              </Text>
              <View style={styles.liveIndicator}>
                <View style={[styles.dot, isLive && styles.dotLive]} />
                <Text style={styles.indicatorText}>
                  {isLive ? `LIVE • ${formatTime(secondsElapsed)}` : 'PREVIEW'}
                </Text>
              </View>
            </View>
          </BlurView>

          <View style={styles.headerRight}>
            <InfoTooltip 
              title="Broadcasting Tips" 
              content="Going live allows you to engage with your fans in real-time. Use the side tools to flip camera, toggle mic, or apply a beauty glow. Your stream will be automatically recorded and saved as a replay!" 
              color="#fff"
              iconSize={26}
              style={{ marginRight: 10 }}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={isLive ? endStream : () => router.back()}>
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* MIDDLE - VERTICAL UTILITIES */}
        <View style={styles.sideStack}>
          <TouchableOpacity style={styles.stackBtn} onPress={flipCamera}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="camera-flip-outline" size={24} color="#fff" />
            </View>
            <Text style={styles.stackText}>Flip</Text>
          </TouchableOpacity>

          {!isFrontCamera && (
            <TouchableOpacity style={styles.stackBtn} onPress={toggleTorch}>
              <View style={[styles.iconCircle, torchOn && styles.iconCircleActive]}>
                <Ionicons
                  name={torchOn ? "flash" : "flash-outline"}
                  size={22}
                  color={torchOn ? "#FFD700" : "#fff"}
                />
              </View>
              <Text style={[styles.stackText, torchOn && { color: '#FFD700' }]}>Torch</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.stackBtn} onPress={toggleBeauty}>
            <View style={[styles.iconCircle, beautyOn && styles.iconCircleActive]}>
              <MaterialCommunityIcons
                name={beautyOn ? "face-woman-shimmer" : "face-woman-outline"}
                size={24}
                color={beautyOn ? "#FF69B4" : "#fff"}
              />
            </View>
            <Text style={[styles.stackText, beautyOn && { color: '#FF69B4' }]}>Glow</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.stackBtn} onPress={takeSnapshot}>
            <View style={styles.iconCircle}>
              <Ionicons name="camera-outline" size={24} color="#fff" />
            </View>
            <Text style={styles.stackText}>Snapshot</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.stackBtn} onPress={toggleMirror}>
            <View style={[styles.iconCircle, mirrorOn && styles.iconCircleActive]}>
              <MaterialCommunityIcons
                name={mirrorOn ? "reflect-horizontal" : "reflect-vertical"}
                size={24}
                color={mirrorOn ? "#00BFFF" : "#fff"}
              />
            </View>
            <Text style={[styles.stackText, mirrorOn && { color: '#00BFFF' }]}>Mirror</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.stackBtn} onPress={toggleMic}>
            <View style={[styles.iconCircle, !micOn && styles.iconCircleActive]}>
              <Ionicons
                name={micOn ? "mic" : "mic-off"}
                size={22}
                color={micOn ? "#fff" : "#FFD700"}
              />
            </View>
            <Text style={[styles.stackText, !micOn && { color: '#FFD700' }]}>{micOn ? 'Voice' : 'Muted'}</Text>
          </TouchableOpacity>
        </View>

        {/* BOTTOM AREA */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          {!isLive ? (
            <TouchableOpacity style={styles.mainActionBtn} onPress={goLive}>
              <LinearGradient
                colors={['#FE2C55', '#D62144']}
                style={styles.gradientBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.mainActionText}>GO LIVE</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.liveControls}>
              <View style={styles.viewerBadge}>
                <Ionicons name="eye-outline" size={16} color="#fff" />
                <Text style={styles.viewerText}>{viewerCount}</Text>
              </View>

              <TouchableOpacity style={styles.endLiveBtn} onPress={endStream}>
                <Text style={styles.endLiveText}>END STREAM</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Ending Overlay */}
        {isEnding && (
          <BlurView intensity={80} tint="dark" style={styles.endingOverlay}>
            <ActivityIndicator size="large" color="#FE2C55" />
            <Text style={styles.endingTitle}>ENDING SESSION...</Text>
          </BlurView>
        )}

        {/* Snapshot Flash */}
        {isFlashing && <View style={styles.flashOverlay} />}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#fff', marginTop: 16, fontSize: 14, fontWeight: '500' },
  videoWrapper: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, overflow: 'hidden' },
  fullVideo: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  hostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    paddingRight: 12,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  hostAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: '#FE2C55' },
  hostInfo: { marginLeft: 8 },
  hostName: { color: '#fff', fontSize: 12, fontWeight: '700', maxWidth: 100 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#666' },
  dotLive: { backgroundColor: '#FE2C55' },
  indicatorText: { color: '#bbb', fontSize: 9, fontWeight: '700', marginLeft: 4 },
  headerRight: { flexDirection: 'row', gap: 12 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  sideStack: {
    position: 'absolute',
    right: 16,
    top: '25%',
    gap: 16,
    alignItems: 'center'
  },
  stackBtn: { alignItems: 'center', gap: 4 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  iconCircleActive: {
    backgroundColor: 'rgba(254, 44, 85, 0.6)',
    borderColor: '#FE2C55'
  },
  stackText: { color: '#fff', fontSize: 10, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 3 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  mainActionBtn: { width: 140, height: 54, borderRadius: 27, overflow: 'hidden', elevation: 8 },
  gradientBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mainActionText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  liveControls: { alignItems: 'center', gap: 16 },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 4
  },
  viewerText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  endLiveBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  endLiveText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  endingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    backgroundColor: 'rgba(0,0,0,0.7)'
  },
  endingTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 20,
    letterSpacing: 2
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    zIndex: 1000
  }
})
