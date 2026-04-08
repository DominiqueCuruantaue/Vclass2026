# 🚀 VCLASS - GUIA DE DEPLOY PARA PRODUÇÃO

## 📋 PRÉ-REQUISITOS

Antes de fazer o deploy, certifique-se de que:

- ✅ Todos os testes locais passaram (ver `TESTING_GUIDE.md`)
- ✅ Supabase está configurado em produção
- ✅ Conta Cloudflare está criada
- ✅ Domínio está pronto (opcional mas recomendado)
- ✅ CDN de vídeo está configurado (Bunny.net ou Cloudflare Stream)

---

## 🎯 ESTRATÉGIA DE DEPLOY

```
Desenvolvimento Local
        ↓
Staging (Cloudflare Pages)
        ↓
Produção (Cloudflare Pages)
```

---

## 🔧 ETAPA 1: CONFIGURAÇÃO DO SUPABASE (Produção)

### 1.1 Criar Projeto de Produção

1. Acesse https://supabase.com
2. Crie novo projeto:
   - Nome: `vclass-production`
   - Database Password: **Senha forte** (salve em local seguro)
   - Região: **Europe West (London)** ou mais próximo de Moçambique
   - Plano: **Free** (para começar)

### 1.2 Executar Migrations

```sql
-- No SQL Editor do Supabase, executar:

-- 1. Schema completo
-- Copiar e colar: database/migrations/001_initial_schema.sql

-- 2. Dados iniciais
-- Copiar e colar: database/seeds/001_initial_data.sql
```

### 1.3 Obter Credenciais

1. Vá em **Settings → API**
2. Copie:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...`
3. Salve em local seguro

### 1.4 Configurar Row Level Security (RLS)

```sql
-- Executar no SQL Editor:

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_submissions ENABLE ROW LEVEL SECURITY;

-- Policy básica de leitura pública para conteúdo
CREATE POLICY "Public read access" ON lessons
  FOR SELECT USING (status = 'published');

CREATE POLICY "Public read access" ON subjects
  FOR SELECT USING (true);

CREATE POLICY "Public read access" ON countries
  FOR SELECT USING (is_active = true);

-- Adicionar mais policies conforme necessário
```

---

## ☁️ ETAPA 2: CONFIGURAÇÃO DO CLOUDFLARE

### 2.1 Criar Conta Cloudflare

1. Acesse https://dash.cloudflare.com
2. Crie conta (se não tiver)
3. Verifique email

### 2.2 Configurar Cloudflare Pages

```bash
# Instalar Wrangler CLI (se não tiver)
npm install -g wrangler

# Login no Cloudflare
wrangler login
```

### 2.3 Criar Projeto Pages

```bash
cd /home/user/vclass

# Criar projeto
wrangler pages project create vclass \
  --production-branch main \
  --compatibility-date 2026-04-08
```

### 2.4 Configurar Secrets (Variáveis de Ambiente)

```bash
# JWT Secret
wrangler pages secret put JWT_SECRET --project-name vclass
# Cole: resultado de `openssl rand -base64 32`

# Supabase URL
wrangler pages secret put SUPABASE_URL --project-name vclass
# Cole: https://seu-projeto.supabase.co

# Supabase Anon Key
wrangler pages secret put SUPABASE_ANON_KEY --project-name vclass
# Cole: sua chave anon do Supabase

# Bunny.net CDN URL (se configurado)
wrangler pages secret put BUNNY_CDN_URL --project-name vclass
# Cole: https://sua-zona.b-cdn.net
```

### 2.5 Verificar Secrets

```bash
wrangler pages secret list --project-name vclass
```

**Resultado esperado:**
```
JWT_SECRET
SUPABASE_URL
SUPABASE_ANON_KEY
BUNNY_CDN_URL
```

---

## 🎬 ETAPA 3: CONFIGURAR CDN DE VÍDEO (Opcional mas Recomendado)

### Opção A: Bunny.net (Recomendado - Mais Barato)

1. **Criar Conta:**
   - Acesse https://bunny.net
   - Criar conta
   - Adicionar método de pagamento

2. **Criar Stream Library:**
   - Dashboard → Stream
   - Create Library
   - Nome: `vclass-videos`
   - Região: Europe
   - Criar

3. **Obter Credenciais:**
   - API Key: Settings → API
   - Library ID: Número na URL
   - CDN URL: `https://vz-XXXXX.b-cdn.net`

