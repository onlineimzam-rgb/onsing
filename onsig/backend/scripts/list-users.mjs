import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import postgres from 'postgres'

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL
console.log('DATABASE_URL:', url ? url.slice(0, 40) + '...' : '(undefined)')
const sql = postgres(url, { max: 1, ssl: 'require' })
try {
  const rows = await sql`SELECT id, name, email, platform_role FROM users ORDER BY id LIMIT 10`
  console.table(rows)
} finally {
  await sql.end()
}
