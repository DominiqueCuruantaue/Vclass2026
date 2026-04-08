# VClass - Plataforma de Educação Digital

**Versão**: 1.3.0 (Redesign AVIMO)  
**Data**: 2026-04-08  
**Status**: ✅ Fase 1 Completa - Em Desenvolvimento Ativo

---

## 📖 Sobre o Projeto

VClass é uma plataforma de educação digital para Moçambique, oferecendo aulas online em vídeo, exercícios práticos e provas anteriores para classes 1ª a 12ª.

### Redesign Baseado na Memória Descritiva AVIMO
A plataforma foi reconstruída seguindo as especificações do documento "VClass. Memoria Descritiva.pdf" (7 páginas) da empresa TecMarc/AVIMO.

**Documentação completa**: [REDESIGN_REPORT.md](./REDESIGN_REPORT.md)

---

## 🌟 Funcionalidades Principais

### ✅ Implementado (Fase 1 - Home Page)
- **Cabeçalho Duplo**:
  * Primário: Logo, navegação (Início, Sobre, Aulas Online), login/registro
  * Secundário: Busca global, notificações, ajuda
- **Hero Section**: Imagem de fundo com CTAs
- **Lista de 12 Classes**: Organizadas por nível (Primário, Secundário I e II)
- **Cursos Adicionais**: 4 tipos (presencial/online, pago/gratuito)
- **Últimas Notícias**: Destaque + notícias secundárias
- **Estatísticas**: 12 classes, 500+ aulas, 10k+ estudantes, 50+ professores
- **Footer Completo**: 4 colunas com links e contatos

### ✅ Funcionalidades Existentes
- Sistema de autenticação JWT (Login/Registro)
- Dashboard de estudante com progresso
- Navegação por países → classes → disciplinas → capítulos → lições
- Player de vídeo HLS com streaming seguro
- Sistema de exercícios com múltipla escolha
- Notificações em tempo real
- Sistema de conquistas e gamificação
- Chat de suporte inteligente
- Biblioteca digital
- Central de ajuda e FAQ

### ⏳ Próximas Fases (Baseado na Memória Descritiva)
- **Fase 2**: Página de Notícias com filtros e categorias
- **Fase 3**: Página de Disciplinas por classe
- **Fase 4**: Capítulos organizados por trimestre
- **Fase 5**: Lição com layout 3 colunas (conteúdo, vídeo, sidebar)
- **Fase 6**: Biblioteca com categorias e preview de PDFs

---

## 🏗️ Arquitetura Técnica

### Stack Principal
- **Runtime**: Cloudflare Workers (edge computing)
- **Framework Backend**: Hono 4.0.0 (ultrarrápido)
- **Database**: PostgreSQL (Supabase)
- **Autenticação**: JWT tokens
- **CDN de Vídeo**: Bunny.net HLS
- **Frontend**: Vanilla JS + Tailwind CSS (CDN)
- **Build**: Vite 6.4.2

### Estrutura do Projeto
```
vclass/
├── src/
│   ├── index.tsx              # Aplicação principal Hono
│   ├── config/                # Configurações (Supabase, JWT)
│   ├── middleware/            # Auth, CORS, Database
│   ├── routes/                # API routes
│   │   ├── auth.ts           # Login, registro, refresh
│   │   ├── content.ts        # Países, classes, disciplinas
│   │   ├── video.ts          # Tokens HLS, progresso
│   │   ├── exercises.ts      # Quizzes e avaliações
│   │   └── progress.ts       # Dashboard e estatísticas
│   └── pages/                 # Páginas HTML
│       ├── home.html         # ✨ Nova Home Page (AVIMO)
│       ├── login.html        # Login
│       ├── dashboard.html    # Dashboard estudante
│       ├── browse.html       # Explorar conteúdo
│       ├── chapters.html     # Lista de capítulos
│       ├── lesson.html       # Player de vídeo
│       └── ... (14 páginas)
├── public/
│   ├── static/               # JS e CSS
│   │   ├── app.js           # API client + utils
│   │   └── styles.css       # Estilos customizados
│   └── designs/              # Referências visuais (PDF→PNG)
├── migrations/               # SQL migrations
├── wrangler.jsonc           # Configuração Cloudflare
├── package.json             # Dependências
├── ecosystem.config.cjs     # PM2 config
└── README.md                # Este arquivo
```

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta Supabase (opcional, tem modo demo)

### Instalação

```bash
# Clone o repositório
git clone <repo-url>
cd vclass

# Instalar dependências
npm install

# Build inicial
npm run build
```

