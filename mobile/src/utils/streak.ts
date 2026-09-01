import type { ActivityDay } from '../api/progress'

// Sequência de dias consecutivos com actividade, contada a partir de hoje
// (ou de ontem, para não zerar o dia todo antes de o aluno abrir a app).
// Ao contrário do web (que guarda `vclass_streak` em localStorage, por
// dispositivo), aqui calculamos a partir do heatmap real devolvido pelo
// servidor (`GET /api/progress/activity`) — funciona entre dispositivos e
// sobrevive a reinstalações.
export function computeStreak(heatmap: ActivityDay[]): number {
  if (!heatmap || heatmap.length === 0) return 0

  const byDate = new Map(heatmap.map((d) => [d.date, d.count]))
  const todayKey = new Date().toISOString().slice(0, 10)
  const hasToday = (byDate.get(todayKey) ?? 0) > 0

  let streak = 0
  const cursor = new Date()
  if (!hasToday) cursor.setDate(cursor.getDate() - 1)

  while (true) {
    const key = cursor.toISOString().slice(0, 10)
    const count = byDate.get(key)
    if (!count) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}
