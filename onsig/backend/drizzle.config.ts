import { config as loadEnv } from 'dotenv'
import type { Config } from 'drizzle-kit'

loadEnv({ path: '.env.local' })
loadEnv() // fallback to .env if .env.local missing

if (!process.env.POSTGRES_URL) {
  console.warn('[drizzle] POSTGRES_URL is not set. Drizzle commands will fail.')
}

export default {
  schema: './db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL || '',
  },
  strict: true,
  verbose: true,
} satisfies Config
