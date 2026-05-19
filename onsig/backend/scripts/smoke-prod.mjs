/**
 * Production smoke probe.
 *
 *   node scripts/smoke-prod.mjs https://onsig-prod.fly.dev
 *
 * Walks the public-facing surface and asserts:
 *   - Live probe returns 200 in <1s
 *   - Marketing home renders
 *   - Login page renders
 *   - /api/health DB probe reports `ok:true`
 *
 * Exits non-zero on any failure — wired into `.github/workflows/fly-deploy.yml`
 * as a quality gate after every deploy.
 */

const base = process.argv[2]
if (!base) {
  console.error('Usage: node scripts/smoke-prod.mjs <base-url>')
  process.exit(1)
}

const targets = [
  { path: '/api/health/live', maxMs: 1500, expectText: 'ok' },
  { path: '/api/health',      maxMs: 6000, expectJson: { ok: true } },
  { path: '/',                maxMs: 6000 },
  { path: '/pricing',         maxMs: 6000 },
  { path: '/login',           maxMs: 6000 },
]

let failed = 0

for (const t of targets) {
  const url = base.replace(/\/$/, '') + t.path
  const start = Date.now()
  try {
    const res = await fetch(url, { redirect: 'manual' })
    const ms = Date.now() - start
    const okStatus = res.status >= 200 && res.status < 400
    let okBody = true
    let snippet = ''
    if (t.expectText) {
      const txt = await res.text()
      okBody = txt.includes(t.expectText)
      snippet = txt.slice(0, 60)
    } else if (t.expectJson) {
      const json = await res.json().catch(() => ({}))
      okBody = Object.entries(t.expectJson).every(([k, v]) => json[k] === v)
      snippet = JSON.stringify(json).slice(0, 80)
    }
    const okMs = ms <= t.maxMs
    const ok = okStatus && okBody && okMs
    const tag = ok ? 'OK ' : 'FAIL'
    console.log(`${tag}  ${String(res.status).padEnd(3)}  ${String(ms).padStart(5)}ms  ${t.path}${snippet ? '  → ' + snippet : ''}`)
    if (!ok) failed++
  } catch (e) {
    console.log(`FAIL  ERR        ${t.path}  → ${e.message}`)
    failed++
  }
}

console.log()
if (failed > 0) {
  console.error(`${failed} probe(s) failed.`)
  process.exit(1)
}
console.log('All probes green ✓')
