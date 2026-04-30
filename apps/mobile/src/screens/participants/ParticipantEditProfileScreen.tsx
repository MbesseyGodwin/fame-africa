// apps/mobile/src/screens/participants/ParticipantEditProfileScreen.tsx

import React, { useState, useEffect, useMemo } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Modal, FlatList,
  Platform, KeyboardAvoidingView, Image
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { participantsApi, aiApi } from '../../utils/api'
import { useTheme } from '../../context/ThemeContext'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import dayjs from 'dayjs'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { AFRICA_LOCATIONS } from '../../utils/locationData'

const MAX_PHOTO_SIZE = 5 * 1024 * 1024 // 5 MB

const AFRICAN_COUNTRIES = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Comoros", "Congo (Congo-Brazzaville)", "Democratic Republic of the Congo", "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Ivory Coast", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "Sao Tome and Principe", "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe"
].sort()

export default function ParticipantEditProfileScreen() {
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading: fetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => participantsApi.getDashboard(),
  })

  const dashboard = data?.data?.data
  const participantData = dashboard?.participant

  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    state: '',
    city: '',
    nationality: '',
    instagramUrl: '',
    twitterUrl: '',
    tiktokUrl: '',
    youtubeUrl: '',
    embeddedVideoUrl: '',
  })

  const [image, setImage] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<'nationality' | 'state' | 'city' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateBio = async () => {
    if (!form.displayName) {
      Alert.alert('Name Required', 'Please enter your Stage/Display Name first so the AI can tailor the bio to you.')
      return
    }

    setIsGenerating(true)
    try {
      const response = await aiApi.generateBio({
        name: form.displayName,
        draftBio: form.bio
      })

      if (response.data?.success) {
        setForm(prev => ({ ...prev, bio: response.data.data }))
      }
    } catch (error: any) {
      console.error('[handleGenerateBio] error:', error)
      Alert.alert('AI Offline', 'Could not generate bio right now. Please try again later.')
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (participantData) {
      setForm({
        displayName: participantData.displayName || '',
        bio: participantData.bio || '',
        state: participantData.state || '',
        city: participantData.city || '',
        nationality: participantData.nationality || '',
        instagramUrl: participantData.instagramUrl || '',
        twitterUrl: participantData.twitterUrl || '',
        tiktokUrl: participantData.tiktokUrl || '',
        youtubeUrl: participantData.youtubeUrl || '',
        embeddedVideoUrl: participantData.embeddedVideoUrl || '',
      })
    }
  }, [participantData])

  const mutation = useMutation({
    mutationFn: (updates: FormData) => participantsApi.updateProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      Alert.alert('Success', 'Profile updated successfully.')
      router.back()
    },
    onError: (error: any) => {
      Alert.alert('Update Failed', error.response?.data?.message || 'Something went wrong')
    }
  })

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    })
    if (!result.canceled) {
      const asset = result.assets[0]
      let size = asset.fileSize
      if (!size) {
        try {
          const info = await FileSystem.getInfoAsync(asset.uri)
          if (info.exists) size = info.size
        } catch { }
      }

      if (size && size > MAX_PHOTO_SIZE) {
        Alert.alert('Photo Too Large', 'Please select a smaller image (under 5 MB) to ensure fast profile loading.')
        return
      }
      setImage(asset.uri)
    }
  }

  const openSelector = (type: 'nationality' | 'state' | 'city') => {
    setModalType(type)
    setSearchQuery('')
    setModalVisible(true)
  }

  const getOptions = (): string[] => {
    if (modalType === 'nationality') return AFRICA_LOCATIONS.map(c => c.name)
    if (modalType === 'state') {
      return AFRICA_LOCATIONS.find(c => c.name === form.nationality)?.states.map(s => s.name) ?? []
    }
    if (modalType === 'city') {
      return AFRICA_LOCATIONS.find(c => c.name === form.nationality)
        ?.states.find(s => s.name === form.state)?.cities ?? []
    }
    return []
  }

  const filteredOptions = getOptions().filter(o =>
    o.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = (item: string) => {
    if (modalType === 'nationality') setForm(f => ({ ...f, nationality: item, state: '', city: '' }))
    else if (modalType === 'state') setForm(f => ({ ...f, state: item, city: '' }))
    else if (modalType === 'city') setForm(f => ({ ...f, city: item }))
    setModalVisible(false)
  }

  const handleSave = () => {
    if (!form.displayName.trim()) return Alert.alert('Error', 'Display name is required.')

    const fd = new FormData()
    fd.append('displayName', form.displayName)
    fd.append('bio', form.bio)
    fd.append('nationality', form.nationality)
    fd.append('state', form.state)
    fd.append('city', form.city)
    fd.append('instagramUrl', form.instagramUrl)
    fd.append('twitterUrl', form.twitterUrl)
    fd.append('tiktokUrl', form.tiktokUrl)
    fd.append('youtubeUrl', form.youtubeUrl)
    fd.append('embeddedVideoUrl', form.embeddedVideoUrl)

    if (image && !image.startsWith('http')) {
      const name = image.split('/').pop() || 'photo.jpg'
      fd.append('photo', {
        uri: image,
        name,
        type: name.endsWith('.png') ? 'image/png' : 'image/jpeg'
      } as any)
    }

    mutation.mutate(fd)
  }

  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad)
  const insets = useSafeAreaInsets()

  if (fetching) {
    return (
      <View style={[s.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
      </View>
    )
  }

  const renderDataRow = (label: string, value: any, icon?: string) => (
    <View style={s.dataRow}>
      <View style={s.dataLabelGroup}>
        {icon && <Ionicons name={icon as any} size={14} color={textSecondary} style={{ marginRight: 6 }} />}
        <Text style={s.dataLabel}>{label}</Text>
      </View>
      <Text style={s.dataValue} numberOfLines={1}>{value?.toString() || '—'}</Text>
    </View>
  )

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={[s.header, { borderTopWidth: 0 }]}>
            <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
              <Ionicons name="close" size={24} color={textPrimary} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Edit Competition Bio</Text>
            <TouchableOpacity onPress={handleSave} disabled={mutation.isPending} style={s.headerBtn}>
              {mutation.isPending ? (
                <ActivityIndicator size="small" color={theme.primaryColor} />
              ) : (
                <Text style={s.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
            {/* Editable Fields Card */}
            <View style={s.card}>
              <Text style={s.cardTitle}>BIO & LOCATION</Text>

              {/* Profile Image */}
              <Text style={s.label}>Profile Photo</Text>
              <View style={s.imageUploadContainer}>
                <TouchableOpacity style={s.imagePicker} onPress={pickImage}>
                  {image ? (
                    <Image source={{ uri: image }} style={s.profileImage} />
                  ) : (
                    <View style={s.placeholderImage}>
                      <Ionicons name="camera" size={32} color={textSecondary} />
                    </View>
                  )}
                  <View style={s.imageEditBadge}>
                    <Ionicons name="pencil" size={14} color="#fff" />
                  </View>
                </TouchableOpacity>
                <View style={s.imageHints}>
                  <Text style={s.imageHintTitle}>Make a great first impression</Text>
                  <Text style={s.imageHintText}>Clear solo shot, natural light. JPG/PNG max 5MB.</Text>
                </View>
              </View>

              <Text style={s.label}>Stage / Display Name</Text>
              <TextInput
                style={s.input}
                value={form.displayName}
                onChangeText={(v) => setForm({ ...form, displayName: v })}
                placeholder="Official Competition Name"
                placeholderTextColor={textSecondary}
              />

              <Text style={s.label}>Nationality (Pan-African)</Text>
              <TouchableOpacity
                style={s.selectTrigger}
                onPress={() => openSelector('nationality')}
              >
                <Text style={[s.selectTriggerText, !form.nationality && { color: textSecondary }]}>
                  {form.nationality || "Select Country"}
                </Text>
                <Ionicons name="chevron-down" size={20} color={textSecondary} />
              </TouchableOpacity>

              <View style={s.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={s.label}>State / Province</Text>
                  <TouchableOpacity
                    style={[s.selectTrigger, !form.nationality && { opacity: 0.5 }]}
                    onPress={() => form.nationality && openSelector('state')}
                    disabled={!form.nationality}
                  >
                    <Text style={[s.selectTriggerText, !form.state && { color: textSecondary }]} numberOfLines={1}>
                      {form.state || "State"}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>City</Text>
                  <TouchableOpacity
                    style={[s.selectTrigger, !form.state && { opacity: 0.5 }]}
                    onPress={() => form.state && openSelector('city')}
                    disabled={!form.state}
                  >
                    <Text style={[s.selectTriggerText, !form.city && { color: textSecondary }]} numberOfLines={1}>
                      {form.city || "City"}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 }}>
                <Text style={[s.label, { marginBottom: 0 }]}>Competition Bio</Text>
                <TouchableOpacity
                  onPress={handleGenerateBio}
                  disabled={isGenerating}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primaryColor + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}
                >
                  {isGenerating ? (
                    <ActivityIndicator size="small" color={theme.primaryColor} style={{ marginRight: 4 }} />
                  ) : (
                    <MaterialCommunityIcons name="book-open-variant" size={14} color={theme.primaryColor} style={{ marginRight: 4 }} />
                  )}
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.primaryColor }}>
                    {isGenerating ? 'Writing...' : 'Magic Write'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[s.input, s.bioInput]}
                value={form.bio}
                onChangeText={(v) => setForm({ ...form, bio: v })}
                placeholder="Tell your fans why they should vote for you..."
                placeholderTextColor={textSecondary}
                multiline
                numberOfLines={10}
              />
            </View>

            {/* Social Presence Card */}
            <View style={s.card}>
              <Text style={s.cardTitle}>SOCIAL PRESENCE & FEATURED VIDEO</Text>

              <Text style={s.label}>Featured Video Link (YouTube/TikTok/Instagram)</Text>
              <TextInput
                style={s.input}
                value={form.embeddedVideoUrl}
                onChangeText={(v) => setForm({ ...form, embeddedVideoUrl: v })}
                placeholder="Paste the video link here to show it on your profile"
                placeholderTextColor={textSecondary}
                multiline
                numberOfLines={5}
                autoCapitalize="none"
              />
              <Text style={{ fontSize: 11, color: textSecondary, marginTop: 4, marginBottom: 16 }}>
                This video will play directly on your voting page for fans to watch.
              </Text>

              <View style={s.socialContainer}>
                {[
                  { key: 'instagramUrl', icon: 'logo-instagram', color: '#E1306C', label: 'Instagram' },
                  { key: 'twitterUrl', icon: 'logo-twitter', color: '#1DA1F2', label: 'Twitter (X)' },
                  { key: 'tiktokUrl', icon: 'logo-tiktok', color: '#000000', label: 'TikTok' },
                  { key: 'youtubeUrl', icon: 'logo-youtube', color: '#FF0000', label: 'YouTube' }
                ].map(social => (
                  <View key={social.key} style={s.socialRow}>
                    <View style={[s.socialIconBox, { backgroundColor: social.color + '15' }]}>
                      <Ionicons name={social.icon as any} size={18} color={social.color} />
                    </View>
                    <TextInput
                      style={s.socialInput}
                      value={(form as any)[social.key]}
                      onChangeText={(v) => setForm({ ...form, [social.key]: v })}
                      placeholder={`@${social.label.toLowerCase()} / link`}
                      placeholderTextColor={textSecondary}
                      autoCapitalize="none"
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* Read-Only System Records */}

            {/* Read-Only System Records */}
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.cardTitle}>SYSTEM RECORDS (READ-ONLY)</Text>
                <Ionicons name="lock-closed" size={14} color={textSecondary} />
              </View>

              <View style={s.dataGrid}>
                <Text style={s.dataSubTitle}>Competition IDs</Text>
                {renderDataRow('Participant ID', participantData?.id, 'finger-print')}
                {renderDataRow('User ID', participantData?.userId, 'person-outline')}
                {renderDataRow('Cycle ID', participantData?.cycleId, 'layers-outline')}
                {renderDataRow('Vote Slug', participantData?.voteLinkSlug, 'link-outline')}

                <View style={s.divider} />
                <Text style={s.dataSubTitle}>Payments & Fees</Text>
                {renderDataRow('Paid', participantData?.registrationFeePaid ? 'YES' : 'NO', 'checkmark-circle-outline')}
                {renderDataRow('Amount', participantData?.paymentAmount ? `₦${participantData.paymentAmount}` : '—', 'cash-outline')}
                {renderDataRow('Reference', participantData?.paymentReference, 'receipt-outline')}
                {renderDataRow('Date Paid', participantData?.paidAt ? dayjs(participantData.paidAt).format('MMM DD, YYYY HH:mm') : '—', 'calendar-outline')}

                <View style={s.divider} />
                <Text style={s.dataSubTitle}>Performance & Status</Text>
                {renderDataRow('Current Status', participantData?.status, 'flash-outline')}
                {renderDataRow('Rank', dashboard?.currentRank ? `#${dashboard.currentRank}` : '—', 'trophy-outline')}
                {renderDataRow('Total Votes', participantData?.totalVotes?.toLocaleString(), 'people-outline')}
                {renderDataRow('Stan Count', participantData?.stanCount?.toLocaleString(), 'heart-outline')}
                {renderDataRow('Arena Wins', participantData?.arenaWins, 'ribbon-outline')}
                {renderDataRow('Strikes', `${participantData?.arenaStrikes}/3`, 'alert-circle-outline')}

                <View style={s.divider} />
                <Text style={s.dataSubTitle}>System Timestamps</Text>
                {renderDataRow('Registered On', dayjs(participantData?.createdAt).format('MMM DD, YYYY HH:mm'), 'time-outline')}
                {renderDataRow('Last Update', dayjs(participantData?.updatedAt).format('MMM DD, YYYY HH:mm'), 'sync-outline')}
                {participantData?.eliminatedAt && renderDataRow('Eliminated On', dayjs(participantData.eliminatedAt).format('MMM DD, YYYY HH:mm'), 'exit-outline')}
              </View>
            </View>

            <TouchableOpacity
              style={[s.saveBtn, mutation.isPending && s.saveBtnDisabled]}
              onPress={handleSave}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.saveBtnText}>Update Profile</Text>
              )}
            </TouchableOpacity>
          </ScrollView>

          {/* Selector Modal */}
          <Modal visible={modalVisible} animationType="slide" transparent>
            <View style={s.modalOverlay}>
              <View style={s.modalContent}>
                <View style={s.modalHeader}>
                  <Text style={s.modalTitle}>
                    Select {modalType?.charAt(0).toUpperCase()}{modalType?.slice(1)}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close-circle" size={26} color={textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={s.searchBar}>
                  <Ionicons name="search" size={20} color={textSecondary} />
                  <TextInput
                    style={s.searchInput}
                    placeholder={`Search ${modalType || 'options'}…`}
                    placeholderTextColor={textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={16} color={textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                <FlatList
                  data={filteredOptions}
                  keyExtractor={item => item}
                  renderItem={({ item }) => {
                    const isActive =
                      (modalType === 'nationality' && form.nationality === item) ||
                      (modalType === 'state' && form.state === item) ||
                      (modalType === 'city' && form.city === item)
                    return (
                      <TouchableOpacity
                        style={[s.countryItem, isActive && { backgroundColor: theme.primaryColor + '08' }]}
                        onPress={() => handleSelect(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.countryText, isActive && { color: theme.primaryColor, fontWeight: '700' }]}>{item}</Text>
                        {isActive && <Ionicons name="checkmark-circle" size={18} color={theme.primaryColor} />}
                      </TouchableOpacity>
                    )
                  }}
                  ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 40 }}>
                      <Ionicons name="search-outline" size={40} color={textSecondary} />
                      <Text style={{ color: textSecondary, marginTop: 10 }}>No results found</Text>
                    </View>
                  }
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>

    </View>
  )
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
    saveText: { fontSize: 16, color: theme.primaryColor, fontWeight: '700' },
    content: { padding: 16, paddingBottom: 40 },
    card: {
      backgroundColor: surface, borderRadius: 20, padding: 20, marginBottom: 16,
      borderWidth: 1, borderColor: border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    cardTitle: { fontSize: 12, fontWeight: '800', color: textSecondary, letterSpacing: 1 },
    label: { fontSize: 13, fontWeight: '700', color: textPrimary, marginTop: 16, marginBottom: 8 },
    input: {
      backgroundColor: bg, borderWidth: 1, borderColor: border,
      borderRadius: 12, padding: 14, fontSize: 15, color: textPrimary
    },
    selectTrigger: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: bg, borderWidth: 1, borderColor: border,
      borderRadius: 12, padding: 14
    },
    selectTriggerText: { fontSize: 15, color: textPrimary },
    bioInput: { height: 200, textAlignVertical: 'top' },
    row: { flexDirection: 'row' },
    socialContainer: { marginTop: 10 },
    socialRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    socialIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    socialInput: { flex: 1, fontSize: 15, color: textPrimary, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: border },
    dataGrid: { marginTop: 8 },
    dataSubTitle: { fontSize: 11, fontWeight: '700', color: theme.primaryColor, marginTop: 16, marginBottom: 8, textTransform: 'uppercase' },
    dataRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: border + '50' },
    dataLabelGroup: { flexDirection: 'row', alignItems: 'center' },
    dataLabel: { fontSize: 13, color: textSecondary },
    dataValue: { fontSize: 13, fontWeight: '600', color: textPrimary, maxWidth: '60%' },
    divider: { height: 1, backgroundColor: border, marginTop: 16, opacity: 0.3 },
    saveBtn: {
      backgroundColor: theme.buttonColor, borderRadius: 16,
      paddingVertical: 18, alignItems: 'center', marginTop: 10
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '80%', padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: textPrimary },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: bg, paddingHorizontal: 15, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: border },
    searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 16, color: textPrimary },
    countryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: border },
    countryText: { fontSize: 16, color: textPrimary },

    infoText: { fontSize: 12, color: textSecondary, marginTop: 8, marginBottom: 16, lineHeight: 18 },
    addVideoBox: { marginBottom: 16 },
    miniInput: {
      backgroundColor: bg, borderWidth: 1, borderColor: border,
      borderRadius: 10, padding: 10, fontSize: 14, color: textPrimary, marginBottom: 8
    },
    addBtn: {
      width: 50, height: 48, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center'
    },
    videoList: { marginTop: 8 },
    videoItem: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: bg, padding: 12, borderRadius: 12, marginBottom: 8,
      borderWidth: 1, borderColor: border
    },
    videoItemInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    videoItemTitle: { fontSize: 13, color: textPrimary, flex: 1 },

    imageUploadContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 },
    imagePicker: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', position: 'relative' },
    profileImage: { width: '100%', height: '100%' },
    placeholderImage: { width: '100%', height: '100%', backgroundColor: bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: border, borderStyle: 'dashed', borderRadius: 40 },
    imageEditBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.primaryColor, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: surface },
    imageHints: { flex: 1, marginLeft: 16 },
    imageHintTitle: { fontSize: 14, fontWeight: '700', color: textPrimary, marginBottom: 4 },
    imageHintText: { fontSize: 12, color: textSecondary, lineHeight: 16 }
  })
}
