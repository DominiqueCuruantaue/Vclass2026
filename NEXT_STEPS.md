# 🚀 VClass — Próximos Passos

**Versão atual:** v1.7.3
**Última atualização:** 2026-04-23
**Stack:** Hono + Cloudflare Pages/Workers · Supabase Postgres · Bunny CDN (HLS)

---

## ✅ Estado atual

### Backend (21 rotas)
auth, content, video, exercises, progress, curriculum, country, creator, editor, finance, moderator, admin, support, chat, news, notifications, plans, library, search, teacher-verification, pages.

### Frontend (32 páginas)
Home, login, register (+ teacher), browse, chapters, lesson, library, search, dashboard, profile, progress, achievements, chat, news, notifications, help, plans, e dashboards por papel (admin, creator, editor, finance, moderator, support, country).

### Infra
- ✅ Supabase production integrado via `service_role` (commit `1db36f1`)
- ✅ Seeds corrigidos`)

---

## 🎯 Próximos passos

### 1. Limpar documentação redundante 🟡
Existem ~20 `.md` de relatórios antigos (FINAL_STATUS, FINAL_REPORT, FINAL_SUMMARY, PROJECT_COMPLETE, REDESIGN_REPORT, COMPLETE_REDESIGN_REPORT, etc.) que descrevem estados passados. Consolidar em `CHANGELOG.md` e arquivar o resto em `docs/archive/`.

**Tempo:** 30 min.

### 2. Revisar segurança do `service_role` 🔴
O backend usa `service_role` em todas as queries, o que bypassa RLS. Verificar:
- Nenhum endpoint público retorna dados sensíveis de outros utilizadores.
- Middleware de auth valida JWT **antes** de qualquer query que dependa de `student_id`/`user_id`.
- `video_tokens`, `subscriptions` e `exercise_submissions` só são acessados com `user_id` vindo do JWT verificado — nunca de query string/body.

**Tempo:** 1 dia de auditoria.

### 3. Carregar conteúdo real 🟡
Seeds ainda contêm dados demo. Fluxo de upload por professor (`creator-lesson-editor.html` + rotas `creator.ts`) existe mas precisa:
- Integração real com Bunny Stream (upload + playback HLS).
- Validação de permissões (só `creator` verificado publica).
- Fluxo de moderação (`moderator-dashboard.html`).

**Tempo:** 1–2 semanas.

### 4. Sistema de pagamentos 🟡
[plans.ts](src/routes/plans.ts) e [plans.html](src/pages/plans.html) existem. Falta:
- Gateway de pagamento (M-Pesa, e-Mola ou Stripe).
- Webhook para atualizar `subscriptions.status`.
- Bloqueio de lições premium no frontend quando `plan_type = 'free'`.

**Tempo:** 1 semana.

### 5. Observabilidade 🟢
- Logs estruturados nos 21 endpoints.
- Sentry ou similar para erros no frontend.
- Dashboard Supabase para queries lentas.

**Tempo:** 2 dias.

### 6. App mobile Flutter 🟢
Não iniciado. Avaliar se PWA (home.html já tem manifest?) não resolve antes de investir em nativo.

**Tempo:** 4–6 semanas se Flutter, ~1 semana se PWA.

---

## 🗂️ Migrations pendentes no Supabase

Aplicar pela ordem:

```
database/migrations/002_fix_security_definer_views.sql
database/migrations/003_fix_function_search_path.sql
database/migrations/004_explicit_rls_deny_policies.sql
```

---

## 📊 Prioridades

| # | Tarefa | Prioridade | Tempo |
|---|--------|-----------|-------|
| 2 | Auditoria `service_role` | 🔴 Alta | 1 dia |
| 1 | Limpar docs redundantes | 🟡 Média | 30 min |
| 3 | Upload de conteúdo real (Bunny) | 🟡 Média | 1–2 sem |
| 4 | Pagamentos (M-Pesa/Stripe) | 🟡 Média | 1 sem |
| 5 | Observabilidade | 🟢 Baixa | 2 dias |
| 6 | Mobile (PWA ou Flutter) | 🟢 Baixa | 1–6 sem |

---

## 🆘 Troubleshooting

### "Database configuration missing"
Verificar `.dev.vars` local ou secrets do Cloudflare (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`).

### Linter do Supabase volta a acusar
Confirmar que migrations 002–004 correram no ambiente em questão. Cada environment (dev/prod) precisa das três.

### Vídeo não reproduz
- Token gerado? Ver `video_tokens`.
- `BUNNY_CDN_URL` configurado?
- HLS suportado pelo browser? Usar `hls.js` como fallback.

---

## 📚 Referências

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
- [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)
- [TESTING_GUIDE.md](TESTING_GUIDE.md)
