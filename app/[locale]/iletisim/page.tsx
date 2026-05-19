'use client'

import { Phone, MessageCircle, Mail, MapPin, Clock } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nProvider'
import { SITE_CONFIG, mapsUrls } from '@/lib/config'

export default function ContactPage() {
  const { t, locale } = useI18n()

  return (
    <div className="pt-24 pb-20">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-gold-600 uppercase tracking-[0.25em] text-xs md:text-sm font-semibold mb-3">
            {t('contact.eyebrow')}
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-navy-950 mb-3">
            {t('contact.title')}
          </h1>
          <p className="text-navy-600 text-base md:text-lg">{t('contact.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-10">
          <a href={`tel:${SITE_CONFIG.phoneRaw}`} className="card p-5 flex items-start gap-4 hover:border-gold-300">
            <div className="w-11 h-11 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-navy-700" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-navy-500 mb-0.5">{t('contact.phone')}</p>
              <p className="font-semibold text-navy-950">{SITE_CONFIG.phoneDisplay}</p>
            </div>
          </a>

          <a
            href={`https://wa.me/${SITE_CONFIG.whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="card p-5 flex items-start gap-4 hover:border-green-300"
          >
            <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-navy-500 mb-0.5">{t('contact.whatsapp')}</p>
              <p className="font-semibold text-navy-950">{SITE_CONFIG.whatsappDisplay}</p>
            </div>
          </a>

          <a href={`mailto:${SITE_CONFIG.email}`} className="card p-5 flex items-start gap-4 hover:border-gold-300">
            <div className="w-11 h-11 rounded-full bg-gold-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-gold-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-navy-500 mb-0.5">{t('contact.email')}</p>
              <p className="font-semibold text-navy-950 break-all">{SITE_CONFIG.email}</p>
            </div>
          </a>

          <a
            href={mapsUrls.directions}
            target="_blank"
            rel="noopener noreferrer"
            className="card p-5 flex items-start gap-4 hover:border-gold-300"
          >
            <div className="w-11 h-11 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-navy-700" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-navy-500 mb-0.5">{t('contact.address')}</p>
              <p className="font-semibold text-navy-950">{SITE_CONFIG.address.full}</p>
              <p className="text-xs text-gold-700 mt-1 font-semibold">{t('contact.directions')} →</p>
            </div>
          </a>

          <div className="card p-5 flex items-start gap-4 md:col-span-2">
            <div className="w-11 h-11 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-navy-700" />
            </div>
            <div className="text-sm text-navy-700">
              <p className="text-xs uppercase tracking-wider text-navy-500 mb-1">{t('contact.working_hours')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                <div>{locale === 'en' ? 'Mon-Fri' : 'Pzt-Cum'}: <strong>{SITE_CONFIG.hours.weekdays}</strong></div>
                <div>{locale === 'en' ? 'Sat' : 'Cmt'}: <strong>{SITE_CONFIG.hours.saturday}</strong></div>
                <div>{locale === 'en' ? 'Sun' : 'Paz'}: <strong>{SITE_CONFIG.hours.sunday}</strong></div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border border-navy-100 shadow-card max-w-5xl mx-auto">
          <iframe
            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${SITE_CONFIG.geo.lat},${SITE_CONFIG.geo.lng}&zoom=14`}
            width="100%"
            height="380"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={SITE_CONFIG.name}
          />
        </div>
      </div>
    </div>
  )
}
