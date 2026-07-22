# ✅ VCLASS - GUIA DE TESTE E VERIFICAÇÃO

## 🎯 OBJETIVO
Este guia permite testar e validar todas as funcionalidades do sistema VClass para garantir que está 100% operacional.

---

## 📋 PRÉ-REQUISITOS

Antes de iniciar os testes, certifique-se de que:

- [ ] Supabase está configurado
- [ ] Arquivo `.dev.vars` está criado
- [ ] Migrations foram executadas no Supabase
- [ ] Seeds foram carregados no banco
- [ ] Build foi executado com sucesso (`npm run build`)

---

## 🚀 ETAPA 1: INICIAR O SISTEMA

### 1.1 Limpar Ambiente
```bash
cd /home/user/vclass

# Limpar porta 3000
fuser -k 3000/tcp 2>/dev/null || true

# Ou parar PM2
pm2 delete all 2>/dev/null || true
```

### 1.2 Build (se ainda não fez)
```bash
npm run build
```

**Resultado esperado:**
```
✓ 188 modules transformed.
dist/_worker.js  389.90 kB
✓ built in 2.67s
```

### 1.3 Iniciar Servidor
```bash
pm2 start ecosystem.config.cjs
```

**Resultado esperado:**
```
[PM2] Process successfully started
┌─────┬──────────┬─────────┬─────────┐
│ id  │ name     │ status  │ restart │
├─────┼──────────┼─────────┼─────────┤
│ 0   │ vclass   │ online  │ 0       │
└─────┴──────────┴─────────┴─────────┘
```

### 1.4 Verificar Logs
```bash
pm2 logs vclass --nostream
```

**Verificar se aparece:**
- ✅ `wrangler pages dev dist`
- ✅ `Ready on http://0.0.0.0:3000`
- ❌ Sem erros de conexão ou configuração

---

## 🧪 ETAPA 2: TESTES DE API (Backend)

### 2.1 Health Check
```bash
curl http://localhost:3000/api/health
```

**Resultado esperado:**
```json
{
  "success": true,
  "message": "VClass API is running",
  "version": "1.0.0",
  "timestamp": "2026-04-08T..."
}
```

### 2.2 Listar Países
```bash
curl http://localhost:3000/api/content/countries
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid...",
      "name": "Moçambique",
      "code": "MOZ",
      "language": "pt",
      ...
    },
    ...
  ]
}
```

### 2.3 Teste de Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "estudante@vclass.mz",
    "password": "password123"
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid...",
      "email": "estudante@vclass.mz",
      "full_name": "João Matola",
      "role": "student"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  },
  "message": "Login successful"
}
```

### 2.4 Teste de Registro
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@vclass.mz",
    "password": "Test1234!",
    "full_name": "Teste Usuario",
    "role": "student"
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "accessToken": "...",
    "refreshToken": "..."
  },
  "message": "Registration successful"
}
```

---

## 🌐 ETAPA 3: TESTES DE FRONTEND (Manual)

### 3.1 Homepage (/)

**Acesse:** http://localhost:3000

**Verificar:**
- [ ] Logo "VClass" aparece
- [ ] Hero section com gradiente roxo
- [ ] Botões "Entrar" e "Registar" funcionam
- [ ] Cards de features (3 colunas)
- [ ] Cards de disciplinas (4 colunas)
- [ ] Footer completo
- [ ] Responsivo (testar redimensionando)

**Ações:**
1. Clique em "Entrar" → deve redirecionar para `/login.html`
2. Clique em "Registar" → deve redirecionar para `/register.html`
3. Clique em "Saber Mais" → deve fazer scroll suave

### 3.2 Login (/login.html)

**Acesse:** http://localhost:3000/login.html

**Verificar:**
- [ ] Formulário de login aparece
- [ ] Logo VClass visível
- [ ] Campos de email e senha
- [ ] Checkbox "Lembrar de mim"
- [ ] Link "Esqueceu a senha?"
- [ ] Link "Registar agora"

**Teste de Login:**
1. Email: `ana.silva@vclass.mz`
2. Senha: `vclass2024`
3. Clicar "Entrar"

**Resultado esperado:**
- [ ] Mensagem "Login realizado com sucesso!" (verde)
- [ ] Redireciona para `/dashboard.html` após 1 segundo
- [ ] Se recarregar, já está logado (não volta ao login)

**Teste de Erro:**
1. Email: `inexistente@test.com`
2. Senha: `wrong`
3. Clicar "Entrar"

