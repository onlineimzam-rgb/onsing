'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Plus, Edit, Trash2, Search, Star, Eye, Loader2, ExternalLink, UploadCloud } from 'lucide-react'
import type { Property } from '@/lib/db'
import { formatPrice, formatNumber } from '@/lib/format'
import { getAdminKey } from './AdminLogin'
import PropertyForm from './PropertyForm'
import BulkImportSahibinden from './BulkImportSahibinden'

export default function PropertiesAdmin() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    const adminKey = getAdminKey()
    if (!adminKey) return
    try {
      const res = await fetch('/api/admin/properties/', {
        headers: { 'x-admin-key': adminKey },
      })
      const data = await res.json()
      setProperties(data.properties || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (id: number, ref: string) => {
    if (!confirm(`${ref} numaralı ilanı ve tüm görsellerini silmek istediğinize emin misiniz?`)) return
    const adminKey = getAdminKey()
    if (!adminKey) return
    const res = await fetch(`/api/admin/properties/${id}/`, {
      method: 'DELETE',
      headers: { 'x-admin-key': adminKey },
    })
    if (res.ok) {
      setProperties((prev) => prev.filter((p) => p.id !== id))
    }
  }

  const filtered = properties.filter((p) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      p.title_tr.toLowerCase().includes(s) ||
      p.reference_no.toLowerCase().includes(s) ||
      (p.district || '').toLowerCase().includes(s) ||
      (p.neighborhood || '').toLowerCase().includes(s)
    )
  })

  if (showForm) {
    return (
      <PropertyForm
        propertyId={editingId}
        onClose={() => {
          setShowForm(false)
          setEditingId(null)
          load()
        }}
        onSaved={load}
      />
    )
  }

  if (showBulkImport) {
    return (
      <BulkImportSahibinden
        onClose={() => {
          setShowBulkImport(false)
          load()
        }}
        onDone={load}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Search className="w-4 h-4 text-navy-400 flex-shrink-0" />
          <input
            placeholder="Başlık, referans, bölge ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input flex-1 max-w-sm"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowBulkImport(true)}
            className="btn-ghost border-2 border-gold-300 text-sm"
          >
            <UploadCloud className="w-4 h-4" />
            Toplu HTML Aktar
          </button>
          <button
            onClick={() => {
              setEditingId(null)
              setShowForm(true)
            }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Yeni İlan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-navy-600">
          {search ? 'Sonuç bulunamadı.' : 'Henüz ilan yok. "Yeni İlan" ile başlayın.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="card p-3 flex items-center gap-3 hover:border-gold-300 transition-colors"
            >
              <div className="relative w-20 h-16 bg-navy-100 rounded-lg overflow-hidden flex-shrink-0">
                {p.cover_image ? (
                  <Image src={p.cover_image} alt="" fill sizes="80px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-navy-400">—</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] bg-navy-100 text-navy-700 px-1.5 py-0.5 rounded">
                    {p.reference_no}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      p.status === 'aktif'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-navy-100 text-navy-700'
                    }`}
                  >
                    {p.status}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gold-100 text-gold-800">
                    {p.type}
                  </span>
                  {p.is_featured && <Star className="w-3.5 h-3.5 text-gold-500 fill-gold-500" />}
                </div>
                <div className="font-semibold text-navy-950 truncate text-sm">{p.title_tr}</div>
                <div className="text-xs text-navy-500 truncate">
                  {[p.neighborhood, p.district].filter(Boolean).join(', ')}
                  {p.area_m2 ? ` · ${formatNumber(p.area_m2)} m²` : ''}
                  {p.bedrooms != null ? ` · ${p.bedrooms} oda` : ''}
                </div>
              </div>
              <div className="text-right flex-shrink-0 hidden sm:block">
                <div className="font-display text-base font-bold text-navy-950">
                  {formatPrice(Number(p.price), p.currency)}
                </div>
                <div className="text-[10px] text-navy-400 inline-flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {p.views || 0}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <a
                  href={`/tr/emlak/${p.slug}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg hover:bg-navy-100 flex items-center justify-center text-navy-600"
                  title="Sitede Gör"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => {
                    setEditingId(p.id)
                    setShowForm(true)
                  }}
                  className="w-9 h-9 rounded-lg hover:bg-navy-100 flex items-center justify-center text-navy-700"
                  title="Düzenle"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.reference_no)}
                  className="w-9 h-9 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