4. **Adicionar ao Cloudflare:**
```bash
wrangler pages secret put BUNNY_API_KEY --project-name vclass
wrangler pages secret put BUNNY_LIBRARY_ID --project-name vclass
```

### Opção B: Cloudflare Stream

1. **Ativar Stream:**
   - Dashboard Cloudflare → Stream
   - Ativar serviço

2. **Obter Credentials:**
   - Account ID
   - API Token

3. **Configurar:**
```bash
wrangler pages secret put CLOUDFLARE_ACCOUNT_ID --project-name vclass
wrangler pages secret put CLOUDFLARE_STREAM_TOKEN --project-name vclass
```

---

## 🚢 ETAPA 4: DEPLOY

### 4.1 Preparar Código para Produção

```bash
cd /home/user/vclass

# Garantir que está na branch main
git checkout main

# Verificar status
git status

# Se houver alterações não commitadas
git add .
git commit -m "Prepare for production deploy"
```

### 4.2 Build de Produção

```bash
# Limpar build anterior
rm -rf dist

# Build
npm run build
```

**Verificar:**
```bash
ls -lh dist/
# Deve mostrar:
# _worker.js (390KB aprox)
# _routes.json
# static/ (se existir)
```

### 4.3 Deploy para Cloudflare Pages

```bash
# Deploy
wrangler pages deploy dist --project-name vclass --branch main
```

**Resultado esperado:**
```
✨ Success! Uploaded X files (Y seconds)
✨ Deployment complete! Take a peek over at https://xxxxx.vclass.pages.dev
```

### 4.4 Verificar Deploy

1. **Acessar URL de Preview:**
   ```
   https://xxxxx.vclass.pages.dev
   ```

2. **Testar funcionalidades básicas:**
   - [ ] Homepage carrega
   - [ ] Login funciona
   - [ ] APIs respondem
   - [ ] Dashboard aparece

---

## 🌐 ETAPA 5: DOMÍNIO CUSTOMIZADO (Opcional)

### 5.1 Adicionar Domínio

```bash
# Adicionar domínio
wrangler pages domain add vclass.co.mz --project-name vclass
```

### 5.2 Configurar DNS

No seu provedor de domínio (ex: GoDaddy, Namecheap):

```
Tipo: CNAME
Nome: @ (ou vclass)
Valor: vclass.pages.dev
TTL: Auto
```

### 5.3 Aguardar Propagação

- Tempo: 5 minutos a 48 horas
- Verificar: https://dnschecker.org

### 5.4 Configurar SSL

Cloudflare configura SSL automaticamente:
- ✅ HTTPS habilitado
- ✅ Certificado Let's Encrypt
- ✅ Redirect HTTP → HTTPS

---

## 📊 ETAPA 6: MONITORAMENTO

### 6.1 Cloudflare Analytics

1. Dashboard → vclass project
2. Analytics
3. Monitorar:
   - Requests/dia
   - Response time
   - Errors
   - Bandwidth

### 6.2 Supabase Monitoring

1. Supabase Dashboard
2. Database → Monitoring
3. Verificar:
   - Queries/segundo
   - Database size
   - Connection count

### 6.3 Logs

```bash
# Ver logs em tempo real
wrangler pages deployment tail --project-name vclass

# Ver logs específicos
wrangler pages deployment list --project-name vclass
```

---

## 🔄 ETAPA 7: CI/CD COM GITHUB (Opcional)

### 7.1 Conectar GitHub

1. Cloudflare Dashboard
2. Pages → vclass
3. Settings → Builds & deployments
4. Connect to Git
5. Selecionar repositório
6. Configurar:
   - Production branch: `main`
   - Build command: `npm run build`
   - Build output: `dist`

### 7.2 Variáveis de Ambiente

Adicionar no Cloudflare Pages (não no GitHub):
- JWT_SECRET
- SUPABASE_URL
- SUPABASE_ANON_KEY
- BUNNY_CDN_URL

### 7.3 Fluxo Automático

```
Push to GitHub
     ↓
Cloudflare detecta
     ↓
Build automático
     ↓
Deploy automático
     ↓
URL atualizada
```

---

## ✅ CHECKLIST DE DEPLOY

### Pré-Deploy
- [ ] Código testado localmente
- [ ] Todos os testes passaram
- [ ] Build funciona sem erros
- [ ] Variáveis de ambiente prontas
- [ ] Supabase produção configurado

### Deploy
- [ ] Cloudflare account criada
- [ ] Projeto Pages criado
- [ ] Secrets configurados
- [ ] Build de produção feito
- [ ] Deploy executado com sucesso

