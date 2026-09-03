// ============================================================
//  VClass — Gerador do Relatório de Auditoria de Segurança (PDF)
//  Stack: Node.js + pdf-lib (já é dependência do projecto — sem
//  instalação global). Gráficos desenhados como vectores nativos
//  do PDF (sem libs de charting): donut via polígonos que
//  aproximam arcos, barras via rectângulos.
//
//  Uso: node docs/security-audit/generate-report.mjs
// ============================================================
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = join(__dirname, 'relatorio-auditoria-seguranca.pdf')

// ── Paleta (definida pelo utilizador) ──────────────────────────────────────
const COLORS = {
  critical: rgb(0xB9/255, 0x1C/255, 0x1C/255),
  high:     rgb(0xEA/255, 0x58/255, 0x0C/255),
  medium:   rgb(0xD9/255, 0x77/255, 0x06/255),
  low:      rgb(0x25/255, 0x63/255, 0xEB/255),
  info:     rgb(0x64/255, 0x74/255, 0x8B/255),
  strength: rgb(0x05/255, 0x96/255, 0x69/255),
  dark:     rgb(0x11/255, 0x18/255, 0x27/255),
  gray:     rgb(0x37/255, 0x41/255, 0x51/255),
  lightGray:rgb(0x9c/255, 0xa3/255, 0xaf/255),
  bg:       rgb(0xF9/255, 0xFA/255, 0xFB/255),
  border:   rgb(0xE5/255, 0xE7/255, 0xEB/255),
  white:    rgb(1, 1, 1),
  purple:   rgb(0x7c/255, 0x3a/255, 0xed/255),
}

const SEV_LABEL = { critical: 'Crítica', high: 'Alta', medium: 'Média', low: 'Baixa', info: 'Informativa' }

// ── Dados da auditoria ──────────────────────────────────────────────────────
const PROJECT_NAME = 'VClass'
const AUDIT_DATE = '30 de Agosto de 2026'
const SCOPE = 'Repositório completo (backend Hono/Cloudflare Workers, 25 routers de API, middlewares de auth/CORS/rate-limit, 33 páginas HTML/JS do frontend, config. de deploy Cloudflare Pages/Workers, histórico Git)'

const STACK_NOTE = [
  { cat: 'Banco sem tranca (isolamento de tenant)', mapping: 'Não há RLS do Supabase em uso — o cliente é sempre criado com a service_role key (bypassa RLS por desenho; ver src/config/supabase.ts). O isolamento é 100% responsabilidade manual de cada handler, filtrando por user_id / student_id / created_by / country_code. Auditados os filtros de todas as queries de listagem/agregação em 25 ficheiros de rotas.' },
  { cat: 'Permissão definida no navegador', mapping: 'Auth via JWT próprio (jsonwebtoken) + middleware requireRole(...) do Hono. Cruzados todos os gates de UI (isAdmin, role==="teacher", etc.) nas 33 páginas com o middleware equivalente no router Hono correspondente.' },
  { cat: 'IDOR', mapping: 'Percorridos sistematicamente os handlers .get/.post/.put/.patch/.delete com :id/:param dos 25 routers, verificando presença de .eq(\'<owner_column>\', user.id) antes de devolver/alterar/apagar o recurso.' },
  { cat: 'Chaves expostas', mapping: 'Grep por padrões de chave (sk-, AKIA, key/secret/password/token literais) em src/, scripts, configs, wrangler.jsonc, .mcp.json, ecosystem.config.cjs e em todo o histórico git (git log -p); verificado .gitignore e ausência de .dev.vars real no repositório.' },
  { cat: 'Inputs sem tratamento (XSS)', mapping: 'Grep por innerHTML/insertAdjacentHTML/document.write nas 33 páginas HTML; verificado se o valor injectado passa por escapeHtml() antes do innerHTML; no backend, verificados os templates de email (utils/email.ts) quanto a interpolação directa de input do utilizador em HTML.' },
]

