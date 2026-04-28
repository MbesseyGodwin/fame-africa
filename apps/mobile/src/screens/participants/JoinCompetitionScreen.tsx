// apps/mobile/src/screens/participants/JoinCompetitionScreen.tsx

import React, { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Image,
  KeyboardAvoidingView, Platform, Dimensions,
  Modal, FlatList, Linking,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { useRouter } from 'expo-router'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { participantsApi, competitionsApi } from '../../utils/api'
import { useTheme } from '../../context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'
import { AFRICA_LOCATIONS } from '../../utils/locationData'
import { BlurView } from 'expo-blur'

const { width, height } = Dimensions.get('window')

// ─────────────────────────────────────────────────────────────
// Responsive scale helper — keeps type/spacing proportional
// across small (360dp) and large (430dp) screens
// ─────────────────────────────────────────────────────────────
const BASE_W = 390
const scale = (size: number) => Math.round((width / BASE_W) * size)
const vs = (size: number) => Math.round((height / 844) * size)

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function JoinCompetitionScreen() {
  const { user } = useAuth()
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const qc = useQueryClient()
  const scrollRef = useRef<ScrollView>(null)

  // ── Cycle query ───────────────────────────────────────────
  const { data: cycleRes, isLoading: checkingCycle } = useQuery({
    queryKey: ['currentCycle'],
    queryFn: () => competitionsApi.getCurrent(),
  })
  const cycle = cycleRes?.data?.data

  // ── Form state ────────────────────────────────────────────
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    bio: '',
    photoUrl: '',
    videoUrl: '',
    category: '',
    state: '',
    city: '',
    nationality: '',
    instagramUrl: '',
    twitterUrl: '',
    tiktokUrl: '',
    youtubeUrl: '',
  })
  const [image, setImage] = useState<string | null>(null)
  const [video, setVideo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // ── Modal (location picker) ───────────────────────────────
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<'nationality' | 'state' | 'city' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // ── Mutation ──────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (data: FormData) => participantsApi.register(data),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      const { paymentUrl } = res.data?.data || {}

      if (paymentUrl) {
        Alert.alert('Payment Required', 'To complete your registration, you need to pay the entry fee.', [
          { text: 'Pay Now', onPress: () => Linking.openURL(paymentUrl) },
          { text: 'Later', onPress: () => router.replace('/(tabs)/profile') },
        ])
      } else {
        Alert.alert('Success 🎉', "You've entered! Your profile is being prepared.", [
          { text: 'Go to Dashboard', onPress: () => router.replace('/(tabs)/profile') },
        ])
      }
    },
    onError: (error: any) => {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Please try again.')
    },
  })

  // ── Pickers ───────────────────────────────────────────────
  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (!result.canceled) {
      const asset = result.assets[0]
      if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
        Alert.alert('Photo Too Large', 'Please select a smaller image (under 50 MB).')
        return
      }
      setImage(asset.uri)
      setForm(f => ({ ...f, photoUrl: asset.uri }))
    }
  }

  async function pickVideo() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
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
      if (size && size > MAX_FILE_SIZE) {
        Alert.alert('Video Too Large', `${(size / 1024 / 1024).toFixed(1)} MB exceeds the 50 MB limit. Please compress or trim your video.`)
        return
      }
      setVideo(asset.uri)
      setForm(f => ({ ...f, videoUrl: asset.uri }))
    }
  }

  // ── Location modal helpers ────────────────────────────────
  const openSelector = (type: 'nationality' | 'state' | 'city') => {
    setModalType(type); setSearchQuery(''); setModalVisible(true)
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

  // ── Step navigation ───────────────────────────────────────
  function goNext() {
    if (step === 0) { setStep(1); scrollRef.current?.scrollTo({ y: 0, animated: false }); return }

    if (step === 1) {
      if (!form.displayName.trim() || !form.category || !form.bio.trim() ||
        !form.state.trim() || !form.city.trim() || !form.nationality.trim()) {
        Alert.alert('Missing Info', 'Please complete all required fields including nationality and category.')
        return
      }
      if (form.bio.length < 50) {
        Alert.alert('Bio Too Short', 'Write at least 50 characters so voters know who you are.')
        return
      }
    }
    if (step === 2 && !image) { Alert.alert('Photo Required', 'Upload a profile photo to continue.'); return }
    if (step === 3 && !video) { Alert.alert('Video Required', 'Upload a talent or intro video to continue.'); return }

    if (step < 4) {
      setStep(s => s + 1)
      scrollRef.current?.scrollTo({ y: 0, animated: false })
    } else {
      handleSubmit()
    }
  }

  async function handleSubmit() {
    if (!cycle?.id) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('cycleId', cycle.id)
      fd.append('displayName', form.displayName)
      fd.append('bio', form.bio)
      fd.append('category', form.category)
      fd.append('state', form.state)
      fd.append('city', form.city)
      fd.append('nationality', form.nationality)
      fd.append('instagramUrl', form.instagramUrl)
      fd.append('twitterUrl', form.twitterUrl)
      fd.append('tiktokUrl', form.tiktokUrl)
      fd.append('youtubeUrl', form.youtubeUrl)

      if (image) {
        const name = image.split('/').pop() || 'photo.jpg'
        fd.append('photo', { uri: image, name, type: name.endsWith('.png') ? 'image/png' : 'image/jpeg' } as any)
      }
      if (video) {
        const name = video.split('/').pop() || 'video.mp4'
        fd.append('video', { uri: video, name, type: 'video/mp4' } as any)
      }

      await mutation.mutateAsync(fd)
    } finally {
      setLoading(false)
    }
  }

  // ── Derived ───────────────────────────────────────────────
  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad, insets)

  const STEPS = [
    { label: 'Oath', icon: 'shield-checkmark-outline' },
    { label: 'Identity', icon: 'person-outline' },
    { label: 'Portrait', icon: 'camera-outline' },
    { label: 'Talent', icon: 'film-outline' },
    { label: 'Connect', icon: 'share-social-outline' },
  ]

  const CATEGORIES = [
    { name: 'Talent', icon: 'star-outline' },
    { name: 'Beauty', icon: 'sparkles-outline' },
    { name: 'Influencer', icon: 'megaphone-outline' },
    { name: 'Fashion', icon: 'shirt-outline' },
    { name: 'Music', icon: 'musical-notes-outline' },
    { name: 'Other', icon: 'apps-outline' },
  ]

  const isOpen = cycle && cycle.status === 'REGISTRATION_OPEN'
  const progressPct = (step / 4) * 100
  const feeAmount = cycle?.registrationFee ? Number(cycle.registrationFee) : 0
  const feeCur = cycle?.feeCurrency === 'NGN' ? '₦' : (cycle?.feeCurrency ?? '₦')
  const feeFormatted = `${feeCur}${feeAmount.toLocaleString()}`
  const prizePool = Math.round(feeAmount * 0.5)
  const marketing = Math.round(feeAmount * 0.3)
  const platformFee = feeAmount - prizePool - marketing

  const CTALabel = [
    'I Understand — Enter the Arena',
    'Save Profile Details',
    image ? 'Use This Photo' : 'Upload Photo to Continue',
    video ? 'Use This Video' : 'Upload Video to Continue',
    `Continue to Secure Payment →`,
  ][step]

  const FooterNote = [
    '',
    'All fields marked * are required',
    'JPG or PNG · max 50 MB',
    'MP4 or MOV · max 50 MB',
    'Secured by Flutterwave — 256-bit encryption',
  ][step]

  // ── Loading ───────────────────────────────────────────────
  if (checkingCycle) {
    return (
      <View style={[s.container, s.center]}>
        <View style={[s.loadingRing, { borderColor: theme.primaryColor + '30' }]}>
          <ActivityIndicator size="large" color={theme.primaryColor} />
        </View>
        <Text style={s.loadingTitle}>Checking competition status…</Text>
        <Text style={s.loadingHint}>Verifying your entry eligibility</Text>
      </View>
    )
  }

  // ── Registration closed ───────────────────────────────────
  if (!isOpen) {
    return (
      <View style={s.container}>
        <ScrollView contentContainerStyle={s.closedWrap} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => router.back()} style={[s.closedBack, { top: insets.top + 10 }]}>
            <Ionicons name="arrow-back" size={20} color={textPrimary} />
          </TouchableOpacity>

          <View style={[s.closedIconWrap, { backgroundColor: theme.primaryColor + '10' }]}>
            <Ionicons name="trophy" size={64} color={theme.primaryColor} />
            <View style={[s.lockBadge, { backgroundColor: surface, borderColor: border }]}>
              <Ionicons name="lock-closed" size={14} color={theme.primaryColor} />
            </View>
          </View>

          <View style={[s.statusBadge, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="time" size={13} color="#B45309" />
            <Text style={s.statusBadgeText}>Doors Currently Closed</Text>
          </View>

          <Text style={s.closedTitle}>The Arena is Resting</Text>
          <Text style={s.closedSub}>
            Registration for this season has concluded. Our judges and voters are evaluating existing contestants.
          </Text>

          <View style={[s.infoCard, { backgroundColor: surface, borderColor: border }]}>
            <View style={s.infoCardRow}>
              <Ionicons name="notifications-outline" size={20} color={theme.primaryColor} />
              <Text style={[s.infoCardTitle, { color: textPrimary }]}>Don't miss the next wave</Text>
            </View>
            <Text style={[s.infoCardText, { color: textSecondary }]}>
              FameAfrica returns with a fresh prize pool and new opportunities soon. Follow our socials to be notified the instant registration opens.
            </Text>
          </View>

          <TouchableOpacity style={s.primaryBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={s.primaryBtnText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    )
  }

  // ── Location picker modal ─────────────────────────────────
  const LocationModal = (
    <Modal visible={modalVisible} animationType="slide" transparent>
      <View style={s.modalBg}>
        <View style={[s.modalSheet, { backgroundColor: surface }]}>
          <View style={[s.modalHeader, { borderBottomColor: border }]}>
            <Text style={[s.modalTitle, { color: textPrimary }]}>
              Select {modalType?.charAt(0).toUpperCase()}{modalType?.slice(1)}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={26} color={textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[s.searchRow, { backgroundColor: bg, borderColor: border }]}>
            <Ionicons name="search-outline" size={16} color={textSecondary} />
            <TextInput
              style={[s.searchInput, { color: textPrimary }]}
              placeholder={`Search ${modalType}…`}
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
                  style={[s.optionRow, { borderBottomColor: border }, isActive && { backgroundColor: theme.primaryColor + '08' }]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.optionText, { color: isActive ? theme.primaryColor : textPrimary }]}>{item}</Text>
                  {isActive && <Ionicons name="checkmark-circle" size={18} color={theme.primaryColor} />}
                </TouchableOpacity>
              )
            }}
            ListEmptyComponent={
              <View style={s.emptyOption}>
                <Ionicons name="search-outline" size={28} color={textSecondary} />
                <Text style={[s.emptyOptionText, { color: textSecondary }]}>No results for "{searchQuery}"</Text>
              </View>
            }
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </View>
    </Modal>
  )

  // ── Main form ─────────────────────────────────────────────
  return (
    <>
      <KeyboardAvoidingView
        style={s.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* ── Sticky header (minimal height) ── */}
        <View style={[s.header, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity
            onPress={() => step > 0 ? setStep(s => s - 1) : router.back()}
            style={s.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={textPrimary} />
          </TouchableOpacity>

          <Text style={[s.headerTitle, { color: textPrimary }]}>FameAfrica Entry</Text>

          <View style={[s.stepPill, { backgroundColor: theme.primaryColor + '15' }]}>
            <Text style={[s.stepPillText, { color: theme.primaryColor }]}>{step}/4</Text>
          </View>
        </View>

        {/* ── Progress bar ── */}
        <View style={s.progressOuter}>
          <View style={[s.progressTrack, { backgroundColor: border }]}>
            <View style={[s.progressFill, { width: `${progressPct}%`, backgroundColor: theme.primaryColor }]} />
          </View>
          <View style={s.dotsRow}>
            {STEPS.map((st, i) => (
              <View key={i} style={s.dotGroup}>
                <View style={[s.dot, {
                  backgroundColor: i <= step ? theme.primaryColor : border,
                }]}>
                  {i < step
                    ? <Ionicons name="checkmark" size={9} color="#fff" />
                    : <View style={[s.dotCore, { backgroundColor: i === step ? '#fff' : 'transparent' }]} />
                  }
                </View>
                <Text style={[s.dotLabel, { color: i <= step ? theme.primaryColor : textSecondary }]}>
                  {st.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Step heading row ── */}
        <View style={s.stepHead}>
          <View style={[s.stepIconCircle, { backgroundColor: theme.primaryColor + '12' }]}>
            <Ionicons name={STEPS[step].icon as any} size={20} color={theme.primaryColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.stepTitle, { color: textPrimary }]}>
              {['The Fairness Charter', 'Forge Your Identity', 'Expose Your Look', 'Unleash Your Talent', 'Launch Your Journey'][step]}
            </Text>
            <Text style={[s.stepSub, { color: textSecondary }]}>
              {[
                'Formal commitment to clean, competitive play',
                'Define how fans across Africa will discover you',
                'Your portrait is your banner — make it legendary',
                'A 60-second window to convince the continent',
                'Finalize your presence and enter the arena',
              ][step]}
            </Text>
          </View>
        </View>

        {/* ════════════════════════════════════════════════════
          SCROLL AREA — button lives INSIDE here, at the bottom
          so it scrolls with content and is never obscured
      ════════════════════════════════════════════════════ */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >

          {/* ─── STEP 0 · Transparency Oath ─────────────────── */}
          {step === 0 && (
            <View style={[s.oathCard, { backgroundColor: surface, borderColor: theme.primaryColor + '50' }]}>
              <View style={s.oathHeadRow}>
                <View style={[s.oathIconBox, { backgroundColor: theme.primaryColor + '12' }]}>
                  <Ionicons name="document-text" size={26} color={theme.primaryColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.oathCardTitle, { color: textPrimary }]}>The Contestant Declaration</Text>
                  <Text style={[s.oathCardSub, { color: textSecondary }]}>Pan-African Legal & Fairness Standard</Text>
                </View>
              </View>

              <Text style={[s.oathIntro, { color: textSecondary }]}>
                FameAfrica is built on meritocracy. By entering, you formally agree to our standards of transparency:
              </Text>

              <View style={[s.oathDivider, { backgroundColor: border }]} />

              {[
                { title: 'The Hustle Mandate', text: 'Success is earned, not bought. The fee gives you a platform; your hustle gets the votes.' },
                { title: 'The No-Refund Clause', text: 'Fees are non-refundable — they immediately fuel the prize pool and national infrastructure.' },
                { title: 'The Authenticity Promise', text: 'This is a talent popularity contest, not a financial scheme. No ROI is guaranteed.' },
                { title: 'The Integrity Audit', text: 'We monitor voting patterns in real-time. Bot usage or fraud means immediate expulsion.' },
              ].map((item, i) => (
                <View key={i} style={s.oathItem}>
                  <View style={[s.oathNum, { backgroundColor: theme.primaryColor + '12' }]}>
                    <Text style={[s.oathNumText, { color: theme.primaryColor }]}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.oathItemTitle, { color: textPrimary }]}>{item.title}</Text>
                    <Text style={[s.oathItemText, { color: textSecondary }]}>{item.text}</Text>
                  </View>
                </View>
              ))}

              <View style={[s.signZone, { backgroundColor: bg, borderColor: border }]}>
                <Ionicons name="finger-print" size={22} color={theme.primaryColor} />
                <Text style={[s.signZoneText, { color: textSecondary }]}>
                  Tapping <Text style={{ fontStyle: 'normal', fontWeight: '800', color: textPrimary }}>"Enter the Arena"</Text> below constitutes your digital signature on this charter.
                </Text>
              </View>
            </View>
          )}

          {/* ─── STEP 1 · Identity ──────────────────────────── */}
          {step === 1 && (
            <View>
              {/* Stage name */}
              <Text style={[s.label, { color: textPrimary }]}>Stage Name <Text style={s.req}>*</Text></Text>
              <Text style={[s.hint, { color: textSecondary }]}>
                Your official brand name — use the name your fans already know you by.
              </Text>
              <View style={[s.inputRow, { backgroundColor: bg, borderColor: border }]}>
                <Ionicons name="person-outline" size={18} color={theme.primaryColor} style={s.inputIcon} />
                <TextInput
                  style={[s.input, { color: textPrimary }]}
                  placeholder="e.g. StarBoy Wiz / Mercy Stylez"
                  placeholderTextColor={textSecondary}
                  value={form.displayName}
                  onChangeText={t => setForm(f => ({ ...f, displayName: t }))}
                  returnKeyType="next"
                />
              </View>

              {/* Category */}
              <Text style={[s.label, { color: textPrimary }]}>Category <Text style={s.req}>*</Text></Text>
              <Text style={[s.hint, { color: textSecondary }]}>
                Choose the arena where you'll compete. This determines your leaderboard.
              </Text>
              <View style={s.catGrid}>
                {CATEGORIES.map(cat => {
                  const sel = form.category === cat.name
                  return (
                    <TouchableOpacity
                      key={cat.name}
                      style={[s.catCard, {
                        backgroundColor: sel ? theme.primaryColor : surface,
                        borderColor: sel ? theme.primaryColor : border,
                      }]}
                      onPress={() => setForm(f => ({ ...f, category: cat.name }))}
                      activeOpacity={0.75}
                    >
                      <Ionicons name={cat.icon as any} size={22} color={sel ? '#fff' : theme.primaryColor} />
                      <Text style={[s.catText, { color: sel ? '#fff' : textPrimary }]}>{cat.name}</Text>
                      {sel && (
                        <View style={s.catCheck}>
                          <Ionicons name="checkmark" size={10} color={theme.primaryColor} />
                        </View>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>

              {/* Bio */}
              <View style={s.bioHeadRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.label, { color: textPrimary, marginTop: 0 }]}>Biography <Text style={s.req}>*</Text></Text>
                  <Text style={[s.hint, { color: textSecondary, marginBottom: 0 }]}>
                    Your pitch to voters — tell your story and why you deserve to win.
                  </Text>
                </View>
                <Text style={[s.bioCounter, { color: form.bio.length < 50 ? '#EF4444' : '#10B981' }]}>
                  {form.bio.length}/500
                </Text>
              </View>
              <View style={[s.inputRow, s.inputMulti, { backgroundColor: bg, borderColor: border }]}>
                <TextInput
                  style={[s.input, s.inputTextArea, { color: textPrimary }]}
                  placeholder="Share your journey and why you deserve to win. (Min 50 characters)"
                  placeholderTextColor={textSecondary}
                  value={form.bio}
                  onChangeText={t => setForm(f => ({ ...f, bio: t.slice(0, 500) }))}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Nationality */}
              <Text style={[s.label, { color: textPrimary }]}>Nationality <Text style={s.req}>*</Text></Text>
              <Text style={[s.hint, { color: textSecondary }]}>Your home country — unlocks the state/city selectors below.</Text>
              <TouchableOpacity
                style={[s.inputRow, { backgroundColor: bg, borderColor: border }]}
                onPress={() => openSelector('nationality')}
                activeOpacity={0.8}
              >
                <Ionicons name="globe-outline" size={18} color={theme.primaryColor} style={s.inputIcon} />
                <Text style={[s.inputVal, { color: form.nationality ? textPrimary : textSecondary, flex: 1 }]}>
                  {form.nationality || 'Select nationality'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={textSecondary} />
              </TouchableOpacity>

              {/* State + City row */}
              <Text style={[s.label, { color: textPrimary }]}>State & City <Text style={s.req}>*</Text></Text>
              <Text style={[s.hint, { color: textSecondary }]}>Helps local fans find and vote for their hometown hero.</Text>
              <View style={s.twoCol}>
                <TouchableOpacity
                  style={[s.inputRow, { flex: 1, backgroundColor: bg, borderColor: border, opacity: form.nationality ? 1 : 0.45 }]}
                  onPress={() => form.nationality && openSelector('state')}
                  disabled={!form.nationality}
                  activeOpacity={0.8}
                >
                  <Ionicons name="map-outline" size={16} color={theme.primaryColor} style={s.inputIcon} />
                  <Text style={[s.inputVal, { color: form.state ? textPrimary : textSecondary, flex: 1 }]}>
                    {form.state || 'State'}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.inputRow, { flex: 1, backgroundColor: bg, borderColor: border, opacity: form.state ? 1 : 0.45 }]}
                  onPress={() => form.state && openSelector('city')}
                  disabled={!form.state}
                  activeOpacity={0.8}
                >
                  <Ionicons name="business-outline" size={16} color={theme.primaryColor} style={s.inputIcon} />
                  <Text style={[s.inputVal, { color: form.city ? textPrimary : textSecondary, flex: 1 }]}>
                    {form.city || 'City'}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={textSecondary} />
                </TouchableOpacity>
              </View>

              {LocationModal}
            </View>
          )}

          {/* ─── STEP 2 · Portrait photo ─────────────────────── */}
          {step === 2 && (
            <View>
              <View style={s.guideRow}>
                <View style={[s.guideBox, { backgroundColor: '#ECFDF5', borderColor: '#10B98125' }]}>
                  <Text style={s.guideBoxHead}>✅ Do This</Text>
                  <Text style={s.guideBoxLine}>Clear natural lighting</Text>
                  <Text style={s.guideBoxLine}>Eye contact with camera</Text>
                  <Text style={s.guideBoxLine}>High-res solo shot</Text>
                </View>
                <View style={[s.guideBox, { backgroundColor: '#FEF2F2', borderColor: '#EF444420' }]}>
                  <Text style={s.guideBoxHead}>❌ Avoid This</Text>
                  <Text style={s.guideBoxLine}>Dark or blurry images</Text>
                  <Text style={s.guideBoxLine}>Heavy filters or masks</Text>
                  <Text style={s.guideBoxLine}>Group photos or cartoons</Text>
                </View>
              </View>

              <Text style={[s.uploadHint, { color: textPrimary }]}>
                Tap the circle to select your photo <Text style={s.req}>*</Text>
              </Text>

              <TouchableOpacity
                style={[s.photoCircle, { borderColor: image ? theme.primaryColor : border, backgroundColor: bg }]}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                {image ? (
                  <Image source={{ uri: image }} style={s.photoImg} />
                ) : (
                  <View style={s.uploadCenter}>
                    <View style={[s.uploadIconRing, { backgroundColor: theme.primaryColor + '12' }]}>
                      <Ionicons name="camera" size={28} color={theme.primaryColor} />
                    </View>
                    <Text style={[s.uploadCta, { color: textPrimary }]}>Select Photo</Text>
                    <Text style={[s.uploadSub, { color: textSecondary }]}>Tap to open gallery</Text>
                  </View>
                )}
                {image && (
                  <View style={[s.editBadge, { backgroundColor: theme.primaryColor, borderColor: surface }]}>
                    <Ionicons name="pencil" size={14} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>

              {image && (
                <View style={[s.successBar, { backgroundColor: '#ECFDF5', borderColor: '#10B98130' }]}>
                  <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                  <Text style={s.successBarText}>Photo ready. Tap the circle to change it.</Text>
                </View>
              )}
            </View>
          )}

          {/* ─── STEP 3 · Talent video ───────────────────────── */}
          {step === 3 && (
            <View>
              <View style={s.guideRow}>
                <View style={[s.guideBox, { backgroundColor: '#EFF6FF', borderColor: '#3B82F620' }]}>
                  <Text style={s.guideBoxHead}>🎭 Talent Tips</Text>
                  <Text style={s.guideBoxLine}>30–60 seconds sweet spot</Text>
                  <Text style={s.guideBoxLine}>Confident intro + performance</Text>
                  <Text style={s.guideBoxLine}>Quiet setting, clear audio</Text>
                </View>
                <View style={[s.guideBox, { backgroundColor: '#F5F3FF', borderColor: '#8B5CF620' }]}>
                  <Text style={s.guideBoxHead}>⚠️ Tech Check</Text>
                  <Text style={s.guideBoxLine}>Steady camera, no shaking</Text>
                  <Text style={s.guideBoxLine}>Max 50 MB file size</Text>
                  <Text style={s.guideBoxLine}>MP4 format recommended</Text>
                </View>
              </View>

              <Text style={[s.uploadHint, { color: textPrimary }]}>
                Tap below to select your video <Text style={s.req}>*</Text>
              </Text>

              <TouchableOpacity
                style={[s.videoBox, { borderColor: video ? theme.primaryColor : border, backgroundColor: bg }]}
                onPress={pickVideo}
                activeOpacity={0.8}
              >
                {video ? (
                  <View style={s.uploadCenter}>
                    <View style={[s.videoSuccessRing, { borderColor: '#10B981' }]}>
                      <Ionicons name="checkmark-circle" size={46} color="#10B981" />
                    </View>
                    <Text style={[s.uploadCta, { color: textPrimary, marginTop: 10 }]}>Video Attached & Ready</Text>
                    <Text style={[s.uploadSub, { color: theme.primaryColor }]}>Tap to swap it out</Text>
                  </View>
                ) : (
                  <View style={s.uploadCenter}>
                    <View style={[s.uploadIconRing, { backgroundColor: theme.primaryColor + '12' }]}>
                      <Ionicons name="film" size={28} color={theme.primaryColor} />
                    </View>
                    <Text style={[s.uploadCta, { color: textPrimary }]}>Select Video from Gallery</Text>
                    <Text style={[s.uploadSub, { color: textSecondary }]}>Max 50 MB · MP4 recommended</Text>
                  </View>
                )}
              </TouchableOpacity>

              {video && (
                <View style={[s.successBar, { backgroundColor: '#ECFDF5', borderColor: '#10B98130' }]}>
                  <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                  <Text style={s.successBarText}>Video ready. Will upload after payment is confirmed.</Text>
                </View>
              )}
            </View>
          )}

          {/* ─── STEP 4 · Socials + fee ──────────────────────── */}
          {step === 4 && (
            <View>
              <View style={[s.infoTip, { backgroundColor: theme.primaryColor + '08', borderColor: theme.primaryColor + '20' }]}>
                <Ionicons name="share-social-outline" size={16} color={theme.primaryColor} />
                <Text style={[s.infoTipText, { color: textPrimary }]}>
                  <Text style={{ fontWeight: '700' }}>Socials are optional</Text> but contestants who link accounts get significantly more votes — fans can verify you're real.
                </Text>
              </View>

              {[
                { key: 'instagramUrl', icon: 'logo-instagram', color: '#E1306C', label: 'Instagram', placeholder: 'yourhandle', prefix: '@' },
                { key: 'twitterUrl', icon: 'logo-twitter', color: '#1DA1F2', label: 'Twitter / X', placeholder: 'yourhandle', prefix: '@' },
                { key: 'tiktokUrl', icon: 'logo-tiktok', color: '#010101', label: 'TikTok', placeholder: 'yourhandle', prefix: '@' },
                { key: 'youtubeUrl', icon: 'logo-youtube', color: '#FF0000', label: 'YouTube URL', placeholder: 'https://youtube.com/c/…', prefix: null },
              ].map(social => (
                <View key={social.key} style={s.socialBlock}>
                  <Text style={[s.label, { color: textPrimary }]}>{social.label}</Text>
                  <View style={[s.socialRow, { backgroundColor: bg, borderColor: border }]}>
                    <View style={[s.socialIconBlock, { borderRightColor: border }]}>
                      <Ionicons name={social.icon as any} size={20} color={social.color} />
                    </View>
                    {social.prefix && (
                      <Text style={[s.socialAt, { color: textSecondary }]}>{social.prefix}</Text>
                    )}
                    <TextInput
                      style={[s.socialInput, { color: textPrimary }]}
                      value={(form as any)[social.key]}
                      onChangeText={v => setForm(f => ({ ...f, [social.key]: v }))}
                      placeholder={social.placeholder}
                      placeholderTextColor={textSecondary}
                      autoCapitalize="none"
                      returnKeyType="next"
                    />
                  </View>
                </View>
              ))}

              {/* Fee breakdown */}
              <View style={[s.feeCard, { backgroundColor: surface, borderColor: border, borderTopColor: theme.primaryColor }]}>
                <View style={s.feeTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.feeTitle, { color: theme.primaryColor }]}>Entry Fee: {feeFormatted}</Text>
                    <Text style={[s.feeSub, { color: textSecondary }]}>Full transparency on how your fee is used</Text>
                  </View>
                  <View style={s.pubBadge}>
                    <Text style={s.pubBadgeText}>PUBLIC</Text>
                  </View>
                </View>

                <View style={[s.feeDivider, { backgroundColor: border }]} />

                {[
                  { icon: 'trophy-outline', color: '#10B981', label: 'Prize Pool (50%) — paid out to winners', value: `${feeCur}${prizePool.toLocaleString()}` },
                  { icon: 'megaphone-outline', color: '#3B82F6', label: 'Marketing & Promotion (30%)', value: `${feeCur}${marketing.toLocaleString()}` },
                  { icon: 'server-outline', color: '#8B5CF6', label: 'Platform Fee (20%) — servers & processing', value: `${feeCur}${platformFee.toLocaleString()}` },
                ].map((row, i) => (
                  <View key={i} style={s.feeRow}>
                    <Ionicons name={row.icon as any} size={13} color={row.color} />
                    <Text style={[s.feeLabel, { color: textSecondary }]}>{row.label}</Text>
                    <Text style={[s.feeVal, { color: textPrimary }]}>{row.value}</Text>
                  </View>
                ))}

                <View style={[s.feeDivider, { backgroundColor: border }]} />

                <View style={[s.payNotice, { backgroundColor: '#ECFDF5', borderColor: '#10B98120' }]}>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#10B981" />
                  <Text style={s.payNoticeText}>
                    Secured by <Text style={{ fontWeight: '700' }}>Flutterwave</Text>. FameAfrica never stores your card details. You'll be redirected to a secure checkout page.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ════════════════════════════════════════════════════
            CTA BUTTON — inside ScrollView so it scrolls with
            content and is never covered by the keyboard
        ════════════════════════════════════════════════════ */}
          <View style={s.ctaWrapper}>
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: theme.buttonColor }]}
              onPress={goNext}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={theme.textOnPrimary} />
              ) : (
                <View style={s.btnRow}>
                  <Text style={[s.primaryBtnText, { color: theme.textOnPrimary }]}>{CTALabel}</Text>
                  {step > 0 && step < 4 && (
                    <Ionicons name="arrow-forward" size={17} color={theme.textOnPrimary} style={{ marginLeft: 6 }} />
                  )}
                </View>
              )}
            </TouchableOpacity>

            {FooterNote.length > 0 && (
              <Text style={[s.footerNote, { color: textSecondary }]}>{FooterNote}</Text>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {
        loading && (
          <View style={s.fullLoadingOverlay}>
            <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={s.loadingContent}>
              <ActivityIndicator size="large" color={theme.primaryColor} />
              <Text style={s.loadingOverlayTitle}>
                {step === 4 ? 'Entering the Arena...' : 'Processing...'}
              </Text>
              <Text style={s.loadingOverlaySub}>
                {step === 4
                  ? 'Securing your spot and uploading your talent video. Please do not close the app.'
                  : 'Getting things ready...'}
              </Text>
            </View>
          </View>
        )
      }

    </>
  )
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
function makeStyles(
  theme: any, bg: string, surface: string,
  textPrimary: string, textSecondary: string,
  border: string, pad: number, insets: any,
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: surface },
    center: { justifyContent: 'center', alignItems: 'center' },

    // Loading
    loadingRing: {
      width: scale(80), height: scale(80), borderRadius: scale(40),
      borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: vs(16),
    },
    loadingTitle: { fontSize: scale(18), fontWeight: '800', color: textPrimary, marginBottom: vs(6) },
    loadingHint: { fontSize: scale(13), color: textSecondary, textAlign: 'center', paddingHorizontal: 32 },

    // Header
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 14, paddingBottom: 10, backgroundColor: surface,
    },
    backBtn: { width: 38, height: 38, justifyContent: 'center' },
    headerTitle: { fontSize: scale(15), fontWeight: '700', letterSpacing: -0.2 },
    stepPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    stepPillText: { fontSize: scale(11), fontWeight: '700' },

    // Progress
    progressOuter: { paddingHorizontal: 18, paddingBottom: 6 },
    progressTrack: { height: 3, borderRadius: 2, marginBottom: 8 },
    progressFill: { height: '100%', borderRadius: 2 },
    dotsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    dotGroup: { flex: 1, alignItems: 'center', gap: 3 },
    dot: {
      width: 20, height: 20, borderRadius: 10,
      justifyContent: 'center', alignItems: 'center',
    },
    dotCore: { width: 6, height: 6, borderRadius: 3 },
    dotLabel: { fontSize: scale(9), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.2 },

    // Step head
    stepHead: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 10,
      paddingHorizontal: 18, paddingTop: 12, paddingBottom: 8,
    },
    stepIconCircle: {
      width: scale(38), height: scale(38), borderRadius: scale(19),
      justifyContent: 'center', alignItems: 'center', flexShrink: 0,
    },
    stepTitle: { fontSize: scale(18), fontWeight: '900', letterSpacing: -0.4, marginBottom: 2 },
    stepSub: { fontSize: scale(12), lineHeight: scale(17) },

    // Scroll content  ← this is key: padding + gap creates natural breathing room
    scrollContent: {
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 28,
      gap: 0,
    },

    // ── Oath ──────────────────────────────────────────────
    oathCard: { borderRadius: 22, borderWidth: 1.5, padding: scale(18), marginBottom: 0 },
    oathHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    oathIconBox: { width: scale(44), height: scale(44), borderRadius: scale(22), justifyContent: 'center', alignItems: 'center' },
    oathCardTitle: { fontSize: scale(15), fontWeight: '900', letterSpacing: -0.3 },
    oathCardSub: { fontSize: scale(10), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
    oathIntro: { fontSize: scale(13), lineHeight: scale(20), marginBottom: 12 },
    oathDivider: { height: 1, marginVertical: 12 },
    oathItem: { flexDirection: 'row', gap: 12, marginBottom: 14 },
    oathNum: {
      width: scale(26), height: scale(26), borderRadius: scale(13),
      justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1,
    },
    oathNumText: { fontSize: scale(12), fontWeight: '800' },
    oathItemTitle: { fontSize: scale(13), fontWeight: '800', marginBottom: 2 },
    oathItemText: { fontSize: scale(12), lineHeight: scale(18) },
    signZone: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 10,
      padding: scale(14), borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', marginTop: 6,
    },
    signZoneText: { flex: 1, fontSize: scale(12), fontStyle: 'italic', lineHeight: scale(18) },

    // ── Form labels / inputs ──────────────────────────────
    label: { fontSize: scale(13), fontWeight: '800', marginTop: 18, marginBottom: 4 },
    hint: { fontSize: scale(11), lineHeight: scale(16), marginBottom: 8 },
    req: { color: '#EF4444' },
    inputRow: {
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12,
      height: vs(48),
    },
    inputMulti: { height: vs(100), alignItems: 'flex-start', paddingTop: 10 },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, fontSize: scale(14), fontWeight: '500' },
    inputTextArea: { height: vs(80), textAlignVertical: 'top' },
    inputVal: { fontSize: scale(14), fontWeight: '500' },

    // Bio counter
    bioHeadRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 18, marginBottom: 4 },
    bioCounter: { fontSize: scale(11), fontWeight: '800', marginBottom: 4 },

    // Two column row
    twoCol: { flexDirection: 'row', gap: 10 },

    // Category grid
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
    catCard: {
      width: (width - 48) / 2 - 5, padding: scale(13), borderRadius: 16,
      borderWidth: 1.5, alignItems: 'center', gap: 6,
    },
    catText: { fontSize: scale(13), fontWeight: '700' },
    catCheck: {
      position: 'absolute', top: 8, right: 8,
      width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff',
      justifyContent: 'center', alignItems: 'center',
    },

    // Upload areas
    uploadHint: { fontSize: scale(13), fontWeight: '700', textAlign: 'center', marginTop: 16, marginBottom: 12 },
    uploadCenter: { alignItems: 'center' },
    uploadIconRing: { width: scale(60), height: scale(60), borderRadius: scale(30), justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    uploadCta: { fontSize: scale(14), fontWeight: '800' },
    uploadSub: { fontSize: scale(12), marginTop: 4 },
    photoCircle: {
      width: width * 0.58, height: width * 0.58, borderRadius: width * 0.29,
      alignSelf: 'center', borderWidth: 2.5, borderStyle: 'dashed',
      justifyContent: 'center', alignItems: 'center',
    },
    photoImg: { width: '100%', height: '100%', borderRadius: width * 0.29 },
    videoBox: {
      width: '100%', height: vs(180), borderRadius: 22,
      borderWidth: 2.5, borderStyle: 'dashed',
      justifyContent: 'center', alignItems: 'center',
    },
    editBadge: {
      position: 'absolute', bottom: -8, right: width * 0.08,
      width: scale(36), height: scale(36), borderRadius: scale(18),
      justifyContent: 'center', alignItems: 'center', borderWidth: 4,
    },
    videoSuccessRing: {
      width: scale(70), height: scale(70), borderRadius: scale(35),
      borderWidth: 2, justifyContent: 'center', alignItems: 'center',
    },
    successBar: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 14,
    },
    successBarText: { fontSize: scale(12), color: '#065F46', flex: 1, fontWeight: '600' },

    // Guide boxes
    guideRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    guideBox: { flex: 1, padding: 12, borderRadius: 16, borderWidth: 1 },
    guideBoxHead: { fontSize: scale(11), fontWeight: '800', marginBottom: 7 },
    guideBoxLine: { fontSize: scale(11), color: '#374151', lineHeight: scale(17), marginBottom: 3 },

    // Tip banner
    infoTip: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 10,
      borderWidth: 1.5, borderRadius: 16, padding: 12, marginBottom: 18,
    },
    infoTipText: { flex: 1, fontSize: scale(12), lineHeight: scale(18), fontWeight: '500' },

    // Socials
    socialBlock: { marginBottom: 4 },
    socialRow: {
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 1.5, borderRadius: 14, overflow: 'hidden', height: vs(50),
    },
    socialIconBlock: {
      width: scale(46), height: '100%', backgroundColor: 'rgba(0,0,0,0.03)',
      justifyContent: 'center', alignItems: 'center',
      borderRightWidth: 1,
    },
    socialAt: { fontSize: scale(15), fontWeight: '700', paddingHorizontal: 5 },
    socialInput: { flex: 1, fontSize: scale(14), fontWeight: '600', paddingRight: 12 },

    // Fee card
    feeCard: {
      borderRadius: 22, borderWidth: 1, padding: scale(18),
      marginTop: 20, borderTopWidth: 4,
    },
    feeTopRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    feeTitle: { fontSize: scale(16), fontWeight: '900', marginBottom: 3 },
    feeSub: { fontSize: scale(11), lineHeight: scale(16) },
    pubBadge: { backgroundColor: '#10B98115', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
    pubBadgeText: { color: '#059669', fontSize: scale(9), fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    feeDivider: { height: 1, marginVertical: 12 },
    feeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    feeLabel: { flex: 1, fontSize: scale(12), fontWeight: '500' },
    feeVal: { fontSize: scale(13), fontWeight: '800' },
    payNotice: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 8,
      borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 4,
    },
    payNoticeText: { flex: 1, fontSize: scale(12), color: '#065F46', lineHeight: scale(18), fontWeight: '500' },

    // ── CTA block (inside scroll, not fixed) ──────────────
    ctaWrapper: { marginTop: 28 },
    primaryBtn: {
      borderRadius: 100, padding: vs(17), alignItems: 'center',
      shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
    },
    btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    primaryBtnText: { fontSize: scale(15), fontWeight: '800', letterSpacing: 0.3 },
    footerNote: { fontSize: scale(11), textAlign: 'center', marginTop: 10, fontWeight: '600' },

    // ── Closed state ──────────────────────────────────────
    closedWrap: { flexGrow: 1, padding: 28, alignItems: 'center', justifyContent: 'center' },
    closedBack: {
      position: 'absolute', left: 20, width: 40, height: 40, borderRadius: 20,
      backgroundColor: surface, borderWidth: 1, borderColor: border,
      justifyContent: 'center', alignItems: 'center',
    },
    closedIconWrap: {
      width: scale(110), height: scale(110), borderRadius: scale(55),
      justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    },
    lockBadge: {
      position: 'absolute', bottom: 0, right: 8,
      width: 32, height: 32, borderRadius: 16, borderWidth: 3,
      justifyContent: 'center', alignItems: 'center',
    },
    statusBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginBottom: 16,
    },
    statusBadgeText: { fontSize: scale(11), fontWeight: '800', color: '#B45309', textTransform: 'uppercase' },
    closedTitle: { fontSize: scale(24), fontWeight: '900', textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 },
    closedSub: { fontSize: scale(14), textAlign: 'center', lineHeight: scale(21), marginBottom: 28 },
    infoCard: { width: '100%', borderRadius: 20, borderWidth: 1.5, padding: 18, marginBottom: 24 },
    infoCardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    infoCardTitle: { fontSize: scale(14), fontWeight: '800', flex: 1 },
    infoCardText: { fontSize: scale(13), lineHeight: scale(20) },

    // ── Location modal ────────────────────────────────────
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, height: '80%' },
    modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14, borderBottomWidth: 1,
    },
    modalTitle: { fontSize: scale(16), fontWeight: '800' },
    searchRow: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      margin: 14, paddingHorizontal: 12, height: vs(44),
      borderRadius: 12, borderWidth: 1.5,
    },
    searchInput: { flex: 1, fontSize: scale(14), height: '100%' },
    optionRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5,
    },
    optionText: { fontSize: scale(15) },
    emptyOption: { paddingVertical: 48, alignItems: 'center', gap: 10 },
    emptyOptionText: { fontSize: scale(13) },
    fullLoadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    },
    loadingContent: {
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    loadingOverlayTitle: {
      color: '#fff',
      fontSize: scale(22),
      fontWeight: '900',
      marginTop: 20,
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    loadingOverlaySub: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: scale(14),
      marginTop: 10,
      textAlign: 'center',
      lineHeight: scale(20),
    },
  })
}