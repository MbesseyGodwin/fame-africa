// apps/mobile/src/screens/dashboard/EditProfileScreen.tsx

import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Image, Platform,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Image as ExpoImage } from 'expo-image'
import { useRouter } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'

export default function EditProfileScreen() {
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    displayName: user?.displayName || '',
    bio: user?.bio || '',
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const mutation = useMutation({
    mutationFn: (data: any) => usersApi.updateMe(data),
    onSuccess: async () => {
      await refreshUser()
      queryClient.invalidateQueries({ queryKey: ['me'] })
      Alert.alert('Success', 'Profile updated successfully.')
      router.back()
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile.')
    }
  })

  async function handleSave() {
    if (!form.fullName) {
      Alert.alert('Error', 'Full name is required')
      return
    }
    setLoading(true)
    try {
      await mutation.mutateAsync(form)
    } finally {
      setLoading(false)
    }
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Sorry, we need camera roll permissions to make this work!')
      return
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled) {
      handleUploadPhoto(result.assets[0])
    }
  }

  async function handleUploadPhoto(asset: ImagePicker.ImagePickerAsset) {
    setUploading(true)
    try {
      const formData = new FormData() as any
      const uri = Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri

      formData.append('photo', {
        uri: asset.uri,
        name: asset.fileName || `photo-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      })

      const res = await usersApi.updatePhoto(formData) // Need to add this to usersApi or use axios directly
      await refreshUser()
      queryClient.invalidateQueries({ queryKey: ['me'] })
      Alert.alert('Success', 'Profile photo updated')
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad)

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.primaryColor} />
          ) : (
            <Text style={s.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.avatarSection}>
          <TouchableOpacity style={s.avatarContainer} onPress={pickImage} disabled={uploading}>
            {user?.photoUrl ? (
              <ExpoImage source={{ uri: user.photoUrl }} style={s.avatarImage} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarText}>{user?.fullName?.slice(0, 2).toUpperCase()}</Text>
              </View>
            )}
            {uploading && (
              <View style={s.uploadOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
            {/* <View style={s.cameraIconBox}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View> */}
          </TouchableOpacity>
          <TouchableOpacity style={s.changePhotoBtn} onPress={pickImage} disabled={uploading}>
            <Text style={s.changePhotoText}>
              {uploading ? 'Uploading...' : 'Change Profile Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Profile Details</Text>

          <Text style={s.label}>Full Name</Text>
          <TextInput
            style={s.input}
            value={form.fullName}
            onChangeText={(v) => setForm({ ...form, fullName: v })}
            placeholder="Your full name"
            placeholderTextColor={textSecondary}
          />

          <Text style={s.label}>Stage / Display Name</Text>
          <TextInput
            style={s.input}
            value={form.displayName}
            onChangeText={(v) => setForm({ ...form, displayName: v })}
            placeholder="Your stage name"
            placeholderTextColor={textSecondary}
          />

          <Text style={s.label}>Bio / Personal Quote</Text>
          <TextInput
            style={[s.input, s.bioInput]}
            value={form.bio}
            onChangeText={(v) => setForm({ ...form, bio: v })}
            placeholder="Tell your fans something about yourself..."
            placeholderTextColor={textSecondary}
            multiline
            numberOfLines={4}
          />

          <Text style={s.label}>Phone Number</Text>
          <TextInput
            style={[s.input, s.readOnlyInput]}
            value={user?.phone}
            editable={false}
          />

          <Text style={s.label}>Email Address</Text>
          <TextInput
            style={[s.input, s.readOnlyInput]}
            value={user?.email}
            editable={false}
          />
          <Text style={s.hint}>To change your email or phone, please contact support.</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Account Information (Read-only)</Text>

          <DataRow label="Account ID" value={user?.id} border={border} textPrimary={textPrimary} />
          <DataRow label="Role" value={user?.role} border={border} textPrimary={textPrimary} />
          <DataRow label="Account Status" value={user?.isActive ? 'Active' : 'Suspended'} border={border} textPrimary={textPrimary} />
          <DataRow label="Email Verified" value={user?.emailVerified ? 'Yes' : 'No'} border={border} textPrimary={textPrimary} />
          <DataRow label="Phone Verified" value={user?.phoneVerified ? 'Yes' : 'No'} border={border} textPrimary={textPrimary} />
          <DataRow label="Password Hash" value="[SECURED • SET]" border={border} textPrimary={textPrimary} />
          <DataRow label="Last Login" value={user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'} border={border} textPrimary={textPrimary} />
          <DataRow label="Registered On" value={new Date(user?.createdAt).toLocaleString()} border={border} textPrimary={textPrimary} />
          <DataRow label="Last Updated" value={new Date(user?.updatedAt).toLocaleString()} border={border} textPrimary={textPrimary} last />
        </View>
      </ScrollView>
    </View>
  )
}

function DataRow({ label, value, border, textPrimary, last }: { label: string, value: any, border: string, textPrimary: string, last?: boolean }) {
  return (
    <View style={[rowStyles.container, { borderBottomColor: border, borderBottomWidth: last ? 0 : 0.5 }]}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, { color: textPrimary }]}>{value?.toString() || 'N/A'}</Text>
    </View>
  )
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 4,
  },
  label: { fontSize: 13, color: '#888' },
  value: { fontSize: 13, fontWeight: '500', textAlign: 'right', flex: 1, marginLeft: 20 },
})

function makeStyles(theme: any, bg: string, surface: string, textPrimary: string, textSecondary: string, border: string, pad: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    header: {
      paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20,
      backgroundColor: surface, borderBottomWidth: 0.5, borderBottomColor: border,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: textPrimary },
    saveText: { fontSize: 16, color: theme.primaryColor, fontWeight: '600' },
    content: { padding: 20 },
    avatarSection: { alignItems: 'center', marginBottom: 24 },
    avatarContainer: {
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: theme.accentColor,
      overflow: 'hidden', position: 'relative',
    },
    avatarImage: { width: '100%', height: '100%' },
    avatarPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: theme.primaryColor, fontSize: 32, fontWeight: '800' },
    uploadOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center', justifyContent: 'center',
    },
    cameraIconBox: {
      position: 'absolute', bottom: 0, right: 0,
      backgroundColor: theme.primaryColor, width: 30, height: 30,
      borderRadius: 15, alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: bg, zIndex: 100
    },
    changePhotoBtn: { marginTop: 14 },
    changePhotoText: { color: theme.primaryColor, fontSize: 13, fontWeight: '600' },
    section: { marginBottom: 32 },
    sectionTitle: {
      fontSize: 12, fontWeight: '800', color: textSecondary,
      textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
    },
    label: { fontSize: 13, fontWeight: '600', color: textSecondary, marginBottom: 8, marginTop: 18 },
    input: {
      backgroundColor: surface,
      borderWidth: 1, borderColor: border,
      borderRadius: 14, padding: 16,
      fontSize: 15, color: textPrimary,
    },
    readOnlyInput: { backgroundColor: border + '15', color: textSecondary, borderColor: 'transparent' },
    bioInput: { height: 100, textAlignVertical: 'top', paddingTop: 14 },
    hint: { fontSize: 12, color: textSecondary, marginTop: 10, fontStyle: 'italic', lineHeight: 18 },
  })
}
