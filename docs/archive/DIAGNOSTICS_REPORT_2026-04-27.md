# 📋 Relatório de Diagnóstico — VClass (WebVClass)

> **Data:** 2026-04-27
> **Analisado por:** Claude App Diagnostics
> **Versão da aplicação:** 1.7.2 (declarada em [src/index.tsx:89](src/index.tsx#L89))
> **Stack:** TypeScript · Hono 4.12.12 · Vite 6 · Cloudflare Pages/Workers · Supabase · bcryptjs · jsonwebtoken · Zod

---

## 📊 Resumo Executivo

| Categoria | Status | Críticos | Avisos |
|-----------|--------|----------|--------|
| 🔐 Segurança | 🔴 | 3 | 6 |
| ⚡ Desempenho | 🟡 | 0 | 3 |
| 🧪 Qualidade de Código | 🟡 | 0 | 4 |
| ✅ Testes | 🔴 | 1 | — |
| 📦 Dependências | 🟡 | 0 | 2 |
| 🏗️ Arquitetura | 🟢 | 0 | 2 |

**Score Geral:** 58/100 — **PRECISA DE ATENÇÃO** (bloqueadores de segurança antes de produção)

---

## 🗺️ Mapa da Aplicação

- **Arquivos TS/TSX:** ~60 (8 970 linhas)
- **Páginas HTML:** 35 em [src/pages/](src/pages/)
- **Rotas API:** 22 grupos (auth, content, video, creator, admin, finance, moderator, etc.)
- **Migrations SQL:** 4 + 1 seed em [database/](database/)
- **Documentação Markdown:** 25+ ficheiros na raiz (excessivo — ver §Qualidade)

---

## 🔐 Segurança

### 🔴 CRÍTICO

#### 1. JWT_SECRET com fallback hardcoded inseguro
📍 [src/utils/jwt.ts:4](src/utils/jwt.ts#L4)
```ts
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
```
💬 Se `JWT_SECRET` não estiver definido no ambiente, o servidor **arranca** com um segredo conhecido publicamente. Em Cloudflare Workers, `process.env` é acedido em tempo de import — se a variável existir só em `c.env`, este fallback é o que será usado.
🛠️ **Solução:** remover o fallback e ler o segredo a partir de `c.env` em cada handler:
```ts
export function generateAccessToken(payload: JWTPayload, secret: string): string {
  if (!secret) throw new Error('JWT_SECRET not configured')
  return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRES_IN })
}
```
Passar `c.env.JWT_SECRET` em cada chamada nas rotas.

#### 2. SUPABASE_SERVICE_ROLE_KEY em `.env` local
📍 [.env](.env) · [src/config/supabase.ts:12](src/config/supabase.ts#L12)
💬 O ficheiro `.env` está corretamente no `.gitignore`, mas contém a `service_role` key — chave que **bypassa todas as RLS policies**. Qualquer leak (backup, screenshot, sync, push acidental para repo público) compromete toda a base de dados. Confirmar também que `.dev.vars` (mesmo conteúdo) nunca foi versionado.
🛠️ **Solução:**
- Verificar histórico: `git log --all --full-history -- .env .dev.vars`
- Se aparecer no histórico → **rodar a service_role key imediatamente** no painel Supabase
- Em produção, usar **apenas** Cloudflare Wrangler secrets (`wrangler secret put SUPABASE_SERVICE_ROLE_KEY`), nunca ficheiro
- Considerar restringir a service_role a operações específicas (preferir anon + RLS quando possível)

#### 3. Sem suite de testes automatizados
📍 [package.json:13](package.json#L13)
```json
"test": "curl http://localhost:3000"
```
💬 O script `test` apenas faz um curl. Não existe Jest/Vitest/Playwright. Para uma plataforma educacional com pagamentos, multi-tenant (países), e 7 níveis de role (`student/teacher/admin/support/editor/country_manager/finance/moderator`), a ausência de testes é um risco crítico — qualquer mudança nas RLS ou no `requireRole` pode silenciosamente abrir privilégios.
🛠️ **Solução:** instalar Vitest, criar mínimo:
- `auth.test.ts` — login/registo/refresh/role-checks
- `rls.test.ts` — confirmar que cada role só vê o que deve
- CI no GitHub Actions a rodar em cada PR

### 🟠 ALTO

#### 4. Validação de senha inconsistente entre endpoints
📍 [src/routes/auth.ts:28,33,506](src/routes/auth.ts)
- `loginSchema`: mínimo **6** caracteres
- `registerSchema`: mínimo **8** caracteres + força (`validatePassword`)
- `change-password`: mínimo **6** caracteres, sem validação de força
💬 Permitir alterar senha para algo mais fraco do que se exige no registo é uma backdoor. O endpoint de login com 6 não é problema (apenas valida formato), mas o `change-password` é.
🛠️ **Solução:** chamar `validatePassword(new_password)` em [auth.ts:506](src/routes/auth.ts#L506).

#### 5. Rate limiting em memória — ineficaz em Cloudflare Workers
📍 [src/middleware/auth.ts:160](src/middleware/auth.ts#L160)
```ts
const _rateLimitStore: Map<string, { count: number; resetAt: number }> = new Map()
```
💬 Cada isolate Worker tem o seu próprio Map. Brute-force distribuído entre isolates passa despercebido. Em produção real isto **não rate-limita**.
🛠️ **Solução:** usar **Cloudflare KV** ou **Durable Objects** para estado partilhado. Alternativa rápida: KV namespace `RATE_LIMIT` com TTL. Documentado em [wrangler.jsonc](wrangler.jsonc) (já tem placeholder comentado).

#### 6. Refresh token usa o mesmo segredo e estrutura do access token
📍 [src/utils/jwt.ts:29](src/utils/jwt.ts#L29)
💬 `verifyToken()` aceita qualquer JWT válido — incluindo um access token sendo passado como refresh. Não há `type: 'refresh'` claim nem revogação (logout não invalida o token).
🛠️ **Solução:** adicionar claim `type: 'refresh'` e validar; persistir hash dos refresh tokens emitidos numa tabela `refresh_tokens` com `revoked_at`.

#### 7. CORS — falta domínio de produção e wildcard subdomains
📍 [src/middleware/cors.ts:5](src/middleware/cors.ts#L5)
```ts
origin: ['http://localhost:3000', 'http://localhost:5173', 'https://vclass.pages.dev']
```
💬 Quando for usado domínio próprio (`vclass.com`/`.mz`/etc.), as chamadas serão bloqueadas. `credentials: true` + lista estática é correto, mas precisa cobrir todos os ambientes.
🛠️ **Solução:** ler origins de `c.env.ALLOWED_ORIGINS` e validar dinamicamente.

#### 8. 213 usos de `innerHTML` em páginas HTML
📍 [src/pages/](src/pages/) — 30 ficheiros
💬 Não significa XSS automaticamente, mas qualquer `el.innerHTML = userInput` ou `${apiData.title}` interpolado é vetor. Auditar os 213 casos é trabalhoso — começar pelos top: `admin-dashboard.html` (15), `creator-lesson-editor.html` (20), `lesson.html` (13), `profile.html` (12), `teacher-verification.html` (13).
🛠️ **Solução:** `grep -n "innerHTML" src/pages/admin-dashboard.html` e converter para `textContent` onde for texto puro, ou usar DOMPurify quando precisar de HTML.

#### 9. Headers de segurança ausentes
📍 [src/index.tsx](src/index.tsx)
💬 Nenhum CSP, X-Frame-Options, Strict-Transport-Security, Referrer-Policy. A página 404 e `/favicon.ico` carregam Tailwind CDN inline — sem CSP é trivial injectar scripts via XSS.
🛠️ **Solução:** adicionar middleware global:
```ts
app.use('*', async (c, next) => {
  await next()
  c.header('X-Frame-Options', 'DENY')
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  c.header('Content-Security-Policy', "default-src 'self'; script-src 'self' https://cdn.tailwindcss.com https://cdn.jsdelivr.net; ...")
})
```

### 🟡 MÉDIO

- **bcrypt rounds = 10** ([password.ts:4](src/utils/password.ts#L4)) — aceitável, mas em 2026 recomenda-se **12**.
- **Demo mode com senha universal `vclass2024`** ([database.ts:38](src/middleware/database.ts#L38)) — ok desde que `isDatabaseConfigured(env)` retorne `true` em produção (depende de variáveis estarem setadas; falha silenciosa abre login com senha conhecida). Adicionar `if (env?.NODE_ENV === 'production' && !isDatabaseConfigured(env)) throw`.
- **`change-password` não exige re-autenticação recente** — útil contra session hijacking.
- **`as any` em [jwt.ts:81](src/utils/jwt.ts#L81)** — perde type safety na validação do video token.

### Checklist de Segurança

| Item | Status |
|------|--------|
| Senhas com bcrypt | ✅ (rounds=10, recomendado 12) |
| Sem segredos hardcoded em código | ⚠️ JWT fallback inseguro |
| CORS configurado | ⚠️ falta domínio prod |
| Rate limiting em auth | ⚠️ in-memory (não funciona em Workers) |
| Headers de segurança | ❌ ausentes |
| Dependências sem CVEs | ⚠️ 2 moderate |
| .env fora do repositório | ✅ (verificar histórico) |
| SQL parametrizado | ✅ (Supabase client) |
| JWT seguro | ⚠️ refresh sem `type` claim, sem revogação |
| Validação de senha consistente | ❌ inconsistente |

---

## ⚡ Desempenho

### 🟡 Avisos

- **Cache HTTP ausente** — apenas `/favicon.ico` define `Cache-Control`. Páginas e assets de [public/](public/) servidos via `serveStatic` herdam defaults.
- **Sem KV cache** para conteúdos públicos (catálogo de cursos, capítulos). Cada request bate na Supabase.
- **Connection pooling** — Supabase JS cria cliente por request quando `env` é passado ([supabase.ts:20](src/config/supabase.ts#L20)). Em Workers isso é correto (sem pooling no edge), mas verificar se a Supabase tem **Supavisor** habilitado.

---

## 🧪 Qualidade de Código

| Métrica | Valor | Ideal | Status |
|---------|-------|-------|--------|
| Cobertura de testes | 0% | ≥ 80% | ❌ |
| Linhas TS/TSX | 8 970 | — | ℹ️ |
| TODO/FIXME | 1 | 0 | 🟢 |
| Ficheiros .md na raiz | 25+ | < 5 | 🟡 |

### Pontos a melhorar

1. **Documentação descontrolada** — 25+ relatórios `.md` na raiz (FINAL_REPORT, FINAL_STATUS, FINAL_SUMMARY, PROJECT_COMPLETE, REDESIGN_REPORT, NEW_FEATURES_REPORT, etc.). Mover para [docs/](docs/) e manter só README + ARCHITECTURE.
2. **`as any` em vários pontos** ([auth.ts:444](src/routes/auth.ts#L444), [jwt.ts:81](src/utils/jwt.ts#L81), [supabase.ts:5](src/config/supabase.ts#L5)) — perda de type safety.
3. **Tipagem `Database`** ([supabase.ts:38](src/config/supabase.ts#L38)) toda como `any` — não há autocomplete nem segurança nas queries Supabase.
4. **Lógica duplicada de extração de token** — `auth.ts` linhas 354, 439, 495 reimplementam o que `extractToken()` já faz e o middleware `authMiddleware` já resolve. Aplicar middleware nas rotas `/me`, `/profile`, `/change-password`.

---

## ✅ Funcionalidades

| Módulo | Status |
|--------|--------|
| Auth (login/register/refresh/me/profile/change-password) | ✅ Ativa, sem testes |
| Conteúdo, vídeo, exercícios, progresso | ✅ Ativa, sem testes |
| Multi-role (student/teacher/admin/support/editor/country_manager/finance/moderator) | ✅ Definido em middleware |
| Demo mode (sem DB) | ✅ Funcional |
| Pagamentos / Bunny CDN | 🔶 `BUNNY_CDN_URL=` vazio em [.env](.env) |
| Testes | ❌ Inexistentes |

---

## 📦 Dependências

`npm audit`: 2 moderate, 0 high, 0 critical (208 deps totais).

| Pacote | Atual | Seguro | Severidade | CVE |
|--------|-------|--------|------------|-----|
| hono | 4.12.12 | ≥ 4.12.14 | 🟡 Moderate | [GHSA-458j-xx4x-4375](https://github.com/advisories/GHSA-458j-xx4x-4375) (XSS via JSX SSR) |
| postcss | <8.5.10 | ≥ 8.5.10 | 🟡 Moderate | [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) |

🛠️ **Fix:** `npm audit fix` (ambos têm fix disponível).

---

## 🏗️ Arquitetura

### Pontos Fortes
- ✅ Separação clara: `routes/` · `middleware/` · `utils/` · `config/`
- ✅ Hono com Zod para validação tipada
- ✅ Migrations versionadas em [database/migrations/](database/migrations/) incluindo correções de RLS (`002_fix_security_definer_views.sql`, `004_explicit_rls_deny_policies.sql`)
- ✅ Demo mode permite desenvolvimento offline
- ✅ Multi-role bem desenhado em [middleware/auth.ts](src/middleware/auth.ts)

### Pontos de Melhoria
- 🔶 Páginas servidas como HTML estático em [src/pages/](src/pages/) — sem build pipeline para minify/hash. Considerar bundle único.
- 🔶 Falta camada de **service** — controllers (routes) acedem Supabase diretamente; testar e reusar lógica fica difícil.

---

## 🚨 Action Items Prioritários

### 🔴 48h (bloqueadores)

1. **Remover fallback JWT_SECRET** — [src/utils/jwt.ts:4](src/utils/jwt.ts#L4) · ⏱️ 1h
2. **Auditar git history para `.env`/`.dev.vars`; rodar service_role se exposta** · ⏱️ 30min + impact
3. **Adicionar middleware de security headers** em [src/index.tsx](src/index.tsx) · ⏱️ 1h
4. **`npm audit fix`** (hono, postcss) · ⏱️ 15min + smoke test

### 🟠 2 semanas

5. **Corrigir `change-password`** para usar `validatePassword` · ⏱️ 30min
6. **Migrar rate limiter para KV/Durable Object** · ⏱️ 4h
7. **Adicionar `type: 'refresh'` ao refresh token + tabela de revogação** · ⏱️ 6h
8. **Auditar 213 `innerHTML`** começando pelos dashboards (admin/creator-lesson-editor) · ⏱️ 1–2 dias

### 🟡 Backlog técnico

9. Setup Vitest + testes mínimos auth/RLS (1 sprint)
10. Limpeza de docs `.md` para [docs/](docs/) · ⏱️ 1h
11. Tipagem real do `Database` Supabase (gerar com `supabase gen types`) · ⏱️ 2h
12. Centralizar extração de token via `authMiddleware` · ⏱️ 3h
13. Bcrypt rounds 10 → 12 (com migração progressiva no login) · ⏱️ 4h

---

## 📎 Apêndice

### Comandos executados
- `ls`, `find src -type f`, `wc -l`
- `cat .env .gitignore wrangler.jsonc package.json`
- `npm audit --json`
- Greps: `innerHTML|eval|dangerouslySetInnerHTML`, `TODO|FIXME|HACK`

### Não analisado
- **Conteúdo das 35 páginas HTML** (auditoria XSS detalhada exige inspeção caso a caso)
- **Migrations SQL** (apenas listadas — não auditadas para RLS coverage completa)
- **Runtime testing** (servidor não foi iniciado)
- **Bundle size de produção** (sem `dist/` recente analisada)

### Referências
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [Hono Security Advisory GHSA-458j-xx4x-4375](https://github.com/advisories/GHSA-458j-xx4x-4375)
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
