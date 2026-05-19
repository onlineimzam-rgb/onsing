#!/usr/bin/env node
/**
 * grant-admin — promote a user to a platform admin role.
 *
 *   node scripts/grant-admin.mjs <email> [role]
 *
 * Roles: super_admin | support | finance | moderator | none (default super_admin).
 *
 * Run from the backend folder so that `.env.local` is picked up.
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import postgres from 'postgres'

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL
if (!url) {
  console.error('POSTGRES_URL .env.local içinde tanımlı değil.')
  process.exit(1)
}

const [, , emailArg, roleArg = 'super_admin'] = process.argv
if (!emailArg) {
  console.error('Kullanım: node scripts/grant-admin.mjs <email> [role]')
  process.exit(1)
}

const ALLOWED = ['none', 'super_admin', 'support', 'finance', 'moderator']
if (!ALLOWED.includes(roleArg)) {
  console.error(`Geçersiz role: ${roleArg}. Geçerli: ${ALLOWED.join(', ')}`)
  process.exit(1)
}

const sql = postgres(url, { max: 1, prepare: false })

try {
  const rows = await sql`SELECT id, name, email, platform_role FROM users WHERE LOWER(email) = LOWER(${emailArg}) LIMIT 1`
  if (rows.length === 0) {
    console.error(`Kullanıcı bulunamadı: ${emailArg}`)
    process.exit(1)
  }
  const user = rows[0]
  await sql`UPDATE users SET platform_role = ${roleArg}, updated_at = NOW() WHERE id = ${user.id}`
  console.log(`✓ ${user.name} <${user.email}>  ${user.platform_role}  →  ${roleArg}`)
  console.log(`  Tarayıcıyı yenileyin: /admin artık erişilebilir.`)
} finally {
  await sql.end()
}
