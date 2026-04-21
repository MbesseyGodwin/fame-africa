// apps/mobile/src/screens/notifications/NotificationsScreen.tsx

import React, { useState } from 'react'
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, RefreshControl, StatusBar
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { notificationsApi } from '../../utils/api'
import { useTheme } from '../../context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function NotificationsScreen() {
  const { theme, bg, surface, textPrimary, textSecondary, border } = useTheme()
  const queryClient = useQueryClient()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [refreshing, setRefreshing] = useState(false)

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
  const s = makeStyles(theme, bg, surface, textPrimary, textSecondary, border, insets)

  function renderNotification({ item }: { item: any }) {
    const isSuccess = item.type === 'SUCCESS' || item.type === 'PAYMENT_CONFIRMED'
    const isUrgent = item.type === 'URGENT' || item.type === 'ELIMINATION_WARNING'
    const isVote = item.type === 'VOTE_RECEIVED'

    let statusColor = theme.primaryColor
    let iconName: any = 'notifications'

    if (isSuccess) {
      statusColor = '#10B981' // Success Green
      iconName = 'checkmark-circle'
    } else if (isUrgent) {
      statusColor = '#EF4444' // Error Red
      iconName = 'alert-circle'
    } else if (isVote) {
      statusColor = '#8B5CF6' // Purple
      iconName = 'heart'
    }

    return (
      <TouchableOpacity
        style={[s.card, !item.readAt && s.unreadCard]}
        onPress={() => !item.readAt && markReadMutation.mutate(item.id)}
        activeOpacity={0.7}
      >
        <View style={[s.iconBox, { backgroundColor: statusColor + '15' }]}>
          <Ionicons name={iconName} size={22} color={statusColor} />
        </View>
        
        <View style={s.cardBody}>
          <View style={s.cardHeader}>
            <Text style={[s.title, !item.readAt && s.unreadTitle]}>{item.title}</Text>
            {!item.readAt && <View style={s.unreadIndicator} />}
          </View>
          <Text style={s.body} numberOfLines={3}>{item.body || item.message}</Text>
          <View style={s.cardFooter}>
            <Ionicons name="time-outline" size={12} color={textSecondary} />
            <Text style={s.time}>
              {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
        
        {!item.readAt && <View style={[s.sideLine, { backgroundColor: statusColor }]} />}
      </TouchableOpacity>
    )
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Premium Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={s.backCircle}>
            <Ionicons name="chevron-back" size={24} color={textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Notifications</Text>
          <View style={{ width: 44 }} />
        </View>
        
        {notifications.length > 0 && (
          <TouchableOpacity 
            onPress={() => markAllReadMutation.mutate()}
            style={s.markAllBtn}
          >
            <Text style={s.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator color={theme.primaryColor} size="large" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primaryColor} />
          }
          ListEmptyComponent={
            <View style={s.emptyState}>
              <View style={s.emptyIconCircle}>
                <Ionicons name="notifications-off-outline" size={48} color={theme.primaryColor} />
              </View>
              <Text style={s.emptyTitle}>Quiet in here...</Text>
              <Text style={s.emptySub}>You're all caught up! New alerts about votes and events will show up here.</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

function makeStyles(theme: any, bg: string, surface: string, textPrimary: string, textSecondary: string, border: string, insets: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
      backgroundColor: '#fff',
      paddingTop: insets.top + 10,
      paddingBottom: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12
    },
    backCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center'
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: textPrimary,
      letterSpacing: -0.5
    },
    markAllBtn: {
      alignSelf: 'flex-end',
      paddingVertical: 4
    },
    markAllText: {
      fontSize: 14,
      color: theme.primaryColor,
      fontWeight: '700',
    },
    
    listContent: {
      padding: 16,
      paddingBottom: 40
    },
    card: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: '#ffffff',
      borderRadius: 20,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 4,
      overflow: 'hidden',
      position: 'relative',
    },
    unreadCard: {
      backgroundColor: '#fff',
      shadowOpacity: 0.1,
      elevation: 6
    },
    sideLine: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
    },
    iconBox: {
      width: 50,
      height: 50,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center'
    },
    cardBody: {
      flex: 1,
      marginLeft: 16
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1F2937',
      flex: 1
    },
    unreadTitle: {
      fontWeight: '800',
      color: '#111827'
    },
    unreadIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.primaryColor,
      marginLeft: 8
    },
    body: {
      fontSize: 14,
      color: '#4B5563',
      lineHeight: 20,
      marginBottom: 10
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    time: {
      fontSize: 12,
      color: '#9CA3AF',
      marginLeft: 4,
      fontWeight: '500'
    },

    emptyState: {
      alignItems: 'center',
      marginTop: 100,
      paddingHorizontal: 40
    },
    emptyIconCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.accentColor + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: textPrimary,
      marginBottom: 8
    },
    emptySub: {
      fontSize: 15,
      color: textSecondary,
      textAlign: 'center',
      lineHeight: 24
    },
  })
}