// Achados verificados (arquivo por arquivo)
const FINDINGS = [
  {
    id: 'F1', severity: 'critical', category: 'Isolamento de tenant / IDOR',
    file: 'src/routes/country.ts', lines: '326-460',
    title: 'Country Manager acede e altera dados de qualquer país, não apenas o seu',
    desc: 'Todas as rotas /api/country/:id/* (stats, teachers, users, curriculum, teachers/:tid, announcement) usam apenas o middleware de papel requireCountryManagerOrAdmin (middleware/auth.ts:70), que valida SÓ o papel "country_manager" — nunca compara o :id do país pedido com o country_code do próprio gestor. GET /api/country/me (linha 302-323) resolve correctamente o país do gestor a partir de users.country_code, mas nenhuma das rotas seguintes reaproveita essa verificação.',
    code: `// src/routes/country.ts
country.use('/*', authMiddleware)
country.use('/*', requireCountryManagerOrAdmin)   // só verifica o PAPEL

// GET /api/country/:id/users  (linha 395)
country.get('/:id/users', async (c) => {
  const id = c.req.param('id')                     // <- vem directo do URL
  ...
  .eq('country_code', id)                           // nunca comparado com o país do gestor
})

// PATCH /api/country/:id/teachers/:tid (linha 445)
country.patch('/:id/teachers/:tid', async (c) => {
  const tid = c.req.param('tid')
  ...
  .update({ is_active: body.status !== 'inactive' }).eq('id', tid)  // desactiva QUALQUER professor`,
    why: 'Um gestor de país (role=country_manager) atribuído a Angola tem um JWT válido para o seu papel. Nada nesse token ou nestas rotas restringe QUAL país ele pode gerir. Com o mesmo login, ele pode chamar GET /api/country/mz/users e obter nome+email+nota média de todos os alunos e professores de Moçambique, ou PATCH /api/country/mz/teachers/{id} para desactivar a conta de um professor moçambicano, ou POST /api/country/mz/announcement para enviar avisos em nome de outro país. O próprio código já resolve o "meu país" correctamente em outro ficheiro (src/routes/teacher-verification.ts, função getManagerCountry + comparação app.country_id !== managerCountry em 5 rotas) — a omissão aqui é uma regressão/lacuna face ao padrão já estabelecido no mesmo projecto.',
    exploitability: 'Requer apenas uma conta válida de country_manager (papel de staff normal, não precisa de admin). Sem feature flag nem configuração insegura adicional — reprodutível em qualquer ambiente com Supabase configurado.',
  },
  {
    id: 'F2', severity: 'high', category: 'Inputs sem tratamento (XSS)',
    file: 'src/routes/chat.ts + src/pages/chat.html', lines: 'chat.ts:195 · chat.html:313-320,402-411',
    title: 'XSS reflectido no Chat IA permite roubo do token de sessão (localStorage)',
    desc: 'Quando a pergunta do utilizador não bate com nenhuma tag da base de conhecimento local, o backend devolve a mensagem original do utilizador embutida sem qualquer escaping HTML dentro da resposta do "assistente". O frontend renderiza essa resposta com innerHTML após só converter marcações markdown (**negrito**, `código`), sem nunca escapar < > & antes.',
    code: `// src/routes/chat.ts (fallback local, linha ~195)
return \`Boa pergunta sobre **"\${message.substring(0, 60)}"**! 🤔 ...\`
// 'message' é o texto CRU enviado pelo utilizador em POST /api/chat

// src/pages/chat.html (linha 402-411)
function formatBotText(text) {
    text = text.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')   // NÃO escapa HTML antes
    ...
    return text
}
// linha 313-320
const formattedText = formatBotText(text);
div.innerHTML = \`... <div class="text-sm">\${formattedText}</div> ...\`   // injecção directa`,
    why: 'Enviar POST /api/chat {"message":"<img src=x onerror=alert(document.cookie)>"} (uma frase que não corresponda a nenhuma tag da KB local — o caso mais comum quando OPENAI_API_KEY não está configurada, que é o modo por omissão, ou sempre que a chamada à OpenAI falhar) faz o servidor devolver essa string HTML por dentro de "response", e o chat.html injecta-a directamente no DOM via innerHTML. O token de acesso (JWT) fica em localStorage.accessToken (confirmado em public/static/app.js:66,96,144) — sem HttpOnly, plenamente legível por JavaScript. Um script injectado consegue portanto ler e exfiltrar esse token para um servidor externo, permitindo sequestro de sessão. Vector típico: engenharia social ("cola este texto no chat da VClass para desbloquear X") — um "self-XSS" clássico que na prática rouba a própria sessão da vítima.',
    exploitability: 'Reprodutível sem nenhuma configuração especial: é o caminho por omissão sempre que OPENAI_API_KEY não está definida (variável opcional) ou a chamada à API OpenAI falha — nesses casos o servidor cai sempre para este fallback local.',
  },
  {
    id: 'F3', severity: 'medium', category: 'Chaves expostas / defaults inseguros',
    file: 'src/middleware/database.ts + src/routes/auth.ts', lines: 'database.ts:38-133 · auth.ts:247-284',
    title: 'Modo demo com password fixa e conta admin ficam activos se as variáveis do Supabase faltarem',
    desc: 'Quando SUPABASE_URL ou SUPABASE_ANON_KEY não estão definidas no ambiente (env do Worker), o login (POST /api/auth/login) cai automaticamente em "modo demo": aceita qualquer email de mockUsers com a password fixa DEMO_PASSWORD = \'vclass2024\', incluindo a conta admin@vclass.mz com role=\'admin\'. Não existe nenhuma validação de arranque que rejeite o deploy em produção sem estas variáveis configuradas.',
    code: `// src/middleware/database.ts (linha 38)
export const DEMO_PASSWORD = 'vclass2024'
export const mockUsers = [
  ...
  { email: 'admin@vclass.mz', role: 'admin', ... },   // linha 120-133
]

// src/routes/auth.ts (linha 247)
if (!isDatabaseConfigured(c.env)) {
  const demoUser = mockUsers.find(u => u.email === email)
  if (!demoUser || password !== DEMO_PASSWORD) { ... 401 ... }
  // gera accessToken válido com role='admin' para admin@vclass.mz`,
    why: 'Isto corresponde exactamente ao padrão "default público que vira segredo real se não for sobrescrito": vclass2024 está em texto simples no repositório público. Se a env SUPABASE_URL/SUPABASE_ANON_KEY do Worker de produção não estiver definida (secret esquecido, nome trocado, binding não copiado ao criar novo ambiente Cloudflare Pages), a aplicação não falha de forma visível — passa silenciosamente a aceitar login como admin@vclass.mz / vclass2024 com um JWT de admin válido, assinado com o JWT_SECRET real de produção. Não há nenhum "startup check" que impeça isto de acontecer num ambiente que se pensa estar em produção.',
    exploitability: 'Requer que as variáveis SUPABASE_URL/SUPABASE_ANON_KEY estejam ausentes nesse ambiente Cloudflare (configuração incorrecta) — não é o caminho normal de produção documentado, mas nada no código impede ou avisa sobre esse estado.',
  },
  {
    id: 'F4', severity: 'medium', category: 'Isolamento de tenant',
    file: 'src/routes/creator.ts', lines: '680-719',
    title: 'Qualquer professor consegue listar nome e email de TODOS os alunos da plataforma',
    desc: 'GET /api/creator/students devolve, para qualquer utilizador com role teacher/admin, a lista completa de utilizadores com role=\'student\' e is_active=true (nome completo + email), de qualquer país, independentemente de o professor ter alguma vez leccionado a esse aluno. Só o progresso/nota é correctamente calculado apenas sobre as lições do próprio professor — mas a listagem de identidade (nome+email) não é filtrada.',
    code: `// src/routes/creator.ts (linha 703)
let usersQuery = supabase
  .from('users')
  .select('id, full_name, email, created_at', { count: 'exact' })
  .eq('role', 'student')
  .eq('is_active', true)
  // <- sem filtro por país do professor nem por relação professor-aluno`,
    why: 'Um professor de Angola pode paginar /api/creator/students e obter nome+email de estudantes de Moçambique, Portugal ou Brasil com quem nunca teve qualquer interacção — apenas porque a query busca TODA a tabela users filtrando só por papel. Isto viola o princípio de minimização de dados (o professor só precisa de ver os SEUS alunos) e expõe uma base de emails de milhares de estudantes a qualquer conta de professor.',
    exploitability: 'Reprodutível com qualquer conta de professor (role=teacher) real, sem configuração adicional; basta paginar ?page=N para exfiltrar toda a tabela de estudantes.',
  },
  {
    id: 'F5', severity: 'low', category: 'Inputs sem tratamento (XSS)',
    file: 'src/utils/email.ts', lines: '73-130',
    title: 'HTML de utilizador interpolado sem escape em emails transacionais',
    desc: 'Os templates de email (candidatura recebida/aprovada/rejeitada/info-pedida) interpolam directamente full_name (fornecido pelo próprio candidato em POST /api/teacher-verification/apply, sem autenticação) e a mensagem livre do avaliador, sem qualquer função de escape de HTML.',
    code: `// src/utils/email.ts (linha 77)
html: emailLayout('Candidatura recebida ✅', \`
  <p>Olá \${fullName},</p>   // fullName vem directo do formulário público, sem sanitização
  ...\`)
// linha 124 — mensagem do avaliador também sem escape:
<p ...>\${message}</p>`,
    why: 'Um candidato pode submeter full_name = "<a href=http://phish.example>Clique aqui</a>" (o schema Zod só valida comprimento mínimo, não caracteres) e esse HTML é injectado sem escape no corpo do email que o próprio Resend envia. A maioria dos clientes de email bloqueia <script>, mas HTML/CSS injectado pode alterar o layout ou introduzir links enganosos dentro de um email que parece legítimo da VClass — vector menor de phishing/spoofing visual, não execução de script.',
    exploitability: 'Reprodutível sem autenticação (endpoint público /apply); impacto limitado porque o email é enviado apenas para o próprio endereço submetido pelo candidato.',
  },
  {
    id: 'F6', severity: 'low', category: 'IDOR',
    file: 'src/routes/creator.ts', lines: '1124-1164',
    title: 'Estado de processamento de vídeo Bunny acessível sem verificar posse',
    desc: 'GET /api/creator/video/:videoId/status devolve título, thumbnail, duração e progresso de encoding de QUALQUER videoId do Bunny Stream da conta, sem confirmar que o vídeo pertence a uma lição criada pelo professor autenticado.',
    code: `// src/routes/creator.ts (linha 1124)
creator.get('/video/:videoId/status', async (c) => {
  const videoId = c.req.param('videoId')   // <- sem verificação de posse
  ... fetch(\`https://video.bunnycdn.com/library/\${bunnyLibraryId}/videos/\${videoId}\`, ...)
  return c.json({ success:true, data:{ title: v.title, thumbnailUrl: v.thumbnailUrl, ... } })`,
    why: 'Qualquer professor autenticado que adivinhe ou obtenha (ex: via inspecção de rede noutra aba) um videoId do Bunny de outro professor consegue ver o título e thumbnail desse vídeo antes mesmo de ser publicado. Impacto limitado (sem PII, sem acesso ao stream em si, que continua protegido por token HMAC em src/routes/video.ts), mas é uma verificação de posse em falta face ao padrão usado no resto do ficheiro (todas as outras rotas de creator.ts fazem .eq(\'created_by\', user.id)).',
    exploitability: 'Requer conhecer um videoId válido (GUID do Bunny, não enumerável por sequência) — reduz a probabilidade prática, mas o controlo de acesso está mesmo assim ausente.',
  },
  {
    id: 'F7', severity: 'info', category: 'Permissão definida no navegador',
    file: 'src/routes/pages.ts', lines: '1-105',
    title: 'Páginas HTML de painéis privilegiados são servidas sem verificação de sessão',
    desc: '/admin-dashboard.html, /finance-dashboard.html, /country-dashboard.html, /moderator-dashboard.html, /editor-dashboard.html e /support-dashboard.html são servidas a qualquer visitante (pages.ts não aplica authMiddleware). Isto é apenas o "invólucro" estático (HTML/JS) — todas as chamadas de API que essas páginas fazem para popular dados estão correctamente protegidas no backend (requireAdmin, requireFinanceOrAdmin, etc., confirmado nos routers correspondentes).',
    code: `// src/routes/pages.ts — sem authMiddleware em nenhuma rota
app.get('/admin-dashboard.html', (c) => c.html(adminDashboardHtml))
app.get('/finance-dashboard.html', (c) => c.html(financeDashboardHtml))`,
    why: 'Um visitante não autenticado consegue ver a estrutura/JS destes painéis (nomes de campos, endpoints chamados, lógica de negócio) sem autenticação, o que facilita o reconhecimento do alvo por um atacante — mas não expõe dados reais, porque cada chamada de API subsequente é rejeitada com 401/403 pelo backend. Classificada como informativa por não haver fuga de dados, apenas de estrutura.',
    exploitability: 'Sempre acessível publicamente por desenho actual — sem impacto directo de dados, apenas superfície de reconhecimento.',
  },
]

