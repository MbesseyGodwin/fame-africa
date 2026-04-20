// apps/mobile/src/screens/streaming/LiveViewerScreen.tsx

import React, { useEffect, useState, useRef } from 'react'
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  TextInput, FlatList, KeyboardAvoidingView, Platform,
  ActivityIndicator, Image,
  Alert
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  IRtcEngine,
  RenderModeType
} from 'react-native-agora'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { streamingApi } from '../../utils/api'
import { LinearGradient } from 'expo-linear-gradient'

const { width, height } = Dimensions.get('window')
const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || 'agora_app_id_placeholder'

export default function LiveViewerScreen() {
  const { streamId } = useLocalSearchParams<{ streamId: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const engine = useRef<IRtcEngine | null>(null)

  const [loading, setLoading] = useState(true)
  const [remoteUid, setRemoteUid] = useState<number | null>(null)
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState('')
  const [streamInfo, setStreamInfo] = useState<any>(null)

  useEffect(() => {
    init()
    return () => {
      engine.current?.leaveChannel()
      engine.current?.release()
    }
  }, [])

  const init = async () => {
    try {
      // 1. Fetch stream info
      const res = await streamingApi.listLive() // Ideal: getOneStream(streamId)
      const stream = res.data.data.find((s: any) => s.id === streamId)
      if (!stream) {
        Alert.alert('Error', 'Stream no longer active')
        router.back()
        return
      }
      setStreamInfo(stream)

      // 2. Get Agora Token
      const tokenRes = await streamingApi.getToken(stream.channelName, 'SUBSCRIBER')
      const token = tokenRes.data.data.token

      // 3. Initialize Engine
      engine.current = createAgoraRtcEngine()
      engine.current.initialize({ appId: AGORA_APP_ID })

      engine.current.registerEventHandler({
        onJoinChannelSuccess: (connection, elapsed) => {
          console.log('Successfully joined channel', connection.channelId)
          setLoading(false)
        },
        onUserJoined: (connection, remoteUid, elapsed) => {
          console.log('Remote user joined', remoteUid)
          setRemoteUid(remoteUid)
        },
        onUserOffline: (connection, remoteUid, reason) => {
          console.log('Remote user offline', remoteUid)
          setRemoteUid(null)
          Alert.alert('Stream Ended', 'The host has ended the broadcast.')
          router.back()
        }
      })

      engine.current.enableVideo()
      engine.current.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting)
      engine.current.setClientRole(ClientRoleType.ClientRoleAudience)

      // 4. Join Channel
      engine.current.joinChannel(token, stream.channelName, 0, {})

    } catch (error) {
      console.error('Failed to init Agora', error)
      setLoading(false)
    }
  }

  const sendComment = () => {
    if (!commentText.trim()) return
    const newComment = {
      id: Date.now().toString(),
      userName: user?.displayName || 'Voter',
      content: commentText.trim()
    }
    setComments([newComment, ...comments])
    setCommentText('')
    // Ideal: Emit via Socket.io to others
  }

  const handleReport = () => {
    Alert.alert(
      'Report Content',
      'Are you sure you want to report this live stream for a violation of the community guidelines?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report', 
          style: 'destructive',
          onPress: async () => {
            try {
              await streamingApi.reportStream(streamId, 'General violation')
              Alert.alert('Reported', 'Thank you for keeping our community safe. Our team will review this broadcast.')
            } catch (error) {
              Alert.alert('Error', 'Failed to submit report. Please try again later.')
            }
          }
        }
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FE2C55" />
        <Text style={styles.loadingText}>Connecting to Virtual House...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Video Background */}
      {remoteUid ? (
        <RtcSurfaceView
          canvas={{ uid: remoteUid, renderMode: RenderModeType.RenderModeHidden }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={styles.placeholder}>
          <ActivityIndicator color="#fff" />
          <Text style={styles.placeholderText}>Waiting for host video...</Text>
        </View>
      )}

      {/* Overlay UI */}
      <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill}>

        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.hostInfo}>
            <Image source={{ uri: streamInfo?.host?.photoUrl }} style={styles.avatar} />
            <View>
              <Text style={styles.hostName}>{streamInfo?.host?.displayName}</Text>
              <Text style={styles.viewerCount}>{streamInfo?.viewerCount || 0} viewers</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity 
              style={[styles.closeBtn, { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 22 }]} 
              onPress={handleReport}
            >
              <Ionicons name="flag-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments Feed */}
        <FlatList
          data={comments}
          inverted
          keyExtractor={(item) => item.id}
          style={styles.commentList}
          renderItem={({ item }) => (
            <View style={styles.commentBubble}>
              <Text style={styles.commentUser}>{item.userName}</Text>
              <Text style={styles.commentContent}>{item.content}</Text>
            </View>
          )}
        />

        {/* Input Bar */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Express your support..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={commentText}
              onChangeText={setCommentText}
              onSubmitEditing={sendComment}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendComment}>
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.heartBtn}>
              <Ionicons name="heart" size={28} color="#FE2C55" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#fff', marginTop: 16, fontWeight: '600' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: 'rgba(255,255,255,0.5)', marginTop: 12 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 50, paddingHorizontal: 20
  },
  hostInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0,0,0,0.4)', padding: 6, borderRadius: 100, paddingRight: 15 },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#fff' },
  hostName: { color: '#fff', fontSize: 13, fontWeight: '800' },
  viewerCount: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600' },
  closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  commentList: { flex: 1, paddingHorizontal: 20, marginBottom: 10 },
  commentBubble: { backgroundColor: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 12, marginBottom: 8, alignSelf: 'flex-start' },
  commentUser: { color: '#FE2C55', fontSize: 11, fontWeight: '800', marginBottom: 2 },
  commentContent: { color: '#fff', fontSize: 14 },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 30, gap: 12 },
  input: { flex: 1, height: 44, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 22, paddingHorizontal: 20, color: '#fff' },
  sendBtn: { width: 44, height: 44, backgroundColor: '#FE2C55', borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  heartBtn: { padding: 4 }
})
