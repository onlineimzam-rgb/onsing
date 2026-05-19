import PropertyDetailPage from '@/components/property/PropertyDetailPage'

export default function Page({ params }: { params: { slug: string; locale: string } }) {
  return <PropertyDetailPage slug={params.slug} />
}