// Pontos fortes verificados
const STRENGTHS = [
  { area: 'Isolamento de dados do próprio utilizador', evidence: 'progress.ts, favorites.ts, bookmarks.ts, comments.ts (DELETE), sessions.ts e exercises.ts filtram consistentemente por .eq(\'student_id\'|\'user_id\', user.id) em cada query de leitura/escrita/remoção.' },
  { area: 'Posse verificada em conteúdo de professor', evidence: 'creator.ts confirma .eq(\'created_by\', user.id) antes de editar/apagar lição, capítulo, sessão ao vivo e item de biblioteca — em 10+ handlers distintos.' },
  { area: 'Isolamento de país replicado correctamente noutro módulo', evidence: 'teacher-verification.ts implementa getManagerCountry() e compara app.country_id com o país do gestor em 5 rotas (/applications, /:id, /:id/review, /:id/approve, /:id/reject, /:id/request-info) — prova que o padrão correcto já existe no projecto, tornando a omissão em country.ts (F1) uma regressão isolada, não uma lacuna de arquitectura.' },
  { area: 'Verificação de papel no servidor para todas as rotas privilegiadas', evidence: 'admin.ts, editor.ts, finance.ts, moderator.ts, support.ts e country.ts aplicam requireAdmin / requireEditorOrAdmin / requireFinanceOrAdmin / requireModeratorOrAdmin / requireSupportOrAdmin / requireCountryManagerOrAdmin como middleware global do router (nunca dependem só da UI esconder botões).' },
  { area: 'Segredos obrigatórios sem fallback inseguro', evidence: 'utils/jwt.ts (requireSecret) e routes/video.ts (getVideoSecret) lançam erro em runtime se JWT_SECRET/VIDEO_SECRET não tiverem, respectivamente, ≥16/≥32 caracteres — não existe nenhum valor por omissão que funcione como segredo real.' },
  { area: 'Nenhum segredo real no repositório ou histórico git', evidence: '.dev.vars nunca foi commitado (confirmado via git log --all -- .dev.vars e git ls-files); .gitignore cobre .env*/.dev.vars/.mcp.json; grep por padrões de chave (sk-, AKIA, key/secret literais) no código-fonte não encontrou nenhum valor real, só placeholders (sua-secret-super-secreta, your-...) em ficheiros de exemplo.' },
  { area: 'Escaping consistente de conteúdo gerado por utilizador no frontend', evidence: 'lesson.html usa escapeHtml() em nome de autor, texto de comentário/resposta, título de marcador e conceitos-chave antes de qualquer innerHTML — a excepção isolada é o Chat IA (F2).' },
  { area: 'Tokens de vídeo com escopo e expiração', evidence: 'routes/video.ts assina tokens HMAC-SHA256 com escopo (userId × lessonId × videoId) e expiração de 4h, valida IP/pertença ao utilizador antes de servir qualquer stream — o URL real do CDN nunca chega ao browser.' },
  { area: 'CSRF mitigado por desenho', evidence: 'O access token vai em header Authorization (nunca em cookie), imune a CSRF clássico; o refresh token usa cookie HttpOnly + Secure + SameSite=Strict (routes/auth.ts).' },
]

