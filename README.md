# 🎓 VClass - Plataforma de Educação Digital

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](package.json)

## 📖 Visão Geral

**VClass** é uma plataforma de educação digital completa, escalável e otimizada para ambientes de baixa conectividade, focada inicialmente em Moçambique mas projetada para expansão multi-país.

### ✨ Características Principais

- 🎥 **Streaming de vídeo protegido** com tokens temporários
- 📚 **Conteúdo estruturado** por país, sistema educacional, série e disciplina
- ✍️ **Exercícios interativos** com feedback imediato
- 📊 **Tracking de progresso** detalhado por estudante com gráficos
- 👤 **Gerenciamento de perfil** completo com preferências
- 📈 **Dashboard analítico** com estatísticas em tempo real
- 🔐 **Autenticação robusta** com JWT e roles (student, teacher, admin)
- 📱 **Mobile-first** com suporte a modo offline (app Flutter)
- 🌍 **Multi-país** e multi-currículo desde o design
- ⚡ **Performance otimizada** para low-bandwidth
- 🎨 **UI moderna** com Tailwind CSS e animações

---

## 🏗️ Arquitetura

```
Frontend Web (React + Tailwind)
         ↓
Cloudflare Workers (Hono API)
         ↓
    ┌────┴────┬──────────────┬─────────────┐
    ↓         ↓              ↓             ↓
Supabase  Cloudflare R2  Bunny.net CDN  KV Cache
(PostgreSQL) (Storage)   (Video Stream)
```

### 🛠️ Stack Tecnológica

**Backend:**
- **Runtime:** Cloudflare Workers (Edge Computing)
- **Framework:** Hono (lightweight web framework)
- **Database:** Supabase (PostgreSQL)
- **Auth:** JWT (jsonwebtoken)
- **Validation:** Zod
- **Password:** bcryptjs

**Frontend Web:**
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (CDN)
- **HTTP Client:** Fetch API / Axios
- **Video Player:** Video.js / HLS.js

**Mobile App:**
- **Framework:** Flutter 3.x (a ser implementado)
- **State:** Provider / Riverpod
- **Storage:** Hive (encrypted)
- **Video:** better_player

**Infraestrutura:**
- **Deployment:** Cloudflare Pages
- **CDN:** Bunny.net (video streaming)
- **Storage:** Cloudflare R2
- **Cache:** Cloudflare KV

---

## 📦 Instalação e Configuração

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta Supabase (free tier funciona)
- Conta Cloudflare (free tier funciona)
- Conta Bunny.net (opcional, para vídeos)

### 1. Clone o Repositório

```bash
git clone <repository-url>
cd vclass
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure as Variáveis de Ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .dev.vars.example .dev.vars
```

Edite `.dev.vars`:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima-aqui
JWT_SECRET=sua-secret-super-secreta
BUNNY_CDN_URL=https://sua-zona.b-cdn.net
```

### 4. Configure o Banco de Dados

**No Supabase:**

1. Acesse seu projeto Supabase
2. Vá em SQL Editor
3. Execute o arquivo `database/migrations/001_initial_schema.sql`
4. Execute o arquivo `database/seeds/001_initial_data.sql`

Isso criará:
- Todas as tabelas necessárias
- Dados de exemplo (países, disciplinas, usuários de teste)
- Views e funções automáticas

**Usuários de teste criados:**
- Admin: `admin@vclass.mz` / `password123`
- Professor: `professor@vclass.mz` / `password123`
- Estudante: `estudante@vclass.mz` / `password123`

### 5. Build o Projeto

```bash
npm run build
```

---

## 🚀 Executando o Projeto

### Desenvolvimento Local (Sandbox)

```bash
# Limpar porta 3000
npm run clean-port

# Build (necessário na primeira vez)
npm run build

# Iniciar com PM2
pm2 start ecosystem.config.cjs

# Ver logs
pm2 logs vclass --nostream

# Testar
curl http://localhost:3000/api/health
```

### Desenvolvimento Local (Máquina Local)

```bash
npm run dev
```

Acesse: `http://localhost:5173`

---

## 📡 APIs Disponíveis

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Registrar novo usuário |
| POST | `/api/auth/login` | Login de usuário |
| POST | `/api/auth/refresh` | Renovar access token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Dados do usuário atual |

### Conteúdo

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/content/countries` | Listar países ativos |
| GET | `/api/content/education-systems/:country_id` | Sistemas educacionais |
| GET | `/api/content/grades/:education_system_id` | Séries/anos |
| GET | `/api/content/subjects/:grade_id` | Disciplinas |
| GET | `/api/content/chapters/:grade_subject_id` | Capítulos |
| GET | `/api/content/lessons/:chapter_id` | Lições |
| GET | `/api/content/lesson/:lesson_id` | Detalhes da lição |

### Vídeos (Requer Autenticação)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/video/:lesson_id/token` | Gerar token de streaming |
| POST | `/api/video/:lesson_id/progress` | Atualizar progresso |

### Exercícios (Requer Autenticação)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/exercises/:lesson_id` | Listar exercícios |
| POST | `/api/exercises/submit` | Submeter resposta |
| GET | `/api/exercises/results/:lesson_id` | Resultados |

### Progresso (Estudante)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/progress/dashboard` | Dashboard resumido |
| GET | `/api/progress/lesson/:lesson_id` | Progresso de lição |
| GET | `/api/progress/subject/:grade_subject_id` | Progresso de disciplina |
| GET | `/api/progress/recommendations` | Recomendações |

---

## 🎯 Funcionalidades Implementadas

### ✅ Fase 1 (MVP - Completo)

