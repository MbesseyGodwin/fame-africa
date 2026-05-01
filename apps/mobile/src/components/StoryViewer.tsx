// apps/mobile/src/components/StoryViewer.tsx

import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  Modal, ActivityIndicator, Image as RNImage, FlatList, Alert
} from 'react-native'
import { Image } from 'expo-image'
import { useVideoPlayer, VideoView } from 'expo-video'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../context/ThemeContext'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { storiesApi } from '../utils/api'
import { useAuth } from '../context/AuthContext'

const { width, height } = Dimensions.get('window')

export default function StoryViewer() {
  const { theme, textPrimary, textSecondary } = useTheme()
  const { user } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['activeStories'],
    queryFn: () => storiesApi.getActiveStories(),
    refetchInterval: 60000, // Refresh every minute
  })

  const storyGroups = data?.data?.data || []

  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null)
  const [activeStoryIndex, setActiveStoryIndex] = useState(0)

  const activeGroup = activeGroupIndex !== null ? storyGroups[activeGroupIndex] : null
  const activeStory = activeGroup?.stories[activeStoryIndex]
  const isOwner = user?.participant?.id === activeGroup?.participant?.id

  const player = useVideoPlayer(activeStory?.videoUrl || null, player => {
    player.loop = false
    player.play()
  })

  useEffect(() => {
    if (activeGroupIndex !== null && activeStory) {
      player.replaceAsync(activeStory.videoUrl)
      player.play()
    }
  }, [activeGroupIndex, activeStoryIndex])

  // Hook into video playback to auto-advance
  useEffect(() => {
    const subscription = player.addListener('statusChange', (status) => {
      if (status.status === 'readyToPlay' && player.duration > 0 && player.currentTime >= player.duration - 0.5) {
        handleNext()
      }
    })
    return () => subscription.remove()
  }, [player])

  const handleNext = () => {
    if (!activeGroup) return
    if (activeStoryIndex < activeGroup.stories.length - 1) {
      setActiveStoryIndex(prev => prev + 1)
    } else if (activeGroupIndex < storyGroups.length - 1) {
      setActiveGroupIndex(prev => prev! + 1)
      setActiveStoryIndex(0)
    } else {
      closeViewer()
    }
  }

  const handlePrev = () => {
    if (!activeGroup) return
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(prev => prev - 1)
    } else if (activeGroupIndex > 0) {
      setActiveGroupIndex(prev => prev! - 1)
      setActiveStoryIndex(storyGroups[activeGroupIndex - 1].stories.length - 1)
    } else {
      player.seekBy(-player.currentTime) // Restart first video
    }
  }

  const closeViewer = () => {
    setActiveGroupIndex(null)
    setActiveStoryIndex(0)
    player.pause()
    refetch()
  }

  const handleDeleteStory = () => {
    if (!activeStory) return
    Alert.alert(
      'Delete Story',
      'Are you sure you want to delete this story? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await storiesApi.deleteStory(activeStory.id)
              // If last story in group, close viewer. Otherwise advance.
              if (activeGroup?.stories.length === 1) {
                closeViewer()
              } else {
                handleNext()
              }
            } catch (err) {
              Alert.alert('Error', 'Could not delete story. Please try again.')
            }
          }
        }
      ]
    )
  }

  if (isLoading && storyGroups.length === 0) {
    return null
  }

  if (storyGroups.length === 0) {
    return null // Don't show the horizontal list if there are no stories
  }

  return (
    <>
      <View style={s.container}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={storyGroups}
          keyExtractor={(item) => item.participant.id}
          contentContainerStyle={s.listContent}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={s.avatarContainer}
              onPress={() => {
                setActiveGroupIndex(index)
                setActiveStoryIndex(0)
              }}
            >
              <View style={[s.ring, { borderColor: theme.primaryColor }]}>
                {item.participant.photoUrl ? (
                  <Image source={{ uri: item.participant.photoUrl }} style={s.avatar} />
                ) : (
                  <View style={[s.avatar, s.avatarFallback, { backgroundColor: theme.primaryColor + '20' }]}>
                    <Text style={[s.avatarFallbackText, { color: theme.primaryColor }]}>
                      {item.participant.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[s.name, { color: textPrimary }]} numberOfLines={1}>
                {item.participant.displayName.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <Modal
        visible={activeGroupIndex !== null}
        animationType="fade"
        transparent={false}
        onRequestClose={closeViewer}
      >
        <View style={s.modalContainer}>
          {activeStory && (
            <VideoView
              player={player}
              style={s.video}
              contentFit="cover"
              nativeControls={false}
            />
          )}

          {/* Top Info Bar */}
          <View style={[s.modalHeader, { paddingTop: insets.top || 40 }]}>
            {/* Progress Bars */}
            <View style={s.progressContainer}>
              {activeGroup?.stories.map((_: any, i: number) => (
                <View key={i} style={s.progressBarBg}>
                  <View
                    style={[
                      s.progressBarFill,
                      { width: i < activeStoryIndex ? '100%' : i === activeStoryIndex ? '50%' : '0%' } // Simple representation, real progress would need an interval
                    ]}
                  />
                </View>
              ))}
            </View>

            <View style={s.userInfoRow}>
              <View style={s.userInfo}>
                {activeGroup?.participant.photoUrl ? (
                  <Image source={{ uri: activeGroup.participant.photoUrl }} style={s.modalAvatar} />
                ) : (
                  <View style={[s.modalAvatar, s.avatarFallback, { backgroundColor: '#333' }]}>
                    <Text style={s.avatarFallbackText}>
                      {activeGroup?.participant.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={s.modalName}>{activeGroup?.participant.displayName}</Text>
                {activeStory?.createdAt && (
                  <Text style={s.timeAgo}>
                    {Math.round((new Date().getTime() - new Date(activeStory.createdAt).getTime()) / (1000 * 60 * 60))}h
                  </Text>
                )}
              </View>

              <View style={s.headerActions}>
                {isOwner && (
                  <TouchableOpacity onPress={handleDeleteStory} style={s.actionBtn}>
                    <Ionicons name="trash-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={closeViewer} style={s.closeBtn}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Navigation Overlay */}
          <View style={s.navOverlay}>
            <TouchableOpacity style={s.navLeft} onPress={handlePrev} />
            <TouchableOpacity style={s.navRight} onPress={handleNext} />
          </View>

          {/* Caption & Actions */}
          <View style={[s.modalFooter, { paddingBottom: insets.bottom || 20 }]}>
            <View style={s.footerContent}>
              {activeStory?.caption && (
                <Text style={s.caption} numberOfLines={3}>{activeStory.caption}</Text>
              )}
              <TouchableOpacity
                style={[s.voteBtn, { backgroundColor: theme.primaryColor }]}
                activeOpacity={0.8}
                onPress={() => {
                  const slug = activeGroup?.participant.voteLinkSlug
                  if (slug) {
                    closeViewer()
                    // Fixed: Use /vote/[slug] path as seen in discovery feed
                    router.push(`/vote/${slug}`)
                  }
                }}
              >
                <Text style={s.voteBtnText}>VOTE NOW</Text>
                <Ionicons name="heart" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const s = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'transparent',
    paddingVertical: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    width: 68,
  },
  ring: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 24,
    fontWeight: '700',
  },
  name: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  modalHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 10,
    // Add gradient later
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  modalName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  timeAgo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    padding: 4,
  },
  closeBtn: {
    padding: 4,
  },
  navOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 5,
  },
  navLeft: {
    flex: 1,
  },
  navRight: {
    flex: 1,
  },
  modalFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    zIndex: 10,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  caption: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '400',
    flex: 1,
    marginRight: 12,
  },
  voteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  voteBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
})
