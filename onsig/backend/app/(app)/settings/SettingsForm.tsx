'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, User as UserIcon, Palette, Gavel, Save } from 'lucide-react'
import { api, ApiError } from '@/lib/client/api'
import { Field, FormError } from '@/components/ui/Field'
import type { TenantSettings } from '@/db/schema'

interface Props {
  tenant: {
    id: number
    name: string
    slug: string
    plan: string
    settings: TenantSettings
  }
  user: {
    id: number
    name: string
    email: string | null
    phone: string | null
  }
}

type Banner = { kind: 'ok' | 'err'; text: string } | null

export default function SettingsForm({ tenant, user }: Props) {
  const router = useRouter()
  const s = tenant.settings ?? {}
  const brand = s.brand ?? {}

  const [name, setName] = useState(tenant.name)
  const [legalName, setLegalName] = useState(s.legalName ?? '')
  const [taxId, setTaxId] = useState(s.taxId ?? '')
  const [taxOffice, setTaxOffice] = useState(s.taxOffice ?? '')
  const [address, setAddress] = useState(s.address ?? '')
  const [city, setCity] = useState(s.city ?? '')
  const [phone, setPhone] = useState(s.phone ?? '')
  const [email, setEmail] = useState(s.email ?? '')
  const [website, setWebsite] = useState(s.website ?? '')

  const [competentCourt, setCompetentCourt] = useState(s.competentCourt ?? '')
  const [brokerageLicenseNo, setBrokerageLicenseNo] = useState(s.brokerageLicenseNo ?? '')

  const [logoUrl, setLogoUrl] = useState(brand.logoUrl ?? '')
  const [primaryColor, setPrimaryColor] = useState(brand.primaryColor ?? '#5A3DF5')
  const [senderName, setSenderName] = useState(brand.senderName ?? '')
  const [senderEmail, setSenderEmail] = useState(brand.senderEmail ?? '')

  const [banner, setBanner] = useState<Banner>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setBanner(null)
    setError(null)
    start(async () => {
      try {
        await api('/api/tenant', {
          method: 'PATCH',
          json: {
            name: name.trim(),
            settings: {
              legalName: legalName.trim(),
              taxId: taxId.trim(),
              taxOffice: taxOffice.trim(),
              address: address.trim(),
              city: city.trim(),
              phone: phone.trim(),
              email: email.trim(),
              website: website.trim(),
              competentCourt: competentCourt.trim(),
              brokerageLicenseNo: brokerageLicenseNo.trim(),
              brand: {
                logoUrl: logoUrl.trim(),
                primaryColor: primaryColor.trim(),
                senderName: senderName.trim(),
                senderEmail: senderEmail.trim(),
              },
            },
          },
        })
        setBanner({ kind: 'ok', text: 'Ayarlar güncellendi.' })
        router.refresh()
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Bağlantı hatası.')
      }
    })
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {banner && (
        <div
          className={`rounded-xl border px-4 py-2.5 text-sm ${
            banner.kind === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {banner.text}
        </div>
      )}

      <SectionCard
        icon={<Building2 className="w-4 h-4" />}
        title="Firma bilgileri"
        description="Sözleşme antetinde, PDF başlığında ve audit kayıtlarında kullanılır."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Görünen firma adı" required>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Yasal ünvan" hint="Sicil kaydındaki tam ad">
            <input
              className="input"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
            />
          </Field>
          <Field label="Vergi / TC Kimlik No">
            <input className="input" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
          </Field>
          <Field label="Vergi dairesi">
            <input
              className="input"
              value={taxOffice}
              onChange={(e) => setTaxOffice(e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Adres">
              <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
            </Field>
          </div>
          <Field label="Şehir / İlçe">
            <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label="Telefon">
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="E-posta">
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Web sitesi">
            <input
              className="input"
              placeholder="https://"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        icon={<Gavel className="w-4 h-4" />}
        title="Sözleşme varsayılanları"
        description="Sözleşme metnine otomatik yerleştirilen alanların varsayılan değerleri."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="Yetkili mahkeme / icra"
            hint="Örn: İstanbul (Sözleşmelerde 14./7. maddede kullanılır)"
          >
            <input
              className="input"
              value={competentCourt}
              onChange={(e) => setCompetentCourt(e.target.value)}
            />
          </Field>
          <Field
            label="Yetki belgesi / oda sicil no"
            hint="Yetki sözleşmesi ve alım-satım sözleşmelerinde basılır."
          >
            <input
              className="input"
              value={brokerageLicenseNo}
              onChange={(e) => setBrokerageLicenseNo(e.target.value)}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        icon={<Palette className="w-4 h-4" />}
        title="Marka & e-posta görünümü"
        description="Logo URL'i, vurgu rengi ve giden bildirimlerde görünecek isim."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Logo URL'si" hint="Şimdilik dışarıdan barındırılan PNG/SVG URL'i.">
              <input
                className="input"
                placeholder="https://..."
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Vurgu rengi">
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="h-11 w-12 rounded-xl border border-slate-200 bg-white p-1"
                value={primaryColor || '#5A3DF5'}
                onChange={(e) => setPrimaryColor(e.target.value)}
              />
              <input
                className="input"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
              />
            </div>
          </Field>
          <Field label="Gönderen adı">
            <input
              className="input"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
            />
          </Field>
          <Field label="Gönderen e-posta">
            <input
              type="email"
              className="input"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        icon={<UserIcon className="w-4 h-4" />}
        title="Kişisel hesap"
        description="Bu bölüm bilgi amaçlıdır; güncelleme şu an profil sayfasından gelecek."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Ad soyad">
            <input className="input" value={user.name} disabled />
          </Field>
          <Field label="E-posta">
            <input className="input" value={user.email ?? ''} disabled />
          </Field>
          <Field label="Telefon">
            <input className="input" value={user.phone ?? ''} disabled />
          </Field>
          <Field label="Üye kodu">
            <input className="input" value={`U-${user.id}`} disabled />
          </Field>
        </div>
      </SectionCard>

      <FormError message={error} />
      <div className="flex justify-end">
        <button className="btn-primary" disabled={pending}>
          <Save className="w-4 h-4" />
          {pending ? 'Kaydediliyor…' : 'Değişiklikleri kaydet'}
        </button>
      </div>
    </form>
  )
}

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="card">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand-deep grid place-items-center shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
          {description && <p className="text-xs text-ink-muted mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}
