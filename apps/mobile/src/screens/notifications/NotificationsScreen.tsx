// apps/mobile/src/screens/notifications/NotificationsScreen.tsx

import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { notificationsApi } from '../../utils/api'
import { useTheme } from '../../context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'

export default function NotificationsScreen() {
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [refreshing, setRefreshing] = React.useState(false)

  const { data: nRes, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll(),
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const notifications = nRes?.data?.data || []
  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, pad)

  function renderNotification({ item }: { item: any }) {
    const isSuccess = item.type === 'SUCCESS'
    const isSystem = item.type === 'SYSTEM'
    const isUrgent = item.type === 'URGENT'

    let statusColor = theme.primaryColor
    if (isSuccess) statusColor = '#4CAF50'
    if (isUrgent) statusColor = '#F44336'

    return (
      <TouchableOpacity
        style={[s.card, !item.readAt && s.unreadCard]}
        onPress={() => !item.readAt && markReadMutation.mutate(item.id)}
        activeOpacity={0.7}
      >
        <View style={[s.statusIndicator, { backgroundColor: statusColor }]} />
        <View style={[s.iconBox, { backgroundColor: statusColor + '15' }]}>
          <Ionicons
            name={isSuccess ? 'checkmark-circle' : isUrgent ? 'alert-circle' : 'notifications'}
            size={22}
            color={statusColor}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <View style={s.cardHeader}>
            <Text style={[s.title, !item.readAt && s.unreadTitle]}>{item.title}</Text>
            {!item.readAt && <View style={s.unreadDot} />}
          </View>
          <Text style={s.body} numberOfLines={3}>{item.message}</Text>
          <View style={s.cardFooter}>
            <Ionicons name="time-outline" size={12} color={textSecondary} />
            <Text style={s.time}>
              {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color={textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Notifications</Text>
        </View>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={() => markAllReadMutation.mutate()}>
            <Text style={s.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator color={theme.primaryColor} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primaryColor} />
          }
          ListEmptyComponent={
            <View style={s.emptyState}>
              <View style={s.emptyIconCircle}>
                <Ionicons name="notifications-outline" size={40} color={theme.primaryColor} />
              </View>
              <Text style={s.emptyTitle}>All caught up!</Text>
              <Text style={s.emptySub}>You don't have any new alerts. When you do, they'll appear here.</Text>
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
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
      backgroundColor: surface, borderBottomWidth: 1, borderBottomColor: border + '20',
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    backBtn: { marginRight: 12, padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: textPrimary },
    markAllText: { fontSize: 13, color: theme.primaryColor, fontWeight: '600' },
    card: {
      flexDirection: 'row', padding: 16, backgroundColor: surface,
      borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: border + '10',
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
      overflow: 'hidden', position: 'relative',
    },
    unreadCard: { backgroundColor: theme.accentColor + '15', borderColor: theme.primaryColor + '20' },
    statusIndicator: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
    iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
    title: { fontSize: 15, fontWeight: '600', color: textPrimary, flex: 1 },
    unreadTitle: { fontWeight: '800' },
    body: { fontSize: 13, color: textSecondary, lineHeight: 19, marginBottom: 8 },
    cardFooter: { flexDirection: 'row', alignItems: 'center' },
    time: { fontSize: 11, color: textSecondary, marginLeft: 4, fontWeight: '500' },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primaryColor, marginLeft: 8 },
    emptyState: { alignItems: 'center', marginTop: 120, paddingHorizontal: 40 },
    emptyIconCircle: {
      width: 80, height: 80, borderRadius: 40, backgroundColor: theme.accentColor,
      alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: textPrimary },
    emptySub: { fontSize: 14, color: textSecondary, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  })
}
