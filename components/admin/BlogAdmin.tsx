'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Image from 'next/image'
import imageCompression from 'browser-image-compression'
import {
  Plus, Edit, Trash2, Save, X, ArrowLeft, Eye, EyeOff,
  Loader2, Upload, ExternalLink,
} from 'lucide-react'
import type { BlogPost } from '@/lib/db'
import { getAdminKey } from './AdminLogin'

const EMPTY = {
  title_tr: '', title_en: '',
  excerpt_tr: '', excerpt_en: '',
  content_tr: '', content_en: '',
  tags: '',
  is_published: true,
}

export default function BlogAdmin() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [currentCover, setCurrentCover] = useState<string | null>(null)
  const [removeCover, setRemoveCover] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const key = getAdminKey()
    if (!key) return
    const res = await fetch('/api/admin/blog/', { headers: { 'x-admin-key': key } })
    const data = await res.json()
    setPosts(data.posts || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const startNew = () => {
    setForm(EMPTY)
    setEditingId(null)
    setCoverFile(null)
    setCurrentCover(null)
    setRemoveCover(false)
    setShowForm(true)
  }

  const startEdit = async (p: BlogPost) => {
    setForm({
      title_tr: p.title_tr,
      title_en: p.title_en || '',
      excerpt_tr: p.excerpt_tr || '',
      excerpt_en: p.excerpt_en || '',
      content_tr: p.content_tr,
      content_en: p.content_en || '',
      tags: (p.tags || []).join(', '),
      is_published: p.is_published,
    })
    setEditingId(p.id)
    setCurrentCover(p.cover_image)
    setCoverFile(null)
    setRemoveCover(false)
    setShowForm(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const key = getAdminKey()
      if (!key) throw new Error('Yetki yok')
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
      if (coverFile) {
        const compressed = coverFile.size > 1_500_000
          ? await imageCompression(coverFile, { maxSizeMB: 1.4, maxWidthOrHeight: 2000, useWebWorker: true, fileType: 'image/jpeg' })
          : coverFile
        fd.append('cover', compressed, coverFile.name)
      }
      if (removeCover) fd.append('remove_cover', 'true')

      const url = editingId ? `/api/admin/blog/${editingId}/` : '/api/admin/blog/'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'x-admin-key': key }, body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Hata')
      await load()
      setShowForm(false)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    if (!confirm('Bu yazıyı silmek istediğinize emin misiniz?')) return
    const key = getAdminKey()
    if (!key) return
    await fetch(`/api/admin/blog/${id}/`, { method: 'DELETE', headers: { 'x-admin-key': key } })
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  const togglePublish = async (p: BlogPost) => {
    const key = getAdminKey()
    if (!key) return
    await fetch(`/api/admin/blog/${p.id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
      body: JSON.stringify({ is_published: !p.is_published }),
    })
    await load()
  }

  if (showForm) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <button type="button" onClick={() => setShowForm(false)} className="inline-flex items-center gap-2 text-navy-600 text-sm">
          <ArrowLeft className="w-4 h-4" /> Geri
        </button>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="label">Başlık (TR) *</label>
            <input className="input" required value={form.title_tr} onChange={(e) => setForm({ ...form, title_tr: e.target.value })} />
          </div>
          <div>
            <label className="label">Başlık (EN)</label>
            <input className="input" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="label">Özet (TR)</label>
            <textarea className="input min-h-[80px]" value={form.excerpt_tr} onChange={(e) => setForm({ ...form, excerpt_tr: e.target.value })} />
          </div>
          <div>
            <label className="label">Özet (EN)</label>
            <textarea className="input min-h-[80px]" value={form.excerpt_en} onChange={(e) => setForm({ ...form, excerpt_en: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="label">İçerik (TR) *</label>
            <textarea className="input min-h-[300px]" required value={form.content_tr} onChange={(e) => setForm({ ...form, content_tr: e.target.value })} />
          </div>
          <div>
            <label className="label">İçerik (EN)</label>
            <textarea className="input min-h-[300px]" value={form.content_en} onChange={(e) => setForm({ ...form, content_en: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="label">Etiketler (virgülle)</label>
            <input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Çandarlı, yatırım, 2026" />
          </div>
          <div>
            <label className="label">Durum</label>
            <label className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-navy-200 bg-white">
              <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
              <span className="text-sm">Yayınla</span>
            </label>
          </div>
          <div>
            <label className="label">Kapak Görseli</label>
            <div className="flex items-center gap-2">
              {currentCover && !removeCover && !coverFile && (
                <div className="relative w-14 h-14 rounded-lg overflow-hidden">
                  <Image src={currentCover} alt="" fill sizes="56px" className="object-cover" />
                </div>
              )}
              <label className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-navy-300 hover:border-gold-400 cursor-pointer text-sm text-navy-600">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
                <Upload className="w-4 h-4" />
                {coverFile ? coverFile.name.slice(0, 20) : 'Görsel seç'}
              </label>
              {currentCover && !removeCover && (
                <button type="button" onClick={() => { setRemoveCover(true); setCoverFile(null) }} className="w-9 h-9 rounded-lg hover:bg-red-50 text-red-600 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editingId ? 'Güncelle' : 'Yayınla'}
          </button>
          <button type="button" onClick={() => setShowForm(false)} className="btn-ghost border-2 border-navy-200">
            <X className="w-4 h-4" />
            İptal
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-navy-950">{posts.length} yazı</h3>
        <button onClick={startNew} className="btn-primary"><Plus className="w-4 h-4" /> Yeni Yazı</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gold-500" /></div>
      ) : posts.length === 0 ? (
        <div className="card p-10 text-center text-navy-600">Henüz yazı yok. "Yeni Yazı" ile başlayın.</div>
      ) : (
        <div className="space-y-2">
          {posts.map((p) => (
            <div key={p.id} className="card p-3 flex items-center gap-3">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-navy-100 flex-shrink-0">
                {p.cover_image ? (
                  <Image src={p.cover_image} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-navy-400 text-xs">—</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    p.is_published ? 'bg-green-100 text-green-700' : 'bg-navy-100 text-navy-700'
                  }`}>{p.is_published ? 'YAYINDA' : 'TASLAK'}</span>
                  <span className="text-xs text-navy-500">
                    {p.published_at ? new Date(p.published_at).toLocaleDateString('tr-TR') : '—'}
                  </span>
                </div>
                <div className="font-semibold text-navy-950 truncate text-sm">{p.title_tr}</div>
                <div className="text-xs text-navy-500 truncate">{p.tags?.join(' · ') || ''}</div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <a href={`/tr/blog/${p.slug}/`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg hover:bg-navy-100 flex items-center justify-center text-navy-600">
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button onClick={() => togglePublish(p)} className="w-9 h-9 rounded-lg hover:bg-navy-100 flex items-center justify-center text-navy-600" title={p.is_published ? 'Yayından kaldır' : 'Yayınla'}>
                  {p.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => startEdit(p)} className="w-9 h-9 rounded-lg hover:bg-navy-100 flex items-center justify-center text-navy-700">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => remove(p.id)} className="w-9 h-9 rounded-lg hover:bg-red-50 text-red-600 flex items-center justify-center">
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
