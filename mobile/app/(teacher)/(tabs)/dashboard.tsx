import React, { useCallback, useState } from 'react'
import { RefreshControl, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useAuth } from '../../../src/context/AuthContext'
import { Badge, Button, Card, ErrorState, H1, H2, LoadingState, Muted, Screen } from '../../../src/components/ui'
import { BarChart } from '../../../src/components/charts'
import { colors } from '../../../src/theme/colors'
import { fetchCreatorDashboard, fetchCreatorLessons, type CreatorDashboard, type CreatorLessonListItem } from '../../../src/api/creator'
import { ApiError } from '../../../src/api/client'

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const STATUS_LABEL: Record<string, string> = { draft: 'Rascunho', pending_review: 'Em revisão', published: 'Publicada', archived: 'Arquivada' }
const STATUS_TONE: Record<string, 'default' | 'warning' | 'success'> = { draft: 'default', pending_review: 'warning', published: 'success', archived: 'default' }

export default function TeacherDashboardScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<CreatorDashboard | null>(null)
  const [recentLessons, setRecentLessons] = useState<CreatorLessonListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [d, lessons] = await Promise.all([fetchCreatorDashboard(), fetchCreatorLessons().catch(() => [])])
      setData(d)
      const sorted = [...lessons].sort(
        (a, b) => new Date(b.updated || b.created_at).getTime() - new Date(a.updated || a.created_at).getTime()
      )
      setRecentLessons(sorted.slice(0, 5))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar o painel.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  if (loading) return <Screen><LoadingState /></Screen>
  if (error) return <Screen><ErrorState message={error} onRetry={load} /></Screen>

  const stats = data?.stats
  const firstName = (user?.full_name || user?.name || '').split(' ')[0]

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor={colors.brand600} />}>
      <H1>Olá, {firstName} 👋</H1>
      <Muted style={{ marginBottom: 16 }}>Aqui está o resumo do teu conteúdo.</Muted>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <StatBox label="Lições publicadas" value={stats?.published_lessons ?? 0} />
        <StatBox label="Em revisão" value={stats?.review_lessons ?? 0} />
        <StatBox label="Rascunhos" value={stats?.draft_lessons ?? 0} />
        <StatBox label="Capítulos" value={stats?.total_chapters ?? 0} />
        <StatBox label="Alunos alcançados" value={stats?.total_students_reached ?? 0} />
        <StatBox label="Taxa média aprovação" value={`${stats?.avg_approval_rate ?? 0}%`} />
      </View>

      {stats?.weekly_by_day && stats.weekly_by_day.some((v) => v > 0) ? (
        <>
          <H2>Engajamento da semana</H2>
          <Card>
            <BarChart
              data={['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((label, i) => ({
                label,
                value: stats.weekly_by_day[i] ?? 0,
              }))}
              color={colors.info}
            />
          </Card>
        </>
      ) : null}

      {recentLessons.length > 0 ? (
        <>
          <H2>Lições recentes</H2>
          <Card>
            {recentLessons.map((l, i) => (
              <TouchableOpacity key={l.id} onPress={() => router.push(`/(teacher)/lesson/${l.id}`)}>
                <View
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
                    <Text style={{ fontWeight: '600', color: colors.text }} numberOfLines={1}>{l.title}</Text>
                    <Muted style={{ fontSize: 12 }} numberOfLines={1}>{l.subject} · {l.chapter}</Muted>
                  </View>
                  <Badge text={STATUS_LABEL[l.status] || l.status} tone={STATUS_TONE[l.status] || 'default'} />
                </View>
              </TouchableOpacity>
            ))}
          </Card>
        </>
      ) : null}

      {stats && stats.lessons_without_exercises > 0 ? (
        <Card style={{ backgroundColor: '#fffbeb', borderColor: colors.warning }}>
          <Text style={{ fontWeight: '700', color: colors.warning }}>⚠️ Pendências</Text>
          <Muted style={{ marginTop: 4 }}>
            {stats.lessons_without_exercises} lição(ões) sem exercícios — adiciona-os antes de publicar.
          </Muted>
        </Card>
      ) : null}

      <View style={{ marginTop: 8, marginBottom: 16 }}>
        <Button title="📊 Ver Analytics" variant="outline" onPress={() => router.push('/(teacher)/analytics')} />
      </View>

      {data?.subjects && data.subjects.length > 0 ? (
        <>
          <H2>Por disciplina</H2>
          <Card>
            {data.subjects.map((s, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{s.name}</Text>
                <Muted>{s.published}/{s.lessons} publicadas</Muted>
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  )
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <Card style={{ flexBasis: '47%', flexGrow: 1, alignItems: 'center', paddingVertical: 18 }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color: colors.navy950 }}>{value}</Text>
      <Muted style={{ marginTop: 4, textAlign: 'center', fontSize: 12 }}>{label}</Muted>
    </Card>
  )
}