const RECOMMENDATIONS = [
  { p: 'P1', text: 'Corrigir country.ts (F1): adicionar a mesma verificação já usada em teacher-verification.ts — obter o country_code do gestor autenticado e comparar com o :id do path em TODAS as rotas /api/country/:id/*, devolvendo 403 em caso de mismatch (admin continua sem restrição).' },
  { p: 'P1', text: 'Corrigir a reflexão não escapada em chat.ts (F2): aplicar escape HTML ao texto do utilizador antes de o embutir em qualquer resposta textual, e/ou sanitizar no frontend (chat.html) antes do innerHTML — nunca confiar em texto vindo da API para innerHTML sem passar por escapeHtml() ou um sanitizador (ex: DOMPurify).' },
  { p: 'P2', text: 'Adicionar uma validação de arranque (fail-fast) que rejeite requests em produção se SUPABASE_URL/SUPABASE_ANON_KEY não estiverem definidas, em vez de cair silenciosamente em modo demo com password fixa (F3). Alternativamente, gerar a password demo aleatoriamente por deploy e nunca reutilizar "admin@vclass.mz" com uma password documentada publicamente.' },
  { p: 'P2', text: 'Restringir GET /api/creator/students (F4) aos alunos com progresso registado nas lições do próprio professor (mesma lógica já usada para o cálculo de score), em vez de devolver toda a tabela de estudantes.' },
  { p: 'P3', text: 'Escapar full_name/message antes de os interpolar nos templates HTML de email em utils/email.ts (F5) — usar uma função simples de escape ou uma lib de sanitização de HTML de email.' },
  { p: 'P3', text: 'Adicionar .eq(\'created_by\', user.id) (via lookup da lição associada ao videoId) em GET /api/creator/video/:videoId/status (F6), alinhando com o padrão já usado no resto de creator.ts.' },
  { p: 'P3', text: 'Opcional: aplicar authMiddleware/optionalAuth a pages.ts (F7) e devolver um redirect para /login.html quando a página exigir sessão, reduzindo a superfície de reconhecimento — sem impacto funcional, já que os dados continuam protegidos pela API.' },
]

// Issues GitHub — texto completo Markdown
const ISSUES = [
{
  title: '[Segurança] Country Manager acede e altera dados de qualquer país (crítico)',
  labels: 'security, critical',
  body: `## Problema
Todas as rotas \`/api/country/:id/*\` (stats, teachers, users, curriculum, teachers/:tid, announcement) só validam o **papel** do utilizador (\`requireCountryManagerOrAdmin\`), nunca comparam o \`:id\` do país pedido com o \`country_code\` do próprio gestor autenticado. \`GET /api/country/me\` resolve correctamente o país do gestor, mas as restantes rotas ignoram essa restrição.

## Por que é explorável
Qualquer conta com \`role='country_manager'\` (não precisa de admin) pode chamar estas rotas trocando o \`:id\` do URL por qualquer código de país, obtendo acesso total de gestão sobre países que não lhe pertencem.

## Evidência
\`src/routes/country.ts:395-411\`
\`\`\`ts
country.get('/:id/users', async (c) => {
  const id = c.req.param('id')             // vem directo do URL, sem verificação
  ...
  .eq('country_code', id)
})
\`\`\`
\`src/routes/country.ts:445-460\`
\`\`\`ts
country.patch('/:id/teachers/:tid', async (c) => {
  const tid = c.req.param('tid')
  ...
  .update({ is_active: body.status !== 'inactive' }).eq('id', tid)
})
\`\`\`

## Impacto
- Leitura de PII (nome, email, notas) de alunos e professores de qualquer país.
- Desactivação/reactivação de contas de professores de outros países.
- Envio de avisos ("announcements") em nome de países que não gere.

## Sugestão de correcção
Replicar o padrão já usado em \`src/routes/teacher-verification.ts\` (\`getManagerCountry()\` + comparação \`app.country_id !== managerCountry\` → 403) em todas as rotas \`/api/country/:id/*\`, mantendo o admin sem restrição.

## Critérios de aceite
- [ ] \`GET/PATCH/POST /api/country/:id/*\` devolve 403 quando \`role==='country_manager'\` e \`:id\` ≠ país do gestor.
- [ ] Admin continua a aceder sem restrição a qualquer \`:id\`.
- [ ] Teste automatizado cobrindo o caso de mismatch para cada rota afectada.
- [ ] \`GET /api/country/me\` continua a funcionar sem alterações.`
},
{
  title: '[Segurança] XSS reflectido no Chat IA expõe o token de sessão (alto)',
  labels: 'security, high',
  body: `## Problema
Quando a pergunta do utilizador não corresponde a nenhuma tag da base de conhecimento local, o backend devolve o texto do utilizador embutido sem escaping HTML na resposta do "assistente". O frontend injecta essa resposta via \`innerHTML\` depois de só converter marcações markdown, sem nunca escapar HTML.

## Por que é explorável
Este é o caminho por omissão sempre que \`OPENAI_API_KEY\` não está configurada (variável opcional) ou a chamada à API OpenAI falha. O JWT de acesso vive em \`localStorage.accessToken\` (sem HttpOnly), por isso um script injectado consegue lê-lo e exfiltrá-lo.

## Evidência
\`src/routes/chat.ts\` (fallback local):
\`\`\`ts
return \`Boa pergunta sobre **"\${message.substring(0, 60)}"**! 🤔 ...\`
\`\`\`
\`src/pages/chat.html:402-411\`:
\`\`\`js
function formatBotText(text) {
    text = text.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>') // sem escape prévio
    return text
}
\`\`\`
\`src/pages/chat.html:313-320\`:
\`\`\`js
div.innerHTML = \`... <div class="text-sm">\${formattedText}</div> ...\`
\`\`\`

## Impacto
Roubo do token de sessão (\`localStorage.accessToken\`) → sequestro de conta. Vector prático: engenharia social ("cola este texto no chat para desbloquear X").

## Sugestão de correcção
Escapar HTML do texto do utilizador antes de o embutir em qualquer resposta textual do backend, **e** sanitizar/escapar no frontend antes do \`innerHTML\` (nunca confiar apenas numa das duas camadas).

## Critérios de aceite
- [ ] Enviar \`<img src=x onerror=alert(1)>\` como mensagem não executa script na resposta do chat.
- [ ] Testes cobrindo o fallback local e o caminho de erro da API OpenAI.
- [ ] Marcação markdown (negrito, código) continua a funcionar para texto legítimo.`
},
{
  title: '[Segurança] Modo demo com password fixa pode conceder acesso de admin (médio)',
  labels: 'security, medium',
  body: `## Problema
Sem \`SUPABASE_URL\`/\`SUPABASE_ANON_KEY\` configuradas, o login cai em modo demo: aceita qualquer conta de \`mockUsers\` (incluindo \`admin@vclass.mz\`, role \`admin\`) com a password fixa \`DEMO_PASSWORD = 'vclass2024'\`, gerando um JWT real assinado com o \`JWT_SECRET\` de produção. Não há validação de arranque que impeça isto.

## Por que é explorável
Um erro de configuração (secret não copiado ao criar novo ambiente, nome de variável trocado) faz a app degradar silenciosamente para um estado onde qualquer pessoa que conheça a password pública do repositório (\`vclass2024\`) obtém um JWT de administrador válido.

## Evidência
\`src/middleware/database.ts:38\`
\`\`\`ts
export const DEMO_PASSWORD = 'vclass2024'
\`\`\`
\`src/routes/auth.ts:247-256\`
\`\`\`ts
if (!isDatabaseConfigured(c.env)) {
  const demoUser = mockUsers.find(u => u.email === email)
  if (!demoUser || password !== DEMO_PASSWORD) { ... }
  // gera accessToken válido com role do demoUser (inclui 'admin')
\`\`\`

## Impacto
Acesso administrativo completo caso o ambiente de produção fique, por engano, sem as variáveis Supabase configuradas.

## Sugestão de correcção
Adicionar uma validação de arranque que recuse operar em modo demo fora de ambientes explicitamente marcados como dev/staging (ex: variável \`ENVIRONMENT=production\` obrigatória e incompatível com modo demo), ou gerar a password demo aleatoriamente por deploy.

## Critérios de aceite
- [ ] Em produção, ausência de SUPABASE_URL/SUPABASE_ANON_KEY resulta em erro explícito, não em fallback silencioso para modo demo.
- [ ] Modo demo, quando permitido (dev/staging), documentado como tal na resposta da API.`
},
{
  title: '[Segurança] Lista de alunos exposta a qualquer professor sem filtro (médio)',
  labels: 'security, medium',
  body: `## Problema
\`GET /api/creator/students\` devolve nome completo e email de **todos** os utilizadores com \`role='student'\` e \`is_active=true\` da plataforma, sem filtrar por país ou por relação professor-aluno. Só o progresso/nota é calculado apenas sobre as lições do próprio professor.

## Por que é explorável
Qualquer conta de professor real (sem privilégio especial) consegue paginar este endpoint e exfiltrar nome+email de todos os estudantes da plataforma, incluindo os de outros países com quem nunca teve qualquer interacção.

## Evidência
\`src/routes/creator.ts:703-707\`
\`\`\`ts
let usersQuery = supabase
  .from('users')
  .select('id, full_name, email, created_at', { count: 'exact' })
  .eq('role', 'student')
  .eq('is_active', true)
\`\`\`

## Impacto
Exposição em massa de PII (nome + email) de estudantes a qualquer professor, violando minimização de dados.

## Sugestão de correcção
Restringir a lista aos alunos com progresso registado nas lições do próprio professor (mesma lógica já usada mais abaixo na função para calcular score/progresso), aplicando esse filtro **antes** da paginação, não só no cálculo de métricas.

## Critérios de aceite
- [ ] \`GET /api/creator/students\` só devolve alunos com pelo menos um registo em \`student_progress\` associado a uma lição do professor autenticado.
- [ ] Paginação e contagem total reflectem o novo filtro.`
},
{
  title: '[Segurança] HTML sem escape em emails transacionais e IDOR no estado de vídeo Bunny (baixo)',
  labels: 'security, low',
  body: `Agrupados por serem de baixa severidade e afectarem áreas relacionadas de tratamento de input.

## 1) HTML de utilizador não escapado em emails (\`src/utils/email.ts:73-130\`)
\`full_name\` (submetido sem autenticação em \`POST /api/teacher-verification/apply\`) e a mensagem livre do avaliador são interpolados directamente em templates HTML de email, sem escape:
\`\`\`ts
html: emailLayout('Candidatura recebida ✅', \`<p>Olá \${fullName},</p> ...\`)
\`\`\`
**Impacto:** injecção de HTML/links no corpo do email (phishing visual); a maioria dos clientes de email bloqueia \`<script>\`, pelo que o impacto é limitado a alteração de layout/links, não execução de código.

## 2) IDOR no estado de vídeo Bunny (\`src/routes/creator.ts:1124-1164\`)
\`GET /api/creator/video/:videoId/status\` devolve título/thumbnail/progresso de qualquer \`videoId\`, sem confirmar que pertence a uma lição do professor autenticado — todas as outras rotas do mesmo ficheiro fazem essa verificação via \`.eq('created_by', user.id)\`.

## Sugestão de correcção
- Escapar \`full_name\`/\`message\` antes de os interpolar em \`utils/email.ts\`.
- Adicionar verificação de posse (lookup da lição pelo \`videoId\`) em \`GET /api/creator/video/:videoId/status\`.

## Critérios de aceite
- [ ] Candidatura com \`full_name\` contendo HTML não altera a estrutura do email enviado.
- [ ] \`GET /api/creator/video/:videoId/status\` devolve 404/403 quando o \`videoId\` não pertence a uma lição do professor autenticado.`
},
]