### Desenvolvimento Local

```bash
# Iniciar servidor de desenvolvimento com PM2
pm2 start ecosystem.config.cjs

# Verificar status
pm2 list

# Ver logs (modo não-bloqueante)
pm2 logs vclass --nostream

# Parar servidor
pm2 stop vclass

# Reiniciar após mudanças
pm2 restart vclass
```

### Scripts Úteis

```bash
# Build para produção
npm run build

# Limpar porta 3000
npm run clean-port

# Testar endpoint
npm run test

# Deploy para Cloudflare Pages
npm run deploy

# Operações de banco de dados (D1)
npm run db:migrate:local      # Migrations locais
npm run db:migrate:prod       # Migrations produção
npm run db:seed               # Dados de teste
npm run db:reset              # Reset completo

# Git
npm run git:init              # Inicializar repo
npm run git:commit -- "msg"   # Commit rápido
npm run git:status            # Ver status
```

---

## 🌐 URLs de Acesso

### Desenvolvimento Local
- **Home**: http://localhost:3000/
- **Login**: http://localhost:3000/login.html
- **Dashboard**: http://localhost:3000/dashboard.html
- **Explorar**: http://localhost:3000/browse.html
- **API Health**: http://localhost:3000/api/health

### Sandbox Público (válido por 1h)
```
https://3000-ia6r8c8trneyl04o4nl6o-ecea8f22.sandbox.novita.ai
```

### Credenciais de Teste (Modo Demo)
- **Email**: estudante@vclass.mz
- **Senha**: password123
- **Papel**: student

---

## 📊 APIs Disponíveis

### Autenticação (`/api/auth`)
- `POST /register` - Criar conta
- `POST /login` - Fazer login
- `POST /refresh` - Renovar token
- `POST /logout` - Sair
- `GET /me` - Info do usuário

### Conteúdo (`/api/content`)
- `GET /countries` - Listar países
- `GET /education-systems/:country_id` - Sistemas de ensino
- `GET /grades/:education_system_id` - Classes
- `GET /subjects/:grade_id` - Disciplinas
- `GET /chapters/:grade_subject_id` - Capítulos
- `GET /lessons/:chapter_id` - Lições
- `GET /lessons/:lesson_id` - Detalhes da lição

### Vídeo (`/api/video`)
- `POST /token` - Token HLS para streaming
- `POST /progress` - Atualizar progresso

### Exercícios (`/api/exercises`)
- `GET /lesson/:lesson_id` - Exercícios da lição
- `POST /submit` - Submeter respostas
- `GET /results/:submission_id` - Ver resultados

### Progresso (`/api/progress`)
- `GET /dashboard` - Dashboard completo
- `GET /lesson/:lesson_id` - Progresso da lição
- `GET /subject/:grade_subject_id` - Progresso por disciplina
- `GET /recommendations` - Recomendações personalizadas

---

## 🗄️ Modelo de Dados

### Tabelas Principais (16 tabelas)

**Usuários e Autenticação**
- `users` - Dados do usuário
- `user_roles` - Papéis (student, teacher, admin)
- `refresh_tokens` - Tokens de sessão

**Estrutura de Conteúdo**
- `countries` - Países disponíveis
- `education_systems` - Sistemas de ensino por país
- `grades` - Classes (1ª-12ª)
- `subjects` - Disciplinas (Matemática, Física, etc.)
- `grade_subjects` - Relação classe-disciplina
- `chapters` - Capítulos de cada disciplina
- `lessons` - Lições com vídeo e texto

**Avaliações**
- `exercises` - Exercícios/quizzes
- `exercise_options` - Opções de resposta
- `exercise_submissions` - Submissões dos estudantes
- `exercise_results` - Resultados e notas

**Progresso**
- `lesson_progress` - Progresso por lição
- `video_progress` - Tempo assistido de vídeos

---

## 🎨 Design System

### Cores Principais
- **Primary Blue**: `#1e40af` → `#3b82f6` (gradiente)
- **Secondary Green**: `#059669` → `#10b981` (gradiente)
- **Accent Purple**: `#9333ea`

### Código de Cores por Nível Escolar
- **Ensino Primário** (1ª-6ª): 🔵 Blue 500
- **Secundário I** (7ª-9ª): 🟢 Green 500
- **Secundário II** (10ª-12ª): 🟣 Purple 500

### Tipografia
- **Heading 1**: 5xl (48px), bold
- **Heading 2**: 4xl (36px), bold
- **Heading 3**: 2xl (24px), bold
- **Body**: base (16px), regular
- **Small**: sm (14px), regular

