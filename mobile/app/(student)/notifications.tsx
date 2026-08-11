import React, { useCallback, useState } from 'react'
import { RefreshControl, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Badge, Card, EmptyState, ErrorState, LoadingState, Muted, Screen } from '../../src/components/ui'
import { colors } from '../../src/theme/colors'
import { fetchNotifications, markNotificationRead, type NotificationItem } from '../../src/api/notifications'
import { ApiError } from '../../src/api/client'

export default function NotificationsScreen() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const data = await fetchNotifications()
      setItems(data)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar as notificações.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  async function handleTap(item: NotificationItem) {
    if (!item.read) {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)))
      markNotificationRead(item.id).catch(() => {})
    }
  }

  if (loading) return <Screen><LoadingState /></Screen>
  if (error) return <Screen><ErrorState message={error} onRetry={load} /></Screen>

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor={colors.brand600} />}>
      {items.length === 0 ? (
        <EmptyState icon="🔔" title="Sem notificações" subtitle="Volta mais tarde para veres novidades." />
      ) : (
        items.map((item) => (
          <TouchableOpacity key={item.id} onPress={() => handleTap(item)}>
            <Card style={{ opacity: item.read ? 0.6 : 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontWeight: '700', color: colors.text, flex: 1 }}>{item.title}</Text>
                {!item.read ? <Badge text="Novo" tone="info" /> : null}
              </View>
              <Muted>{item.message}</Muted>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </Screen>
  )
}