// ── Contagens para os gráficos ───────────────────────────────────────────────
const SEV_ORDER = ['critical', 'high', 'medium', 'low', 'info']
const sevCounts = Object.fromEntries(SEV_ORDER.map(s => [s, FINDINGS.filter(f => f.severity === s).length]))
const catCounts = {}
FINDINGS.forEach(f => { catCounts[f.category] = (catCounts[f.category] || 0) + 1 })

// ============================================================
//  Motor de layout PDF
// ============================================================
const PAGE_W = 595.28, PAGE_H = 841.89 // A4
const MARGIN = 56.7 // ~2cm
const CONTENT_W = PAGE_W - 2 * MARGIN

const doc = await PDFDocument.create()
doc.setTitle('Relatório de Auditoria de Segurança — VClass')
doc.setAuthor('Auditoria de Segurança Automatizada')
doc.setSubject('Auditoria de Segurança')

const fRegular = await doc.embedFont(StandardFonts.Helvetica)
const fBold = await doc.embedFont(StandardFonts.HelveticaBold)
const fOblique = await doc.embedFont(StandardFonts.HelveticaOblique)
const fMono = await doc.embedFont(StandardFonts.Courier)
const fMonoBold = await doc.embedFont(StandardFonts.CourierBold)

// Substitui caracteres fora do WinAnsi (emojis, etc.) por um marcador seguro
function sanitize(str) {
  return String(str ?? '')
    .replace(/\r\n/g, '\n')
    .split('').map(ch => {
      const code = ch.codePointAt(0)
      if (code === 0x0A) return ch
      if (code >= 0x20 && code <= 0xFF) return ch
      // mapear alguns símbolos comuns para equivalentes ASCII
      return ''
    }).join('')
    .replace(/[ \t]{2,}/g, ' ')
}

let pages = []
let cur = null
let y = 0

function addPage() {
  const page = doc.addPage([PAGE_W, PAGE_H])
  pages.push(page)
  cur = page
  y = PAGE_H - MARGIN
  return page
}

function ensureSpace(h) {
  if (y - h < MARGIN + 20) addPage()
}

