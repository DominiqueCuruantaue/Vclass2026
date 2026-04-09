import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/cloudflare-workers'
import { corsConfig } from './middleware/cors'

// Import routes
import authRoutes from './routes/auth'
import contentRoutes from './routes/content'
import videoRoutes from './routes/video'
import exercisesRoutes from './routes/exercises'
import progressRoutes from './routes/progress'
import creatorRoutes from './routes/creator'
import pagesRoutes from './routes/pages'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('/api/*', corsConfig)

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))
app.use('/designs/*', serveStatic({ root: './public' }))

// HTML Pages
app.route('/', pagesRoutes)

// API Routes
app.route('/api/auth', authRoutes)
app.route('/api/content', contentRoutes)
app.route('/api/video', videoRoutes)
app.route('/api/exercises', exercisesRoutes)
app.route('/api/progress', progressRoutes)
app.route('/api/creator', creatorRoutes)

// Health check
app.get('/api/health', (c) => {
  return c.json({
    success: true,
    message: 'VClass API is running',
    version: '1.2.0',
    timestamp: new Date().toISOString()
  })
})

// 404 handler — return HTML for page routes, JSON for API routes
app.notFound((c) => {
  const path = c.req.path
  if (path.startsWith('/api/')) {
    return c.json({ success: false, error: 'Route not found' }, 404)
  }
  // HTML 404 page
  return c.html(`<!DOCTYPE html>
<html lang="pt"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Página não encontrada - VClass</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head><body class="bg-gray-50 min-h-screen flex items-center justify-center p-4">
<div class="text-center max-w-md">
  <div class="text-8xl mb-6">🎓</div>
  <h1 class="text-6xl font-bold text-purple-600 mb-2">404</h1>
  <h2 class="text-2xl font-bold text-gray-900 mb-3">Página não encontrada</h2>
  <p class="text-gray-600 mb-8">A página que você procura não existe ou foi movida.</p>
  <div class="flex flex-col sm:flex-row gap-3 justify-center">
    <a href="/dashboard.html" class="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition">
      <i class="fas fa-home mr-2"></i> Ir ao Dashboard
    </a>
    <a href="/browse.html" class="inline-flex items-center justify-center px-6 py-3 border border-purple-600 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition">
      <i class="fas fa-book mr-2"></i> Explorar Conteúdo
    </a>
  </div>
  <p class="mt-8 text-sm text-gray-400"><a href="/home.html" class="hover:text-purple-600">← Voltar ao início</a></p>
</div></body></html>`, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err)
  return c.json({
    success: false,
    error: 'Internal server error',
    message: err.message
  }, 500)
})

export default app
