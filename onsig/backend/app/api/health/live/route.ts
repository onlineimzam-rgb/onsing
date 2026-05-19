/**
 * Liveness probe — returns 200 as soon as the Node process is responding.
 *
 * Container Apps and load balancers should point at THIS endpoint, not
 * `/api/health`, because a transient DB hiccup must not get the pod recycled
 * mid-traffic. `/api/health` remains the deeper readiness/diagnostics probe.
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  return new NextResponse('ok', {
    status: 200,
    headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' },
  })
}