function drawText(text, { x = MARGIN, size = 10, font = fRegular, color = COLORS.dark, lineGap = 3.6 } = {}) {
  const clean = sanitize(text)
  cur.drawText(clean, { x, y, size, font, color })
  y -= size + lineGap
}

// Quebra texto em linhas que cabem em maxWidth. Palavras isoladas mais
// largas que maxWidth (ex: identificadores longos unidos por "/") são
// forçadas a quebrar carácter-a-carácter, para nunca sair da página.
function wrapLines(text, font, size, maxWidth) {
  const clean = sanitize(text)
  const paragraphs = clean.split('\n')
  const lines = []
  const pushWord = (line, w) => {
    // Se a própria palavra já não cabe sozinha na largura, parte-a em pedaços.
    if (font.widthOfTextAtSize(w, size) > maxWidth) {
      if (line) { lines.push(line) }
      let chunk = ''
      for (const ch of w) {
        const test = chunk + ch
        if (font.widthOfTextAtSize(test, size) > maxWidth && chunk) {
          lines.push(chunk)
          chunk = ch
        } else {
          chunk = test
        }
      }
      return chunk
    }
    return line ? line + ' ' + w : w
  }
  for (const para of paragraphs) {
    if (para.trim() === '') { lines.push(''); continue }
    const words = para.split(' ')
    let line = ''
    for (const w of words) {
      const test = line ? line + ' ' + w : w
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        lines.push(line)
        line = pushWord('', w)
      } else if (font.widthOfTextAtSize(w, size) > maxWidth) {
        line = pushWord(line, w)
      } else {
        line = test
      }
    }
    if (line) lines.push(line)
  }
  return lines
}

function drawParagraph(text, { x = MARGIN, size = 10, font = fRegular, color = COLORS.gray, maxWidth = CONTENT_W, lineGap = 4 } = {}) {
  const lines = wrapLines(text, font, size, maxWidth)
  for (const ln of lines) {
    ensureSpace(size + lineGap)
    cur.drawText(ln, { x, y, size, font, color })
    y -= size + lineGap
  }
}

function drawCodeBlock(text, { x = MARGIN, size = 8, maxWidth = CONTENT_W } = {}) {
  const lines = []
  sanitize(text).split('\n').forEach(raw => {
    // quebra linhas de código muito longas
    let line = raw
    while (fMono.widthOfTextAtSize(line, size) > maxWidth - 16 && line.length > 10) {
      let cut = line.length
      while (cut > 10 && fMono.widthOfTextAtSize(line.slice(0, cut), size) > maxWidth - 16) cut--
      lines.push(line.slice(0, cut))
      line = '  ' + line.slice(cut)
    }
    lines.push(line)
  })
  const lineHeight = size + 3.4
  const padTop = 8, padBottom = 6
  const blockH = lines.length * lineHeight + padTop + padBottom

  // Bloco de código pode ultrapassar o espaço restante da página — se for o
  // caso, quebra para a página seguinte ANTES de desenhar o rectângulo de
  // fundo, para nunca cortar o rectângulo a meio.
  if (blockH + 10 > PAGE_H - 2 * MARGIN) {
    // bloco maior que uma página inteira: desenha na página actual mesmo assim
  }
  ensureSpace(Math.min(blockH + 10, PAGE_H - 2 * MARGIN))

  const rectTop = y
  const rectBottom = y - blockH
  cur.drawRectangle({ x, y: rectBottom, width: maxWidth, height: blockH, color: rgb(0.965, 0.965, 0.975), borderColor: COLORS.border, borderWidth: 0.75 })

  let ty = rectTop - padTop - size * 0.8
  for (const ln of lines) {
    cur.drawText(ln, { x: x + 8, y: ty, size, font: fMono, color: COLORS.dark })
    ty -= lineHeight
  }
  y = rectBottom - 6
}

function severityColor(sev) { return COLORS[sev] || COLORS.gray }

function drawChip(label, color, x, yTop, size = 8.5) {
  const padX = 6, h = size + 6
  const w = fBold.widthOfTextAtSize(label, size) + padX * 2
  cur.drawRectangle({ x, y: yTop - h, width: w, height: h, color, borderWidth: 0 })
  cur.drawText(label, { x: x + padX, y: yTop - h + 4.2, size, font: fBold, color: COLORS.white })
  return w
}

function header(title) {
  cur.drawText(sanitize(title), { x: MARGIN, y: PAGE_H - MARGIN + 18, size: 9, font: fBold, color: COLORS.purple })
  cur.drawLine({ start: { x: MARGIN, y: PAGE_H - MARGIN + 10 }, end: { x: PAGE_W - MARGIN, y: PAGE_H - MARGIN + 10 }, thickness: 0.75, color: COLORS.border })
}

function sectionTitle(text) {
  ensureSpace(34)
  cur.drawRectangle({ x: MARGIN, y: y - 22, width: 4, height: 22, color: COLORS.purple })
  cur.drawText(sanitize(text), { x: MARGIN + 12, y: y - 17, size: 15, font: fBold, color: COLORS.dark })
  y -= 34
}

function subTitle(text, color = COLORS.dark) {
  ensureSpace(20)
  cur.drawText(sanitize(text), { x: MARGIN, y, size: 11.5, font: fBold, color })
  y -= 18
}

// ============================================================
//  1. CAPA
// ============================================================
addPage()
cur.drawRectangle({ x: 0, y: PAGE_H - 230, width: PAGE_W, height: 230, color: COLORS.dark })
cur.drawRectangle({ x: 0, y: PAGE_H - 234, width: PAGE_W, height: 4, color: COLORS.purple })

cur.drawText('RELATÓRIO DE AUDITORIA', { x: MARGIN, y: PAGE_H - 100, size: 26, font: fBold, color: COLORS.white })
cur.drawText('DE SEGURANÇA', { x: MARGIN, y: PAGE_H - 132, size: 26, font: fBold, color: COLORS.white })
cur.drawText(`Projecto ${PROJECT_NAME}`, { x: MARGIN, y: PAGE_H - 165, size: 15, font: fRegular, color: rgb(0.85,0.85,0.9) })
cur.drawText(AUDIT_DATE, { x: MARGIN, y: PAGE_H - 190, size: 11, font: fOblique, color: rgb(0.7,0.7,0.8) })

y = PAGE_H - 270
subTitle('Escopo Auditado')
drawParagraph(SCOPE, { size: 10.5 })
y -= 8

