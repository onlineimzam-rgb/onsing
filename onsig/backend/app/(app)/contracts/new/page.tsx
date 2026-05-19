import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowRight,
  Home,
  Key,
  Handshake,
  Map,
  Users,
  FileEdit,
} from 'lucide-react'
import { listTemplates, SIGNER_ROLE_LABELS, type SignerRole } from '@shared/contracts'
import { getOptionalUser } from '@/lib/session'

export const metadata = { title: 'Yeni sözleşme · Şablon seç' }
export const dynamic = 'force-dynamic'

// Visual metadata per template — used by the picker UI only.
const TEMPLATE_UI: Record<
  string,
  { icon: React.ReactNode; gradient: string; tagline: string; description: string }
> = {
  kira: {
    icon: <Home className="w-5 h-5" />,
    gradient: 'from-violet-500 to-fuchsia-500',
    tagline: 'En sık kullanılan matbu kira sözleşmesi',
    description:
      'Türk Borçlar Kanunu uyumlu, mal sahibi-kiracı-kefil rollerini içeren matbu kira sözleşmesi.',
  },
  yetki: {
    icon: <Key className="w-5 h-5" />,
    gradient: 'from-amber-500 to-orange-500',
    tagline: 'Mal sahibi – emlak komisyoncusu',
    description:
      'Komisyoncuya satış/kiralama yetkisi veren, süreli ve uzayabilen tek sayfalık yetki sözleşmesi.',
  },
  'alim-satim': {
    icon: <Handshake className="w-5 h-5" />,
    gradient: 'from-emerald-500 to-teal-500',
    tagline: 'Gayrimenkul satış sözleşmesi',
    description:
      'Satıcı, alıcı ve komisyoncuyu tek belgede toplayan; kapora, komisyon, cayma şartları içeren satış akdi.',
  },
  'yer-gosterme': {
    icon: <Map className="w-5 h-5" />,
    gradient: 'from-sky-500 to-cyan-500',
    tagline: 'Yer gösterme tutanağı',
    description:
      'Müşteriye gezdirilen taşınmazları kayıt altına alan, 6 ay süreli komisyon koruma sözleşmesi.',
  },
  custom: {
    icon: <FileEdit className="w-5 h-5" />,
    gradient: 'from-slate-500 to-zinc-700',
    tagline: 'Boş şablon · kendi metnin',
    description:
      'Standart şablonlar dışında bir akit mi? Başlığı ve metni kendin yaz, 1–4 imzacıya gönder.',
  },
}

export default async function NewContractPickerPage() {
  const session = await getOptionalUser()
  if (!session) redirect('/login')

  // Show real-estate cards + the sector-agnostic "custom" template.
  const templates = [...listTemplates('real-estate'), ...listTemplates('other')]

  return (
    <div>
      <div>
        <p className="text-xs uppercase tracking-wider text-ink-muted">Adım 1 / 2</p>
        <h1 className="font-display text-2xl font-bold tracking-tight mt-0.5">
          Hangi sözleşmeyi oluşturmak istiyorsun?
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Bir şablon seç, sonraki adımda detayları gir ve imzaya gönder.
        </p>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        {templates.map((t) => {
          const ui = TEMPLATE_UI[t.key] ?? {
            icon: <Home className="w-5 h-5" />,
            gradient: 'from-slate-500 to-slate-700',
            tagline: '',
            description: '',
          }
          return (
            <Link
              key={t.key}
              href={`/contracts/new/${t.key}`}
              className="group card relative overflow-hidden hover:border-brand hover:shadow-md transition"
            >
              <div
                className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${ui.gradient} opacity-10 group-hover:opacity-20 transition`}
              />
              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ui.gradient} text-white grid place-items-center shadow-sm`}
                >
                  {ui.icon}
                </div>
                <h2 className="mt-3 font-display text-lg font-bold tracking-tight">{t.label}</h2>
                <p className="text-xs uppercase tracking-wider text-brand mt-0.5 font-semibold">
                  {ui.tagline}
                </p>
                <p className="text-sm text-ink-muted mt-2 line-clamp-3">{ui.description}</p>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      {t.roles
                        .map((r) => SIGNER_ROLE_LABELS[r as SignerRole] ?? r)
                        .join(' · ')}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand group-hover:text-brand-deep">
                    Bu şablonu kullan
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <p className="text-xs text-ink-muted mt-6 text-center">
        Yakında daha fazla sektör (freelance, eğitim, sağlık…) ve özelleştirilebilir hazır şablonlar
        eklenecek.
      </p>
    </div>
  )
}