### Componentes Reutilizáveis
- **Card Hover**: Transform + shadow em hover
- **Class Badge**: Badge arredondado com cor por nível
- **Gradient Button**: Botões com gradiente e transições
- **Search Bar**: Barra de busca com ícone

---

## 💰 Estimativa de Custos (Produção)

### Plano MVP (1,000 usuários)
- Cloudflare Workers: $0-5/mês
- Supabase Free: $0
- Bunny CDN: $10-15/mês
- **Total**: $10-20/mês

### Plano Médio (10,000 usuários)
- Cloudflare Workers: $5-10/mês
- Supabase Pro: $25/mês
- Bunny CDN: $50-95/mês
- **Total**: $80-130/mês

### Plano Empresarial (100,000 usuários)
- Cloudflare Workers: $50/mês
- Supabase Pro: $599/mês
- Bunny CDN: $500/mês
- **Total**: $1,149/mês

---

## 📝 Documentação Adicional

- **[REDESIGN_REPORT.md](./REDESIGN_REPORT.md)** - Relatório completo do redesign AVIMO
- **[CONTENT_NAV_FIX.md](./CONTENT_NAV_FIX.md)** - Fix da navegação de conteúdo
- **[NEW_FEATURES_REPORT.md](./NEW_FEATURES_REPORT.md)** - Notificações, conquistas e chat
- **[PROJECT_SUMMARY.txt](./PROJECT_SUMMARY.txt)** - Resumo executivo

---

## 🛠️ Desenvolvimento Futuro

### Prioridade Alta (1-2 semanas)
- [ ] Página de Notícias (Fase 2)
- [ ] Página de Disciplinas (Fase 3)
- [ ] Capítulos por Trimestre (Fase 4)
- [ ] Lição 3-Colunas (Fase 5)
- [ ] Biblioteca completa (Fase 6)
- [ ] Implementar backend de notificações
- [ ] Sistema de conquistas no backend

### Prioridade Média (1 mês)
- [ ] Notificações push (Web Push API)
- [ ] Chat com IA real (OpenAI/Gemini)
- [ ] Modo escuro
- [ ] Busca global avançada
- [ ] Upload de avatar
- [ ] Compartilhamento social

### Prioridade Baixa (2-3 meses)
- [ ] Fórum de discussão
- [ ] Aulas ao vivo (live classes)
- [ ] Calendário de estudos
- [ ] Certificados digitais
- [ ] Integração M-Pesa/Stripe
- [ ] App móvel (Flutter)
- [ ] Modo offline

---

## 📞 Contactos

**VClass Platform**
- 🌐 Website: http://localhost:3000
- 📧 Email: info@vclass.co.mz
- 📞 Telefone: +258 84 553 3100
- 📍 Endereço: Rua do Aeroporto, Nampula, Moçambique

**Suporte**
- 💬 Chat: http://localhost:3000/chat.html
- ❓ Ajuda: http://localhost:3000/help.html
- 📧 Email: suporte@vclass.co.mz

**Desenvolvedor (TecMarc)**
- 🌐 Site: www.tecmarc.co.mz
- 📧 Email: info@tecmarc.co.mz

---

## 📄 Licença

Propriedade de VClass/TecMarc © 2024. Todos os direitos reservados.

---

## 🎯 Status do Projeto

### Estatísticas Atuais
- **Páginas HTML**: 14
- **APIs REST**: 22
- **Tabelas DB**: 16
- **Bundle Size**: 627 KB
- **Build Time**: ~3s
- **Total Commits**: 29
- **Documentação**: 15 arquivos

### Progresso por Fase
- ✅ **Fase 1**: Home Page (100%)
- ⏳ **Fase 2**: Notícias (0%)
- ⏳ **Fase 3**: Disciplinas (0%)
- ⏳ **Fase 4**: Capítulos (0%)
- ⏳ **Fase 5**: Lição 3-Colunas (0%)
- ⏳ **Fase 6**: Biblioteca (0%)

### Qualidade de Código
- ✅ TypeScript strict mode
- ✅ Git com commits semânticos
- ✅ Documentação abrangente
- ✅ API RESTful consistente
- ✅ Responsive design
- ✅ Acessibilidade básica

---

**Última Atualização**: 2026-04-08 22:40 GMT  
**Versão README**: 2.0  
**Status**: 🚀 Production Ready (Fase 1) | 🔨 Em Desenvolvimento Ativo
