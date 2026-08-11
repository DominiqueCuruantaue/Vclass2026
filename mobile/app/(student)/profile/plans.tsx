import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { Badge, Button, Card, ErrorState, H1, LoadingState, Muted, Screen } from '../../../src/components/ui'
import { colors } from '../../../src/theme/colors'
import { fetchPlans, fetchMyPlan, subscribeToPlan, type PlanData } from '../../../src/api/plans'
import { ApiError } from '../../../src/api/client'

export default function PlansScreen() {
  const [plans, setPlans] = useState<PlanData[]>([])
  const [currentPlanId, setCurrentPlanId] = useState<string>('free')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    Promise.all([fetchPlans('mzn'), fetchMyPlan()])
      .then(([plansRes, myPlan]) => {
        setPlans(plansRes.plans)
        setCurrentPlanId(myPlan.current_plan.id)
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Não foi possível carregar os planos.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubscribe(plan: PlanData) {
    if (plan.id === 'free' || plan.id === currentPlanId) return
    setSubscribing(plan.id)
    setMessage('')
    try {
      const res: any = await subscribeToPlan({ plan_id: plan.id as 'basic' | 'premium', billing: 'monthly', currency: 'MZN', payment_method: 'mpesa' })
      setMessage(res?.payment_instructions?.instructions || 'Subscrição iniciada — segue as instruções de pagamento enviadas.')
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : 'Não foi possível iniciar a subscrição.')
    } finally {
      setSubscribing(null)
    }
  }

  if (loading) return <Screen><LoadingState /></Screen>
  if (error) return <Screen><ErrorState message={error} /></Screen>

  return (
    <Screen>
      <H1>Planos</H1>
      <Muted style={{ marginBottom: 16 }}>Escolhe o plano que melhor se adapta ao teu ritmo de estudo.</Muted>

      {message ? (
        <Card style={{ backgroundColor: '#eff6ff', borderColor: colors.info }}>
          <Muted>{message}</Muted>
        </Card>
      ) : null}

      {plans.map((plan) => {
        const isCurrent = plan.id === currentPlanId
        return (
          <Card key={plan.id} style={isCurrent ? { borderColor: colors.brand600, borderWidth: 2 } : undefined}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontWeight: '800', fontSize: 17, color: colors.navy950 }}>{plan.name}</Text>
              {isCurrent ? <Badge text="Plano atual" tone="success" /> : null}
            </View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.brand600, marginBottom: 8 }}>
              {plan.display_price_monthly > 0 ? `${plan.display_price_monthly} ${plan.currency}/mês` : 'Grátis'}
            </Text>
            {plan.features?.map((f, i) => (
              <Muted key={i}>• {f}</Muted>
            ))}
            {!isCurrent && plan.id !== 'free' ? (
              <View style={{ marginTop: 12 }}>
                <Button
                  title={subscribing === plan.id ? 'A processar…' : 'Subscrever'}
                  onPress={() => handleSubscribe(plan)}
                  loading={subscribing === plan.id}
                />
              </View>
            ) : null}
          </Card>
        )
      })}
    </Screen>
  )
}
