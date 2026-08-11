import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { Card, ErrorState, LoadingState, Muted, Screen } from '../../src/components/ui'
import { colors, radius } from '../../src/theme/colors'
import { fetchDashboard, type DashboardData } from '../../src/api/progress'
import { ApiError } from '../../src/api/client'

interface Badge {
  icon: string
  title: string
  description: string
  earned: boolean
}

function buildBadges(stats: DashboardData['stats']): Badge[] {
  const completed = stats.completedLessons ?? 0
  const avg = stats.averageScore ?? 0
  return [
    { icon: '🎬', title: 'Primeiros Passos', description: 'Completa a tua primeira lição', earned: completed >= 1 },
    { icon: '🔥', title: 'Em Ritmo', description: 'Completa 5 lições', earned: completed >= 5 },
    { icon: '📚', title: 'Dedicado', description: 'Completa 20 lições', earned: completed >= 20 },
    { icon: '🏅', title: 'Excelência', description: 'Nota média igual ou superior a 70%', earned: avg >= 70 },
    { icon: '🎓', title: 'Mestre da Disciplina', description: 'Completa 100% de uma disciplina com nota ≥ 70%', earned: false },
  ]
}

export default function AchievementsScreen() {
  const [stats, setStats] = useState<DashboardData['stats'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboard()
      .then((d) => setStats(d.stats))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Não foi possível carregar as conquistas.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Screen><LoadingState /></Screen>
  if (error || !stats) return <Screen><ErrorState message={error || 'Erro'} /></Screen>

  const badges = buildBadges(stats)
  const earnedCount = badges.filter((b) => b.earned).length

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 40 }}>🏆</Text>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.navy950, marginTop: 8 }}>
          {earnedCount} de {badges.length} conquistas
        </Text>
        <Muted>Continua a aprender para desbloquear mais</Muted>
      </View>

      {badges.map((badge) => (
        <Card key={badge.title} style={{ flexDirection: 'row', alignItems: 'center', opacity: badge.earned ? 1 : 0.5 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: radius.md,
              backgroundColor: badge.earned ? colors.brand50 : '#f1f5f9',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 22 }}>{badge.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', color: colors.text }}>{badge.title}</Text>
            <Muted>{badge.description}</Muted>
          </View>
          {badge.earned ? <Text style={{ fontSize: 18 }}>✅</Text> : null}
        </Card>
      ))}
    </Screen>
  )
}