**Resultado esperado:**
- [ ] Mensagem de erro em vermelho
- [ ] Permanece na página de login

### 3.3 Registro (/register.html)

**Acesse:** http://localhost:3000/register.html

**Verificar:**
- [ ] Formulário completo aparece
- [ ] Campos: Nome, Email, Telefone, Senha, Confirmar Senha, Role
- [ ] Checkbox de termos de uso
- [ ] Validação de senha (mensagem de requisitos)

**Teste de Registro:**
1. Nome: `Novo Estudante`
2. Email: `novo@test.com`
3. Telefone: `+258 84 123 4567`
4. Senha: `Test1234!`
5. Confirmar: `Test1234!`
6. Role: `Estudante`
7. Marcar checkbox
8. Clicar "Criar Conta"

**Resultado esperado:**
- [ ] Mensagem "Conta criada com sucesso!" (verde)
- [ ] Redireciona para `/dashboard.html`
- [ ] Usuário já logado

**Teste de Validação:**
1. Senha fraca: `123` → Deve mostrar erro
2. Senhas diferentes → Deve mostrar erro
3. Email inválido → Deve mostrar erro

### 3.4 Dashboard (/dashboard.html)

**Acesse:** http://localhost:3000/dashboard.html (após login)

**Verificar:**
- [ ] Mensagem "Olá, [Nome]! 👋"
- [ ] 4 cards de estatísticas:
  - Lições Completas (roxo)
  - Exercícios Feitos (azul)
  - Pontuação Média (verde)
  - Tempo de Estudo (laranja)
- [ ] Seção "Atividade Recente" (pode estar vazia inicialmente)
- [ ] Seção "Progresso por Disciplina" (pode estar vazia)
- [ ] CTA "Explorar Conteúdo" (botão roxo)
- [ ] Menu de navegação no topo
- [ ] Nome do usuário no canto superior direito
- [ ] Botão "Sair"

**Teste de Navegação:**
1. Clicar "Explorar Conteúdo" → Deve ir para `/browse.html`
2. Clicar "Conteúdo" no menu → Deve ir para `/browse.html`
3. Clicar "Dashboard" → Recarrega a página
4. Clicar "Sair" → Logout e redireciona para `/`

### 3.5 Browse (/browse.html)

**Acesse:** http://localhost:3000/browse.html (após login)

**Verificar:**
- [ ] Breadcrumb: "Início > Países"
- [ ] Título "Explorar Conteúdo"
- [ ] Subtítulo "Selecione o país e série para começar"
- [ ] Cards de países:
  - Moçambique 🇲🇿
  - Brasil 🇧🇷
  - Angola 🇦🇴

**Teste de Navegação - Fluxo Completo:**

**Passo 1:** Clicar em "Moçambique"
- [ ] Breadcrumb atualiza: "Início > Moçambique"
- [ ] Título: "Moçambique - Séries"
- [ ] Cards de séries aparecem: 10ª, 11ª, 12ª Classe
- [ ] Botão "Voltar" aparece

**Passo 2:** Clicar em "10ª Classe"
- [ ] Breadcrumb: "Início > Moçambique > 10ª Classe"
- [ ] Título: "10ª Classe - Disciplinas"
- [ ] Cards de disciplinas aparecem:
  - Matemática (azul)
  - Português (vermelho)
  - Física (verde)
- [ ] Cada card tem ícone apropriado

**Passo 3:** Clicar em "Matemática"
- [ ] Redireciona para `/chapters.html?gs=...&subject=Matemática&...`

**Teste de Voltar:**
- [ ] Botão "Voltar" funciona em cada nível
- [ ] Breadcrumb é clicável

### 3.6 Chapters (/chapters.html)

**Acesse:** Via navegação em browse.html

**Verificar:**
- [ ] Breadcrumb completo visível
- [ ] Header com nome da disciplina "Matemática"
- [ ] Info: "10ª Classe • Moçambique"
- [ ] Barra de progresso no topo direito
- [ ] Cards de capítulos:
  - Cada capítulo tem número, título, descrição
  - Header roxo com número do capítulo
  - Lista de lições dentro do capítulo
- [ ] Cada lição mostra:
  - Thumbnail (ou placeholder)
  - Número da lição
  - Título
  - Badge "GRÁTIS" (se for free)
  - Duração (se disponível)
  - Descrição
  - Ícone de play

