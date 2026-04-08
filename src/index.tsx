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

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('/api/*', corsConfig)

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))

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
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

// Root route - serve web app
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="pt">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>VClass - Plataforma de Educação Digital</title>
        <meta name="description" content="Plataforma de educação digital para Moçambique e além">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .fade-in {
            animation: fadeIn 0.6s ease-out;
          }
          .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Header -->
        <nav class="gradient-bg text-white shadow-lg">
            <div class="container mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-graduation-cap text-3xl"></i>
                        <h1 class="text-2xl font-bold">VClass</h1>
                    </div>
                    <div class="flex space-x-4">
                        <button onclick="showLogin()" class="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition">
                            <i class="fas fa-sign-in-alt mr-2"></i>Entrar
                        </button>
                        <button onclick="showRegister()" class="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition">
                            <i class="fas fa-user-plus mr-2"></i>Registar
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <section class="gradient-bg text-white py-20">
            <div class="container mx-auto px-4 text-center fade-in">
                <h2 class="text-5xl font-bold mb-6">
                    Educação Digital de Qualidade
                </h2>
                <p class="text-xl mb-8 text-purple-100">
                    Aprenda do 10º ao 12º ano com vídeos, exercícios e conteúdo interativo
                </p>
                <div class="flex justify-center space-x-4">
                    <button onclick="showRegister()" class="px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition">
                        Começar Agora - Grátis
                    </button>
                    <button onclick="scrollToFeatures()" class="px-8 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition">
                        Saber Mais
                    </button>
                </div>
            </div>
        </section>

        <!-- Features Section -->
        <section id="features" class="py-16 bg-white">
            <div class="container mx-auto px-4">
                <h3 class="text-3xl font-bold text-center mb-12 text-gray-800">
                    Por que escolher VClass?
                </h3>
                <div class="grid md:grid-cols-3 gap-8">
                    <div class="text-center p-6 bg-purple-50 rounded-lg fade-in">
                        <i class="fas fa-video text-5xl text-purple-600 mb-4"></i>
                        <h4 class="text-xl font-bold mb-2">Vídeos de Qualidade</h4>
                        <p class="text-gray-600">Aulas em vídeo com professores especializados</p>
                    </div>
                    <div class="text-center p-6 bg-blue-50 rounded-lg fade-in" style="animation-delay: 0.2s">
                        <i class="fas fa-tasks text-5xl text-blue-600 mb-4"></i>
                        <h4 class="text-xl font-bold mb-2">Exercícios Práticos</h4>
                        <p class="text-gray-600">Teste seus conhecimentos com quizzes interativos</p>
                    </div>
                    <div class="text-center p-6 bg-green-50 rounded-lg fade-in" style="animation-delay: 0.4s">
                        <i class="fas fa-chart-line text-5xl text-green-600 mb-4"></i>
                        <h4 class="text-xl font-bold mb-2">Acompanhe seu Progresso</h4>
                        <p class="text-gray-600">Veja seu desenvolvimento em tempo real</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Subjects Section -->
        <section class="py-16 bg-gray-50">
            <div class="container mx-auto px-4">
                <h3 class="text-3xl font-bold text-center mb-12 text-gray-800">
                    Disciplinas Disponíveis
                </h3>
                <div class="grid md:grid-cols-4 gap-6">
                    <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                        <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                            <i class="fas fa-calculator text-white text-xl"></i>
                        </div>
                        <h4 class="font-bold text-lg">Matemática</h4>
                        <p class="text-gray-600 text-sm">Álgebra, Geometria, Cálculo</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                        <div class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-4">
                            <i class="fas fa-book text-white text-xl"></i>
                        </div>
                        <h4 class="font-bold text-lg">Português</h4>
                        <p class="text-gray-600 text-sm">Literatura e Gramática</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                        <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4">
                            <i class="fas fa-atom text-white text-xl"></i>
                        </div>
                        <h4 class="font-bold text-lg">Física</h4>
                        <p class="text-gray-600 text-sm">Mecânica e Eletromagnetismo</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                        <div class="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-4">
                            <i class="fas fa-flask text-white text-xl"></i>
                        </div>
                        <h4 class="font-bold text-lg">Química</h4>
                        <p class="text-gray-600 text-sm">Orgânica e Inorgânica</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="gradient-bg text-white py-8">
            <div class="container mx-auto px-4 text-center">
                <div class="flex items-center justify-center space-x-2 mb-4">
                    <i class="fas fa-graduation-cap text-2xl"></i>
                    <span class="text-xl font-bold">VClass</span>
                </div>
                <p class="text-purple-200 mb-4">
                    Plataforma de Educação Digital para Moçambique
                </p>
                <div class="flex justify-center space-x-6 mb-4">
                    <a href="#" class="hover:text-purple-200 transition">
                        <i class="fab fa-facebook text-2xl"></i>
                    </a>
                    <a href="#" class="hover:text-purple-200 transition">
                        <i class="fab fa-twitter text-2xl"></i>
                    </a>
                    <a href="#" class="hover:text-purple-200 transition">
                        <i class="fab fa-instagram text-2xl"></i>
                    </a>
                </div>
                <p class="text-sm text-purple-200">
                    © 2024 VClass. Todos os direitos reservados.
                </p>
            </div>
        </footer>

        <!-- Modals (to be implemented in separate files) -->
        <div id="modal-container"></div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
        <script>
            function scrollToFeatures() {
                document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
            }
            
            function showLogin() {
                alert('Login modal - Implement in separate file');
                // Redirect to login page or open modal
                window.location.href = '/login.html';
            }
            
            function showRegister() {
                alert('Register modal - Implement in separate file');
                // Redirect to register page or open modal
                window.location.href = '/register.html';
            }
        </script>
    </body>
    </html>
  `)
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
