import React from 'react'
import { Text, View, useWindowDimensions } from 'react-native'
import { colors, withAlpha } from '../theme/colors'
import type { ActivityDay } from '../api/progress'

// ── Gráfico de barras (ex: actividade da semana) ────────────────────────────
// Puramente flexbox — a largura de cada barra adapta-se ao ecrã sem medições
// manuais, por isso funciona em telemóvel estreito ou tablet sem alterações.
export function BarChart({
  data,
  color = colors.brand600,
  maxBarHeight = 90,
}: {
  data: Array<{ label: string; value: number }>
  color?: string
  maxBarHeight?: number
}) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: maxBarHeight + 34, gap: 6 }}>
      {data.map((d, i) => {
        const barHeight = Math.max(3, Math.round((d.value / max) * maxBarHeight))
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            {d.value > 0 ? (
              <Text style={{ fontSize: 10, color: colors.textMuted, marginBottom: 2 }}>{d.value}</Text>
            ) : (
              <View style={{ height: 14 }} />
            )}
            <View
              style={{
                width: '100%',
                maxWidth: 28,
                height: barHeight,
                borderRadius: 6,
                backgroundColor: d.value > 0 ? color : colors.border,
              }}
            />
            <Text style={{ fontSize: 10, color: colors.textFaint, marginTop: 6 }} numberOfLines={1}>
              {d.label}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

// ── Heatmap de actividade (estilo GitHub) ───────────────────────────────────
// O tamanho de cada quadrado adapta-se à largura disponível do ecrã
// (useWindowDimensions), por isso o número de semanas visíveis é o mesmo em
// todos os aparelhos mas o quadrado fica maior num tablet do que num
// telemóvel estreito.
const DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export function ActivityHeatmap({ heatmap, weeks = 12 }: { heatmap: ActivityDay[]; weeks?: number }) {
  const { width } = useWindowDimensions()
  const days = heatmap.slice(-weeks * 7)

  // Completa a primeira semana para começar sempre num Domingo.
  const firstDate = days.length ? new Date(`${days[0].date}T00:00:00`) : new Date()
  const leadingBlanks = firstDate.getDay()
  const padded: Array<ActivityDay | null> = [...Array(leadingBlanks).fill(null), ...days]
  const cols = Math.ceil(padded.length / 7)

  const gap = 3
  const horizontalPadding = 32 + 20 // Screen padding + card padding, aproximado
  const available = Math.max(200, width - horizontalPadding)
  const cell = Math.min(14, Math.max(8, Math.floor((available - cols * gap) / cols)))

  function colorFor(count: number) {
    if (count <= 0) return colors.border
    if (count === 1) return withAlpha(colors.brand500, 0.35)
    if (count <= 3) return withAlpha(colors.brand500, 0.65)
    return colors.brand600
  }

  const columns: Array<Array<ActivityDay | null>> = []
  for (let c = 0; c < cols; c++) columns.push(padded.slice(c * 7, c * 7 + 7))

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      <View style={{ marginRight: 6, justifyContent: 'space-between', height: cell * 7 + gap * 6 }}>
        {DAY_LABELS.map((l, i) => (
          <Text key={i} style={{ fontSize: 9, color: colors.textFaint, height: cell }}>{i % 2 === 1 ? l : ''}</Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap }}>
        {columns.map((col, ci) => (
          <View key={ci} style={{ gap }}>
            {col.map((d, di) => (
              <View
                key={di}
                style={{
                  width: cell,
                  height: cell,
                  borderRadius: 3,
                  backgroundColor: d ? colorFor(d.count) : 'transparent',
                }}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  )
}