**Teste de Click:**
1. Clicar em uma lição
2. Deve redirecionar para `/lesson.html?id=...`

### 3.7 Lesson (/lesson.html)

**Acesse:** Via chapters.html

**Verificar:**
- [ ] Breadcrumb completo até "Lição"
- [ ] Título da lição em destaque
- [ ] Descrição da lição
- [ ] Duração e visualizações
- [ ] **Video Player:**
  - [ ] Player Video.js aparece
  - [ ] Controles de play/pause
  - [ ] Barra de progresso
  - [ ] Controle de volume
  - [ ] Fullscreen
  - [ ] (Vídeo pode não carregar se não tiver URL real - normal)
- [ ] **Tabs:**
  - [ ] Tab "Conteúdo" (ativo por padrão)
  - [ ] Tab "Exercícios"
  - [ ] Tab "Anexos"
- [ ] **Sidebar:**
  - [ ] Card "Seu Progresso" com barra
  - [ ] Percentual de conclusão
  - [ ] Tempo gasto
  - [ ] Status da lição
  - [ ] Botões de navegação

**Teste de Tabs:**
1. Clicar "Exercícios"
   - [ ] Conteúdo muda para lista de exercícios
   - [ ] Perguntas aparecem numeradas
   - [ ] Opções A, B, C, D visíveis
   - [ ] Botão "Submeter Respostas"

2. Clicar "Anexos"
   - [ ] Lista de anexos (ou mensagem "Nenhum anexo")
   - [ ] Links para download (se houver)

3. Clicar "Conteúdo"
   - [ ] Volta para o conteúdo da lição

**Teste de Navegação:**
- [ ] "Voltar ao Capítulo" funciona
- [ ] "Ir para Dashboard" funciona
- [ ] Navegação do menu superior funciona

---

## 🎯 ETAPA 4: TESTES DE INTEGRAÇÃO

### 4.1 Fluxo Completo do Estudante

**Execute este fluxo end-to-end:**

1. **Homepage** → Clicar "Registar"
2. **Registro** → Criar nova conta
3. **Dashboard** → Ver estatísticas (zeradas)
4. **Browse** → Explorar conteúdo
5. **Navegar** → Moçambique > 10ª Classe > Matemática
6. **Chapters** → Ver capítulos
7. **Lesson** → Abrir lição
8. **Ver vídeo** → Player carrega (pode dar erro se não tiver CDN real)
9. **Ler conteúdo** → Tab conteúdo funciona
10. **Fazer exercício** → Tab exercícios funciona
11. **Voltar** → Dashboard
12. **Verificar** → Estatísticas atualizadas (se progresso foi salvo)

**Resultado esperado:**
- [ ] Todo o fluxo funciona sem erros
- [ ] Navegação é suave
- [ ] Dados persistem

### 4.2 Teste de Autenticação

1. **Logout:**
   - Clicar "Sair"
   - Deve redirecionar para homepage
   - Tentar acessar `/dashboard.html` diretamente
   - Deve redirecionar para `/login.html`

2. **Login novamente:**
   - Fazer login
   - Deve ir para dashboard
   - Dados do usuário aparecem
   - Progresso anterior persiste

### 4.3 Teste de Responsividade

**Redimensionar navegador para testar:**

1. **Desktop (1920x1080):**
   - [ ] Layout com 3 colunas
   - [ ] Sidebar visível
   - [ ] Todos os elementos visíveis

2. **Tablet (768x1024):**
   - [ ] Layout com 2 colunas
   - [ ] Menu adaptado
   - [ ] Elementos reposicionados

3. **Mobile (375x667):**
   - [ ] Layout com 1 coluna
   - [ ] Menu hamburger (se implementado)
   - [ ] Cards empilhados
   - [ ] Texto legível

---

## ✅ CHECKLIST DE VALIDAÇÃO FINAL

### Backend APIs
- [ ] Health check retorna sucesso
- [ ] Login funciona com usuário de teste
- [ ] Registro cria novo usuário
- [ ] Listar países retorna dados
- [ ] Todas as 22 APIs respondem corretamente

### Frontend Pages
- [ ] Homepage carrega sem erros
- [ ] Login page funciona
- [ ] Register page funciona
- [ ] Dashboard carrega com dados
- [ ] Browse navega corretamente
- [ ] Chapters mostra lições
- [ ] Lesson page completa funciona

