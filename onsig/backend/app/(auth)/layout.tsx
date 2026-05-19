import Link from 'next/link'
import {
  ShieldCheck,
  PenLine,
  ScrollText,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

/**
 * Auth layout — split-screen with a premium "dark hero" on the right.
 *
 * The hero is decorative (no real auth surface there); it positions OnSig as a
 * serious legal-tech tool and gives the form area visual breathing room. On
 * smaller screens the hero collapses entirely.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* ── Form pane ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-grid-faint bg-grid-md opacity-[0.35]"
        />
        <div
          aria-hidden
          className="absolute -top-32 -left-24 w-72 h-72 rounded-full bg-iris-3 blur-3xl opacity-50 pointer-events-none"
        />

        <header className="relative px-6 lg:px-10 py-6">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <span className="relative grid place-items-center w-9 h-9 rounded-xl bg-iris-hero text-white font-display font-bold shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_6px_rgba(11,15,27,0.3)]">
              <span aria-hidden className="text-[15px] tracking-tightest">
                O
              </span>
              <span
                aria-hidden
                className="absolute inset-0 rounded-xl ring-1 ring-white/15"
              />
            </span>
            <span className="font-display text-lg font-bold tracking-tightest text-ink-12 group-hover:text-iris-11 transition-colors">
              OnSig
            </span>
          </Link>
        </header>

        <main className="relative flex-1 flex items-center px-6 lg:px-10 py-6">
          <div className="w-full max-w-md mx-auto animate-slide-up">
            {children}
          </div>
        </main>

        <footer className="relative px-6 lg:px-10 py-6">
          <p className="text-2xs text-ink-7 tracking-tight">
            © {new Date().getFullYear()} OnSig — Türkiye legal-tech sertifikalı
            elektronik imza altyapısı.
          </p>
        </footer>
      </div>

      {/* ── Hero pane ────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-1 max-w-[640px] m-3 ml-0 relative overflow-hidden rounded-2xl bg-iris-hero text-paper shadow-pop">
        <div
          aria-hidden
          className="absolute inset-0 bg-grid-faint bg-grid-md opacity-[0.07]"
        />
        <div
          aria-hidden
          className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-iris-9 blur-3xl opacity-30"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-12 w-[420px] h-[420px] rounded-full bg-iris-6 blur-3xl opacity-15"
        />

        <div className="relative flex flex-col justify-between p-10 w-full">
          {/* Top */}
          <div className="inline-flex items-center gap-2 self-start px-2.5 py-1 rounded-pill bg-white/10 ring-1 ring-inset ring-white/15 text-2xs uppercase tracking-[0.16em] font-semibold backdrop-blur-glass">
            <Sparkles className="w-3 h-3 text-iris-3" />
            v1 · Türkçe yasal şablonlar
          </div>

          {/* Center */}
          <div className="space-y-6">
            <h2 className="font-display text-4xl xl:text-5xl font-bold tracking-tightest text-balance leading-[1.05]">
              İmza atılan her belge,
              <br />
              <span className="text-iris-3">denetlenebilir bir zincirde.</span>
            </h2>
            <p className="text-paper/70 text-sm leading-relaxed max-w-md">
              OnSig; sözleşme oluşturma, OTP doğrulamalı uzaktan imza, zaman
              damgası, IP/UA logu ve değişmez audit zincirini tek panelde
              birleştirir.
            </p>

            <ul className="grid grid-cols-2 gap-3 max-w-md pt-2">
              <FeatureLine
                icon={<PenLine className="w-3.5 h-3.5" />}
                label="Uzaktan imza"
                sub="OTP + canvas"
              />
              <FeatureLine
                icon={<ShieldCheck className="w-3.5 h-3.5" />}
                label="Audit zinciri"
                sub="SHA-256 zincirleme"
              />
              <FeatureLine
                icon={<Clock className="w-3.5 h-3.5" />}
                label="Zaman damgası"
                sub="RFC 3161 hazır"
              />
              <FeatureLine
                icon={<ScrollText className="w-3.5 h-3.5" />}
                label="Hazır şablonlar"
                sub="Kira, yetki, alım-satım"
              />
            </ul>
          </div>

          {/* Bottom: testimonial / quote */}
          <figure className="bg-white/5 rounded-xl p-4 ring-1 ring-inset ring-white/10 backdrop-blur-glass">
            <blockquote className="text-sm leading-relaxed text-paper/85">
              “Müşterilerimi tek tek matbaaya çağırmak yerine kira sözleşmesini
              5 dakikada e-imzaya gönderiyorum. Hata oranımız sıfıra düştü.”
            </blockquote>
            <figcaption className="mt-3 flex items-center gap-2 text-2xs">
              <span className="grid place-items-center w-7 h-7 rounded-full bg-iris-3 text-iris-11 font-bold">
                ÇŞ
              </span>
              <div>
                <p className="font-semibold text-paper">Çetin Şahbaz</p>
                <p className="text-paper/55">
                  Çandarlı Uzman Gayrimenkul · İzmir
                </p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1 text-paper/60">
                <CheckCircle2 className="w-3 h-3 text-success" />
                Doğrulanmış
              </span>
            </figcaption>
          </figure>
        </div>
      </aside>
    </div>
  )
}

function FeatureLine({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode
  label: string
  sub: string
}) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 grid place-items-center w-7 h-7 rounded-md bg-white/10 ring-1 ring-inset ring-white/10 text-iris-3 shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-paper leading-snug">{label}</p>
        <p className="text-2xs text-paper/55 leading-snug truncate">{sub}</p>
      </div>
    </li>
  )
}
