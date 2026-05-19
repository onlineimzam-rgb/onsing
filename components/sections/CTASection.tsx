'use client'

import Link from 'next/link'
import { Calculator, Plus, ArrowRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nProvider'

export default function CTASection() {
  const { t, locale } = useI18n()
  return (
    <section className="bg-navy-gradient text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-full rounded-full bg-gold-500 blur-3xl" />
      </div>
      <div className="container-custom section-padding relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
          <div className="card bg-white/5 backdrop-blur-sm border-white/10 hover:border-gold-500/50 p-6 md:p-8 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-gold-gradient flex items-center justify-center mb-4 shadow-gold">
              <Calculator className="w-6 h-6 text-navy-950" />
            </div>
            <h3 className="font-display text-2xl md:text-3xl font-bold mb-2">
              {t('valuation.title')}
            </h3>
            <p className="text-navy-200 mb-5 leading-relaxed">
              {t('valuation.subtitle')}
            </p>
            <Link
              href={`/${locale}/mulk-degerleme/`}
              className="inline-flex items-center gap-2 bg-gold-gradient text-navy-950 px-5 py-2.5 rounded-full font-semibold text-sm hover:shadow-lg transition-all"
            >
              {t('valuation.submit')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="card bg-white/5 backdrop-blur-sm border-white/10 hover:border-gold-500/50 p-6 md:p-8 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-gold-gradient flex items-center justify-center mb-4 shadow-gold">
              <Plus className="w-6 h-6 text-navy-950" />
            </div>
            <h3 className="font-display text-2xl md:text-3xl font-bold mb-2">
              {t('lead_form.title')}
            </h3>
            <p className="text-navy-200 mb-5 leading-relaxed">
              {t('lead_form.subtitle')}
            </p>
            <Link
              href={`/${locale}/portfoy-toplama/`}
              className="inline-flex items-center gap-2 bg-white text-navy-950 px-5 py-2.5 rounded-full font-semibold text-sm hover:shadow-lg transition-all"
            >
              {t('nav.list_property')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