**Backend & APIs (22 endpoints):**
- [x] Sistema de autenticação (JWT + roles)
- [x] Estrutura multi-país e multi-currículo
- [x] Navegação de conteúdo (países → grades → disciplinas → capítulos → lições)
- [x] Streaming de vídeo protegido com tokens
- [x] Sistema de exercícios (multiple choice, true/false, essay)
- [x] Tracking de progresso por estudante
- [x] APIs REST completas (22 endpoints)
- [x] Database schema (16 tabelas PostgreSQL)

**Frontend Web (9 páginas):**
- [x] Landing page com hero section
- [x] Login e registro de usuários
- [x] Dashboard do estudante com estatísticas
- [x] Navegação de conteúdo (browse, chapters)
- [x] Player de vídeo com tracking automático
- [x] Sistema de exercícios interativo
- [x] **Página de progresso detalhado com gráficos** ⭐ NOVO
- [x] **Página de perfil do usuário completa** ⭐ NOVO
- [x] **App.js melhorado com utilities avançadas** ⭐ NOVO

### 🔄 Fase 2 (Parcialmente Completo)

- [x] **Progresso detalhado com visualizações** ⭐
- [x] **Gerenciamento de perfil e preferências** ⭐
- [x] **Notificações visuais animadas** ⭐
- [ ] Upload de conteúdo por professores
- [ ] Sistema de comentários
- [ ] Busca e filtros avançados

### ⏳ Fase 3 (Futuro)

- [ ] App móvel Flutter
- [ ] Modo offline seguro (app)
- [ ] Live classes (Zoom/Meet integration)
- [ ] Sistema de pagamentos (Stripe, M-Pesa)
- [ ] Analytics para professores
- [ ] Certificados de conclusão
- [ ] Modo escuro completo

---

## 🌍 Dados Iniciais

### Países Disponíveis
- 🇲🇿 Moçambique (ativo)
- 🇧🇷 Brasil (ativo)
- 🇦🇴 Angola (ativo)

### Séries (Moçambique)
- 10ª Classe
- 11ª Classe
- 12ª Classe

### Disciplinas
- Matemática (azul)
- Português (vermelho)
- Física (verde)
- Química (laranja)
- Biologia (roxo)
- História (rosa)
- Geografia (turquesa)
- Inglês (índigo)

---

## 📊 Estrutura do Banco de Dados

Ver documentação completa em: [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md)

**Tabelas principais:**
- `users` - Usuários (student, teacher, admin)
- `countries` → `education_systems` → `grades`
- `subjects` + `grade_subjects`
- `chapters` → `lessons` → `exercises`
- `student_progress` - Progresso dos estudantes
- `exercise_submissions` - Submissões de exercícios
- `video_tokens` - Tokens temporários de vídeo

---

## 🔐 Segurança

- ✅ Autenticação JWT com tokens de curta duração (30 min)
- ✅ Refresh tokens (7 dias)
- ✅ Password hashing com bcrypt
- ✅ Tokens de vídeo temporários (15 min)
- ✅ CORS configurado
- ✅ Rate limiting (planejado)
- ✅ Input validation com Zod
- ✅ Row Level Security no Supabase

---

## 📱 Modo Offline (Mobile App)

O app Flutter implementará:

1. **Download seguro** de lições para cache local
2. **Criptografia AES-256** de conteúdo offline
3. **Sincronização** automática de progresso
4. **Expiração** de cache (30 dias)
5. **Acesso apenas dentro do app** (não exportável)

---

## 🚀 Deploy para Produção

### Cloudflare Pages

```bash
# 1. Build
npm run build

# 2. Deploy
npm run deploy:prod
```

### Configurar Variáveis de Ambiente

No Cloudflare Pages dashboard:

```bash
wrangler pages secret put SUPABASE_URL --project-name vclass
wrangler pages secret put SUPABASE_ANON_KEY --project-name vclass
wrangler pages secret put JWT_SECRET --project-name vclass
wrangler pages secret put BUNNY_CDN_URL --project-name vclass
```

---

## 📈 Escalabilidade

### Limites Iniciais (Free Tier)
- **Cloudflare Workers:** 100k requests/dia
- **Supabase:** 500MB DB, 1GB storage, 2GB transfer
- **Bunny.net:** Pay-as-you-go ($0.005/GB)

### Custos Estimados

**MVP (1k alunos):** $10-20/mês  
**Crescimento (10k alunos):** $75-125/mês  
**Escala (100k alunos):** $500-1000/mês

---

## 🧪 Testes

### Testar APIs Localmente

```bash
# Health check
curl http://localhost:3000/api/health

# Registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "full_name": "Test User",
    "role": "student"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "estudante@vclass.mz",
    "password": "password123"
  }'

# Listar países
curl http://localhost:3000/api/content/countries
```

---

## 📚 Documentação Adicional

- [Arquitetura Completa](ARCHITECTURE.md)
- [Schema do Banco de Dados](DATABASE_SCHEMA.md)
- [Migrações SQL](database/migrations/)
- [Dados de Seed](database/seeds/)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.

---

## 👥 Equipe

Desenvolvido por **VClass Team** 🇲🇿

---

## 📞 Suporte

- Email: support@vclass.mz
- Website: https://vclass.pages.dev
- GitHub Issues: [Create an issue](../../issues)

---

## 🎯 Roadmap

### Q2 2024
- [x] MVP Backend API
- [x] Autenticação e segurança
- [ ] Frontend web completo
- [ ] Upload de conteúdo (teachers)

### Q3 2024
- [ ] App móvel Flutter (MVP)
- [ ] Modo offline
- [ ] Sistema de pagamentos
- [ ] Live classes

### Q4 2024
- [ ] Expansão para mais países
- [ ] Analytics avançado
- [ ] Certificados
- [ ] Gamification

---

**Desenvolvido com ❤️ para transformar a educação em África**
