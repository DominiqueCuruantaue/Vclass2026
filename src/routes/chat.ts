// AI Chat Route — VClass
// Usa OpenAI-compatible endpoint (configurável via OPENAI_API_KEY + OPENAI_BASE_URL)
// Fallback inteligente para base de conhecimento local quando sem chave API
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { authMiddleware } from '../middleware/auth'
import { z } from 'zod'
import type { ApiResponse } from '../types'

const chat = new Hono<{ Bindings: CloudflareBindings }>()
chat.use('*', authMiddleware)

// ── Knowledge base local (fallback sem API key) ───────────────────────────────
const LOCAL_KB = [
  {
    tags: ['função quadrática','equação quadrática','parábola','bhaskara','baskara','delta','discriminante'],
    subject: 'Matemática',
    response: `**Funções Quadráticas** 📐

Uma função quadrática tem a forma **f(x) = ax² + bx + c** (a ≠ 0)

**Fórmula de Bhaskara:**
x = (-b ± √Δ) / 2a · onde **Δ = b² - 4ac**

**Casos do discriminante:**
• Δ > 0 → 2 raízes reais distintas
• Δ = 0 → 1 raiz real (dupla)
• Δ < 0 → sem raízes reais

**Vértice da parábola:**
xᵥ = -b/2a | yᵥ = -Δ/4a`
  },
  {
    tags: ['newton','lei de newton','força','inércia','ação reação','massa','aceleração'],
    subject: 'Física',
    response: `**Leis de Newton** ⚡

**1ª Lei (Inércia):** Um corpo em repouso tende a permanecer em repouso; em movimento, a continuar em movimento.

**2ª Lei:** F = m·a (Força = massa × aceleração, em Newtons)

**3ª Lei (Ação e Reação):** Para toda ação há uma reação igual e contrária.

💡 A força **resultante** é a soma vetorial de todas as forças que agem sobre o corpo.`
  },
  {
    tags: ['tabela periódica','elemento','período','grupo','número atômico','metal','não-metal'],
    subject: 'Química',
    response: `**Tabela Periódica** 🧪

Organiza os **118 elementos** por número atômico crescente.

**Organização:**
• **Períodos** (linhas) → mesmo nível de energia principal
• **Grupos** (colunas) → mesmas propriedades químicas

**Grupos importantes:**
• Grupo 1 → Metais Alcalinos (Li, Na, K…)
• Grupo 17 → Halogênios (F, Cl, Br…)
• Grupo 18 → Gases Nobres (He, Ne, Ar…)

Z (número atômico) = nº de prótons = nº de elétrons (átomo neutro)`
  },
  {
    tags: ['derivada','derivação','derivar','cálculo diferencial','taxa de variação','integral'],
    subject: 'Matemática',
    response: `**Derivadas** 📈

A derivada f'(x) mede a taxa de variação instantânea de f(x).

**Regras principais:**
• Constante: (c)' = 0
• Potência: (xⁿ)' = n·xⁿ⁻¹
• Soma: (f+g)' = f' + g'
• Produto: (f·g)' = f'·g + f·g'

**Exemplos:**
• f(x) = x³ → f'(x) = 3x²
• f(x) = 5x² + 3x + 1 → f'(x) = 10x + 3`
  },
  {
    tags: ['célula','mitose','meiose','dna','gene','cromossomo','genética','proteína'],
    subject: 'Biologia',
    response: `**Biologia Celular** 🔬

**Tipos de células:**
• **Procariótica** → sem núcleo definido (bactérias)
• **Eucariótica** → com núcleo definido (animais, plantas, fungos)

**Divisão celular:**
• **Mitose** → 2 células-filhas idênticas (crescimento e regeneração)
• **Meiose** → 4 células com metade dos cromossomos (reprodução)

**DNA:** dupla hélice com bases A-T e C-G · Gene = segmento que codifica uma proteína`
  },
  {
    tags: ['trigonometria','seno','cosseno','tangente','triângulo','pitágoras','hipotenusa'],
    subject: 'Matemática',
    response: `**Trigonometria** 📐

**No triângulo retângulo:**
• sen(θ) = cateto oposto / hipotenusa
• cos(θ) = cateto adjacente / hipotenusa
• tg(θ) = cateto oposto / cateto adjacente

**Valores especiais:**
| θ  | sen   | cos   | tg    |
|----|-------|-------|-------|
| 30°| 1/2   | √3/2  | √3/3  |
| 45°| √2/2  | √2/2  | 1     |
| 60°| √3/2  | 1/2   | √3    |

**Teorema de Pitágoras:** a² = b² + c²`
  },
  {
    tags: ['energia','trabalho','potência','cinemática','velocidade','queda livre','mrua','mru'],
    subject: 'Física',
    response: `**Cinemática e Energia** ⚡

**Equações do MRUA:**
• v = v₀ + a·t
• s = s₀ + v₀·t + ½·a·t²
• v² = v₀² + 2·a·Δs

**Queda Livre:** a = g ≈ 10 m/s² (para baixo)

**Energia:**
• Cinética: Ec = ½·m·v²
• Potencial gravitacional: Ep = m·g·h
• Mecânica total: Em = Ec + Ep (conservada sem atrito)

**Trabalho:** W = F·d·cos(θ) | **Potência:** P = W/t`
  },
  {
    tags: ['vclass','plataforma','como usar','ajuda','começar','funcionalidade'],
    subject: '',
    response: `**Sobre o VClass** 🎓

O VClass é uma plataforma de educação premium para estudantes do ensino médio em Angola, Moçambique, Portugal e Brasil.

**Como usar:**
1. Vai a **Conteúdo** → escolhe o teu país e série
2. Selecciona a disciplina e o capítulo
3. Assiste às lições em vídeo (protegidas)
4. Faz os exercícios interactivos
5. Acompanha o progresso no **Dashboard**

**Funcionalidades:** vídeos premium, exercícios, progresso, conquistas, biblioteca, chat IA.`
  },
  {
    tags: ['dica','estudo','estudar','memorizar','aprender','método','pomodoro','exame','prova','aprovação'],
    subject: '',
    response: `**Técnicas de Estudo** 📝

**Método Pomodoro:**
25 min de estudo → 5 min de pausa → a cada 4 ciclos: 15-30 min de pausa

**Técnicas mais eficazes:**
1. **Revisão espaçada** — revisar em intervalos crescentes (1d → 3d → 7d → 30d)
2. **Prática activa** — resolver exercícios, não só ler
3. **Ensinar para aprender** — explica o conteúdo em voz alta
4. **Recuperação** — faz testes a ti próprio sem consultar notas

**Para exames:**
• Começa a rever 2 semanas antes
• Resolve exames de anos anteriores
• Dorme bem na véspera`
  }
]