### Funcionalidades
- [ ] Autenticação persiste (localStorage)
- [ ] Logout funciona
- [ ] Navegação hierárquica funciona
- [ ] Breadcrumb atualiza corretamente
- [ ] Tabs trocam conteúdo
- [ ] Video player renderiza
- [ ] Exercícios aparecem
- [ ] Progresso é mostrado

### Performance
- [ ] Páginas carregam em < 2 segundos
- [ ] Sem erros no console do navegador
- [ ] Sem warnings no console
- [ ] Build size é razoável (~390KB)
- [ ] Sem memory leaks aparentes

### UX/UI
- [ ] Design consistente em todas as páginas
- [ ] Cores e estilos uniformes
- [ ] Ícones carregam
- [ ] Animações são suaves
- [ ] Feedback visual em ações
- [ ] Loading states aparecem
- [ ] Mensagens de erro são claras

---

## 🐛 TROUBLESHOOTING

### Problema: "Database configuration missing"
**Solução:**
```bash
# Verificar se .dev.vars existe
cat .dev.vars

# Se não existir, criar:
cat > .dev.vars << EOF
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave
JWT_SECRET=$(openssl rand -base64 32)
BUNNY_CDN_URL=https://placeholder.com
EOF

# Reiniciar servidor
pm2 restart vclass
```

### Problema: Vídeo não carrega
**Esperado:** Normal se não tiver CDN real configurado
**Solução para produção:**
1. Configurar Bunny.net ou Cloudflare Stream
2. Adicionar BUNNY_CDN_URL real no .dev.vars
3. Upload de vídeos de teste

### Problema: "CORS error"
**Solução:**
```typescript
// Em src/middleware/cors.ts, adicionar sua URL:
origin: ['http://localhost:3000', 'http://localhost:5173', 'SUA_URL_AQUI']
```

### Problema: Página em branco
**Verificar:**
1. Console do navegador (F12)
2. Logs do PM2: `pm2 logs vclass`
3. Se build foi feito: `npm run build`
4. Se servidor está rodando: `pm2 list`

### Problema: Exercícios não aparecem
**Causa:** Dados de seed não foram carregados
**Solução:**
1. Executar `database/seeds/001_initial_data.sql` no Supabase
2. Verificar se lições têm exercícios no banco

---

## 📊 RELATÓRIO DE TESTE

Após completar todos os testes, preencha:

```
Data: _______________
Testador: _______________

BACKEND:
✅ / ❌  Health check
✅ / ❌  Login API
✅ / ❌  Register API
✅ / ❌  Content APIs
✅ / ❌  Video APIs
✅ / ❌  Exercise APIs
✅ / ❌  Progress APIs

FRONTEND:
✅ / ❌  Homepage
✅ / ❌  Login page
✅ / ❌  Register page
✅ / ❌  Dashboard
✅ / ❌  Browse
✅ / ❌  Chapters
✅ / ❌  Lesson

INTEGRAÇÃO:
✅ / ❌  Fluxo completo
✅ / ❌  Autenticação persiste
✅ / ❌  Logout funciona
✅ / ❌  Dados sincronizam

PERFORMANCE:
✅ / ❌  Carregamento rápido
✅ / ❌  Sem erros console
✅ / ❌  Responsivo

OBSERVAÇÕES:
_________________________________
_________________________________
_________________________________

CONCLUSÃO:
⭐⭐⭐⭐⭐ Pronto para produção
⭐⭐⭐⭐   Pequenos ajustes necessários
⭐⭐⭐     Ajustes médios necessários
⭐⭐       Vários problemas
⭐         Não funcional
```

---

## ✅ PRÓXIMOS PASSOS APÓS VALIDAÇÃO

Se todos os testes passaram:

1. **✅ Configure Supabase real** (se ainda usou mock)
2. **✅ Configure CDN de vídeo** (Bunny.net)
3. **✅ Adicione conteúdo real** (vídeos, exercícios)
4. **✅ Deploy para staging**
5. **✅ Beta test com 5-10 usuários**
6. **✅ Deploy para produção**
7. **✅ Marketing e aquisição**

---

## 🎉 CONCLUSÃO

Se você chegou até aqui e todos os testes passaram, **parabéns!** 

Seu sistema VClass está **100% funcional** e pronto para:
- ✅ Deploy em produção
- ✅ Testes com usuários reais
- ✅ Adição de conteúdo educacional
- ✅ Crescimento e escala

**O MVP está completo! 🚀**
