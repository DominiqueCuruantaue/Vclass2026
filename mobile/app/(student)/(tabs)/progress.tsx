import React, { useCallback, useState } from 'react'
import { RefreshControl, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Button, Card, EmptyState, ErrorState, H1, H2, LoadingState, Muted, ProgressBar, Screen } from '../../../src/components/ui'
import { colors } from '../../../src/theme/colors'
import { fetchDashboard, fetchRecommendations, type DashboardData } from '../../../src/api/progress'
import { ApiError } from '../../../src/api/client'
import type { Lesson } from '@shared/types'

export default function ProgressScreen() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [recommendations, setRecommendations] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [dashboard, recs] = await Promise.all([
        fetchDashboard(),
        fetchRecommendations().catch(() => []),
      ])
      setData(dashboard)
      setRecommendations(recs)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar o progresso.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  if (loading) return <Screen><LoadingState /></Screen>
  if (error) return <Screen><ErrorState message={error} onRetry={load} /></Screen>

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor={colors.brand600} />}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <H1>O teu progresso</H1>
      </View>

      <Button title="🏆 Ver conquistas" variant="outline" onPress={() => router.push('/(student)/achievements')} />

      <View style={{ height: 20 }} />
      <H2>Por disciplina</H2>
      {data?.subjectProgress && data.subjectProgress.length > 0 ? (
        <Card>
          {data.subjectProgress.map((s: any, i: number) => (
            <View key={i} style={{ marginBottom: i === data.subjectProgress.length - 1 ? 0 : 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontWeight: '600', color: colors.text }}>{s.subject_name || s.name || 'Disciplina'}</Text>
                <Muted>{s.progress_percent ?? 0}%</Muted>
              </View>
              <ProgressBar percent={s.progress_percent ?? 0} />
            </View>
          ))}
        </Card>
      ) : (
        <EmptyState icon="📊" title="Sem dados ainda" subtitle="Começa a assistir aulas para veres o teu progresso." />
      )}

      {recommendations.length > 0 ? (
        <>
          <H2>Recomendado para ti</H2>
          {recommendations.slice(0, 5).map((lesson) => (
            <TouchableOpacity key={lesson.id} onPress={() => router.push(`/(student)/lesson/${lesson.id}`)}>
              <Card>
                <Text style={{ fontWeight: '700', color: colors.text }}>{lesson.title}</Text>
                {lesson.description ? <Muted numberOfLines={2}>{lesson.description}</Muted> : null}
              </Card>
            </TouchableOpacity>
          ))}
        </>
      ) : null}
    </Screen>
  )
}
