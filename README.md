# VClass — Plataforma de Educação Digital

> **Versão:** 3.0.0 &nbsp;|&nbsp; **Última atualização:** Abril de 2026 &nbsp;|&nbsp; **Status:** ✅ Em produção (modo demo)

---

## 📌 Visão Geral

**VClass** é uma plataforma de ensino online voltada para o mercado lusófono africano — com foco inicial em **Moçambique** — mas com suporte estrutural para **Brasil** e **Angola**. Seu objetivo é democratizar o acesso a conteúdos educativos de qualidade para estudantes do ensino primário ao pré-universitário (1ª à 12ª Classe), oferecendo:

- 🎥 **Aulas em vídeo** (streaming HLS com token seguro)
- 📝 **Exercícios interativos** com correção automática e feedback
- 📊 **Dashboard de progresso** personalizado por disciplina
- 🏆 **Gamificação** com conquistas, XP e sequências de estudo
- 🤖 **Chat de suporte com IA** para dúvidas pedagógicas
- 📚 **Biblioteca digital** de materiais complementares
- 🔔 **Sistema de notificações** em tempo real

A plataforma foi desenvolvida como uma **Single Page Application (SPA)** com backend em **Cloudflare Workers**, priorizando leveza, velocidade e baixo custo de operação — ideal para conexões de internet com largura de banda limitada.

---

## 🌍 Contexto e Público-Alvo

| Perfil | Descrição |
|---|---|
| **Estudante** | 10ª–12ª Classe (foco principal); acessa aulas, faz exercícios, acompanha progresso |
| **Professor** | Cria e gerencia conteúdo; acompanha turmas (futuro) |
| **Admin** | Gerencia usuários, conteúdo e relatórios |

**Países suportados:**
- 🇲🇿 Moçambique — Sistema Nacional de Ensino (SNE)
- 🇧🇷 Brasil — BNCC (estrutura pronta)
- 🇦🇴 Angola — Sistema Nacional (estrutura pronta)

---

## 🖥️ Páginas da Plataforma

A plataforma possui **17 páginas HTML**, organizadas em três grupos:

### Páginas Públicas (sem autenticação)
| Página | URL | Descrição |
|---|---|---|
| Landing Page | `/home.html` | Apresentação da plataforma, hero, features, depoimentos, estatísticas e CTA |
| Login | `/login.html` | Autenticação com split-layout, demo rápido, toggle de senha, animação shake |
| Cadastro | `/register.html` | Registro com seletor de papel (Estudante/Professor), medidor de força de senha |

### Páginas de Estudo (requerem login)
| Página | URL | Descrição |
|---|---|---|
| Dashboard | `/dashboard.html` | Visão geral: estatísticas animadas, gráfico semanal, streak, XP, metas diárias |
| Explorar | `/browse.html` | Navegação hierárquica: País → Série → Disciplina (cards animados, busca em tempo real) |
| Capítulos | `/chapters.html` | Lista de capítulos de uma disciplina com progresso |
| Lição | `/lesson.html` | Player de vídeo HLS completo + notas + exercícios integrados |
| Progresso | `/progress.html` | Gráficos interativos por período, progresso por disciplina, histórico de exercícios |
| Biblioteca | `/library.html` | Materiais de estudo organizados por disciplina |
| Busca | `/search.html` | Busca global em tempo real por aulas, disciplinas e materiais |

### Páginas de Conta e Suporte
| Página | URL | Descrição |
|---|---|---|
| Perfil | `/profile.html` | Avatar, badges, nível XP, edição de dados, histórico de atividades, configurações |
| Conquistas | `/achievements.html` | Grid de badges desbloqueadas/bloqueadas, barra XP, dica de próxima conquista |
| Notificações | `/notifications.html` | Feed de notificações com filtros e badge de não lidas |
| Chat IA | `/chat.html` | Assistente inteligente com base de conhecimento por disciplina |
| Notícias | `/news.html` | Feed de atualizações e novidades da plataforma |
| Ajuda / FAQ | `/help.html` | FAQ com busca em tempo real, accordion animado e links de suporte |

---

## 🔌 API REST

Base URL: `/api`

### Autenticação — `/api/auth`
| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/register` | Criar conta (estudante ou professor) |
| `POST` | `/login` | Autenticar e receber accessToken + refreshToken |
| `POST` | `/logout` | Invalidar sessão |
| `POST` | `/refresh` | Renovar accessToken expirado |
| `GET` | `/me` | Dados do usuário autenticado |

### Conteúdo — `/api/content`
| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/countries` | Países disponíveis (Moçambique, Brasil, Angola) |
| `GET` | `/education-systems/:countryId` | Sistemas de ensino do país |
| `GET` | `/grades/:educationSystemId` | Séries/classes disponíveis |
| `GET` | `/subjects/:gradeId` | Disciplinas da série |
| `GET` | `/chapters/:gradeSubjectId` | Capítulos de uma disciplina |
| `GET` | `/lessons/:chapterId` | Lista de lições do capítulo |
| `GET` | `/lesson/:lessonId` | Detalhes completos de uma lição |

