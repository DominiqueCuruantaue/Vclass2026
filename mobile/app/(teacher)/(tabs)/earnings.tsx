import React, { useCallback, useState } from 'react'
import { Text, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Badge, Button, Card, ChipSelect, ErrorState, Field, H1, H2, LoadingState, Muted, Screen } from '../../../src/components/ui'
import { colors } from '../../../src/theme/colors'
import { fetchCreatorEarnings, requestWithdrawal } from '../../../src/api/creator'
import { ApiError } from '../../../src/api/client'

const PERIODS = ['7d', '30d', '90d', '12m', 'all'] as const
const PERIOD_LABELS: Record<string, string> = { '7d': '7 dias', '30d': '30 dias', '90d': '90 dias', '12m': '12 meses', all: 'Tudo' }

export default function TeacherEarningsScreen() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('30d')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [withdrawMsg, setWithdrawMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchCreatorEarnings(period)
      setData(res)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar os ganhos.')
    } finally {
      setLoading(false)
    }
  }, [period])

  useFocusEffect(useCallback(() => { load() }, [load]))

  async function handleWithdraw() {
    setWithdrawMsg('')
    const amt = parseFloat(amount)
    if (!amt || amt < 500) return setWithdrawMsg('Valor mínimo de levantamento: MT 500.')
    if (!phone.trim()) return setWithdrawMsg('Indica o número de telefone (M-Pesa).')
    setRequesting(true)
    try {
      const res = await requestWithdrawal({ amount_mzn: amt, method: 'mpesa', phone: phone.trim() })
      setWithdrawMsg(`Pedido enviado — referência ${res.reference}.`)
      setAmount('')
    } catch (e) {
      setWithdrawMsg(e instanceof ApiError ? e.message : 'Não foi possível pedir o levantamento.')
    } finally {
      setRequesting(false)
    }
  }

  if (loading && !data) return <Screen><LoadingState /></Screen>
  if (error) return <Screen><ErrorState message={error} onRetry={load} /></Screen>

  const kpi = data?.kpi

  return (
    <Screen>
      <H1>Ganhos</H1>
      <ChipSelect options={PERIODS as unknown as string[]} value={period} onChange={(v) => setPeriod(v as any)} labels={PERIOD_LABELS} />
      <View style={{ height: 16 }} />

      <Card>
        <Muted>Disponível para levantamento</Muted>
        <Text style={{ fontSize: 26, fontWeight: '800', color: colors.brand600, marginTop: 4 }}>
          MT {(kpi?.available_mzn ?? 0).toLocaleString()}
        </Text>
        <Muted style={{ marginTop: 8 }}>Comissão total ({data?.commission_rules?.teacher_pct ?? 40}%): MT {(kpi?.commission_mzn ?? 0).toLocaleString()}</Muted>
      </Card>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Card style={{ flex: 1 }}>
          <Muted>Alunos pagantes</Muted>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.navy950 }}>{kpi?.paid_students ?? 0}</Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <Muted>Conclusões</Muted>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.navy950 }}>{kpi?.completions ?? 0}</Text>
        </Card>
      </View>

      <H2>Pedir levantamento</H2>
      <Card>
        <Field label="Valor (MT)" keyboardType="number-pad" value={amount} onChangeText={setAmount} />
        <Field label="Número M-Pesa" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        {withdrawMsg ? <Muted style={{ marginBottom: 8 }}>{withdrawMsg}</Muted> : null}
        <Button title="Pedir levantamento" onPress={handleWithdraw} loading={requesting} />
      </Card>

      {data?.top_lessons?.length ? (
        <>
          <H2>Lições que mais renderam</H2>
          {data.top_lessons.map((l: any) => (
            <Card key={l.id}>
              <Text style={{ fontWeight: '700', color: colors.text }}>{l.title}</Text>
              <Muted>{l.subject} · {l.views} visualizações</Muted>
              <Badge text={`MT ${l.commission_mzn.toLocaleString()}`} tone="success" />
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  )
}
