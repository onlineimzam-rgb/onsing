import BlogDetailPage from '@/components/blog/BlogDetailPage'

export default function Page({ params }: { params: { slug: string } }) {
  return <BlogDetailPage slug={params.slug} />
}
