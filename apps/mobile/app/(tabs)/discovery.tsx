// apps/mobile/app/(tabs)/discovery.tsx

import React, { useState, useRef, useMemo } from 'react'
import {
  View, Text, FlatList, Dimensions, ActivityIndicator,
  TouchableOpacity, StyleSheet, RefreshControl, Modal,
  TextInput, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from '../../src/context/ThemeContext'
import { participantsApi } from '../../src/utils/api'
import { WebView } from 'react-native-webview'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import * as Sharing from 'expo-sharing'
import ViewShot from 'react-native-view-shot'

import { ParticipantCampaignCard } from '../../src/components/ParticipantCampaignCard'
import { InfoTooltip } from '../../src/components/common/InfoTooltip'

const { height } = Dimensions.get('window')

const CATEGORIES = ['All', 'Music', 'Dance', 'Comedy', 'Acting', 'Modeling', 'Other']

/**
 * Robust Embed URL generator
 */
function getEmbedUrl(url: string): string | null {
  if (!url) return null

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let id = ''
    if (url.includes('v=')) id = url.split('v=')[1]?.split('&')[0]
    else if (url.includes('shorts/')) id = url.split('shorts/')[1]?.split('?')[0]
    else id = url.split('/').pop()?.split('?')[0] || ''
    return `https://www.youtube.com/embed/${id}?autoplay=0&rel=0&modestbranding=1`
  }

  if (url.includes('tiktok.com')) {
    const videoId = url.split('/video/')[1]?.split('?')[0]
    if (videoId) return `https://www.tiktok.com/embed/v2/${videoId}`
    return url
  }

  if (url.includes('instagram.com')) {
    let cleanUrl = url.split('?')[0]
    if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1)
    return `${cleanUrl}/embed`
  }

  if (url.includes('facebook.com') || url.includes('fb.watch')) {
    const encodedUrl = encodeURIComponent(url)
    return `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=0&width=500`
  }

  return url
}

