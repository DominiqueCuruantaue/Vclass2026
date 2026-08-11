import React, { useCallback, useState } from 'react'
import { RefreshControl, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useAuth } from '../../../src/context/AuthContext'
import { Button, Card, ErrorState, H1, H2, LoadingState, Muted, Screen } from '../../../src/components/ui'
import { colors } from '../../../src/theme/colors'
import { fetchCreatorDashboard, type CreatorDashboard } from '../../../src/api/creator'
import { ApiError } from '../../../src/api/client'

export default function TeacherDashboardScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<CreatorDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const d = await fetchCreatorDashboard()
      setData(d)
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

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <StatBox label="Lições publicadas" value={stats?.published_lessons ?? 0} />
        <StatBox label="Em revisão" value={stats?.review_lessons ?? 0} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <StatBox label="Rascunhos" value={stats?.draft_lessons ?? 0} />
        <StatBox label="Capítulos" value={stats?.total_chapters ?? 0} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <StatBox label="Alunos alcançados" value={stats?.total_students_reached ?? 0} />
        <StatBox label="Taxa média aprovação" value={`${stats?.avg_approval_rate ?? 0}%`} />
      </View>

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
    <Card style={{ flex: 1, alignItems: 'center', paddingVertical: 18 }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color: colors.navy950 }}>{value}</Text>
      <Muted style={{ marginTop: 4, textAlign: 'center', fontSize: 12 }}>{label}</Muted>
    </Card>
  )
}
