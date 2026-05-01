// apps/mobile/src/screens/dashboard/ManageStoriesScreen.tsx

import React from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Dimensions, Image, Modal
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { storiesApi } from '../../utils/api'
import { useTheme } from '../../context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useStoryUpload } from '../../hooks/useStoryUpload'
import { StoryPreviewModal } from '../../components/StoryPreviewModal'
import { VideoView, useVideoPlayer } from 'expo-video'

const { width, height } = Dimensions.get('window')

export default function ManageStoriesScreen() {
  const { theme } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()

  // Reusable Upload Hook
  const {
    pickStory, confirmUpload, cancelPreview, isUploading,
    showPreviewModal, pendingStory, storyCaption, setStoryCaption
  } = useStoryUpload()

  // Local state for watching a story
  const [activeStory, setActiveStory] = React.useState<any>(null)
  const [showUploadStatus, setShowUploadStatus] = React.useState(false)

  // Sync upload status with isUploading
  React.useEffect(() => {
    if (isUploading) setShowUploadStatus(true)
  }, [isUploading])

  const { data, isLoading } = useQuery({
    queryKey: ['myStories'],
    queryFn: () => storiesApi.getMyStories()
  })

  const stories = data?.data?.data || []

  const deleteMutation = useMutation({
    mutationFn: (id: string) => storiesApi.deleteStory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myStories'] })
      queryClient.invalidateQueries({ queryKey: ['activeStories'] })
      Alert.alert('Deleted', 'Story has been removed.')
      if (activeStory) setActiveStory(null)
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete story.')
    }
  })

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Story',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) }
      ]
    )
  }

  const formatTimeLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return 'Expired'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m left`
  }

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: '#fff' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Stories</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 250 }}>
        {/* Engagement Card */}
        <LinearGradient
          colors={['#FE2C55', '#FF5F7E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.promoCard}
        >
          <Ionicons name="flame" size={32} color="#fff" style={styles.promoIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitle}>Go Viral!</Text>
            <Text style={styles.promoSub}>
              "Hot" stories catch voters' attention 10x more than regular profiles.
              Post daily to stay relevant!
            </Text>
          </View>
        </LinearGradient>

        {/* Guidelines Card */}
        <View style={styles.guidelinesCard}>
          <Text style={styles.guidelinesTitle}>📸 Story Guidelines & Tips</Text>

          <View style={styles.guideItem}>
            <View style={[styles.guideDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.guideText}>
              <Text style={{ fontWeight: 'bold' }}>Be Real:</Text> Share your daily lifestyle, practice sessions, or behind-the-scenes "hustle".
            </Text>
          </View>

          <View style={styles.guideItem}>
            <View style={[styles.guideDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.guideText}>
              <Text style={{ fontWeight: 'bold' }}>Go Viral:</Text> Drop high-energy vlogs or short clips that showcase your unique talent.
            </Text>
          </View>

          <View style={styles.guideItem}>
            <View style={[styles.guideDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.guideText}>
              <Text style={{ fontWeight: 'bold' }}>Technical:</Text> Videos must be under <Text style={{ fontWeight: 'bold' }}>50MB</Text> and in <Text style={{ fontWeight: 'bold' }}>MP4/MOV</Text> format.
            </Text>
          </View>

          <View style={styles.guideItem}>
            <View style={[styles.guideDot, { backgroundColor: '#6366F1' }]} />
            <Text style={styles.guideText}>
              <Text style={{ fontWeight: 'bold' }}>Frequency:</Text> Stories expire every <Text style={{ fontWeight: 'bold' }}>24 hours</Text>. Keep the momentum going!
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Stories ({stories.length})</Text>
        </View>

        {isLoading ? (
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#FE2C55" />
            <Text style={{ marginTop: 10, fontWeight: '600', color: '#64748B' }}>Fetching your stories...</Text>
          </View>
        ) : stories.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="videocam-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Active Stories</Text>
            <Text style={styles.emptySub}>
              You haven't posted any stories in the last 24 hours.
              Keep your fans engaged!
            </Text>
            <TouchableOpacity
              style={[styles.uploadBtn, { backgroundColor: '#FE2C55' }]}
              onPress={pickStory}
            >
              <Text style={styles.uploadBtnText}>Upload Story Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.storyGrid}>
            {stories.map((story: any) => (
              <TouchableOpacity
                key={story.id}
                style={styles.storyCard}
                onPress={() => setActiveStory(story)}
                activeOpacity={0.9}
              >
                <View style={styles.videoPlaceholder}>
                  <Ionicons name="play-circle" size={40} color="rgba(255,255,255,0.6)" />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.timeLeft}>{formatTimeLeft(story.expiresAt)}</Text>
                </View>

                <View style={styles.storyInfo}>
                  <View>
                    <Text style={styles.caption} numberOfLines={1}>
                      {story.caption || 'No caption'}
                    </Text>
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Ionicons name="eye-outline" size={14} color="#64748B" />
                        <Text style={styles.statText}>{story.viewsCount || 0} views</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons name="calendar-outline" size={14} color="#64748B" />
                        <Text style={styles.statText}>{new Date(story.createdAt).toLocaleDateString()}</Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDelete(story.id)}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={styles.deleteText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {stories.length > 0 && !isUploading && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: '#FE2C55', bottom: insets.bottom + 20 }]}
          onPress={pickStory}
        >
          <Ionicons name="add" size={32} color="#fff" />
          <Text style={styles.fabText}>New Story</Text>
        </TouchableOpacity>
      )}

      {/* Story Player Modal */}
      <Modal visible={!!activeStory} animationType="fade" transparent={false}>
        <View style={styles.playerContainer}>
          {activeStory && (
            <FullStoryPlayer
              story={activeStory}
              onClose={() => setActiveStory(null)}
              onDelete={() => handleDelete(activeStory.id)}
            />
          )}
        </View>
      </Modal>

      {/* Background Upload Modal */}
      <Modal visible={isUploading && showUploadStatus} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#FE2C55" style={{ marginBottom: 16 }} />
            <Text style={styles.modalTitle}>Processing Story...</Text>
            <Text style={styles.modalSub}>
              Your video is being prepared and uploaded. You can hide this window and continue using the app; the upload will finish in the background.
            </Text>
            <TouchableOpacity 
              style={styles.modalBtn} 
              onPress={() => setShowUploadStatus(false)}
            >
              <Text style={styles.modalBtnText}>Hide & Finish in Background</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Upload Preview Modal */}
      <StoryPreviewModal
        visible={showPreviewModal}
        videoUri={pendingStory?.uri}
        onClose={cancelPreview}
        onConfirm={confirmUpload}
        caption={storyCaption}
        setCaption={setStoryCaption}
        accentColor="#FE2C55"
      />
    </View>
  )
}

function FullStoryPlayer({ story, onClose, onDelete }: any) {
  const player = useVideoPlayer(story.videoUrl, p => {
    p.loop = true
    p.play()
  })
  const insets = useSafeAreaInsets()

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" />

      <View style={[styles.playerHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={onClose} style={styles.playerCloseBtn}>
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.playerDeleteBtn}>
          <Ionicons name="trash" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.playerFooter, { paddingBottom: insets.bottom + 30 }]}>
        <View style={styles.playerStats}>
          <Ionicons name="eye" size={16} color="#fff" />
          <Text style={styles.playerStatText}>{story.viewsCount || 0} views</Text>
        </View>
        {story.caption && (
          <Text style={styles.playerCaption}>{story.caption}</Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  promoCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    alignItems: 'center',
    gap: 16,
  },
  promoIcon: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 },
  promoTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 4 },
  promoSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, lineHeight: 18 },
  guidelinesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
  },
  guideItem: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingRight: 10,
  },
  guideDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 10,
  },
  guideText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    flex: 1,
  },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#64748B' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 40
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  uploadBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100
  },
  uploadBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  storyGrid: { gap: 16 },
  storyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    height: 120,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  videoPlaceholder: {
    width: 100,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeLeft: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  storyInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  caption: { fontSize: 14, color: '#1E293B', fontWeight: '500' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  deleteText: { color: '#EF4444', fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  fab: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8 },
  playerContainer: { flex: 1, backgroundColor: '#000' },
  playerHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  playerCloseBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  playerDeleteBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239,68,68,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  playerFooter: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingTop: 20,
  },
  playerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  playerStatText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  playerCaption: { color: '#fff', fontSize: 16, lineHeight: 22 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '700',
  },
})
