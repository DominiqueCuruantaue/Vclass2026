# 🚀 VClass — Próximos Passos

**Última atualização:** 2026-09-22 (revisão geral de código)
**Stack:** Hono + Cloudflare Pages/Workers · Supabase Postgres · Bunny CDN (HLS) · Capacitor (mobile)

---

## ✅ Estado atual

### Backend (25 grupos de rotas)
auth, content, video, exercises, progress, curriculum, country, creator, editor, finance, moderator, admin, support, chat, news, notifications, plans, library, search, teacher-verification, pages, earnings, settlementCron, sessions, bookmarks/favorites/comments/tickets.

### Domínio "Teacher Earnings" (política V1.0)
Fundação, VCPM/BQE, comissão de referência (CRA) com conversão e reversão automáticas, campanhas VQ-B, gate anti-fraude, settlement mensal (cron GitHub Actions), execução de payout — tudo implementado e testado (111 testes). UI de professor ligada ao ledger real. Migration 037 (`fn_write_estimated_earnings`, escrita atómica da fase estimate) aplicada e confirmada em produção em 2026-09-23. Detalhe completo em [VCLASS_TEACHER_EARNINGS_V1_IMPLEMENTATION_BLUEPRINT.md](VCLASS_TEACHER_EARNINGS_V1_IMPLEMENTATION_BLUEPRINT.md).

### Segurança
Auditoria de 30/08/2026 (`docs/security-audit/relatorio-auditoria-seguranca.pdf`) encontrou 7 achados (1 crítico) — **todos os 7 confirmados corrigidos** numa re-verificação de código em 2026-09-22. Rate limiting já usa Cloudflare KV, headers de segurança (CSP/HSTS/X-Frame-Options) e CORS de produção já estão em vigor.

### Mobile
App Capacitor publicada (APK) — é um wrapper WebView à volta do site, herda as mesmas páginas. Sem UI própria de admin/earnings (ver gaps abaixo).

---

## 🎯 Próximos passos

### 1. Gateway de pagamento 🔴
Continua a ser o único bloqueador de negócio real. `plans.ts`/`finance.ts` só têm registo manual de subscrições ("a equipa financeira regista o que já aconteceu fora do sistema"). Falta:
- Escolher fornecedor (M-Pesa, e-Mola ou Stripe) — decisão de negócio, não técnica.
- Webhook para atualizar `subscriptions.status` automaticamente.
- Sem isto, a Comissão de Referência (CRA) nunca dispara para utilizadores reais.

### 2. UI de admin para earnings 🟢
[src/pages/admin-earnings.html](src/pages/admin-earnings.html) cobre agora todos os endpoints de admin do domínio: Levantamentos, Sinalizações de Fraude, Campanhas VQ-B, **Contratos (Fee de Embaixador + Conteúdo Especial, adicionado em 2026-10-09)**, Extracto do Ledger e Ajuste Manual. Falta: selector de professor por nome (hoje os formulários pedem o UUID do professor) e versão mobile dedicada.

### 3. Observabilidade 🟡
Sem Sentry nem logger estruturado — só `console.log`/`console.error` espalhados. `src/utils/logger.ts` (criado nesta sessão) padroniza o formato; falta decidir e configurar um serviço externo (Sentry ou equivalente) para agregação e alertas — requer conta/DSN, decisão do utilizador.

### 4. Cobertura de testes no domínio financeiro 🟡
`settlementEngine.ts` (fase estimate) e `earningsAggregation.ts` não têm teste dedicado que exercite agregação real a partir de `qualified_views`/campanhas VQ-B — só os motores puros (`vcpmEngine`/`bqeEngine`) estão bem cobertos.

### 5. Limpeza de `as any` 🟢
111 ocorrências, concentradas em `creator.ts` (41) e `finance.ts` (15) — perda de type safety, não bloqueador funcional.

---

## 📊 Prioridades

| # | Tarefa | Prioridade |
|---|--------|-----------|
| 1 | Gateway de pagamento (decisão + integração) | 🔴 Alta |
| 2 | UI de admin para earnings (expandir a página base) | 🟡 Média |
| 3 | Observabilidade externa (Sentry ou equivalente) | 🟡 Média |
| 4 | Testes de agregação/settlement | 🟡 Média |
| 5 | Limpeza de `as any` | 🟢 Baixa |

---

## 🆘 Troubleshooting

### "Database configuration missing"
Verificar `.dev.vars` local ou secrets do Cloudflare (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`).

### Vídeo não reproduz
- Token gerado? Ver `video_tokens`.
- `BUNNY_CDN_URL`/`BUNNY_API_KEY` configurados?
- HLS suportado pelo browser? Usar `hls.js` como fallback.

### Settlement/earnings
Ver [VCLASS_TEACHER_EARNINGS_V1_IMPLEMENTATION_BLUEPRINT.md](VCLASS_TEACHER_EARNINGS_V1_IMPLEMENTATION_BLUEPRINT.md) — Definition of Done e Requirement Traceability Matrix têm o estado mais actual.

---

## 📚 Referências

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
- [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)
- [TESTING_GUIDE.md](TESTING_GUIDE.md)
- [VCLASS_TEACHER_EARNINGS_V1_IMPLEMENTATION_BLUEPRINT.md](VCLASS_TEACHER_EARNINGS_V1_IMPLEMENTATION_BLUEPRINT.md)
- [docs/security-audit/relatorio-auditoria-seguranca.pdf](docs/security-audit/relatorio-auditoria-seguranca.pdf)
