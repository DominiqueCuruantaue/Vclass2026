# 🏗️ VClass - Arquitetura do Sistema

## 📊 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                     CAMADA DE APRESENTAÇÃO                       │
├──────────────────────────┬──────────────────────────────────────┤
│   Web App (React)        │   Mobile App (Flutter)               │
│   - Responsivo           │   - Android/iOS                      │
│   - PWA                  │   - Modo Offline                     │
│   - Tailwind CSS         │   - Cache Criptografado              │
└──────────────────────────┴──────────────────────────────────────┘
                              ↓ HTTPS/REST API
┌─────────────────────────────────────────────────────────────────┐
│              CLOUDFLARE WORKERS (API GATEWAY)                    │
│   - Hono Framework (Edge Runtime)                               │
│   - JWT Authentication                                           │
│   - Rate Limiting                                                │
│   - Caching Layer (KV)                                           │
│   - Video Token Generation                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────┬──────────────────────┬──────────────────┐
│   SUPABASE           │   CLOUDFLARE R2      │   BUNNY.NET CDN  │
│   (Backend)          │   (File Storage)     │   (Video Stream) │
├──────────────────────┼──────────────────────┼──────────────────┤
│ - PostgreSQL DB      │ - Documentos PDF     │ - HLS Streaming  │
│ - Authentication     │ - Imagens            │ - Token Protected│
│ - Row Level Security │ - Anexos             │ - Adaptive Res.  │
│ - Realtime           │ - Exports            │ - 240p-720p      │
└──────────────────────┴──────────────────────┴──────────────────┘
```

---

## 🎯 Componentes Principais

### 1. **Frontend Web (React + Vite)**
- **Framework**: React 18 com Vite
- **Styling**: Tailwind CSS via CDN
- **State**: React Context + hooks
- **Routing**: React Router (client-side)
- **HTTP Client**: Axios
- **Video Player**: Video.js com HLS support

### 2. **Mobile App (Flutter)**
- **Framework**: Flutter 3.x
- **State Management**: Provider / Riverpod
- **Local Storage**: Hive (encrypted)
- **HTTP**: Dio
- **Video**: better_player (HLS + DRM)
- **Offline**: Background sync

### 3. **Backend API (Cloudflare Workers + Hono)**
- **Framework**: Hono (lightweight)
- **Runtime**: Cloudflare Workers (V8)
- **Authentication**: JWT (HS256)
- **Validation**: Zod
- **CORS**: Habilitado para web/mobile

### 4. **Database (Supabase - PostgreSQL)**
- **Version**: PostgreSQL 15
- **ORM**: Supabase Client SDK
- **Security**: Row Level Security (RLS)
- **Migrations**: SQL migrations

### 5. **Storage**
- **Files**: Cloudflare R2 (S3-compatible)
- **Videos**: Bunny.net CDN (Stream API)
- **Cache**: Cloudflare KV

---

## 🗂️ Estrutura de Dados

### Hierarquia de Conteúdo
```
País (Country)
  └── Sistema Educacional (Education System)
      └── Série/Ano (Grade)
          └── Disciplina (Subject)
              └── Capítulo (Chapter)
                  └── Lição (Lesson)
                      ├── Vídeo (Video)
                      ├── Conteúdo (Content)
                      ├── Anexos (Attachments)
                      └── Exercícios (Exercises)
```

---

## 👥 Roles e Permissões

| Role    | Permissões                                                    |
|---------|---------------------------------------------------------------|
| Student | Ver conteúdo, fazer exercícios, tracking de progresso         |
| Teacher | Criar/editar lessons, upload de vídeo, ver analytics          |
| Admin   | Gerenciar usuários, aprovar conteúdo, analytics completo      |

---

## 🎥 Sistema de Streaming de Vídeo

### Fluxo de Proteção de Vídeo
```
1. Estudante solicita vídeo → GET /api/videos/:id/token
2. Backend valida sessão e permissões
3. Gera token JWT com:
   - video_id
   - user_id
   - expiration (15 minutos)
