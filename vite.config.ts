import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'
import { readdirSync, unlinkSync, statSync } from 'node:fs'
import { join } from 'node:path'

// Plugin que remove ficheiros HTML estáticos do dist/ após o build
// Evita que o Cloudflare Pages sirva versões antigas em vez do _worker.js
function removeStaticHtmlPlugin() {
  return {
    name: 'remove-static-html',
    closeBundle() {
      try {
        const distDir = join(process.cwd(), 'dist')
        const files = readdirSync(distDir)
        let removed = 0
        files.forEach(f => {
          if (f.endsWith('.html')) {
            const fp = join(distDir, f)
            if (statSync(fp).isFile()) {
              unlinkSync(fp)
              removed++
            }
          }
        })
        if (removed > 0) console.log(`[remove-static-html] Removidos ${removed} ficheiro(s) HTML estático(s) de dist/`)
      } catch (_) {
        // dist/ pode não existir ainda na primeira execução
      }
    }
  }
}

export default defineConfig({
  plugins: [
    build(),
    devServer({
      adapter,
      entry: 'src/index.tsx'
    }),
    removeStaticHtmlPlugin()
  ]
})
