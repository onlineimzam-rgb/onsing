import { ensureSiteSettingsSchema, sql } from '@/lib/db'

export type PublicSiteSettings = {
  logoLightUrl: string
  logoDarkUrl: string
  faviconUrl: string
}

const DEFAULTS: PublicSiteSettings = {
  logoLightUrl: '/logo-light.png',
  logoDarkUrl: '/logo-dark.png',
  faviconUrl: '/logo-light.png',
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  try {
    await ensureSiteSettingsSchema()
    const rows = (await sql(
      `SELECT key, value FROM site_settings WHERE key IN ('logo_light_url','logo_dark_url','favicon_url')`
    )) as { key: string; value: string | null }[]
    const values = new Map(rows.map((r) => [r.key, r.value || '']))
    return {
      logoLightUrl: values.get('logo_light_url') || DEFAULTS.logoLightUrl,
      logoDarkUrl: values.get('logo_dark_url') || DEFAULTS.logoDarkUrl,
      faviconUrl: values.get('favicon_url') || DEFAULTS.faviconUrl,
    }
  } catch {
    return DEFAULTS
  }
}

export async function upsertSiteSetting(key: string, value: string | null) {
  await ensureSiteSettingsSchema()
  await sql(
    `INSERT INTO site_settings (key, value, updated_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
    [key, value]
  )
}
