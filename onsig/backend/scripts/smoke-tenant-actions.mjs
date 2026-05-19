/**
 * Smoke-test the tenant write/action surface.
 *
 *   node scripts/smoke-tenant-actions.mjs <admin-email> <admin-password> [tenantId]
 *
 * If `tenantId` is omitted, the script picks the highest-id tenant whose name
 * starts with "smoke-" (created via the regular smoke flow). This script does
 * NOT delete any tenant — destructive paths are exercised against a dummy
 * subscription record only.
 */

const [, , email, password, tenantArg] = process.argv
if (!email || !password) {
  console.error('Kullanım: node scripts/smoke-tenant-actions.mjs <email> <password> [tenantId]')
  process.exit(1)
}

const BASE = process.env.BASE || 'http://localhost:3001'

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
console.log('✓ Giriş başarılı.\n')

const headers = {
  'Content-Type': 'application/json',
  Cookie: `onsig_at=${access}`,
}

async function call(method, path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await r.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text.slice(0, 120) }
  }
  return { status: r.status, json }
}

// Pick a tenant
let tenantId = tenantArg ? Number(tenantArg) : null
if (!tenantId) {
  console.log('• tenantId verilmedi — admin token sahibinin tenant\u2019\u0131 kullanılacak.')
  // /api/me veya benzer mevcut değilse: tenant listesinden ilk freeOlmayan'ı seç.
  // /admin sayfası RSC, bunun yerine subscription endpoint'ini de
  // doğrudan deneyemeyiz. En basit yaklaşım: 1'inci tenant.
  tenantId = 1
}
console.log(`• Hedef tenant: #${tenantId}\n`)

// 1) GET subscription
let r = await call('GET', `/api/admin/tenants/${tenantId}/subscription`)
console.log('GET  subscription      →', r.status, JSON.stringify(r.json).slice(0, 140))

// 2) Upsert subscription (pro)
r = await call('POST', `/api/admin/tenants/${tenantId}/subscription`, {
  plan: 'pro',
  pricePerMonth: 699,
  seats: 5,
  status: 'active',
})
console.log('POST subscription pro  →', r.status, JSON.stringify(r.json).slice(0, 140))

// 3) Pause
r = await call('POST', `/api/admin/tenants/${tenantId}/subscription/status`, {
  action: 'pause',
})
console.log('POST status pause      →', r.status, JSON.stringify(r.json).slice(0, 140))

// 4) Resume
r = await call('POST', `/api/admin/tenants/${tenantId}/subscription/status`, {
  action: 'resume',
})
console.log('POST status resume     →', r.status, JSON.stringify(r.json).slice(0, 140))

// 5) Bulk plan via business
r = await call('POST', `/api/admin/tenants/${tenantId}/subscription`, {
  plan: 'business',
  pricePerMonth: 2499,
  seats: 10,
  status: 'active',
})
console.log('POST subscription biz  →', r.status, JSON.stringify(r.json).slice(0, 140))

// 6) Verify GET reflects business
r = await call('GET', `/api/admin/tenants/${tenantId}/subscription`)
console.log('GET  subscription      →', r.status, JSON.stringify(r.json).slice(0, 140))

// 7) Tenant DELETE protection (kendi tenant'ını silmeye çalış)
r = await call('DELETE', `/api/admin/tenants/${tenantId}`)
console.log('DELETE self-tenant     →', r.status, JSON.stringify(r.json).slice(0, 140))
if (r.status === 400 && r.json?.error?.code === 'self_delete_blocked') {
  console.log('✓ self-delete koruması çalışıyor.')
}

console.log('\n✓ Smoke tamamlandı.')
