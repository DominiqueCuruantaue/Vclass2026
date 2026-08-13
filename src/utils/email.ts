// ============================================================
//  Resend — envio de email transacional (fetch puro, sem SDK,
//  no mesmo estilo do utils/bunny.ts).
//
//  Documentação: https://resend.com/docs/api-reference/emails/send-email
// ============================================================

interface SendEmailInput {
  to: string
  subject: string
  html: string
}

interface SendEmailResult {
  ok: boolean
  error?: string
}

export async function sendEmail(env: any, input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = env?.RESEND_API_KEY
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY não configurada — email para ${input.to} não enviado ("${input.subject}")`)
    return { ok: false, error: 'RESEND_API_KEY não configurada' }
  }

  const from = env?.RESEND_FROM_EMAIL || 'VClass <onboarding@resend.dev>'

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html
      })
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`[email] Falha ao enviar para ${input.to}: ${res.status} ${err}`)
      return { ok: false, error: `Resend ${res.status}: ${err}` }
    }

    return { ok: true }
  } catch (e: any) {
    console.error(`[email] Erro ao enviar para ${input.to}:`, e)
    return { ok: false, error: e?.message || 'Erro desconhecido ao enviar email' }
  }
}

// ── Layout base partilhado pelos templates ─────────────────────────────────
function emailLayout(title: string, bodyHtml: string): string {
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#f9fafb;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">
      <div style="font-size:20px;font-weight:800;color:#7c3aed;margin-bottom:24px;">VClass</div>
      <h1 style="font-size:18px;color:#111827;margin:0 0 16px;">${title}</h1>
      <div style="font-size:14px;line-height:1.6;color:#374151;">${bodyHtml}</div>
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #f3f4f6;font-size:12px;color:#9ca3af;">
        VClass — Educação à distância. Este é um email automático, por favor não responda.
      </div>
    </div>
  </div>`
}

// ── Templates ───────────────────────────────────────────────────────────────

export function teacherApplicationReceivedEmail(fullName: string) {
  return {
    subject: 'Candidatura recebida — VClass',
    html: emailLayout('Candidatura recebida ✅', `
      <p>Olá ${fullName},</p>
      <p>A sua candidatura para se tornar professor na VClass foi recebida com sucesso.</p>
      <p>A nossa equipa vai analisar as suas qualificações e referências. Assim que a revisão for concluída,
      vai receber <strong>outro email</strong> a informar se a sua candidatura foi aprovada — e, nesse caso,
      já poderá começar a dar aulas na plataforma — ou se não foi possível aprová-la desta vez, sempre com o motivo.</p>
      <p>Prazo estimado: até 5 dias úteis.</p>
    `)
  }
}

export function teacherApplicationApprovedEmail(fullName: string, loginEmail: string) {
  return {
    subject: '🎉 Está de parabéns — foi aceite como professor na VClass!',
    html: emailLayout('Está de parabéns! 🎉', `
      <p>Olá ${fullName},</p>
      <p>As suas competências vão de acordo com os requisitos que pretendemos — <strong>foi aceite como
      professor da plataforma VClass</strong>! A sua conta já está activa e pode começar a criar e publicar
      aulas imediatamente.</p>
      <p>Pode entrar com o email <strong>${loginEmail}</strong> e a password que definiu na candidatura, em
      <a href="https://vclass.mz/login.html" style="color:#7c3aed;">vclass.mz/login.html</a>.</p>
      <p>Bem-vindo à equipa VClass!</p>
    `)
  }
}

export function teacherApplicationRejectedEmail(fullName: string) {
  return {
    subject: 'Resultado da sua candidatura — VClass',
    html: emailLayout('Candidatura não aprovada', `
      <p>Olá ${fullName},</p>
      <p>Lamentamos, mas a sua candidatura não foi aceite porque os nossos serviços não têm vagas
      disponíveis para as suas qualificações neste momento.</p>
      <p>Caso abram espaços para oportunidades com os seus requisitos, iremos contactá-lo de volta.</p>
      <p>Obrigado pelo interesse em ensinar na VClass.</p>
    `)
  }
}

export function teacherApplicationInfoRequestedEmail(fullName: string, message: string, requiredDocuments: string[]) {
  const docsHtml = requiredDocuments.length
    ? `<ul>${requiredDocuments.map(d => `<li>${d}</li>`).join('')}</ul>`
    : ''
  return {
    subject: 'Precisamos de mais informação — candidatura VClass',
    html: emailLayout('Informação adicional necessária', `
      <p>Olá ${fullName},</p>
      <p>Para continuar a análise da sua candidatura, precisamos de mais alguma informação:</p>
      <p style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:12px 16px;">${message}</p>
      ${docsHtml}
      <p>Responda a este pedido acompanhando a sua candidatura em
      <a href="https://vclass.mz/teacher-verification.html" style="color:#7c3aed;">vclass.mz/teacher-verification.html</a>.</p>
    `)
  }
}
