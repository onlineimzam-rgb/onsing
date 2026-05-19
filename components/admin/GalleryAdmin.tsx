'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import imageCompression from 'browser-image-compression'
import {
  ArrowDown,
  ArrowUp,
  Image as ImageIcon,
  Loader2,
  MonitorPlay,
  Save,
  Search,
  Trash2,
  Upload,
} from 'lucide-react'
import type { GalleryImage } from '@/lib/db'
import { useSiteSettings } from '@/lib/settings/useSiteSettings'
import { getAdminKey } from './AdminLogin'

const PRESET_CATEGORIES = ['Ana Sayfa Slide', 'Çandarlı', 'Dikili', 'Bademli', 'Sahil', 'Manzara', 'Mimari']
const HOME_SLIDE_CATEGORY = 'Ana Sayfa Slide'

export default function GalleryAdmin() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [category, setCategory] = useState<string>('Ana Sayfa Slide')
  const [title, setTitle] = useState('')
  const [filter, setFilter] = useState('Tümü')
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const settings = useSiteSettings()

  const categories = useMemo(() => {
    const set = new Set(['Tümü', ...PRESET_CATEGORIES, ...images.map((i) => i.category || 'Genel')])
    return Array.from(set)
  }, [images])
  const homeSlides = images.filter((img) => img.category === HOME_SLIDE_CATEGORY)
  const filtered = images.filter((img) => {
    if (filter !== 'Tümü' && (img.category || 'Genel') !== filter) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [img.title, img.alt_text, img.category].filter(Boolean).join(' ').toLowerCase().includes(q)
  })

  const load = async () => {
    setLoading(true)
    const key = getAdminKey()
    if (!key) return
    const res = await fetch('/api/admin/gallery/', { headers: { 'x-admin-key': key } })
    const data = await res.json()
    setImages(data.images || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const handleUpload = async (files: FileList | null, forcedCategory?: string) => {
    if (!files || files.length === 0) return
    const key = getAdminKey()
    if (!key) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      for (const f of Array.from(files)) {
        if (!f.type.startsWith('image/')) continue
        const compressed = f.size > 1_500_000
          ? await imageCompression(f, { maxSizeMB: 1.4, maxWidthOrHeight: 2400, useWebWorker: true, fileType: 'image/jpeg' })
          : f
        fd.append('files', compressed, f.name)
      }
      fd.append('category', forcedCategory || category)
      if (title.trim()) fd.append('title', title.trim())

      const res = await fetch('/api/admin/gallery/', { method: 'POST', headers: { 'x-admin-key': key }, body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Yükleme başarısız')
      setImages((prev) => [...(data.images || []), ...prev].sort((a, b) => a.display_order - b.display_order))
      setTitle('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const remove = async (id: number) => {
    if (!confirm('Bu görseli silmek istediğinize emin misiniz?')) return
    const key = getAdminKey()
    if (!key) return
    await fetch(`/api/admin/gallery/${id}/`, { method: 'DELETE', headers: { 'x-admin-key': key } })
    setImages((prev) => prev.filter((i) => i.id !== id))
  }

  const patchImage = async (id: number, patch: Partial<GalleryImage>) => {
    const key = getAdminKey()
    if (!key) return
    await fetch(`/api/admin/gallery/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
      body: JSON.stringify(patch),
    })
    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }

  const move = async (img: GalleryImage, delta: -1 | 1) => {
    await patchImage(img.id, { display_order: (img.display_order || 0) + delta })
    await load()
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

      <LogoManager light={settings.logoLightUrl} dark={settings.logoDarkUrl} favicon={settings.faviconUrl} />

      <div className="card p-4 md:p-5 border-gold-200 bg-gradient-to-br from-gold-50 to-white">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <MonitorPlay className="w-5 h-5 text-gold-600" />
              <h3 className="font-display text-lg font-bold text-navy-950">Hero Slider Yönetimi</h3>
            </div>
            <p className="text-sm text-navy-600">Ana sayfada dönen görseller burada yönetilir. Sıra butonlarıyla gösterim sırasını değiştirebilirsiniz.</p>
          </div>
          <label className="btn-primary cursor-pointer whitespace-nowrap">
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files, HOME_SLIDE_CATEGORY)} disabled={uploading} />
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Slide Yükle
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {homeSlides.map((img) => <GalleryCard key={img.id} img={img} onPatch={patchImage} onRemove={remove} onMove={move} wide />)}
          {!loading && homeSlides.length === 0 && <div className="border border-dashed border-gold-300 rounded-xl p-5 text-sm text-navy-600 bg-white/70">Henüz ana sayfa slide görseli yok.</div>}
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div>
            <label className="label">Yüklenecek kategori</label>
            <input list="cat-presets" className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
            <datalist id="cat-presets">{PRESET_CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div>
            <label className="label">Başlık / alt metin</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: Çandarlı sahil manzarası" />
          </div>
          <label className="btn-primary cursor-pointer">
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} disabled={uploading} />
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            Galeriye Yükle
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button key={c} type="button" onClick={() => setFilter(c)} className={`text-xs px-2.5 py-1 rounded-full border ${filter === c ? 'bg-gold-gradient text-navy-950 border-gold-500 font-semibold' : 'bg-white border-navy-200 text-navy-700 hover:border-gold-400'}`}>
              {c}
            </button>
          ))}
        </div>
        <label className="relative block max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
          <input className="input pl-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Başlık, alt metin veya kategori ara..." />
        </label>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gold-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-navy-600">Görsel bulunamadı.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((img) => <GalleryCard key={img.id} img={img} onPatch={patchImage} onRemove={remove} onMove={move} />)}
        </div>
      )}
    </div>
  )
}

function GalleryCard({
  img,
  onPatch,
  onRemove,
  onMove,
  wide = false,
}: {
  img: GalleryImage
  onPatch: (id: number, patch: Partial<GalleryImage>) => Promise<void>
  onRemove: (id: number) => Promise<void>
  onMove: (img: GalleryImage, delta: -1 | 1) => Promise<void>
  wide?: boolean
}) {
  const [title, setTitle] = useState(img.title || '')
  const [alt, setAlt] = useState(img.alt_text || '')
  const [category, setCategory] = useState(img.category || '')
  return (
    <div className="card overflow-hidden">
      <div className={`relative ${wide ? 'aspect-[16/9]' : 'aspect-[4/3]'} bg-navy-100`}>
        <Image src={img.url} alt={img.alt_text || ''} fill sizes="420px" className="object-cover" />
      </div>
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input className="text-xs px-2 py-1 rounded border border-navy-200" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="başlık" />
          <input className="text-xs px-2 py-1 rounded border border-navy-200" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="kategori" />
        </div>
        <input className="text-xs px-2 py-1 rounded border border-navy-200 w-full" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="alt metin" />
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            <button onClick={() => onMove(img, -1)} className="w-8 h-8 rounded hover:bg-navy-100 flex items-center justify-center" title="Öne al"><ArrowUp className="w-4 h-4" /></button>
            <button onClick={() => onMove(img, 1)} className="w-8 h-8 rounded hover:bg-navy-100 flex items-center justify-center" title="Arkaya al"><ArrowDown className="w-4 h-4" /></button>
          </div>
          <div className="flex gap-1">
            <button onClick={() => onPatch(img.id, { title, alt_text: alt, category })} className="w-8 h-8 rounded hover:bg-green-50 text-green-700 flex items-center justify-center" title="Kaydet"><Save className="w-4 h-4" /></button>
            <button onClick={() => onRemove(img.id)} className="w-8 h-8 rounded hover:bg-red-50 text-red-600 flex items-center justify-center" title="Sil"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LogoManager({ light, dark, favicon }: { light: string; dark: string; favicon: string }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const upload = async (kind: 'light' | 'dark' | 'favicon', files: FileList | null) => {
    const file = files?.[0]
    const key = getAdminKey()
    if (!file || !key) return
    setBusy(kind)
    setMessage(null)
    try {
      const fd = new FormData()
      fd.append('kind', kind)
      fd.append('file', file)
      const res = await fetch('/api/admin/settings/logo/', { method: 'POST', headers: { 'x-admin-key': key }, body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Logo yüklenemedi')
      setMessage('Logo yüklendi. Sayfayı yenilediğinizde tüm alanlarda görünür.')
    } catch (e) {
      setMessage((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const reset = async (kind: 'light' | 'dark' | 'favicon') => {
    const key = getAdminKey()
    if (!key) return
    setBusy(kind)
    try {
      await fetch('/api/admin/settings/logo/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify({ kind, url: null }),
      })
      setMessage('Logo varsayılana alındı. Sayfayı yenileyin.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="card p-4 md:p-5 border-navy-200 bg-white">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h3 className="font-display text-lg font-bold text-navy-950">Logo Yönetimi</h3>
          <p className="text-xs text-navy-500">Koyu zemin, açık zemin ve favicon için logoları buradan değiştirebilirsiniz.</p>
        </div>
        {message && <span className="text-xs text-navy-600">{message}</span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <LogoSlot label="Koyu zemin logosu" url={light} kind="light" busy={busy} onUpload={upload} onReset={reset} dark />
        <LogoSlot label="Açık zemin logosu" url={dark} kind="dark" busy={busy} onUpload={upload} onReset={reset} />
        <LogoSlot label="Favicon / ikon" url={favicon} kind="favicon" busy={busy} onUpload={upload} onReset={reset} />
      </div>
    </section>
  )
}

function LogoSlot({
  label,
  url,
  kind,
  busy,
  onUpload,
  onReset,
  dark = false,
}: {
  label: string
  url: string
  kind: 'light' | 'dark' | 'favicon'
  busy: string | null
  onUpload: (kind: 'light' | 'dark' | 'favicon', files: FileList | null) => void
  onReset: (kind: 'light' | 'dark' | 'favicon') => void
  dark?: boolean
}) {
  return (
    <div className={`rounded-xl border border-navy-100 p-3 ${dark ? 'bg-navy-950' : 'bg-slate-50'}`}>
      <div className="h-24 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={label} className="max-h-20 max-w-full object-contain" />
      </div>
      <div className={`text-xs font-semibold mt-2 ${dark ? 'text-white' : 'text-navy-900'}`}>{label}</div>
      <div className="flex gap-2 mt-2">
        <label className="text-xs px-2 py-1.5 rounded-lg bg-gold-100 text-gold-800 font-semibold cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(kind, e.target.files)} />
          {busy === kind ? 'Yükleniyor…' : 'Yükle'}
        </label>
        <button type="button" onClick={() => onReset(kind)} className="text-xs px-2 py-1.5 rounded-lg border border-navy-200 bg-white text-navy-700">
          Sıfırla
        </button>
      </div>
    </div>
  )
}
