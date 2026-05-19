import ContractSignPage from '@/components/contracts/ContractSignPage'

export const metadata = {
  title: 'Uzaktan İmza',
  robots: { index: false, follow: false },
}

export default function ImzaPage({ params }: { params: { locale: string; token: string } }) {
  return <ContractSignPage locale={params.locale} token={params.token} />
}
