// apps/mobile/src/hooks/useStoryUpload.ts

import { useState } from 'react'
import { Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { storiesApi } from '../utils/api'
import { useQueryClient } from '@tanstack/react-query'

export function useStoryUpload() {
  const [pendingStory, setPendingStory] = useState<any>(null)
  const [storyCaption, setStoryCaption] = useState('')
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const queryClient = useQueryClient()

  const pickStory = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'videos',
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60,
      })

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0]

        // Check file size (50MB limit)
        const fileInfo = await FileSystem.getInfoAsync(file.uri)
        const fileSize = (fileInfo as any).size || 0

        if (fileSize > 50 * 1024 * 1024) {
          try {
            // Use eval('require') to bypass Metro's eager evaluation/Proxy crash
            let Video: any
            try {
              const compressor = eval('require')('react-native-compressor')
              Video = compressor.Video
            } catch (e) {
              console.log('Compressor library not linked yet - skipping auto-compression')
            }

            if (!Video || typeof Video.compress !== 'function') {
              Alert.alert(
                'File Too Large',
                'Your video is over 50MB. Please choose a smaller file to enable auto-compression.'
              )
              return
            }

            setIsUploading(true)
            Alert.alert('Large File Detected', 'Reducing video size for faster upload...')

            const compressedUri = await Video.compress(
              file.uri,
              {
                compressionMethod: 'auto',
                minimumBitrate: 2000000 // 2Mbps for decent quality
              },
              (progress) => {
                console.log('Compression Progress:', progress)
              }
            )

            // Verify new size
            const newInfo = await FileSystem.getInfoAsync(compressedUri)
            const newSize = (newInfo as any).size || 0

            if (newSize > 50 * 1024 * 1024) {
              Alert.alert('File Still Too Large', 'Even after compression, the video is over 50MB. Please choose a shorter video.')
              setIsUploading(false)
              return
            }

            file.uri = compressedUri
          } catch (error) {
            console.error('COMPRESSION ERROR:', error)
            Alert.alert('Compression Failed', 'Could not reduce video size. Please choose a smaller file.')
            setIsUploading(false)
            return
          } finally {
            setIsUploading(false)
          }
        }

        setPendingStory(file)
        setStoryCaption('')
        setShowPreviewModal(true)
      }
    } catch (e: any) {
      console.error('STORY PICKER ERROR:', e)
      Alert.alert('Error', 'Could not open video library.')
    }
  }

  const confirmUpload = async () => {
    if (!pendingStory) return

    try {
      setShowPreviewModal(false)
      setIsUploading(true)

      const formData = new FormData()
      const payload = {
        uri: pendingStory.uri,
        name: 'story.mp4',
        type: 'video/mp4',
      }

      formData.append('video', payload as any)
      if (storyCaption) {
        formData.append('caption', storyCaption)
      }

      await storiesApi.addStory(formData)

      // Invalidate queries to refresh stories
      queryClient.invalidateQueries({ queryKey: ['myStories'] })
      queryClient.invalidateQueries({ queryKey: ['activeStories'] })

      Alert.alert('Success', 'Your Daily Story is live!')
    } catch (e: any) {
      const errMsg = e.response?.data?.message || e.message || 'There was an error uploading your story.'
      Alert.alert('Upload Failed', errMsg)
    } finally {
      setIsUploading(false)
      setPendingStory(null)
      setStoryCaption('')
    }
  }

  const cancelPreview = () => {
    setShowPreviewModal(false)
    setPendingStory(null)
    setStoryCaption('')
  }

  return {
    pickStory,
    confirmUpload,
    cancelPreview,
    isUploading,
    showPreviewModal,
    pendingStory,
    storyCaption,
    setStoryCaption,
    setShowPreviewModal
  }
}
