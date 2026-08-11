import React, { useCallback, useState } from 'react'
import { Text, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Card, ChipSelect, ErrorState, H2, LoadingState, Muted, Screen } from '../../src/components/ui'
import { colors } from '../../src/theme/colors'
import { fetchCreatorAnalytics } from '../../src/api/creator'
import { ApiError } from '../../src/api/client'

const PERIODS = ['7d', '30d', '90d', 'all'] as const
const LABELS: Record<string, string> = { '7d': '7 dias', '30d': '30 dias', '90d': '90 dias', all: 'Tudo' }

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('7d')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchCreatorAnalytics(period)
      setData(res)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar analytics.')
    } finally {
      setLoading(false)
    }
  }, [period])

  useFocusEffect(useCallback(() => { load() }, [load]))

  if (loading && !data) return <Screen><LoadingState /></Screen>
  if (error) return <Screen><ErrorState message={error} onRetry={load} /></Screen>

  const kpi = data?.kpi || {}

  return (
    <Screen>
      <ChipSelect options={PERIODS as unknown as string[]} value={period} onChange={(v) => setPeriod(v as any)} labels={LABELS} />
      <View style={{ height: 16 }} />

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <Card style={{ flex: 1 }}>
          <Muted>Visualizações</Muted>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.navy950 }}>{kpi.views ?? '—'}</Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <Muted>Conclusões</Muted>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.navy950 }}>{kpi.completions ?? '—'}</Text>
        </Card>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <Card style={{ flex: 1 }}>
          <Muted>Tempo médio assistido</Muted>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.navy950 }}>{kpi.watch_min ?? '—'} min</Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <Muted>Nota média</Muted>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.navy950 }}>{kpi.score ?? '—'}%</Text>
        </Card>
      </View>

      {data?.top_lessons?.length ? (
        <>
          <H2>Melhores lições</H2>
          {data.top_lessons.map((l: any, i: number) => (
            <Card key={i}>
              <Text style={{ fontWeight: '700', color: colors.text }}>{l.title}</Text>
              <Muted>{l.views} visualizações · {l.completions} conclusões · {l.trend}</Muted>
            </Card>
          ))}
        </>
      ) : null}

      {data?.insights?.length ? (
        <>
          <H2>Insights</H2>
          {data.insights.map((ins: any, i: number) => (
            <Card key={i}>
              <Muted>💡 {ins.text}</Muted>
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  )
}
