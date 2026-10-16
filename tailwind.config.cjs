// Tailwind pré-compilado para /static/tailwind.css (antes vinha do CDN
// cdn.tailwindcss.com, que gerava o CSS no browser em cada página e fazia o
// ecrã "piscar" sem estilos, sobretudo na app Android).
// Gerado por `npm run css:build` (corre sozinho antes de `npm run build`).

// Cores das disciplinas/estatísticas montadas em JS (ex.: `bg-${meta.color}-100`
// em creator-*.html e help.html) — o scanner não as vê, por isso ficam fixas.
const DYNAMIC_COLORS = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts,tsx,js}',
    './public/static/**/*.{js,html}'
  ],
  safelist: [
    { pattern: new RegExp(`^(bg|text|from|to)-(${DYNAMIC_COLORS})-(50|100|400|500|600|700)$`) }
  ],
  // Hover só em dispositivos com rato: num toque (telemóvel/app) o estado
  // :hover ficava "colado" ao elemento depois de levantar o dedo.
  future: {
    hoverOnlyWhenSupported: true
  },
  theme: {
    extend: {
      // Paleta da landing (home.html), antes definida inline no tailwind.config do CDN.
      colors: {
        navy: { 950: '#0a1628', 900: '#0d1e33', 800: '#122a44' },
        brand: { 50: '#f0fdf4', 500: '#22c55e', 600: '#16a34a', 700: '#15803d' }
      }
    }
  }
}
