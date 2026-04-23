// Regenera os password_hash dos utilizadores semeados com bcrypt real de 'password123'.
// Uso: node scripts/fix-seed-passwords.mjs
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Faltam SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const hash = await bcrypt.hash('password123', 10)

const emails = [
  'admin@vclass.mz',
  'professor@vclass.mz',
  'estudante@vclass.mz',
  'estudante2@vclass.mz'
]

for (const email of emails) {
  const { data, error } = await supabase
    .from('users')
    .update({ password_hash: hash })
    .eq('email', email)
    .select('email, role')
  if (error) {
    console.error(`FAIL ${email}:`, error.message)
  } else {
    console.log(`OK   ${email} (${data?.[0]?.role ?? '—'})`)
  }
}

console.log('\nPassword para todos:  password123')
