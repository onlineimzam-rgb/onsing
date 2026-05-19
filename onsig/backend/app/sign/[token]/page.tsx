import { notFound } from 'next/navigation'
import SignFlow from './SignFlow'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface SignApiResponse {
  ok: boolean
  title?: string
  body?: string
  contract?: { id: number; status: string; title: string | null; templateKey: string }
  session?: {
    id: number
    role: string
    roleLabel: string
    status: string
    recipientName: string | null
    recipientEmail: string | null
    recipientPhone: string | null
    otpVerifiedAt: string | null
    signedAt: string | null
    expiresAt: string | null
    signaturePng: string | null
  }
  tenant?: { name: string; brand: { primaryColor?: string | null } | null }
  error?: { code?: string; message?: string }
}

async function fetchPublic(token: string): Promise<SignApiResponse | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const res = await fetch(`${baseUrl}/api/sign/${token}`, { cache: 'no-store' })
  if (!res.ok && res.status !== 404) return null
  return (await res.json()) as SignApiResponse
}

export default async function PublicSignPage({ params }: { params: { token: string } }) {
  const data = await fetchPublic(params.token)
  if (!data || !data.ok || !data.session || !data.contract || !data.tenant) {
    notFound()
  }

  return (
    <SignFlow
      token={params.token}
      tenantName={data.tenant!.name}
      title={data.title || 'Sözleşme'}
      body={data.body || ''}
      contract={data.contract!}
      session={data.session!}
    />
  )
}