4. Retorna URL assinada: https://cdn.bunny.net/video.m3u8?token=xyz
5. Player faz request com token
6. CDN valida token e serve vídeo em HLS
7. Token expira após uso
```

### Proteções
- ✅ Token com expiração curta (15 min)
- ✅ URL única por usuário
- ✅ Watermark com user_id (opcional)
- ✅ HLS adaptativo (previne download direto)
- ✅ Rate limiting no endpoint

---

## 📱 Modo Offline (Mobile App)

### Fluxo de Cache Local
```
1. Estudante marca lesson como "Download for Offline"
2. App baixa vídeo + conteúdo + exercícios
3. Criptografa localmente com AES-256
4. Armazena em Hive database
5. Conteúdo só acessível dentro do app
6. Sincroniza progresso quando online
```

### Estrutura de Cache
```dart
class CachedLesson {
  String lessonId;
  String encryptedVideoPath; // AES-256
  String content;
  List<Exercise> exercises;
  DateTime cachedAt;
  DateTime expiresAt; // 30 dias
}
```

---

## 🔐 Autenticação e Segurança

### JWT Token Structure
```json
{
  "sub": "user_id",
  "role": "student|teacher|admin",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Security Features
- ✅ JWT com HS256
- ✅ Refresh token (7 dias)
- ✅ Access token (30 min)
- ✅ CORS configurado
- ✅ Rate limiting (100 req/min)
- ✅ Input validation (Zod)
- ✅ SQL injection protection (prepared statements)
- ✅ XSS protection (sanitização)

---

## 📊 Performance & Otimização

### Para Low-Bandwidth
- Vídeos: 240p padrão, 480p/720p opcional
- Imagens: WebP comprimidas
- Lazy loading de conteúdo
- API pagination (20 itens/página)
- Gzip compression
- Cloudflare CDN edge caching

### Caching Strategy
```
Static Assets: 1 ano (imutável)
API Responses: 5 minutos (variável)
Video Tokens: Não cachear
User Data: Não cachear
```

---

## 🚀 Deployment

### Ambientes
- **Development**: Local (Wrangler dev)
- **Staging**: Cloudflare Pages (branch: staging)
- **Production**: Cloudflare Pages (branch: main)

### CI/CD
```
1. Push to GitHub
2. GitHub Actions:
   - Run tests
   - Build frontend
   - Deploy to Cloudflare Pages
3. Wrangler deploy workers
```

---

## 📈 Escalabilidade

### Limites Iniciais (Free Tier)
- **Cloudflare Workers**: 100k req/dia
- **Supabase**: 500MB DB, 1GB storage
- **Bunny.net**: Pay-as-you-go ($0.005/GB)

### Scaling Path
```
1k users   → Free tier ($0-10/mês)
10k users  → Supabase Pro ($25/mês) + Bunny ($50/mês)
100k users → Supabase Team ($599/mês) + CDN ($500/mês)
```

---

## 🔄 APIs Principais

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Content
- `GET /api/countries`
- `GET /api/grades/:country_id`
- `GET /api/subjects/:grade_id`
- `GET /api/chapters/:subject_id`
- `GET /api/lessons/:chapter_id`
- `GET /api/lessons/:id`

### Video
- `GET /api/videos/:id/token` (protected)
- `POST /api/videos/upload` (teacher only)

### Progress
- `POST /api/progress/lesson`
- `POST /api/progress/exercise`
- `GET /api/progress/student/:id`

### Exercises
- `GET /api/exercises/:lesson_id`
- `POST /api/exercises/submit`
- `GET /api/exercises/results/:id`

---

## 📱 Tech Stack Completo

### Backend
- Cloudflare Workers (runtime)
- Hono (framework)
- Supabase (database)
- Bunny.net (CDN/streaming)

### Frontend Web
- React 18
- Vite
- Tailwind CSS
- Axios
- Video.js

### Mobile
- Flutter 3.x
- Dart
- Provider/Riverpod
- Hive
- Dio

### DevOps
- Git/GitHub
- Wrangler CLI
- PM2 (dev)
- GitHub Actions (CI/CD)

---

## 🎯 MVP Scope (Fase 1)

### Países: Moçambique
### Séries: 10ª, 11ª, 12ª
### Disciplinas: Matemática, Português, Ciências

### Features MVP:
- ✅ Autenticação (registro/login)
- ✅ Navegação de conteúdo
- ✅ Streaming de vídeo protegido
- ✅ Exercícios básicos (multiple choice)
- ✅ Tracking de progresso
- ✅ Dashboard de estudante
- ✅ Upload de conteúdo (teachers)
- ⏳ Modo offline (Fase 2)
- ⏳ Live classes (Fase 3)
- ⏳ Monetização (Fase 3)

---

## 📞 Integrações Futuras

- **Pagamentos**: Stripe, M-Pesa (Moçambique)
- **SMS**: Twilio (notificações)
- **Email**: SendGrid
- **Analytics**: Mixpanel/Amplitude
- **Monitoring**: Sentry
- **Live Video**: Zoom API / Agora.io

