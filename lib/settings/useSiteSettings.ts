'use client'

import { useEffect, useState } from 'react'
import type { PublicSiteSettings } from './index'

const FALLBACK: PublicSiteSettings = {
  logoLightUrl: '/logo-light.png',
  logoDarkUrl: '/logo-dark.png',
  faviconUrl: '/logo-light.png',
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<PublicSiteSettings>(FALLBACK)

  useEffect(() => {
    let cancelled = false
    fetch('/api/settings/', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.settings) setSettings({ ...FALLBACK, ...data.settings })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return settings
}
