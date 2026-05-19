/**
 * Smoke-test the /admin surface end-to-end.
 *
 *   node scripts/smoke-admin.mjs <email> <password>
 *
 * Logs in via the public auth API, then walks every admin page and the live
 * health API and prints HTTP statuses + content length.
 */

const [, , email, password] = process.argv
if (!email || !password) {
  console.error('Kullanım: node scripts/smoke-admin.mjs <email> <password>')
  process.exit(1)
}

const BASE = process.env.BASE || 'http://localhost:3001'

const PATHS = [
  '/admin',
  '/admin/tenants',
  '/admin/contracts',
  '/admin/sign-sessions',
  '/admin/billing',
  '/admin/usage',
  '/admin/risk',
  '/admin/audit',
  '/admin/health',
  '/admin/feature-flags',
  '/admin/support',
  '/api/admin/health',
]

const loginRes = await fetch(`${BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
})
if (!loginRes.ok) {
  console.error('Giriş başarısız:', loginRes.status, await loginRes.text())
  process.exit(1)
}
const cookie = loginRes.headers.getSetCookie?.()?.join('; ') ?? loginRes.headers.get('set-cookie') ?? ''
const access = /onsig_at=([^;]+)/.exec(cookie)?.[1]
if (!access) {
  console.error('Erişim cookie bulunamadı:', cookie)
  process.exit(1)
}

console.log('✓ Giriş başarılı, oturum açıldı.\n')
console.log(`${'PATH'.padEnd(30)} STATUS  BYTES`)
console.log('─'.repeat(50))

for (const p of PATHS) {
  const r = await fetch(`${BASE}${p}`, {
    headers: { Cookie: `onsig_at=${access}` },
    redirect: 'manual',
  })
  const txt = await r.text()
  console.log(`${p.padEnd(30)} ${String(r.status).padEnd(7)} ${txt.length}`)
}
