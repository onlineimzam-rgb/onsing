import { redirect } from 'next/navigation'
import { getOptionalUser } from '@/lib/session'
import BranchManager from './BranchManager'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Şubeler · OnSig' }

export default async function BranchesPage() {
  const session = await getOptionalUser()
  if (!session) redirect('/login')
  return <BranchManager />
}
