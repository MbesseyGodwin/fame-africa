// apps/mobile/src/screens/participants/ParticipantGalleryScreen.tsx

import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, RefreshControl
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { participantsApi } from '../../utils/api'
import { useTheme } from '../../context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { InfoTooltip } from '../../components/common/InfoTooltip'

export default function ParticipantGalleryScreen() {
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  const insets = useSafeAreaInsets()

  const { data, isLoading: fetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => participantsApi.getDashboard(),
  })

  const dashboard = data?.data?.data
  console.log('[Gallery] Dashboard Data:', JSON.stringify(dashboard, null, 2))
  const participantData = dashboard?.participant

  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [newVideoTitle, setNewVideoTitle] = useState('')
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null)

  const videos = dashboard?.participant?.videos || []

  const addVideoMutation = useMutation({
    mutationFn: (video: { url: string, title?: string }) => participantsApi.addVideo(video),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setNewVideoUrl('')
      setNewVideoTitle('')
      Alert.alert('Success', 'Video added successfully')
    }
  })

  const updateVideoMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => participantsApi.updateVideo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setNewVideoUrl('')
      setNewVideoTitle('')
      setEditingVideoId(null)
      Alert.alert('Success', 'Video updated successfully')
    }
  })

  const deleteVideoMutation = useMutation({
    mutationFn: (videoId: string) => participantsApi.deleteVideo(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      Alert.alert('Success', 'Video removed')
    }
  })

  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    setRefreshing(false)
  }

  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad)

  if (fetching) {
    return (
      <View style={[s.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
      </View>
    )
  }

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
              <Ionicons name="arrow-back" size={24} color={textPrimary} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={s.headerTitle}>Video Portfolio</Text>
              <InfoTooltip 
                title="Your Portfolio" 
                content="Add links to your best talent videos from TikTok, YouTube, or Instagram. These videos will appear on the Fame Feed where fans can watch and vote for you directly! A strong portfolio is key to winning." 
              />
            </View>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView 
            contentContainerStyle={s.content} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primaryColor} />
            }
          >
            <View style={s.card}>
              <Text style={s.cardTitle}>MANAGE VIDEO GALLERY</Text>
              <Text style={s.infoText}>
                Add videos from YouTube, TikTok, or Instagram. These will appear on your voting page and in the global discovery feed.
              </Text>

              {/* Add/Edit Video Form */}
              <View style={s.addVideoBox}>
                <Text style={s.formLabel}>
                  {editingVideoId ? 'EDITING VIDEO' : 'ADD NEW VIDEO'}
                </Text>
                
                <TextInput
                  style={s.miniInput}
                  value={newVideoTitle}
                  onChangeText={setNewVideoTitle}
                  placeholder="Video Title (Optional, e.g. My Best Performance)"
                  placeholderTextColor={textSecondary}
                />

                <View style={s.row}>
                  <TextInput
                    style={[s.miniInput, { flex: 1, marginRight: 8 }]}
                    value={newVideoUrl}
                    onChangeText={setNewVideoUrl}
                    placeholder="Paste Video Link (TikTok, YT, IG)"
                    placeholderTextColor={textSecondary}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    style={[s.addBtn, { backgroundColor: theme.primaryColor }]}
                    onPress={() => {
                      if (!newVideoUrl) return Alert.alert('Error', 'Please paste a link')
                      if (editingVideoId) {
                        updateVideoMutation.mutate({ id: editingVideoId, data: { url: newVideoUrl, title: newVideoTitle } })
                      } else {
                        addVideoMutation.mutate({ url: newVideoUrl, title: newVideoTitle })
                      }
                    }}
                    disabled={addVideoMutation.isPending || updateVideoMutation.isPending}
                  >
                    {(addVideoMutation.isPending || updateVideoMutation.isPending) ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name={editingVideoId ? "checkmark" : "add"} size={24} color="#fff" />
                    )}
                  </TouchableOpacity>

                  {editingVideoId && (
                    <TouchableOpacity 
                      style={[s.addBtn, { backgroundColor: textSecondary, marginLeft: 8 }]}
                      onPress={() => {
                        setEditingVideoId(null)
                        setNewVideoUrl('')
                        setNewVideoTitle('')
                      }}
                    >
                      <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* List of existing videos */}
              <View style={s.videoList}>
                <Text style={[s.formLabel, { marginBottom: 12 }]}>YOUR UPLOADS ({videos.length})</Text>
                
                {videos.length === 0 ? (
                  <View style={s.emptyBox}>
                    <Ionicons name="videocam-outline" size={48} color={border} />
                    <Text style={s.emptyText}>No videos added yet.</Text>
                  </View>
                ) : (
                  videos.map((vid: any) => (
                    <View key={vid.id} style={s.videoItem}>
                      <View style={s.videoItemInfo}>
                        <View style={[s.platformIcon, { backgroundColor: getPlatformColor(vid.platform) + '15' }]}>
                          <Ionicons 
                            name={getPlatformIcon(vid.platform)} 
                            size={16} color={getPlatformColor(vid.platform)} 
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.videoItemTitle} numberOfLines={1}>{vid.title || 'Untitled Video'}</Text>
                          <Text style={s.videoItemUrl} numberOfLines={1}>{vid.url}</Text>
                        </View>
                      </View>
                      <View style={s.actionRow}>
                        <TouchableOpacity 
                          onPress={() => {
                            setEditingVideoId(vid.id)
                            setNewVideoUrl(vid.url)
                            setNewVideoTitle(vid.title || '')
                          }}
                          style={s.actionBtn}
                        >
                          <Ionicons name="create-outline" size={20} color={theme.primaryColor} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => {
                            Alert.alert(
                              'Delete Video',
                              'Are you sure you want to remove this video?',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Delete', style: 'destructive', onPress: () => deleteVideoMutation.mutate(vid.id) }
                              ]
                            )
                          }}
                          style={s.actionBtn}
                        >
                          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

function getPlatformIcon(platform: string) {
  switch (platform?.toLowerCase()) {
    case 'youtube': return 'logo-youtube'
    case 'tiktok': return 'logo-tiktok'
    case 'instagram': return 'logo-instagram'
    default: return 'link'
  }
}

function getPlatformColor(platform: string) {
  switch (platform?.toLowerCase()) {
    case 'youtube': return '#FF0000'
    case 'tiktok': return '#000000'
    case 'instagram': return '#E1306C'
    default: return '#534AB7'
  }
}

function makeStyles(theme: any, bg: string, surface: string, textPrimary: string, textSecondary: string, border: string, pad: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: border,
      backgroundColor: surface
    },
    headerBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: textPrimary },
    content: { padding: 16, paddingBottom: 40 },
    card: {
      backgroundColor: surface, borderRadius: 24, padding: 20, marginBottom: 16,
      borderWidth: 1, borderColor: border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05, shadowRadius: 12, elevation: 3
    },
    cardTitle: { fontSize: 12, fontWeight: '800', color: textSecondary, letterSpacing: 1.5, marginBottom: 8 },
    infoText: { fontSize: 13, color: textSecondary, lineHeight: 20, marginBottom: 24 },
    formLabel: { fontSize: 11, fontWeight: '700', color: theme.primaryColor, marginBottom: 10, letterSpacing: 0.5 },
    addVideoBox: { marginBottom: 30, padding: 16, backgroundColor: bg, borderRadius: 16, borderWidth: 1, borderColor: border },
    miniInput: {
      backgroundColor: surface, borderWidth: 1, borderColor: border,
      borderRadius: 12, padding: 12, fontSize: 14, color: textPrimary, marginBottom: 10
    },
    row: { flexDirection: 'row' },
    addBtn: {
      width: 50, height: 48, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center'
    },
    videoList: { marginTop: 10 },
    videoItem: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: bg, padding: 14, borderRadius: 16, marginBottom: 12,
      borderWidth: 1, borderColor: border
    },
    videoItemInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    platformIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    videoItemTitle: { fontSize: 14, fontWeight: '700', color: textPrimary, marginBottom: 2 },
    videoItemUrl: { fontSize: 11, color: textSecondary },
    actionRow: { flexDirection: 'row', alignItems: 'center' },
    actionBtn: { padding: 8, marginLeft: 4 },
    emptyBox: { alignItems: 'center', paddingVertical: 40, opacity: 0.5 },
    emptyText: { marginTop: 12, fontSize: 14, color: textSecondary }
  })
}
