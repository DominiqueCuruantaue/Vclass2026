import React, { useCallback, useState } from 'react'
import { RefreshControl, Text, TouchableOpacity, View } from 'react-native'

import { useFocusEffect, useRouter } from 'expo-router'
import { useAuth } from '../../../src/context/AuthContext'
import { Badge, Card, EmptyState, ErrorState, H1, H2, LoadingState, Muted, ProgressBar, Screen, SubjectDot } from '../../../src/components/ui'
import { colors, FALLBACK_SUBJECT_COLOR } from '../../../src/theme/colors'
import { fetchDashboard, type DashboardData } from '../../../src/api/progress'
import { ApiError } from '../../../src/api/client'

export default function DashboardScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const d = await fetchDashboard()
      setData(d)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar o dashboard.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  if (loading) return <Screen><LoadingState /></Screen>
  if (error) return <Screen><ErrorState message={error} onRetry={load} /></Screen>

  const stats = data?.stats
  const firstName = (user?.full_name || user?.name || '').split(' ')[0]

  function onRefresh() {
    setRefreshing(true)
    load()
  }

  return (
    <Screen
      style={{ paddingTop: 8 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand600} />}
    >
      <View style={{ marginBottom: 20 }}>
        <H1>Olá, {firstName || 'estudante'} 👋</H1>
        <Muted>Vamos continuar a aprender hoje?</Muted>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 4 }}>
        <StatBox label="Lições completas" value={stats?.completedLessons ?? 0} />
        <StatBox label="Total de lições" value={stats?.totalLessons ?? 0} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <StatBox label="Exercícios" value={stats?.totalExercises ?? 0} />
        <StatBox label="Nota média" value={`${stats?.averageScore ?? 0}%`} />
      </View>

      {data?.subjectProgress && data.subjectProgress.length > 0 ? (
        <>
          <H2>Progresso por disciplina</H2>
          <Card>
            {data.subjectProgress.slice(0, 5).map((s: any, i: number) => (
              <View key={i} style={{ marginBottom: i === data.subjectProgress.length - 1 ? 0 : 14 }}>
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
        </>
      ) : null}

      <H2>Actividade recente</H2>
      {data?.recentActivity && data.recentActivity.length > 0 ? (
        data.recentActivity.map((item) => (
          <TouchableOpacity key={item.id} onPress={() => router.push(`/(student)/lesson/${item.lesson.id}`)}>
            <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.text }}>{item.lesson?.title || 'Lição'}</Text>
                <View style={{ marginTop: 6 }}>
                  <ProgressBar percent={item.progress_percent} />
                </View>
              </View>
              <Badge
                text={item.status === 'completed' ? 'Concluída' : item.status === 'in_progress' ? 'Em curso' : 'Novo'}
                tone={item.status === 'completed' ? 'success' : 'info'}
              />
            </Card>
          </TouchableOpacity>
        ))
      ) : (
        <EmptyState icon="🎬" title="Ainda não começaste nenhuma aula" subtitle="Explora o catálogo para começar a aprender." />
      )}
    </Screen>
  )
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center', paddingVertical: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: colors.navy950 }}>{value}</Text>
      <Muted style={{ marginTop: 4, textAlign: 'center' }}>{label}</Muted>
    </Card>
  )
}
