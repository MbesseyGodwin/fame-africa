
// apps/mobile/src/screens/participants/ParticipantsScreen.tsx

import React, { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, Image, RefreshControl, Dimensions
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { participantsApi, stansApi } from '../../utils/api'
import { useTheme } from '../../context/ThemeContext'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

export default function ParticipantsScreen() {
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const [search, setSearch] = useState('')
  const router = useRouter()
  const queryClient = useQueryClient()

  // ── Data Fetching ───────────────────────────────────────────
  const { data: pRes, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['participants', search],
    queryFn: () => participantsApi.list({ search, limit: 100 }),
  })

  // The API returns { data: { data: { participants: [] } } } or similar
  const participants = pRes?.data?.data?.participants ?? pRes?.data?.data ?? []
  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad)

  // ── Mutations ───────────────────────────────────────────────
  const stanMutation = useMutation({
    mutationFn: ({ id, isStanning }: { id: string; isStanning: boolean }) =>
      isStanning ? stansApi.unstan(id) : stansApi.stan(id),
    onSuccess: () => {
      // Fast optimistic-style refresh
      queryClient.invalidateQueries({ queryKey: ['participants'] })
    },
  })

  // ── Renderers ───────────────────────────────────────────────
  function renderParticipant({ item, index }: { item: any, index: number }) {
    const isStanning = item.isStanning

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={s.card}
        onPress={() => router.push(`/vote/${item.voteLinkSlug}`)}
      >
        <View style={s.cardInner}>
          <View style={s.avatarContainer}>
            <Image
              source={{ uri: item.photoUrl || 'https://via.placeholder.com/150' }}
              style={s.avatar}
            />
            {index < 3 && (
              <View style={s.topBadge}>
                <Ionicons name="star" size={10} color="#FFD700" />
              </View>
            )}
          </View>

          <View style={s.info}>
            <Text style={s.name} numberOfLines={1}>{item.displayName}</Text>
            <View style={s.metaRow}>
              <View style={s.tag}>
                <Text style={s.tagText}>{item.category || 'Talent'}</Text>
              </View>
              <Text style={s.locationText}>{item.state || 'NG'}</Text>
            </View>

            <View style={s.statsRow}>
              <View style={s.statItem}>
                <Ionicons name="people-outline" size={14} color={textSecondary} />
                <Text style={s.statValue}>{item.stanCount || 0}</Text>
              </View>
              <View style={[s.statItem, { marginLeft: 12 }]}>
                <Ionicons name="flash-outline" size={14} color={theme.primaryColor} />
                <Text style={[s.statValue, { color: theme.primaryColor }]}>Rank {index + 1}</Text>
              </View>
            </View>
          </View>

          <View style={s.actions}>
            <TouchableOpacity
              style={s.iconBtn}
              onPress={() => stanMutation.mutate({ id: item.id, isStanning })}
              disabled={stanMutation.isPending}
            >
              <Ionicons
                name={isStanning ? 'heart' : 'heart-outline'}
                size={24}
                color={isStanning ? '#FF4081' : textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={s.voteBtn}
              onPress={() => router.push(`/vote/${item.voteLinkSlug}`)}
            >
              <Text style={s.voteBtnText}>VOTE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={s.container}>
      {/* Header / Search Area */}
      <View style={s.header}>
        <View style={s.searchBarContainer}>
          <View style={s.searchBar}>
            <Ionicons name="search" size={20} color={textSecondary} />
            <TextInput
              style={s.input}
              placeholder="Search by name or category..."
              placeholderTextColor={textSecondary}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={20} color={textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={s.refreshBtn}
            onPress={() => refetch()}
            activeOpacity={0.7}
          >
            {isFetching ? (
              <ActivityIndicator size="small" color={theme.primaryColor} />
            ) : (
              <Ionicons name="refresh-outline" size={22} color={theme.primaryColor} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {isLoading && search === '' ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primaryColor} />
          <Text style={s.loadingText}>Scanning the horizon...</Text>
        </View>
      ) : (
        <FlatList
          data={participants}
          keyExtractor={(item) => item.id}
          renderItem={renderParticipant}
          contentContainerStyle={s.listPadding}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor={theme.primaryColor}
              colors={[theme.primaryColor]}
            />
          }
          ListHeaderComponent={
            participants.length > 0 ? (
              <Text style={s.resultsCount}>Showing {participants.length} contestants</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={s.emptyState}>
              <View style={s.emptyIconCircle}>
                <Ionicons name="people-outline" size={40} color={textSecondary} />
              </View>
              <Text style={s.emptyTitle}>No contestants found</Text>
              <Text style={s.emptySubtitle}>Try searching for a different talent or name</Text>
              {search.length > 0 && (
                <TouchableOpacity style={s.clearBtn} onPress={() => setSearch('')}>
                  <Text style={s.clearBtnText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  )
}

function makeStyles(theme: any, bg: string, surface: string, textPrimary: string, textSecondary: string, border: string, pad: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    header: {
      paddingTop: 10,
      backgroundColor: bg,
    },
    searchBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      gap: 12,
    },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: surface,
      height: 48,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    refreshBtn: {
      width: 48,
      height: 48,
      backgroundColor: surface,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: border,
    },
    input: {
      flex: 1,
      marginLeft: 10,
      fontSize: 15,
      color: textPrimary,
      fontWeight: '500',
    },
    listPadding: { padding: 16, paddingBottom: 100 },
    resultsCount: {
      fontSize: 12,
      fontWeight: '700',
      color: textSecondary,
      marginBottom: 16,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    card: {
      backgroundColor: surface,
      borderRadius: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: border,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.03,
      shadowRadius: 12,
      elevation: 3,
    },
    cardInner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
    },
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: theme.accentColor,
      borderWidth: 3,
      borderColor: theme.accentColor,
    },
    topBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: '#1A1A1A',
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: surface,
    },
    info: {
      flex: 1,
      marginLeft: 14,
      justifyContent: 'center',
    },
    name: {
      fontSize: 17,
      fontWeight: '800',
      color: textPrimary,
      letterSpacing: -0.5,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
      gap: 8
    },
    tag: {
      backgroundColor: theme.accentColor,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    tagText: {
      fontSize: 10,
      color: theme.primaryColor,
      fontWeight: '800',
      textTransform: 'uppercase'
    },
    locationText: {
      fontSize: 11,
      color: textSecondary,
      fontWeight: '600',
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statValue: {
      fontSize: 12,
      fontWeight: '700',
      color: textSecondary,
    },
    actions: {
      alignItems: 'center',
      gap: 8,
      paddingLeft: 10,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    voteBtn: {
      backgroundColor: theme.buttonColor,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      shadowColor: theme.buttonColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    voteBtnText: {
      color: theme.textOnPrimary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 100,
    },
    loadingText: {
      marginTop: 12,
      color: textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      marginTop: 80,
      paddingHorizontal: 40,
    },
    emptyIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: border,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: textPrimary,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    clearBtn: {
      marginTop: 24,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: theme.accentColor,
    },
    clearBtnText: {
      color: theme.primaryColor,
      fontWeight: '700',
      fontSize: 14,
    }
  })
}