subTitle('Nota Metodológica')
drawParagraph('A stack do projecto foi detectada antes do início da auditoria: backend Hono sobre Cloudflare Workers/Pages, cliente Supabase (service_role, sem RLS activo), autenticação JWT própria (jsonwebtoken + bcryptjs), frontend em páginas HTML estáticas com JavaScript vanilla (sem framework SPA), deploy via wrangler.jsonc/Cloudflare Pages, CI em .github/. Cada categoria da auditoria foi mapeada ao mecanismo equivalente desta stack:', { size: 10 })
y -= 4
STACK_NOTE.forEach(item => {
  ensureSpace(14)
  drawText(`- ${item.cat}`, { size: 9.5, font: fBold, color: COLORS.purple })
  drawParagraph(item.mapping, { size: 9, x: MARGIN + 12, maxWidth: CONTENT_W - 12 })
  y -= 3
})

// ============================================================
//  2. RESUMO EXECUTIVO
// ============================================================
addPage()
header('Relatório de Auditoria de Segurança — VClass')
sectionTitle('Resumo Executivo')

const totalFindings = FINDINGS.length
drawParagraph(`A auditoria percorreu os 25 routers de API, os middlewares de autenticação/CORS/rate-limit, as 33 páginas do frontend e os ficheiros de configuração de deploy, verificando as cinco categorias solicitadas. Foram confirmados ${totalFindings} achados (1 crítica, 1 alta, 2 médias, 2 baixas, 1 informativa) e documentados 8 pontos fortes com evidência concreta no código.`, { size: 10.5 })
y -= 10

// ── Gráfico de rosca (severidade) + Legenda ──
subTitle('Achados por Severidade')
{
  const chartTop = y
  const cx = MARGIN + 95, cy = chartTop - 95, rOuter = 80, rInner = 46
  const total = totalFindings
  let angleStart = 0
  const order = ['critical','high','medium','low','info']
  for (const sev of order) {
    const count = sevCounts[sev]
    if (!count) continue
    const sweep = (count / total) * 360
    drawDonutSlice(cx, cy, rOuter, rInner, angleStart, angleStart + sweep, severityColor(sev))
    angleStart += sweep
  }
  cur.drawText(String(total), { x: cx - fBold.widthOfTextAtSize(String(total), 22)/2, y: cy - 8, size: 22, font: fBold, color: COLORS.dark })
  cur.drawText('achados', { x: cx - fRegular.widthOfTextAtSize('achados', 8)/2, y: cy - 22, size: 8, font: fRegular, color: COLORS.lightGray })

  // legenda à direita do donut
  let ly = chartTop - 14
  const lx = MARGIN + 220
  for (const sev of order) {
    const count = sevCounts[sev]
    cur.drawRectangle({ x: lx, y: ly - 9, width: 11, height: 11, color: severityColor(sev) })
    cur.drawText(`${SEV_LABEL[sev]}`, { x: lx + 17, y: ly - 8, size: 10, font: fBold, color: COLORS.dark })
    cur.drawText(`${count} achado${count === 1 ? '' : 's'}`, { x: lx + 17, y: ly - 20, size: 8.5, font: fRegular, color: COLORS.gray })
    ly -= 34
  }
  y = chartTop - 200
}

// ── Gráfico de barras (categoria) ──
subTitle('Achados por Categoria')
{
  const cats = Object.keys(catCounts)
  const maxCount = Math.max(...Object.values(catCounts), 1)
  const chartTop = y
  const chartH = 130
  const barAreaW = CONTENT_W
  const barW = Math.min(46, (barAreaW / cats.length) - 18)
  const gap = (barAreaW - barW * cats.length) / (cats.length - 1 || 1)

  cur.drawLine({ start: { x: MARGIN, y: chartTop - chartH }, end: { x: MARGIN + barAreaW, y: chartTop - chartH }, thickness: 0.75, color: COLORS.border })

  cats.forEach((cat, i) => {
    const count = catCounts[cat]
    const h = (count / maxCount) * (chartH - 20)
    const x = MARGIN + i * (barW + gap)
    const barColor = count >= 2 ? COLORS.high : (cat.toLowerCase().includes('permiss') ? COLORS.strength : COLORS.low)
    cur.drawRectangle({ x, y: chartTop - chartH, width: barW, height: h, color: barColor })
    cur.drawText(String(count), { x: x + barW/2 - fBold.widthOfTextAtSize(String(count),10)/2, y: chartTop - chartH + h + 4, size: 10, font: fBold, color: COLORS.dark })
    // rótulo da categoria (multi-linha, pequeno)
    const labelLines = wrapLines(cat, fRegular, 7, barW + gap - 4)
    let ly = chartTop - chartH - 11
    labelLines.slice(0,3).forEach(ln => {
      const lw = fRegular.widthOfTextAtSize(ln, 7)
      cur.drawText(ln, { x: x + barW/2 - lw/2, y: ly, size: 7, font: fRegular, color: COLORS.gray })
      ly -= 9
    })
  })
  y = chartTop - chartH - 46
}

// ============================================================
//  3. PONTOS FORTES E PONTOS FRACOS
// ============================================================
addPage()
header('Relatório de Auditoria de Segurança — VClass')
sectionTitle('Pontos Fortes (protegidos, com evidência)')
STRENGTHS.forEach(s => {
  ensureSpace(30)
  drawChip('OK', COLORS.strength, MARGIN, y + 11, 8)
  const areaLines = wrapLines(s.area, fBold, 10, CONTENT_W - 30)
  areaLines.forEach(ln => { cur.drawText(sanitize(ln), { x: MARGIN + 30, y, size: 10, font: fBold, color: COLORS.dark }); y -= 13 })
  drawParagraph(s.evidence, { x: MARGIN + 30, size: 8.8, maxWidth: CONTENT_W - 30, color: COLORS.gray })
  y -= 6
})

y -= 6
sectionTitle('Pontos Fracos (riscos centrais)')
drawParagraph('O risco central desta auditoria é a ausência de RLS no Supabase combinada com uma única lacuna de verificação de tenant em country.ts (F1): a arquitectura confia inteiramente em cada handler filtrar manualmente por dono/país, e uma única rota que esqueça esse filtro expõe dados de todos os tenants. O segundo risco central é a inconsistência de escaping no Chat IA (F2): o resto do frontend escapa HTML de forma disciplinada, mas o chat quebra esse padrão e permite roubo de token de sessão. Ambos são corrigíveis de forma cirúrgica (replicar padrões já existentes no próprio código), sem redesenho de arquitectura.', { size: 10 })

// ============================================================
//  4. TABELA DE ACHADOS DETALHADOS
// ============================================================
addPage()
header('Relatório de Auditoria de Segurança — VClass')
sectionTitle('Achados Detalhados por Categoria')

const grouped = {}
FINDINGS.forEach(f => { (grouped[f.category] = grouped[f.category] || []).push(f) })

