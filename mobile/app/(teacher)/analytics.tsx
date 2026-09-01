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

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <Card style={{ flexBasis: '47%', flexGrow: 1 }}>
          <Muted>Visualizações</Muted>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.navy950 }}>{kpi.views ?? '—'}</Text>
        </Card>
        <Card style={{ flexBasis: '47%', flexGrow: 1 }}>
          <Muted>Conclusões</Muted>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.navy950 }}>{kpi.completions ?? '—'}</Text>
        </Card>
        <Card style={{ flexBasis: '47%', flexGrow: 1 }}>
          <Muted>Tempo médio assistido</Muted>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.navy950 }}>{kpi.watch_min ?? '—'} min</Text>
        </Card>
        <Card style={{ flexBasis: '47%', flexGrow: 1 }}>
          <Muted>Nota média</Muted>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.navy950 }}>{kpi.score ?? '—'}%</Text>
        </Card>
      </View>

      {data?.funnel ? (
        <>
          <H2>Funil de engajamento</H2>
          <Card>
            {[
              { label: 'Acedeu', value: data.funnel.accessed },
              { label: 'Iniciou', value: data.funnel.started },
              { label: 'Assistiu 80%', value: data.funnel.watched_80pct },
              { label: 'Fez exercícios', value: data.funnel.did_exercises },
              { label: 'Concluiu', value: data.funnel.completed },
            ].map((step, i, arr) => {
              const max = arr[0]?.value || 1
              const pct = Math.round(((step.value ?? 0) / max) * 100)
              return (
                <View key={i} style={{ marginBottom: i === arr.length - 1 ? 0 : 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Muted>{step.label}</Muted>
                    <Muted>{step.value ?? 0}</Muted>
                  </View>
                  <View style={{ height: 8, borderRadius: 999, backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                    <View style={{ width: `${pct}%`, height: '100%', borderRadius: 999, backgroundColor: colors.info }} />
                  </View>
                </View>
              )
            })}
          </Card>
        </>
      ) : null}

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
