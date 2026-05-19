'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Tag, ArrowLeft, User, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nProvider'
import type { BlogPost } from '@/lib/db'

interface DetailData {
  post: BlogPost
  related: Partial<BlogPost>[]
}

export default function BlogDetailPage({ slug }: { slug: string }) {
  const { t, locale } = useI18n()
  const [data, setData] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/blog/${slug}/`)
      .then(async (r) => {
        if (!r.ok) throw new Error('not-found')
        return r.json()
      })
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="pt-32 pb-20 container-custom flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    )
  }
  if (error || !data) {
    return (
      <div className="pt-32 pb-20 container-custom text-center">
        <p className="text-navy-600 mb-4">{t('blog.no_posts')}</p>
        <Link href={`/${locale}/blog/`} className="btn-primary">
          <ArrowLeft className="w-4 h-4" />
          {t('blog.eyebrow')}
        </Link>
      </div>
    )
  }

  const { post, related } = data
  const title = locale === 'en' && post.title_en ? post.title_en : post.title_tr
  const content = locale === 'en' && post.content_en ? post.content_en : post.content_tr

  return (
    <article className="pt-20 pb-16 bg-navy-50/30">
      <div className="container-custom max-w-3xl">
        <Link
          href={`/${locale}/blog/`}
          className="inline-flex items-center gap-2 text-navy-600 hover:text-gold-600 text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('blog.eyebrow')}
        </Link>

        <header className="mb-7">
          <div className="flex flex-wrap items-center gap-3 text-sm text-navy-500 mb-3">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gold-500" />
              {post.published_at && new Date(post.published_at as any).toLocaleDateString(
                locale === 'en' ? 'en-GB' : 'tr-TR',
                { day: 'numeric', month: 'long', year: 'numeric' }
              )}
            </span>
            {post.author && (
              <span className="inline-flex items-center gap-1.5">
                <User className="w-4 h-4 text-gold-500" />
                {post.author}
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-navy-950 leading-tight mb-4">
            {title}
          </h1>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tg) => (
                <span key={tg} className="text-xs uppercase tracking-wider bg-navy-100 text-navy-700 px-2.5 py-0.5 rounded-full">
                  {tg}
                </span>
              ))}
            </div>
          )}
        </header>

        {post.cover_image && (
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-8 shadow-card">
            <Image src={post.cover_image} alt={title} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" priority />
          </div>
        )}

        <div className="prose-content text-navy-800 leading-relaxed text-base md:text-lg whitespace-pre-line">
          {content}
        </div>
      </div>

      {related.length > 0 && (
        <div className="container-custom max-w-5xl mt-14">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-navy-950 mb-5">
            {t('blog.related')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {related.map((p) => {
              const t2 = locale === 'en' && p.title_en ? p.title_en : p.title_tr
              return (
                <Link
                  key={p.id}
                  href={`/${locale}/blog/${p.slug}/`}
                  className="card overflow-hidden hover:shadow-lg group"
                >
                  <div className="relative aspect-[16/9] bg-navy-100">
                    {p.cover_image ? (
                      <Image src={p.cover_image} alt={t2 || ''} fill sizes="33vw" className="object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-navy-100 to-navy-200">
                        <Tag className="w-8 h-8 text-navy-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-base font-bold text-navy-950 line-clamp-2 group-hover:text-gold-700">
                      {t2}
                    </h3>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </article>
  )
}
