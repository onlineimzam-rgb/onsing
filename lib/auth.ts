import type { NextRequest } from 'next/server'

export function isAuthorized(req: NextRequest | Request): boolean {
  const adminKey = process.env.ADMIN_KEY
  if (!adminKey) return false
  const headerKey = req.headers.get('x-admin-key')
  if (headerKey && headerKey === adminKey) return true
  const url = new URL((req as NextRequest).url)
  const queryKey = url.searchParams.get('admin_key')
  return !!queryKey && queryKey === adminKey
}

export function isSetupAuthorized(req: NextRequest | Request): boolean {
  const setupKey = process.env.SETUP_KEY
  if (!setupKey) return false
  const headerKey = req.headers.get('x-setup-key')
  if (headerKey && headerKey === setupKey) return true
  const url = new URL((req as NextRequest).url)
  const queryKey = url.searchParams.get('setup_key')
  return !!queryKey && queryKey === setupKey
}
