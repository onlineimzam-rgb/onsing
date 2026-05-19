'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Calendar, Tag, ArrowRight, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nProvider'
import type { BlogPost } from '@/lib/db'

export default function BlogListPage() {
  const { t, locale } = useI18n()
  const [posts, setPosts] = useState<Partial<BlogPost>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/blog/?limit=24')
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="pt-20 pb-16">
      <section className="bg-navy-gradient text-white py-12 md:py-16 mb-10">
        <div className="container-custom">
          <p className="text-gold-400 uppercase tracking-[0.25em] text-xs md:text-sm font-semibold mb-2">
            {t('blog.eyebrow')}
          </p>
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-3">{t('blog.title')}</h1>
          <p className="text-navy-100 text-base md:text-lg max-w-2xl">{t('blog.subtitle')}</p>
        </div>
      </section>

      <div className="container-custom">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="card p-10 text-center text-navy-600">{t('blog.no_posts')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, idx) => {
              const title = locale === 'en' && post.title_en ? post.title_en : post.title_tr
              const excerpt = locale === 'en' && post.excerpt_en ? post.excerpt_en : post.excerpt_tr
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.04 }}
                >
                  <Link
                    href={`/${locale}/blog/${post.slug}/`}
                    className="card overflow-hidden flex flex-col group hover:shadow-2xl hover:-translate-y-1 transition-all h-full"
                  >
                    <div className="relative aspect-[16/9] bg-navy-100">
                      {post.cover_image ? (
                        <Image
                          src={post.cover_image}
                          alt={title || ''}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-navy-100 to-navy-200">
                          <Tag className="w-10 h-10 text-navy-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 text-xs text-navy-500 mb-2">
                        <Calendar className="w-3.5 h-3.5 text-gold-500" />
                        {post.published_at && new Date(post.published_at as any).toLocaleDateString(
                          locale === 'en' ? 'en-GB' : 'tr-TR',
                          { day: 'numeric', month: 'long', year: 'numeric' }
                        )}
                      </div>
                      <h3 className="font-display text-lg md:text-xl font-bold text-navy-950 mb-2 line-clamp-2 group-hover:text-gold-700 transition-colors">
                        {title}
                      </h3>
                      {excerpt && (
                        <p className="text-sm text-navy-600 line-clamp-3 mb-3">{excerpt}</p>
                      )}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {post.tags.slice(0, 3).map((tg) => (
                            <span key={tg} className="text-[10px] uppercase tracking-wider bg-navy-50 text-navy-700 px-2 py-0.5 rounded">
                              {tg}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-auto inline-flex items-center gap-1 text-gold-700 font-semibold text-sm">
                        {t('blog.read_more')}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
