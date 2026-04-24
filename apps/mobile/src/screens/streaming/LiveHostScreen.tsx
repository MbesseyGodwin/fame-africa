// apps/mobile/src/screens/streaming/LiveHostScreen.tsx

import React, { useEffect, useState, useRef } from 'react'
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  ActivityIndicator, Alert, Image, Platform
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  IRtcEngine,
  RenderModeType,
  AudioProfileType,
  AudioScenarioType,
  VideoMirrorModeType
} from 'react-native-agora'
import { useAuth } from '../../context/AuthContext'
import { streamingApi } from '../../utils/api'
import { LinearGradient } from 'expo-linear-gradient'
import { Camera } from 'expo-camera'
import { Audio } from 'expo-av'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || '4e5cdfdfdf844827a80023bbc9c473bf'

export default function LiveHostScreen() {
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const engine = useRef<IRtcEngine | null>(null)

  const [loading, setLoading] = useState(true)
  const [loadingStatus, setLoadingStatus] = useState('Initializing camera...')
  const [isLive, setIsLive] = useState(false)
  const [streamId, setStreamId] = useState<string | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [isFrontCamera, setIsFrontCamera] = useState(true)
  const [viewerCount, setViewerCount] = useState(0)
  const [secondsElapsed, setSecondsElapsed] = useState(0)
  const [beautyEnabled, setBeautyEnabled] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [isMirrored, setIsMirrored] = useState(true)
  const [isHD, setIsHD] = useState(false)
  const [networkQuality, setNetworkQuality] = useState(1) // 1 = Excellent
  const [screenFlash, setScreenFlash] = useState(false)

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
    // 1. Refresh user first to ensure participant status is current
    refreshUser().then(() => {
      console.log('[LiveHost] User refreshed, starting setup')
      setup()
    }).catch(err => {
      console.error('[LiveHost] Failed to refresh user', err)
      setup() // try setup anyway
    })

    return () => {
      console.log('[LiveHost] Unmounting screen, cleaning up engine')
      if (engine.current) {
        engine.current.leaveChannel()
        engine.current.release()
      }
    }
  }, [])

  const setup = async () => {
    try {
      console.log('[LiveHost] Requesting permissions...')
      setLoadingStatus('Requesting permissions...')
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync()
      const { status: audioStatus } = await Audio.requestPermissionsAsync()

      console.log('[LiveHost] Permissions:', { cameraStatus, audioStatus })

      if (cameraStatus !== 'granted' || audioStatus !== 'granted') {
        Alert.alert('Permission Required', 'We need camera and microphone access to go live.')
        router.back()
        return
      }

      if (!AGORA_APP_ID || AGORA_APP_ID.includes('placeholder')) {
        console.error('[LiveHost] Agora App ID is not configured correctly')
      }

      console.log('[LiveHost] Initializing Agora Engine with ID:', AGORA_APP_ID)
      setLoadingStatus('Initializing Agora engine...')
      engine.current = createAgoraRtcEngine()
      engine.current.initialize({ appId: AGORA_APP_ID })

      engine.current.registerEventHandler({
        onJoinChannelSuccess: (connection, elapsed) => {
          console.log('[LiveHost] Agora: Joined channel successfully', connection, elapsed)
          setIsLive(true)
          setLoading(false)
        },
        onUserJoined: (connection, remoteUid) => {
          console.log('[LiveHost] Agora: User joined', remoteUid)
          setViewerCount(prev => prev + 1)
        },
        onUserOffline: (connection, remoteUid) => {
          console.log('[LiveHost] Agora: User offline', remoteUid)
          setViewerCount(prev => Math.max(0, prev - 1))
        },
        onError: (err, msg) => {
          console.error('[LiveHost] Agora: Error callback', err, msg)
          Alert.alert('Agora Error', `Code: ${err}\nMessage: ${msg || 'Unknown error'}`)
          setLoading(false)
        },
        onLeaveChannel: (connection, stats) => {
          console.log('[LiveHost] Agora: Left channel', connection, stats)
        },
        onNetworkQuality: (connection, remoteUid, txQuality, rxQuality) => {
          if (remoteUid === 0) { // Local user
            setNetworkQuality(txQuality)
          }
        }
      })

      // Audio Improvements: Noise suppression and High Quality voice
      engine.current.setAudioProfile(
        AudioProfileType.AudioProfileMusicStandard,
        AudioScenarioType.AudioScenarioChatroomEntertainment
      )
      engine.current.enableAudioVolumeIndication(200, 3, true)

      console.log('[LiveHost] Enabling video and starting preview')
      engine.current.enableVideo()
      engine.current.startPreview()
      engine.current.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting)
      engine.current.setClientRole(ClientRoleType.ClientRoleBroadcaster)
      
      // Set initial video settings
      engine.current.setLocalVideoMirrorMode(VideoMirrorModeType.VideoMirrorModeEnabled) 
      engine.current.setVideoEncoderConfiguration({
        dimensions: { width: 640, height: 480 },
        frameRate: 24,
        bitrate: 800,
      })

      console.log('[LiveHost] Setup complete')
      setLoading(false)
    } catch (error: any) {
      console.error('[LiveHost] Setup Error', error)
      Alert.alert('Setup Error', error.message || 'Failed to initialize camera')
      setLoading(false)
    }
  }

  const goLive = async () => {
    if (!user?.participant?.id) {
      Alert.alert('Not a Participant', 'You must be a registered participant to start a live stream.')
      return
    }

    console.log('[LiveHost] Starting Go Live process...')
    setLoading(true)
    setLoadingStatus('Starting broadcast...')

    // Timeout mechanism
    const timeoutId = setTimeout(() => {
      if (!isLive) {
        console.warn('[LiveHost] Go Live timed out after 30s')
        Alert.alert('Connection Timeout', 'Taking too long to join. Please check your internet connection.')
        setLoading(false)
      }
    }, 30000)

    try {
      console.log('[LiveHost] Calling startStream API')
      const streamRes = await streamingApi.startStream({
        participantId: user.participant.id,
        title: `${user.displayName || user.fullName}'s Live Arena`
      })
      const streamData = streamRes.data.data
      console.log('[LiveHost] Stream created:', streamData.id)
      setStreamId(streamData.id)

      console.log('[LiveHost] Fetching Agora token for channel:', streamData.channelName)
      setLoadingStatus('Fetching secure token...')
      const tokenRes = await streamingApi.getToken(streamData.channelName, 'PUBLISHER')
      const token = tokenRes.data.data.token
      console.log('[LiveHost] Token received')

      console.log('[LiveHost] Joining Agora channel...')
      setLoadingStatus('Joining live channel...')
      engine.current?.joinChannel(token, streamData.channelName, 0, {})

    } catch (error: any) {
      clearTimeout(timeoutId)
      console.error('[LiveHost] Go Live Error', error)
      Alert.alert('Broadcast Error', error.response?.data?.message || error.message || 'Could not start broadcast')
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
          console.log('[LiveHost] Ending stream...')
          try {
            if (streamId) {
              await streamingApi.endStream(streamId)
              console.log('[LiveHost] Stream ended on backend')
            }
            engine.current?.leaveChannel()
            router.back()
          } catch (err) {
            console.error('[LiveHost] Error ending stream', err)
            router.back()
          }
        }
      }
    ])
  }

  const toggleBeauty = () => {
    const newState = !beautyEnabled
    setBeautyEnabled(newState)
    engine.current?.setBeautyEffectOptions(newState, {
      lighteningContrastLevel: 1,
      lighteningLevel: 0.7,
      smoothnessLevel: 0.5,
      rednessLevel: 0.1,
    })
  }

  const toggleTorch = () => {
    if (isFrontCamera) {
      setScreenFlash(!screenFlash)
    } else {
      const newState = !torchOn
      setTorchOn(newState)
      engine.current?.setCameraTorchOn(newState)
    }
  }

  const toggleMirror = () => {
    const newState = !isMirrored
    setIsMirrored(newState)
    // In Agora v4, mirror mode is set via local video canvas or setLocalVideoMirrorMode
    engine.current?.setLocalVideoMirrorMode(
      newState ? VideoMirrorModeType.VideoMirrorModeEnabled : VideoMirrorModeType.VideoMirrorModeDisabled
    )
  }

  const toggleQuality = () => {
    const newState = !isHD
    setIsHD(newState)
    engine.current?.setVideoEncoderConfiguration({
      dimensions: newState ? { width: 1280, height: 720 } : { width: 640, height: 480 },
      frameRate: 24,
      bitrate: newState ? 1500 : 800,
    })
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
          canvas={{ uid: 0, renderMode: RenderModeType.RenderModeHidden }}
          style={styles.fullVideo}
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
                {isLive && (
                  <View style={styles.networkBadge}>
                    <View style={[styles.signalBar, { height: 4, backgroundColor: networkQuality <= 2 ? '#4ADE80' : networkQuality <= 4 ? '#FACC15' : '#EF4444' }]} />
                    <View style={[styles.signalBar, { height: 7, backgroundColor: networkQuality <= 2 ? '#4ADE80' : networkQuality <= 4 ? '#FACC15' : '#991B1B' }]} />
                    <View style={[styles.signalBar, { height: 10, backgroundColor: networkQuality <= 1 ? '#4ADE80' : '#991B1B' }]} />
                  </View>
                )}
              </View>
            </View>
          </BlurView>

          <View style={styles.headerRight}>
            {!isLive && (
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => router.push('/streaming/history')}
              >
                <Ionicons name="time-outline" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={isLive ? endStream : () => router.back()}>
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* MIDDLE - VERTICAL UTILITIES */}
        <View style={styles.sideStack}>
          <TouchableOpacity
            style={styles.stackBtn}
            onPress={() => {
              setIsFrontCamera(!isFrontCamera)
              engine.current?.switchCamera()
            }}
          >
            <MaterialCommunityIcons name="camera-flip-outline" size={24} color="#fff" />
            <Text style={styles.stackText}>Flip</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.stackBtn} onPress={() => {
            setMicOn(!micOn)
            engine.current?.muteLocalAudioStream(micOn)
          }}>
            <Ionicons name={micOn ? "mic-outline" : "mic-off-outline"} size={24} color="#fff" />
            <Text style={styles.stackText}>{micOn ? 'Mute' : 'Unmute'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.stackBtn}
            onPress={toggleBeauty}
          >
            <Ionicons
              name="sparkles-outline"
              size={24}
              color={beautyEnabled ? "#FE2C55" : "#fff"}
            />
            <Text style={[styles.stackText, beautyEnabled && { color: '#FE2C55' }]}>Beauty</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.stackBtn} onPress={toggleTorch}>
            <Ionicons 
              name={isFrontCamera ? (screenFlash ? "sunny" : "sunny-outline") : (torchOn ? "flash" : "flash-outline")} 
              size={24} 
              color={isFrontCamera ? (screenFlash ? "#fff" : "#fff") : (torchOn ? "#FFD700" : "#fff")} 
            />
            <Text style={[styles.stackText, (torchOn || screenFlash) && { color: '#FFD700' }]}>
              {isFrontCamera ? 'Screen Flash' : 'Flash'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.stackBtn} onPress={toggleMirror}>
            <MaterialCommunityIcons 
              name={isMirrored ? "mirror" : "mirror-variant"} 
              size={24} 
              color={isMirrored ? "#4ADE80" : "#fff"} 
            />
            <Text style={[styles.stackText, isMirrored && { color: '#4ADE80' }]}>Mirror</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.stackBtn} onPress={toggleQuality}>
            <MaterialCommunityIcons 
              name={isHD ? "high-definition" : "standard-definition"} 
              size={24} 
              color={isHD ? "#60A5FA" : "#fff"} 
            />
            <Text style={[styles.stackText, isHD && { color: '#60A5FA' }]}>{isHD ? '720p' : '480p'}</Text>
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
        
        {/* Screen Flash Overlay */}
        {screenFlash && isFrontCamera && (
          <View style={styles.screenFlashOverlay} pointerEvents="none" />
        )}
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
    top: '30%',
    gap: 20,
    alignItems: 'center'
  },
  stackBtn: { alignItems: 'center' },
  stackText: { color: '#fff', fontSize: 10, marginTop: 4, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 3 },
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
  screenFlashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 40,
    borderColor: '#fff',
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginLeft: 8,
    height: 10
  },
  signalBar: {
    width: 3,
    borderRadius: 1
  }
})