export default function DiscoveryScreen() {
  const { theme, textPrimary, textSecondary, surface, bg, border } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const viewShotRef = useRef<ViewShot>(null)
  const [sharingParticipant, setSharingParticipant] = useState<any>(null)

  // State
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')

  // Query
  const { data: videos, isLoading, refetch } = useQuery({
    queryKey: ['discovery-videos', selectedCategory, searchQuery],
    queryFn: async () => {
      const params: any = {}
      if (selectedCategory !== 'All') params.category = selectedCategory
      if (searchQuery) params.search = searchQuery
      const res = await participantsApi.getDiscoveryFeed(params)
      return res.data.data
    }
  })

  // Mutations
  const likeMutation = useMutation({
    mutationFn: (videoId: string) => participantsApi.toggleLike(videoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['discovery-videos'] })
  })

  const commentMutation = useMutation({
    mutationFn: ({ videoId, content }: { videoId: string, content: string }) =>
      participantsApi.addComment(videoId, content),
    onSuccess: () => {
      setCommentText('')
      queryClient.invalidateQueries({ queryKey: ['discovery-comments', activeVideoId] })
      queryClient.invalidateQueries({ queryKey: ['discovery-videos'] })
    }
  })

  // Comments Query
  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: ['discovery-comments', activeVideoId],
    queryFn: async () => {
      if (!activeVideoId) return []
      const res = await participantsApi.getComments(activeVideoId)
      return res.data.data
    },
    enabled: !!activeVideoId && showComments
  })

  const handleLike = (videoId: string) => {
    likeMutation.mutate(videoId)
  }

  const handleShare = async (item: any) => {
    setSharingParticipant(item.participant)
    // Wait for state to update and component to render
    setTimeout(async () => {
      try {
        const uri = await (viewShotRef.current as any)?.capture?.()
        if (uri) {
          await Sharing.shareAsync(uri, {
            dialogTitle: `Support ${item.participant.displayName} on Fame Africa!`,
            mimeType: 'image/png',
          })
        }
      } catch (error) {
        console.log('Error sharing:', error)
      }
    }, 500)
  }

  const renderComment = ({ item }: { item: any }) => (
    <View style={s.commentItem}>
      <Image source={{ uri: item.user.photoUrl }} style={s.commentAvatar} />
      <View style={s.commentContent}>
        <Text style={[s.commentUser, { color: textPrimary }]}>{item.user.displayName}</Text>
        <Text style={[s.commentText, { color: textSecondary }]}>{item.content}</Text>
      </View>
    </View>
  )

  const renderItem = ({ item }: { item: any }) => {
    const embedUrl = getEmbedUrl(item.url)

    return (
      <View style={[s.card, { backgroundColor: surface, borderColor: border }]}>
        {/* Card Header */}
        <TouchableOpacity
          style={s.cardHeader}
          onPress={() => router.push(`/vote/${item.participant.voteLinkSlug}`)}
        >
          <View style={[s.avatar, { backgroundColor: theme.primaryColor + '20' }]}>
            {item.participant.photoUrl ? (
              <Image source={{ uri: item.participant.photoUrl }} style={s.avatarImg} />
            ) : (
              <Ionicons name="person" size={20} color={theme.primaryColor} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.participantName, { color: textPrimary }]}>{item.participant.displayName}</Text>
            <View style={s.statsRow}>
              <Ionicons name="heart" size={12} color={theme.primaryColor} />
              <Text style={[s.statsText, { color: textSecondary }]}>{item.participant.totalVotes.toLocaleString()} Votes</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[s.miniVoteBtn, { backgroundColor: theme.primaryColor }]}
            onPress={() => router.push(`/vote/${item.participant.voteLinkSlug}`)}
          >
            <Text style={s.miniVoteBtnText}>VOTE</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Video Area */}
        <View style={s.videoArea}>
          <WebView
            source={{ uri: embedUrl || '' }}
            style={s.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsFullscreenVideo={true}
            scrollEnabled={false}
            mediaPlaybackRequiresUserAction={true}
            onShouldStartLoadWithRequest={(request) => {
              return (
                request.url.startsWith('https://www.youtube.com') ||
                request.url.startsWith('https://www.tiktok.com') ||
                request.url.startsWith('https://www.facebook.com') ||
                request.url.startsWith('https://www.instagram.com') ||
                request.url === embedUrl
              )
            }}
            userAgent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
          />
        </View>

        {/* Engagement Row */}
        <View style={s.engagementRow}>
          <View style={s.leftActions}>
            <TouchableOpacity style={s.actionBtn} onPress={() => handleLike(item.id)}>
              <Ionicons
                name={item.isLiked ? "heart" : "heart-outline"}
                size={26}
                color={item.isLiked ? "#E91E63" : textPrimary}
              />
              <Text style={[s.actionCount, { color: textSecondary }]}>{item.likeCount || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.actionBtn} onPress={() => {
              setActiveVideoId(item.id)
              setShowComments(true)
            }}>
              <Ionicons name="chatbubble-outline" size={24} color={textPrimary} />
              <Text style={[s.actionCount, { color: textSecondary }]}>{item.commentCount || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.actionBtn} onPress={() => handleShare(item)}>
              <Ionicons name="share-social-outline" size={24} color={textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={s.platformBadge}>
            <Ionicons
              name={item.platform === 'youtube' ? 'logo-youtube' : (item.platform === 'tiktok' ? 'logo-tiktok' : 'logo-instagram')}
              size={16} color={textSecondary}
            />
          </View>
        </View>

        {/* Card Footer */}
        <View style={s.cardFooter}>
          {item.title && (
            <Text style={[s.videoTitle, { color: textPrimary }]}>{item.title}</Text>
          )}
        </View>
      </View>
    )
  }

  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, insets)

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      {/* Search & Filter Header */}
      <View style={[s.header, { backgroundColor: surface, borderBottomColor: border }]}>
        <View style={s.topHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 4 }}>
              <Ionicons name="chevron-back" size={24} color={textPrimary} />
            </TouchableOpacity>
            <Text style={[s.headerTitle, { color: textPrimary }]}>Fame Feed</Text>
            <InfoTooltip 
              title="Welcome to Fame Feed!" 
              content="Watch contestant performances from TikTok, YouTube, and Instagram. Like and comment to support them, and click 'VOTE' to go directly to their profile to boost their rank!" 
            />
          </View>
          <View style={[s.searchBar, { backgroundColor: bg }]}>
            <Ionicons name="search" size={18} color={textSecondary} />
            <TextInput
              style={[s.searchInput, { color: textPrimary }]}
              placeholder="Search talent..."
              placeholderTextColor={textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.filterRow}
          contentContainerStyle={s.filterContent}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                s.filterChip,
                { backgroundColor: selectedCategory === cat ? theme.primaryColor : bg },
                selectedCategory === cat && s.activeChip
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[
                s.filterText,
                { color: selectedCategory === cat ? '#fff' : textSecondary }
              ]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={theme.primaryColor} />
        </View>
      ) : (
        <FlatList
          data={videos}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.primaryColor} />
          }
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="videocam-outline" size={64} color={textSecondary} />
              <Text style={[s.emptyTitle, { color: textPrimary }]}>No performances found</Text>
              <Text style={[s.emptySub, { color: textSecondary }]}>Try adjusting your filters or search query.</Text>
            </View>
          }
        />
      )}

      {/* Comments Modal */}
      <Modal visible={showComments} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.modalOverlay}
        >
          <View style={[s.modalContent, { backgroundColor: surface }]}>
            <View style={[s.modalHeader, { borderBottomColor: border }]}>
              <Text style={[s.modalTitle, { color: textPrimary }]}>Comments</Text>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <Ionicons name="close" size={24} color={textPrimary} />
              </TouchableOpacity>
            </View>

            {isLoadingComments ? (
              <ActivityIndicator style={{ margin: 20 }} color={theme.primaryColor} />
            ) : (
              <FlatList
                data={comments}
                renderItem={renderComment}
                keyExtractor={(item) => item.id}
                contentContainerStyle={s.commentList}
                ListEmptyComponent={
                  <Text style={[s.emptyComments, { color: textSecondary }]}>Be the first to comment!</Text>
                }
              />
            )}

            <View style={[s.commentInputRow, { borderTopColor: border }]}>
              <TextInput
                style={[s.commentInput, { backgroundColor: bg, color: textPrimary }]}
                placeholder="Add a comment..."
                placeholderTextColor={textSecondary}
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                style={[s.sendBtn, { backgroundColor: theme.primaryColor }]}
                onPress={() => commentMutation.mutate({ videoId: activeVideoId!, content: commentText })}
                disabled={!commentText.trim() || commentMutation.isPending}
              >
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Hidden Campaign Card for Sharing ────────────────── */}
      {sharingParticipant && (
        <View style={{ position: 'absolute', left: -5000 }}>
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
            <ParticipantCampaignCard participant={sharingParticipant} />
          </ViewShot>
        </View>
      )}
    </View>
  )
}

