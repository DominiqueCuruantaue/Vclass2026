// Paleta partilhada com o tema web (navy/verde) — ver src/pages/home.html no repo raiz.
export const colors = {
  navy950: '#0a1628',
  navy900: '#0d1e33',
  navy800: '#122a44',
  brand50: '#f0fdf4',
  brand500: '#22c55e',
  brand600: '#16a34a',
  brand700: '#15803d',

  bg: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  danger: '#dc2626',
  warning: '#d97706',
  info: '#2563eb',
} as const

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const
export const spacing = (n: number) => n * 4

// Cor de fallback para disciplinas sem `color` definido na BD — mesmo valor
// usado no web (ver subjectIcons em src/pages/browse.html).
export const FALLBACK_SUBJECT_COLOR = '#7c3aed'

/** Converte um hex (#rgb ou #rrggbb) em rgba(...) com a opacidade indicada. */
export function withAlpha(hex: string, alpha: number): string {
  const clean = (hex || '').replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) return hex
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
