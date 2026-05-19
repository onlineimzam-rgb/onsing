'use client'

import Link from 'next/link'
import {
  Phone, Mail, MapPin, Clock, Instagram, Facebook, Linkedin, Youtube,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nProvider'
import { SITE_CONFIG } from '@/lib/config'
import { useSiteSettings } from '@/lib/settings/useSiteSettings'

export default function Footer() {
  const { t, locale } = useI18n()
  const siteSettings = useSiteSettings()
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { href: `/${locale}/`, label: t('nav.home') },
    { href: `/${locale}/emlak/`, label: t('nav.properties') },
    { href: `/${locale}/blog/`, label: t('nav.blog') },
    { href: `/${locale}/galeri/`, label: t('nav.gallery') },
    { href: `/${locale}/hakkimizda/`, label: t('nav.about') },
    { href: `/${locale}/iletisim/`, label: t('nav.contact') },
  ]

  const serviceLinks = [
    { href: `/${locale}/emlak/?type=satilik`, label: t('property_type.satilik') },
    { href: `/${locale}/emlak/?type=kiralik`, label: t('property_type.kiralik') },
    { href: `/${locale}/mulk-degerleme/`, label: t('nav.valuation') },
    { href: `/${locale}/portfoy-toplama/`, label: t('nav.list_property') },
  ]

  const legalLinks = [
    { href: `/${locale}/gizlilik/`, label: t('footer.privacy') },
    { href: `/${locale}/kvkk/`, label: t('footer.kvkk') },
  ]

  return (
    <footer className="bg-navy-950 text-white">
      <div className="container-custom section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link href={`/${locale}/`} className="inline-block mb-4">
              <img
                src={siteSettings.logoLightUrl}
                alt="Çandarlı Uzman Gayrimenkul"
                className="h-20 md:h-24 w-auto object-contain"
              />
            </Link>
            <p className="text-navy-200 text-sm leading-relaxed mb-5">
              {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-2">
              {SITE_CONFIG.social.instagram && (
                <a
                  href={SITE_CONFIG.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-gold-500 hover:text-navy-950 flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {SITE_CONFIG.social.facebook && (
                <a
                  href={SITE_CONFIG.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-gold-500 hover:text-navy-950 flex items-center justify-center transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {SITE_CONFIG.social.youtube && (
                <a
                  href={SITE_CONFIG.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-gold-500 hover:text-navy-950 flex items-center justify-center transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              )}
              {SITE_CONFIG.social.linkedin && (
                <a
                  href={SITE_CONFIG.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-gold-500 hover:text-navy-950 flex items-center justify-center transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base font-semibold mb-4 text-gold-400">
              {t('footer.quick_links')}
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-navy-200 hover:text-gold-400 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-base font-semibold mb-4 text-gold-400">
              {t('footer.services_title')}
            </h3>
            <ul className="space-y-2.5">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-navy-200 hover:text-gold-400 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h4 className="text-sm font-semibold mt-6 mb-2 text-gold-400/80">
              {t('footer.service_areas')}
            </h4>
            <p className="text-xs text-navy-300 leading-relaxed">
              {SITE_CONFIG.serviceAreas.join(' · ')}
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-base font-semibold mb-4 text-gold-400">
              {t('footer.contact_info')}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={`tel:${SITE_CONFIG.phoneRaw}`}
                  className="flex items-start gap-2.5 text-navy-200 hover:text-white transition-colors"
                >
                  <Phone className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
                  <span>{SITE_CONFIG.phoneDisplay}</span>
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${SITE_CONFIG.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 text-navy-200 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                  </svg>
                  <span>WhatsApp · {SITE_CONFIG.whatsappDisplay}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  className="flex items-start gap-2.5 text-navy-200 hover:text-white transition-colors break-all"
                >
                  <Mail className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
                  <span>{SITE_CONFIG.email}</span>
                </a>
              </li>
              <li>
                <div className="flex items-start gap-2.5 text-navy-200">
                  <MapPin className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
                  <span>{SITE_CONFIG.address.full}</span>
                </div>
              </li>
              <li>
                <div className="flex items-start gap-2.5 text-navy-200">
                  <Clock className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div>{locale === 'en' ? 'Mon-Fri' : 'Pzt-Cum'}: {SITE_CONFIG.hours.weekdays}</div>
                    <div>{locale === 'en' ? 'Sat' : 'Cmt'}: {SITE_CONFIG.hours.saturday}</div>
                    <div>{locale === 'en' ? 'Sun' : 'Paz'}: {SITE_CONFIG.hours.sunday}</div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-navy-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-navy-300 text-xs md:text-sm text-center md:text-left">
              © {currentYear} {SITE_CONFIG.name}. {t('footer.rights')}
            </p>
            <ul className="flex flex-wrap items-center justify-center md:justify-end gap-x-5 gap-y-2 text-xs md:text-sm">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-navy-300 hover:text-gold-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
