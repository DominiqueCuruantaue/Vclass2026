import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/utils/**', 'src/middleware/**'],
      exclude: ['src/utils/refreshTokens.ts'] // requer mock de Supabase + WebCrypto
    }
  }
})
