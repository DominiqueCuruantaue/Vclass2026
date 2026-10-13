// Logger estruturado mínimo — sem dependência externa (nenhum serviço de
// observabilidade está configurado ainda, ver NEXT_STEPS.md). Produz uma
// linha JSON por evento em vez de strings soltas, para que os logs do
// Cloudflare Workers (Tail/Logpush) fiquem grep/parse-áveis por campo em vez
// de só por substring.
export interface LogFields {
  [key: string]: unknown
}

function emit(level: 'info' | 'warn' | 'error', message: string, fields?: LogFields) {
  const line = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(fields ? { fields } : {})
  }
  const out = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  out(JSON.stringify(line))
}

export const logger = {
  info: (message: string, fields?: LogFields) => emit('info', message, fields),
  warn: (message: string, fields?: LogFields) => emit('warn', message, fields),
  /** `error` pode ser um Error, o `{ error }` devolvido pelo supabase-js, ou qualquer valor de um catch. */
  error: (message: string, error?: unknown, fields?: LogFields) => {
    const errFields = error instanceof Error
      ? { errorMessage: error.message, stack: error.stack }
      : error != null
        ? { errorMessage: String((error as any)?.message ?? error) }
        : {}
    emit('error', message, { ...errFields, ...fields })
  }
}
