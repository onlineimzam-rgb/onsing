import ValuationReportPage from '@/components/valuation/ValuationReportPage'

export const metadata = {
  title: 'Değerleme Raporu',
  robots: { index: false, follow: false },
}

export default function Page({ params }: { params: { id: string } }) {
  return <ValuationReportPage id={params.id} />
}
