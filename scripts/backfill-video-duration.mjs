// Preenche lessons.video_duration (segundos) a partir da duração real
// reportada pelo Bunny.net Stream, para lições existentes que têm video_id
// mas nunca tiveram a duração gravada — bloqueador nº1 do Teacher Earnings
// V1 (VQ-R/VQ-P nunca disparam sem video_duration > 0; ver Art. 7 da
// Política de Remuneração e blueprint, gap #14).
//
// Uso: node scripts/backfill-video-duration.mjs [--dry-run]
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.dev.vars' })

const dryRun = process.argv.includes('--dry-run')

const supabaseUrl = process.env.SUPABASE_URL
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
const bunnyApiKey = process.env.BUNNY_API_KEY
const libraryId   = process.env.BUNNY_LIBRARY_ID

if (!supabaseUrl || !serviceKey) {
  console.error('Faltam SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em .dev.vars')
  process.exit(1)
}
if (!bunnyApiKey || !libraryId) {
  console.error('Faltam BUNNY_API_KEY ou BUNNY_LIBRARY_ID em .dev.vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const { data: lessons, error } = await supabase
  .from('lessons')
  .select('id, title, video_id, video_duration')
  .not('video_id', 'is', null)
  .or('video_duration.is.null,video_duration.eq.0')

if (error) {
  console.error('Falha ao ler lições:', error.message)
  process.exit(1)
}

if (!lessons || lessons.length === 0) {
  console.log('Nenhuma lição com video_id e video_duration em falta. Nada a fazer.')
  process.exit(0)
}

console.log(`${lessons.length} lição(ões) a verificar contra o Bunny.net...${dryRun ? '  [dry-run]' : ''}\n`)

let updated = 0, skipped = 0, failed = 0

for (const lesson of lessons) {
  try {
    const res = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${lesson.video_id}`,
      { headers: { AccessKey: bunnyApiKey, Accept: 'application/json' } }
    )
    if (!res.ok) {
      console.warn(`SKIP  ${lesson.title} (${lesson.id}) — Bunny respondeu ${res.status}`)
      skipped++
      continue
    }
    const v = await res.json()
    const length = Math.round(v.length ?? 0)
    if (length <= 0) {
      console.warn(`SKIP  ${lesson.title} (${lesson.id}) — Bunny ainda não reporta duração (status=${v.status})`)
      skipped++
      continue
    }

    if (dryRun) {
      console.log(`WOULD-UPDATE  ${lesson.title} (${lesson.id}) → ${length}s`)
    } else {
      const { error: updateError } = await supabase
        .from('lessons')
        .update({ video_duration: length })
        .eq('id', lesson.id)
      if (updateError) {
        console.error(`FAIL  ${lesson.title} (${lesson.id}):`, updateError.message)
        failed++
        continue
      }
      console.log(`OK    ${lesson.title} (${lesson.id}) → ${length}s`)
    }
    updated++
  } catch (err) {
    console.error(`FAIL  ${lesson.title} (${lesson.id}):`, err.message)
    failed++
  }
}

console.log(`\n${dryRun ? 'Seriam actualizadas' : 'Actualizadas'}: ${updated}  |  Ignoradas: ${skipped}  |  Falhadas: ${failed}`)