Object.entries(grouped).forEach(([cat, items]) => {
  ensureSpace(22)
  drawText(cat, { size: 12, font: fBold, color: COLORS.purple })
  y -= 2

  items.forEach(f => {
    ensureSpace(70)
    const rowTop = y
    const chipW = drawChip(SEV_LABEL[f.severity], severityColor(f.severity), MARGIN, rowTop + 12, 8.5)
    const titleX = MARGIN + chipW + 10
    const titleWidth = CONTENT_W - chipW - 10
    const titleLines = wrapLines(`${f.id} — ${f.title}`, fBold, 10, titleWidth)
    let titleY = rowTop
    titleLines.forEach(ln => {
      cur.drawText(sanitize(ln), { x: titleX, y: titleY, size: 10, font: fBold, color: COLORS.dark })
      titleY -= 13
    })
    y = titleY - 2
    cur.drawText(sanitize(`${f.file} : ${f.lines}`), { x: MARGIN, y, size: 8.3, font: fMono, color: COLORS.gray })
    y -= 13
    drawParagraph(f.desc, { size: 8.8, maxWidth: CONTENT_W, color: COLORS.gray })
    y -= 4
    drawText('Código:', { size: 8, font: fBold, color: COLORS.dark })
    drawCodeBlock(f.code, { size: 7.6 })
    drawText('Por que é explorável:', { size: 8.5, font: fBold, color: COLORS.dark })
    drawParagraph(f.why, { size: 8.6, color: COLORS.gray })
    y -= 2
    drawText('Condições de exploração:', { size: 8.5, font: fBold, color: COLORS.dark })
    drawParagraph(f.exploitability, { size: 8.6, color: COLORS.gray })
    y -= 14
    ensureSpace(1)
    cur.drawLine({ start: { x: MARGIN, y: y + 6 }, end: { x: PAGE_W - MARGIN, y: y + 6 }, thickness: 0.5, color: COLORS.border })
    y -= 8
  })
})

// ============================================================
//  5. RECOMENDAÇÕES PRIORIZADAS
// ============================================================
addPage()
header('Relatório de Auditoria de Segurança — VClass')
sectionTitle('Recomendações Priorizadas')
RECOMMENDATIONS.forEach(r => {
  ensureSpace(28)
  const chipColor = r.p === 'P1' ? COLORS.critical : r.p === 'P2' ? COLORS.medium : COLORS.low
  const w = drawChip(r.p, chipColor, MARGIN, y + 11, 9)
  drawParagraph(r.text, { x: MARGIN + w + 10, size: 9.6, maxWidth: CONTENT_W - w - 10 })
  y -= 8
})

// ============================================================
//  6. ISSUES PARA O GITHUB
// ============================================================
addPage()
header('Relatório de Auditoria de Segurança — VClass')
sectionTitle('Issues para o GitHub')
drawParagraph('As issues abaixo estão prontas para copiar e colar directamente no GitHub. Cada bloco delimitado corresponde a uma issue completa em Markdown.', { size: 9.5 })
y -= 6

ISSUES.forEach((issue, i) => {
  ensureSpace(40)
  drawText(`--- ISSUE ${i + 1} ---`, { size: 9, font: fMonoBold, color: COLORS.purple })
  y -= 2
  drawParagraph(`Título: ${issue.title}`, { size: 9, font: fBold, color: COLORS.dark, lineGap: 2 })
  drawParagraph(`Labels sugeridas: ${issue.labels}`, { size: 8.5, font: fOblique, color: COLORS.gray, lineGap: 2 })
  y -= 4
  const bodyLines = wrapLines(issue.body, fMono, 7.6, CONTENT_W)
  bodyLines.forEach(ln => {
    ensureSpace(11)
    cur.drawText(ln, { x: MARGIN, y, size: 7.6, font: fMono, color: COLORS.dark })
    y -= 10.6
  })
  y -= 4
  ensureSpace(14)
  drawText(`--- FIM ISSUE ${i + 1} ---`, { size: 9, font: fMonoBold, color: COLORS.purple })
  y -= 16
})

// ============================================================
//  Funções auxiliares de desenho vectorial (donut)
// ============================================================
// pdf-lib's drawSvgPath renders path coordinates in SVG space (y grows
// downward) and flips them internally. To place a slice at absolute PDF
// coordinates (cx,cy with normal y-up meaning), we pass anchor x=0,y=0 and
// negate every y we compute so the internal flip lands it in the right spot.
function drawDonutSlice(cx, cy, rOuter, rInner, aStartDeg, aEndDeg, color) {
  const segments = Math.max(2, Math.ceil((aEndDeg - aStartDeg) / 6))
  const toRad = d => (d * Math.PI) / 180
  // Convenção: 0° = topo (12h), ângulo cresce no sentido horário.
  const point = (r, aDeg) => {
    const a = toRad(aDeg)
    const px = cx + r * Math.sin(a)
    const py = cy + r * Math.cos(a)
    return [px, -py] // negado por causa do flip interno do drawSvgPath
  }
  let path = ''
  for (let i = 0; i <= segments; i++) {
    const a = aStartDeg + (aEndDeg - aStartDeg) * (i / segments)
    const [px, py] = point(rOuter, a)
    path += (i === 0 ? 'M' : 'L') + px.toFixed(2) + ' ' + py.toFixed(2) + ' '
  }
  for (let i = segments; i >= 0; i--) {
    const a = aStartDeg + (aEndDeg - aStartDeg) * (i / segments)
    const [px, py] = point(rInner, a)
    path += 'L' + px.toFixed(2) + ' ' + py.toFixed(2) + ' '
  }
  path += 'Z'
  cur.drawSvgPath(path, { color, borderWidth: 0, x: 0, y: 0 })
}

// ============================================================
//  Cabeçalho/rodapé finais em todas as páginas + numeração
// ============================================================
const totalPages = pages.length
pages.forEach((page, idx) => {
  if (idx === 0) return // capa sem rodapé de secção
  page.drawLine({ start: { x: MARGIN, y: MARGIN - 12 }, end: { x: PAGE_W - MARGIN, y: MARGIN - 12 }, thickness: 0.75, color: COLORS.border })
  page.drawText('Relatório de Auditoria de Segurança — VClass', { x: MARGIN, y: MARGIN - 24, size: 7.5, font: fRegular, color: COLORS.lightGray })
  const pgLabel = `Página ${idx + 1} de ${totalPages}`
  const pgW = fRegular.widthOfTextAtSize(pgLabel, 7.5)
  page.drawText(pgLabel, { x: PAGE_W - MARGIN - pgW, y: MARGIN - 24, size: 7.5, font: fRegular, color: COLORS.lightGray })
})
// Rodapé simples na capa
pages[0].drawText(`Página 1 de ${totalPages}`, { x: PAGE_W - MARGIN - fRegular.widthOfTextAtSize(`Página 1 de ${totalPages}`,7.5), y: MARGIN - 24, size: 7.5, font: fRegular, color: rgb(0.6,0.6,0.65) })

const pdfBytes = await doc.save()
writeFileSync(OUT_PATH, pdfBytes)
console.log(`PDF gerado: ${OUT_PATH}`)
console.log(`Total de paginas: ${totalPages}`)
