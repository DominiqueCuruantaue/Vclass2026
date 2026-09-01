import React, { useCallback, useState } from 'react'
import { RefreshControl, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Badge, Button, Card, EmptyState, ErrorState, H1, H2, LoadingState, Muted, ProgressBar, Screen, SubjectDot } from '../../../src/components/ui'
import { ActivityHeatmap } from '../../../src/components/charts'
import { colors, FALLBACK_SUBJECT_COLOR } from '../../../src/theme/colors'
import { fetchDashboard, fetchRecommendations, fetchActivity, type DashboardData, type ActivityData } from '../../../src/api/progress'
import { computeStreak } from '../../../src/utils/streak'
import { ApiError } from '../../../src/api/client'
import type { Lesson } from '@shared/types'

const EVENT_LABEL: Record<string, string> = {
  lesson_completed: 'Concluiu uma lição',
  lesson_progress: 'Continuou a assistir',
  exercise: 'Respondeu a um exercício',
}

export default function ProgressScreen() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [recommendations, setRecommendations] = useState<Lesson[]>([])
  const [activity, setActivity] = useState<ActivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [dashboard, recs, act] = await Promise.all([
        fetchDashboard(),
        fetchRecommendations().catch(() => []),
        fetchActivity().catch(() => null),
      ])
      setData(dashboard)
      setRecommendations(recs)
      setActivity(act)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar o progresso.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const streak = activity ? computeStreak(activity.heatmap) : 0

  useFocusEffect(useCallback(() => { load() }, [load]))

  if (loading) return <Screen><LoadingState /></Screen>
  if (error) return <Screen><ErrorState message={error} onRetry={load} /></Screen>

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor={colors.brand600} />}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <H1>O teu progresso</H1>
        {streak > 0 ? <Badge text={`🔥 ${streak} ${streak === 1 ? 'dia' : 'dias'}`} tone="warning" /> : null}
      </View>

      <Button title="🏆 Ver conquistas" variant="outline" onPress={() => router.push('/(student)/achievements')} />

      {activity && activity.heatmap.some((d) => d.count > 0) ? (
        <>
          <View style={{ height: 20 }} />
          <H2>Actividade (últimas semanas)</H2>
          <Card style={{ alignItems: 'flex-start' }}>
            <ActivityHeatmap heatmap={activity.heatmap} />
          </Card>
        </>
      ) : null}

      {activity && activity.recentActivity.length > 0 ? (
        <>
          <View style={{ height: 20 }} />
          <H2>Histórico recente</H2>
          <Card>
            {activity.recentActivity.slice(0, 8).map((ev, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                }}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ fontWeight: '600', color: colors.text }} numberOfLines={1}>{ev.title}</Text>
                  <Muted style={{ fontSize: 12 }}>{EVENT_LABEL[ev.type] || ev.type}</Muted>
                </View>
                {ev.type === 'exercise' ? (
                  <Badge text={ev.correct ? 'Correcto' : 'Errado'} tone={ev.correct ? 'success' : 'danger'} />
                ) : null}
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <View style={{ height: 20 }} />
      <H2>Por disciplina</H2>
      {data?.subjectProgress && data.subjectProgress.length > 0 ? (
        <Card>
          {data.subjectProgress.map((s: any, i: number) => (
            <View key={i} style={{ marginBottom: i === data.subjectProgress.length - 1 ? 0 : 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <SubjectDot color={s.subject_color} label={s.subject_name || s.name || 'Disciplina'} size={24} />
                  <Text style={{ fontWeight: '600', color: colors.text }}>{s.subject_name || s.name || 'Disciplina'}</Text>
                </View>
                <Muted>{s.progress_percent ?? 0}%</Muted>
              </View>
              <ProgressBar percent={s.progress_percent ?? 0} color={s.subject_color || FALLBACK_SUBJECT_COLOR} />
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
