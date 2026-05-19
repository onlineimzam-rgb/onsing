import { redirect } from 'next/navigation'
import { getOptionalUser } from '@/lib/session'
import TeamManager from './TeamManager'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Ekip · OnSig' }

export default async function TeamPage() {
  const session = await getOptionalUser()
  if (!session) redirect('/login')
  return <TeamManager />
}
