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

// Health check
app.get('/api/health', (c) => {
  return c.json({
    success: true,
    message: 'VClass API is running',
    version: '1.2.0',
    timestamp: new Date().toISOString()
  })
})

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Route not found'
  }, 404)
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