function localKbResponse(message: string, subject?: string): string {
  const lower = message.toLowerCase()
  let best: typeof LOCAL_KB[0] | null = null
  let bestScore = 0

  for (const entry of LOCAL_KB) {
    const subBoost = (subject && entry.subject === subject) ? 2 : 1
    let score = 0
    for (const tag of entry.tags) {
      if (lower.includes(tag)) score += subBoost
    }
    if (score > bestScore) { bestScore = score; best = entry }
  }

  if (best && bestScore > 0) return best.response

  return `Boa pergunta sobre **"${message.substring(0, 60)}"**! 🤔

Não encontrei uma resposta específica na minha base local.

**Sugestões:**
• Reformula com palavras-chave (ex: "leis de Newton", "tabela periódica")
• Escolhe uma disciplina nos filtros acima para respostas mais precisas
• Consulta directamente as lições relacionadas no conteúdo

**Tópicos disponíveis:** Funções Quadráticas, Leis de Newton, Tabela Periódica, Derivadas, Trigonometria, Genética, Cinemática e muito mais!`
}

// ── Schema de validação ───────────────────────────────────────────────────────
const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  subject: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(500)
  })).optional().default([])
})

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/chat
// ═══════════════════════════════════════════════════════════════════════════════
chat.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const validation = chatSchema.safeParse(body)
    if (!validation.success) {
      return c.json<ApiResponse>({ success: false, error: validation.error.errors[0].message }, 400)
    }

    const { message, subject, history } = validation.data

    // ── Verificar se há API key configurada ───────────────────────────────────
    const apiKey  = c.env?.OPENAI_API_KEY  || process.env.OPENAI_API_KEY  || ''
    const baseUrl = c.env?.OPENAI_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    const model   = c.env?.OPENAI_MODEL    || process.env.OPENAI_MODEL    || 'gpt-4o-mini'

    if (!apiKey) {
      // Fallback: base de conhecimento local
      const response = localKbResponse(message, subject)
      return c.json<ApiResponse>({
        success: true,
        data: { response, source: 'local' }
      })
    }

    // ── Chamar API OpenAI-compatible ──────────────────────────────────────────
    const systemPrompt = `És o assistente académico do VClass, uma plataforma de educação premium para estudantes do ensino médio em Angola, Moçambique, Portugal e Brasil.

O teu papel é:
1. Explicar conteúdos académicos de forma clara e estruturada
2. Ajudar com dúvidas de Matemática, Física, Química, Biologia, Português, História e outras disciplinas
3. Usar exemplos práticos e fórmulas quando necessário
4. Encorajar os alunos e dar dicas de estudo
5. Responder sempre em Português europeu (pt-PT)

${subject ? `O aluno está focado em: **${subject}**. Prioriza respostas sobre esta disciplina.` : ''}

Usa **negrito** para termos importantes, listas com bullet points e fórmulas matemáticas quando relevante. Sê conciso mas completo.`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((h: any) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ]

    const aiRes = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 800,
        temperature: 0.7
      })
    })

    if (!aiRes.ok) {
      // API falhou → usar fallback local
      console.error('OpenAI API error:', aiRes.status, await aiRes.text())
      const response = localKbResponse(message, subject)
      return c.json<ApiResponse>({
        success: true,
        data: { response, source: 'local' }
      })
    }

    const aiJson = await aiRes.json() as any
    const response = aiJson.choices?.[0]?.message?.content || localKbResponse(message, subject)

    return c.json<ApiResponse>({
      success: true,
      data: { response, source: 'ai' }
    })

  } catch (e: any) {
    console.error('Chat error:', e)
    // Nunca retorna erro ao user — fallback gracioso
    return c.json<ApiResponse>({
      success: true,
      data: { response: localKbResponse('ajuda geral', ''), source: 'local' }
    })
  }
})

export default chat