### Vídeo — `/api/video`
| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/:lessonId/token` | Gerar token temporário para streaming HLS (15 min) |
| `POST` | `/:lessonId/progress` | Registrar progresso de reprodução |

### Exercícios — `/api/exercises`
| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/:lessonId` | Exercícios de múltipla escolha da lição |
| `POST` | `/submit` | Submeter resposta individual |
| `GET` | `/results/:lessonId` | Ver resultados e explicações |

### Progresso — `/api/progress`
| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/dashboard` | Dados completos do dashboard (stats, atividade recente, progresso por disciplina) |
| `GET` | `/lesson/:lessonId` | Progresso de uma lição específica |
| `POST` | `/lesson/:lessonId` | Atualizar progresso de uma lição |
| `GET` | `/recommendations` | Recomendações personalizadas de conteúdo |

---

## 🗂️ Catálogo de Conteúdo (Modo Demo)

No modo demo (sem banco de dados configurado), a plataforma serve dados simulados completos:

### Países e Séries
- **Moçambique:** 10ª, 11ª e 12ª Classe
- **Brasil:** Ensino Médio (1º, 2º Ano)
- **Angola:** 10ª, 11ª Classe

### Disciplinas (10ª Classe — Moçambique)
| Disciplina | Cor | Ícone |
|---|---|---|
| Matemática | Indigo | 🔢 Calculadora |
| Português | Pink | 📖 Livro |
| Física | Teal | ⚛️ Átomo |
| Química | Amber | 🧪 Frasco |

### Conteúdo Disponível
- **61 capítulos** mapeados (Matemática, Física, Química, Português, Biologia, etc.)
- **16 lições** completas com vídeo HLS (Física — Leis de Newton, Óptica, Cinemática, etc.)
- Exercícios de múltipla escolha com explicações detalhadas
- Materiais complementares na Biblioteca

---

## 🏗️ Arquitetura Técnica

```
┌─────────────────────────────────────────────────────────┐
│                  FRONTEND (Browser)                      │
│  HTML + Tailwind CSS (CDN) + Vanilla JS + Chart.js       │
│                                                          │
│  app.js (v2.0) — API client, auth, navbar global,        │
│  formatters, notificações, loading overlay               │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP / REST JSON
┌──────────────────▼──────────────────────────────────────┐
│              EDGE RUNTIME (Cloudflare Workers)           │
│                                                          │
│  Framework: Hono 4.0.0                                   │
│  ├── Middleware: CORS, Logger, Auth JWT                  │
│  ├── /api/auth     → auth.ts                             │
│  ├── /api/content  → content.ts                          │
│  ├── /api/video    → video.ts                            │
│  ├── /api/exercises→ exercises.ts                        │
│  ├── /api/progress → progress.ts                         │
│  └── Static Files  → /static/*, /designs/*              │
└──────────────────┬──────────────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         │                    │
┌────────▼──────┐    ┌────────▼──────────┐
│  Supabase     │    │   Bunny.net CDN   │
│  (PostgreSQL) │    │   (HLS Streaming) │
│  16 tabelas   │    │   Vídeo seguro    │
└───────────────┘    └───────────────────┘
```

### Stack Tecnológico

| Camada | Tecnologia | Versão |
|---|---|---|
| Runtime | Cloudflare Workers | Edge |
| Framework API | Hono | 4.0.0 |
| Build Tool | Vite | 6.4.2 |
| Linguagem | TypeScript | 5.x |
| Banco de Dados | Supabase (PostgreSQL) | — |
| Streaming de Vídeo | Bunny.net HLS | — |
| Autenticação | JWT (access 8h + refresh 30d) | — |
| Validação | Zod | — |
| Frontend CSS | Tailwind CSS | CDN |
| Ícones | FontAwesome | 6.4.0 |
| Gráficos | Chart.js | 4.4.0 |
| HTTP Client | Axios | 1.6.0 (CDN) |
| Process Manager | PM2 | — |

---

## 🔒 Segurança

- **JWT assimétrico:** accessToken válido por **8 horas**, refreshToken válido por **30 dias**
- **Refresh automático:** fila de requisições paralelas sem duplo refresh
- **Token de vídeo:** token separado e temporário (15 min) para cada stream HLS
- **Rotas protegidas:** middleware `authMiddleware` em todas as APIs privadas
- **Validação Zod:** schemas rigorosos em todos os endpoints de escrita
- **CORS configurado:** apenas origens autorizadas acessam a API
- **Modo demo:** dados simulados sem exposição de dados reais em desenvolvimento

---

## 🗄️ Modelo de Dados

### Tabelas Principais (16 tabelas)

```
USUÁRIOS                   CONTEÚDO
├── users                  ├── countries
├── user_roles             ├── education_systems
└── refresh_tokens         ├── grades
                           ├── subjects
PROGRESSO                  ├── grade_subjects
├── lesson_progress        ├── chapters
└── video_progress         └── lessons

AVALIAÇÕES
├── exercises
├── exercise_options
├── exercise_submissions
└── exercise_results
```

---

## 🎮 Sistema de Gamificação

### XP e Níveis
| Nível | XP Necessário | Badge |
|---|---|---|
| Iniciante | 0 – 49 | 🥉 |
| Intermediário | 50 – 149 | 🥉 |
| Avançado | 150 – 299 | 🥈 |
| Expert | 300 – 499 | 💎 |
| Mestre | 500+ | 🏆 |

### Conquistas (12 badges)
| Categoria | Badges |
|---|---|
| Aulas | Primeiro Passo, Estudante Dedicado, Mestre do Conhecimento |
| Exercícios | Solucionador, Pontuação Perfeita, Expert Matemático |
| Sequência | Consistente (3 dias), Dedicação Total (7 dias), Maratonista (30 dias) |
| Especiais | Explorador, Madrugador, Coruja Noturna |

### Streak
- Contador de dias consecutivos de estudo
- Animação de chama (🔥) no Dashboard
- Conquistas progressivas por sequência

---

## 🎨 Design System

### Paleta de Cores
| Papel | Cor | Hex |
|---|---|---|
| Primary | Roxo | `#7c3aed` – `#6d28d9` |
| Secondary | Índigo | `#4f46e5` – `#4338ca` |
| Success | Verde | `#22c55e` |
| Warning | Âmbar | `#f59e0b` |
| Danger | Vermelho | `#ef4444` |
| Info | Azul | `#3b82f6` |

### Código por Nível Escolar
- 🔵 **Ensino Primário** (1ª–4ª): Azul
- 🟢 **Ensino Básico** (5ª–7ª): Verde
- 🟠 **Ensino Médio** (8ª–10ª): Laranja
- 🟣 **Pré-Universitário** (11ª–12ª): Roxo

### Componentes Globais
- `VClass.initNavbar(activePage)` — navbar injetada dinamicamente em todas as páginas
- `VClass.showNotification(msg, type)` — notificações empilhadas com auto-dismiss
- `VClass.showLoading(msg)` / `VClass.hideLoading()` — overlay com spinner
- `VClass.formatDuration()`, `formatDate()`, `formatRelativeTime()` — formatadores PT-BR

---

## 📐 Estrutura de Diretórios

```
vclass/
├── src/
│   ├── index.tsx               # Entrada principal Hono + rotas
│   ├── config/
│   │   └── supabase.ts         # Configuração do banco de dados
│   ├── middleware/
│   │   ├── auth.ts             # Middleware JWT + extração de usuário
│   │   ├── cors.ts             # Configuração CORS
│   │   └── database.ts         # Dados mock completos (modo demo)
│   ├── routes/
│   │   ├── auth.ts             # Login, registro, refresh, logout
│   │   ├── content.ts          # Países, séries, disciplinas, lições
│   │   ├── video.ts            # Token HLS e progresso de vídeo
│   │   ├── exercises.ts        # Exercícios e submissões
│   │   ├── progress.ts         # Dashboard e progresso
│   │   └── pages.ts            # Roteamento das páginas HTML
│   ├── utils/
│   │   └── jwt.ts              # Geração e verificação de tokens
│   ├── types/                  # Interfaces TypeScript
│   └── pages/                  # 17 páginas HTML fonte
│       ├── home.html           # Landing page pública
│       ├── login.html          # Autenticação
│       ├── register.html       # Cadastro
│       ├── dashboard.html      # Painel do estudante
│       ├── browse.html         # Explorar conteúdo
│       ├── chapters.html       # Capítulos da disciplina
│       ├── lesson.html         # Player + exercícios
│       ├── progress.html       # Progresso detalhado
│       ├── profile.html        # Perfil e configurações
│       ├── library.html        # Biblioteca digital
│       ├── achievements.html   # Conquistas e badges
│       ├── notifications.html  # Notificações
│       ├── chat.html           # Chat com IA
│       ├── news.html           # Notícias
│       ├── help.html           # FAQ e suporte
│       └── search.html         # Busca global
├── public/
│   └── static/
│       ├── app.js              # API client + utilitários (418 linhas)
│       └── styles.css          # Estilos customizados
├── dist/                       # Build de produção (gerado)
│   ├── _worker.js              # Worker compilado (~876 KB)
│   └── _routes.json            # Mapeamento de rotas
├── migrations/                 # SQL migrations (Supabase)
├── wrangler.jsonc              # Configuração Cloudflare Pages
├── vite.config.ts              # Configuração do build
├── tsconfig.json               # TypeScript config
├── package.json                # Dependências e scripts
└── ecosystem.config.cjs        # Configuração PM2
```

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm 9+
- (Opcional) Conta Supabase para banco de dados real

### Instalação

```bash
git clone <repo-url>
cd vclass
npm install
npm run build
```

### Desenvolvimento Local (com PM2)

```bash
# Iniciar servidor
pm2 start ecosystem.config.cjs

# Verificar status
pm2 list

# Ver logs (sem bloquear o terminal)
pm2 logs vclass --nostream

# Reiniciar após mudanças
npm run build && pm2 restart vclass
```

### Credenciais de Teste (Modo Demo)

| Papel | Email | Senha |
|---|---|---|
| Estudante | `estudante@vclass.mz` | `password123` |
| Professor | `professor@vclass.mz` | `password123` |
| Admin | `admin@vclass.mz` | `password123` |

### URLs Principais

```
/              → Landing Page
/login.html    → Login
/dashboard.html→ Dashboard (requer login)
/browse.html   → Explorar Conteúdo
/api/health    → Health Check da API
```

---

## 📦 Scripts Disponíveis

```bash
npm run build              # Build de produção (Vite)
npm run dev                # Servidor de desenvolvimento Vite
npm run deploy             # Build + deploy para Cloudflare Pages
npm run db:migrate:local   # Aplicar migrations localmente (D1)
npm run db:migrate:prod    # Aplicar migrations em produção
npm run db:seed            # Inserir dados de teste
npm run db:reset           # Resetar banco local
npm run clean-port         # Liberar porta 3000
npm run test               # Health check via curl
```

---

## 💰 Estimativa de Custos (Produção)

| Plano | Usuários | Cloudflare | Supabase | Bunny CDN | **Total/mês** |
|---|---|---|---|---|---|
| MVP | 1.000 | $0–5 | $0 (free) | $10–15 | **~$15–20** |
| Crescimento | 10.000 | $5–10 | $25 | $50–95 | **~$80–130** |
| Escala | 100.000 | $50 | $599 | $500 | **~$1.150** |

---

## 🛣️ Roadmap

### ✅ Concluído
- [x] Sistema de autenticação JWT (login, registro, refresh)
- [x] Navegação de conteúdo: País → Série → Disciplina → Capítulo → Lição
- [x] Player de vídeo HLS com progresso e notas
- [x] Sistema de exercícios com feedback imediato
- [x] Dashboard animado com gráficos semanais
- [x] Perfil completo com histórico e configurações
- [x] Sistema de conquistas e badges
- [x] Chat de suporte com IA (base de conhecimento local)
- [x] Biblioteca digital
- [x] Sistema de notificações
- [x] FAQ interativo com busca
- [x] Navbar global reutilizável em todas as páginas
- [x] Página 404 personalizada
- [x] Modo demo completo sem banco de dados

### ⏳ Próximos Passos
- [ ] Backend de notificações (banco de dados real)
- [ ] Modo escuro
- [ ] Upload de avatar do usuário
- [ ] Certificados digitais ao concluir disciplinas
- [ ] Chat com IA real (OpenAI / Gemini)
- [ ] Busca global com indexação de conteúdo
- [ ] Aulas ao vivo (WebRTC / agendamento)
- [ ] Fórum de discussão por disciplina
- [ ] Sistema de pagamentos (cursos premium)
- [ ] PWA com suporte offline
- [ ] App mobile (Flutter)
- [ ] Integração M-Pesa para pagamentos locais

---

## 📞 Contactos

| | |
|---|---|
| 🌐 Plataforma | https://vclass.co.mz |
| 📧 Suporte | suporte@vclass.co.mz |
| 📞 Telefone | +258 84 553 3100 |
| 🏢 Empresa | TecMarc — Nampula, Moçambique |
| 📧 Empresa | info@tecmarc.co.mz |

---

## 📄 Licença

Propriedade de **VClass / TecMarc** © 2024–2026. Todos os direitos reservados.

---

*Última atualização: Abril 2026 — VClass v3.0.0*