function makeStyles(theme: any, bg: string, surface: string, textPrimary: string, textSecondary: string, border: string, insets: any) {
  return StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: insets.top || 50,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 15,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', flex: 1 },
  searchBar: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  filterRow: { maxHeight: 50 },
  filterContent: { paddingHorizontal: 15, gap: 10 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
  },
  activeChip: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: { fontSize: 13, fontWeight: '700' },

  listContent: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  participantName: { fontSize: 15, fontWeight: '700' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  statsText: { fontSize: 11, fontWeight: '600' },
  miniVoteBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  miniVoteBtnText: { color: '#fff', fontSize: 11, fontWeight: '900' },

  videoArea: { width: '100%', aspectRatio: 1, backgroundColor: '#000' },
  webview: { flex: 1 },

  engagementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  leftActions: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionCount: { fontSize: 13, fontWeight: '700' },
  platformBadge: { opacity: 0.5 },

  cardFooter: { paddingHorizontal: 15, paddingBottom: 15 },
  videoTitle: { fontSize: 14, fontWeight: '500', lineHeight: 20 },

  emptyState: { alignItems: 'center', marginTop: 100, padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: 15 },
  emptySub: { fontSize: 14, textAlign: 'center', marginTop: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { height: height * 0.7, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 15, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  commentList: { paddingVertical: 15 },
  commentItem: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  commentContent: { flex: 1 },
  commentUser: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  commentText: { fontSize: 14, lineHeight: 20 },
  emptyComments: { textAlign: 'center', marginTop: 50, opacity: 0.5 },
  commentInputRow: { flexDirection: 'row', gap: 10, paddingTop: 15, borderTopWidth: 1 },
  commentInput: { flex: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }
  })
}