### Pós-Deploy
- [ ] URL de preview funciona
- [ ] Homepage carrega
- [ ] Login funciona
- [ ] APIs respondem
- [ ] Dashboard aparece
- [ ] Navegação funciona

### Domínio (Opcional)
- [ ] Domínio adicionado
- [ ] DNS configurado
- [ ] SSL habilitado
- [ ] Domínio acessível

### Monitoramento
- [ ] Analytics configurado
- [ ] Logs funcionando
- [ ] Alertas configurados (opcional)

---

## 🐛 TROUBLESHOOTING DE DEPLOY

### Erro: "Build failed"

**Causa:** Dependências não instaladas ou erro de build

**Solução:**
```bash
# Limpar node_modules
rm -rf node_modules
npm install

# Testar build localmente
npm run build

# Se funcionar local, tentar deploy novamente
```

### Erro: "Secret not found"

**Causa:** Variáveis de ambiente não configuradas

**Solução:**
```bash
# Verificar secrets
wrangler pages secret list --project-name vclass

# Adicionar secret faltante
wrangler pages secret put NOME_SECRET --project-name vclass
```

### Erro: "Database connection failed"

**Causa:** SUPABASE_URL ou SUPABASE_ANON_KEY incorretos

**Solução:**
1. Verificar credenciais no Supabase
2. Atualizar secrets:
```bash
wrangler pages secret put SUPABASE_URL --project-name vclass
wrangler pages secret put SUPABASE_ANON_KEY --project-name vclass
```

### Erro: "CORS policy"

**Causa:** URL de produção não está no CORS config

**Solução:**
```typescript
// Em src/middleware/cors.ts, adicionar:
origin: [
  'http://localhost:3000',
  'https://vclass.pages.dev',
  'https://xxxxx.vclass.pages.dev', // Sua URL
  'https://vclass.co.mz' // Seu domínio
]

// Rebuild e redeploy
npm run build
wrangler pages deploy dist --project-name vclass
```

### Site mostra "404 Not Found"

**Causa:** _routes.json ou build incorreto

**Solução:**
```bash
# Verificar se dist/_worker.js existe
ls -la dist/

# Se não existir, rebuild
npm run build

# Verificar _routes.json
cat dist/_routes.json

# Redeploy
wrangler pages deploy dist --project-name vclass
```

---

## 📈 ESCALABILIDADE

### Quando Escalar?

**Free Tier Limits:**
- Cloudflare Workers: 100k requests/dia
- Supabase: 500MB DB, 2GB bandwidth/mês

**Sinais de que precisa escalar:**
- Mais de 50k requests/dia
- Database > 400MB
- Latência > 500ms
- Erros de rate limiting

### Como Escalar?

**Cloudflare:**
```bash
# Upgrade para Workers Paid ($5/mês)
# Aumenta para 10M requests/mês
```

**Supabase:**
- Pro Plan: $25/mês
- Até 8GB database
- 50GB bandwidth
- Backups automáticos

**CDN:**
- Bunny.net: Pay-as-you-go
- Escalona automaticamente

---

## 🎯 PRÓXIMOS PASSOS APÓS DEPLOY

1. **✅ Teste Completo em Produção**
   - Todos os fluxos
   - Performance
   - Mobile

2. **✅ Adicione Conteúdo Real**
   - Upload de vídeos
   - Criar lições
   - Adicionar exercícios

3. **✅ Beta Testing**
   - Convide 10-20 usuários
   - Colete feedback
   - Faça ajustes

4. **✅ Marketing**
   - Redes sociais
   - Comunidades
   - Escolas

5. **✅ Monitore e Otimize**
   - Analytics
   - Performance
   - Custos

---

## 🎉 CONCLUSÃO

Parabéns! Se você completou todas as etapas, seu **VClass** está:

✅ Rodando em produção  
✅ Escalável globalmente  
✅ Seguro e confiável  
✅ Monitorado  
✅ Pronto para crescer  

**Próximo marco: 100 primeiros alunos! 🚀**

---

## 📞 RECURSOS

- **Cloudflare Docs:** https://developers.cloudflare.com/pages
- **Supabase Docs:** https://supabase.com/docs
- **Wrangler CLI:** https://developers.cloudflare.com/workers/wrangler
- **Bunny.net Docs:** https://docs.bunny.net

**Boa sorte com o lançamento! 🎓🇲🇿**
