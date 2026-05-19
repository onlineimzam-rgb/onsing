import Link from 'next/link'
import { Github, Linkedin, Mail, Twitter } from 'lucide-react'

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Ürün',
    links: [
      { href: '/features', label: 'Özellikler' },
      { href: '/pricing', label: 'Fiyatlandırma' },
      { href: '/security', label: 'Güvenlik' },
      { href: '/industries', label: 'Sektörler' },
    ],
  },
  {
    title: 'Çözümler',
    links: [
      { href: '/industries#emlak', label: 'Emlak' },
      { href: '/industries#avukat', label: 'Hukuk büroları' },
      { href: '/industries#muhasebe', label: 'Mali müşavirlik' },
      { href: '/industries#kobi', label: 'KOBİ' },
    ],
  },
  {
    title: 'Şirket',
    links: [
      { href: '/contact', label: 'İletişim' },
      { href: '/contact#destek', label: 'Destek' },
      { href: '/contact#satis', label: 'Satış görüşmesi' },
    ],
  },
  {
    title: 'Yasal',
    links: [
      { href: '/security', label: 'KVKK & güvenlik' },
      { href: '/security#audit', label: 'Audit zinciri' },
      { href: '/security#kanuni-delil', label: 'Kanuni delil' },
    ],
  },
]

export function MarketingFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="relative border-t border-divider bg-paper">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-iris-9/30 to-transparent"
      />

      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Brand block */}
          <div className="col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5"
              aria-label="OnSig anasayfa"
            >
              <span className="relative grid place-items-center w-9 h-9 rounded-lg bg-iris-hero text-white font-display font-bold shadow-card">
                O
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-lg ring-1 ring-white/15"
                />
              </span>
              <span className="font-display text-base font-bold tracking-tightest text-ink-12">
                OnSig
              </span>
            </Link>
            <p className="mt-4 text-sm text-ink-8 leading-relaxed max-w-xs">
              Türkiye için tasarlanmış, audit zinciriyle korunan online sözleşme
              ve e-imza platformu.
            </p>
            <div className="mt-5 inline-flex items-center gap-2.5 text-xs font-semibold text-ink-9">
              <span className="grid place-items-center w-5 h-5 rounded-full bg-success-soft text-success-deep">
                <span className="block w-1.5 h-1.5 rounded-full bg-success-deep" />
              </span>
              Tüm sistemler çalışıyor
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="section-overline text-ink-7 mb-4">
                {col.title}
              </div>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-ink-9 hover:text-ink-12 transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-divider flex flex-wrap items-center justify-between gap-6">
          <p className="text-xs text-ink-7">
            © {year} OnSig. Tüm hakları saklıdır.{' '}
            <span className="text-ink-6">KVKK uyumlu · ISO 27001 yolda</span>
          </p>
          <div className="flex items-center gap-1.5">
            <SocialLink
              href="https://twitter.com"
              icon={<Twitter className="w-3.5 h-3.5" />}
              label="Twitter"
            />
            <SocialLink
              href="https://linkedin.com"
              icon={<Linkedin className="w-3.5 h-3.5" />}
              label="LinkedIn"
            />
            <SocialLink
              href="https://github.com"
              icon={<Github className="w-3.5 h-3.5" />}
              label="GitHub"
            />
            <SocialLink
              href="mailto:hello@onsig.app"
              icon={<Mail className="w-3.5 h-3.5" />}
              label="E-posta"
            />
          </div>
        </div>
      </div>
    </footer>
  )
}

function SocialLink({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid place-items-center w-8 h-8 rounded-md text-ink-8 hover:text-ink-12 hover:bg-ink-2 transition-colors"
    >
      {icon}
    </a>
  )
}
