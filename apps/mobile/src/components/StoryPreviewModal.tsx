// apps/mobile/src/components/StoryPreviewModal.tsx

import React from 'react'
import { 
  View, StyleSheet, Modal, TouchableOpacity, 
  TextInput, Dimensions, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard 
} from 'react-native'
import { VideoView, useVideoPlayer } from 'expo-video'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width, height } = Dimensions.get('window')

interface Props {
  visible: boolean
  videoUri: string | null
  onClose: () => void
  onConfirm: () => void
  caption: string
  setCaption: (text: string) => void
  accentColor?: string
}

export const StoryPreviewModal: React.FC<Props> = ({
  visible, videoUri, onClose, onConfirm, caption, setCaption, accentColor = '#FE2C55'
}) => {
  const insets = useSafeAreaInsets()
  
  // Hook called unconditionally inside the component
  const player = useVideoPlayer(videoUri || null, p => {
    p.loop = true
    if (visible) p.play()
  })

  // Control playback based on visibility
  React.useEffect(() => {
    if (visible) {
      player.play()
    } else {
      player.pause()
    }
  }, [visible, player])

  if (!visible) return null

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.container}
      >
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={StyleSheet.absoluteFill}>
            <View style={[s.header, { paddingTop: insets.top + 10 }]}>
              <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
        
        <View style={{ flex: 1 }} />

        <View style={[s.footer, { paddingBottom: insets.bottom + 20 }]}>
          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              placeholder="Add a caption..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={caption}
              onChangeText={setCaption}
              multiline
              autoFocus={false}
            />
            <TouchableOpacity 
              style={[s.sendBtn, { backgroundColor: accentColor }]}
              onPress={onConfirm}
            >
              <Ionicons name="send" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  closeBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    maxHeight: 120,
    paddingVertical: 8,
    paddingHorizontal: 4,
    textAlignVertical: 'top',
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  }
})
