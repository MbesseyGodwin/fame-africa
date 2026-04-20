// apps/mobile/src/components/GlassCard.tsx

import React from 'react'
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import { BlurView } from 'expo-blur'

interface GlassCardProps {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  intensity?: number
  /**
   * 'dark'  → white-tinted blur — correct for dark gradient backgrounds
   * 'light' → transparent/white blur — only use on pure white backgrounds
   * Default changed to 'dark' so text on dark backgrounds stays readable.
   */
  tint?: 'light' | 'dark' | 'default'
}

export default function GlassCard({
  children,
  style,
  intensity = 80,
  tint = 'dark',    // ← was 'light', which washed out text on dark backgrounds
}: GlassCardProps) {
  return (
    <View style={[styles.outer, style]}>
      <BlurView intensity={intensity} tint={tint} style={styles.blur}>
        {/* Inner tint overlay for extra depth — dark mode needs a subtle dark veil */}
        <View style={[
          styles.tintOverlay,
          tint === 'dark'
            ? { backgroundColor: 'rgba(0, 0, 0, 0.35)' }
            : { backgroundColor: 'rgba(255, 255, 255, 0.12)' }
        ]}>
          <View style={styles.content}>
            {children}
          </View>
        </View>
      </BlurView>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 24,
    overflow: 'hidden',
    // Strong top+left highlight: the "glass edge catching light" effect
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    // Soft shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  blur: {
    flex: 1,
  },
  tintOverlay: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
})