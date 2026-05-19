'use client'

import { useEffect, useState } from 'react'
import { Loader2, Phone, Mail, Trash2, Filter, MessageSquare } from 'lucide-react'
import type { Lead } from '@/lib/db'
import { getAdminKey } from './AdminLogin'
import LeadDetailModal from './LeadDetailModal'

const STATUSES = ['yeni', 'iletisimde', 'eslestirildi', 'kapatildi'] as const

function boolText(value: boolean | null | undefined) {
  if (value == null) return null
  return value ? 'Evet' : 'Hayır'
}

export default function LeadsAdmin() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')
  const [openLeadId, setOpenLeadId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    const key = getAdminKey()
    if (!key) return
    const res = await fetch('/api/admin/leads/', { headers: { 'x-admin-key': key } })
    const data = await res.json()
    setLeads(data.leads || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const updateStatus = async (id: number, status: string) => {
    const key = getAdminKey()
    if (!key) return
    await fetch(`/api/admin/leads/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
      body: JSON.stringify({ status }),
    })
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: status as any } : l)))
  }

  const remove = async (id: number) => {
    if (!confirm('Bu talebi silmek istediğinize emin misiniz?')) return
    const key = getAdminKey()
    if (!key) return
    await fetch(`/api/admin/leads/${id}/`, { method: 'DELETE', headers: { 'x-admin-key': key } })
    setLeads((prev) => prev.filter((l) => l.id !== id))
  }

  const filtered = filter ? leads.filter((l) => l.status === filter) : leads

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gold-500" /></div>
  }
  if (leads.length === 0) {
    return <div className="card p-10 text-center text-navy-600">Henüz talep yok.</div>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-navy-500" />
        <button
          onClick={() => setFilter('')}
          className={`px-3 py-1 rounded-full text-xs font-semibold ${!filter ? 'bg-navy-950 text-white' : 'bg-white border border-navy-200 text-navy-700'}`}
        >Tümü ({leads.length})</button>
        {STATUSES.map((s) => {
          const count = leads.filter((l) => l.status === s).length
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold ${filter === s ? 'bg-navy-950 text-white' : 'bg-white border border-navy-200 text-navy-700'}`}
            >{s} ({count})</button>
          )
        })}
      </div>

      <div className="space-y-2">
        {filtered.map((l) => (
          <div key={l.id} className="card p-4 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-gold-100 text-gold-800">
                  {l.intent === 'alici' ? 'Alıcı' : l.intent === 'satici' ? 'Satıcı' : l.intent}
                </span>
                <span className="font-display font-bold text-navy-950">{l.name}</span>
                <span className="text-xs text-navy-500">
                  {new Date(l.created_at).toLocaleString('tr-TR')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setOpenLeadId(l.id)}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-gold-400 bg-gold-50 hover:bg-gold-100 text-gold-800 font-semibold"
                  title="Detay aç, mülk öner / mesaj gönder"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mesaj / İlan Öner</span>
                  <span className="sm:hidden">Aç</span>
                </button>
                <select
                  value={l.status}
                  onChange={(e) => updateStatus(l.id, e.target.value)}
                  className="text-xs px-2 py-1 rounded border border-navy-200 bg-white"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button onClick={() => remove(l.id)} className="w-7 h-7 rounded hover:bg-red-50 text-red-600 flex items-center justify-center">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
              <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1.5 text-navy-700 hover:text-gold-700">
                <Phone className="w-3.5 h-3.5 text-gold-500" />
                {l.phone}
              </a>
              {l.email && (
                <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1.5 text-navy-700 hover:text-gold-700 truncate">
                  <Mail className="w-3.5 h-3.5 text-gold-500" />
                  {l.email}
                </a>
              )}
              {l.district && <span className="text-navy-600">📍 {l.district}</span>}
              {l.category && <span className="text-navy-600">🏷 {l.category}</span>}
            </div>
            {(l.budget_min || l.budget_max) && (
              <div className="text-sm text-navy-700">
                Bütçe: {l.budget_min || '?'} - {l.budget_max || '?'} {l.currency}
              </div>
            )}
            {(l.rooms || l.area_min || l.lot_min || l.total_floors || l.land_status || l.location_note || l.is_detached != null || l.in_site != null) && (
              <div className="flex flex-wrap gap-1.5 text-xs text-navy-700">
                {l.rooms && <span className="bg-navy-50 px-2 py-1 rounded">Oda: {l.rooms}</span>}
                {l.area_min && <span className="bg-navy-50 px-2 py-1 rounded">Min net: {l.area_min} m²</span>}
                {l.lot_min && <span className="bg-navy-50 px-2 py-1 rounded">Min arsa: {l.lot_min} m²</span>}
                {l.total_floors && <span className="bg-navy-50 px-2 py-1 rounded">Kat: {l.total_floors}</span>}
                {boolText(l.is_detached) && <span className="bg-navy-50 px-2 py-1 rounded">Müstakil: {boolText(l.is_detached)}</span>}
                {boolText(l.in_site) && <span className="bg-navy-50 px-2 py-1 rounded">Site: {boolText(l.in_site)}</span>}
                {l.land_status && <span className="bg-navy-50 px-2 py-1 rounded">Nitelik: {l.land_status}</span>}
                {l.location_note && <span className="bg-navy-50 px-2 py-1 rounded">Mevki: {l.location_note}</span>}
              </div>
            )}
            {l.message && (
              <div className="text-sm text-navy-700 bg-navy-50 p-2 rounded whitespace-pre-line">
                {l.message}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detay modal */}
      {openLeadId != null && (() => {
        const lead = leads.find((l) => l.id === openLeadId)
        if (!lead) return null
        return (
          <LeadDetailModal
            lead={lead}
            onClose={() => setOpenLeadId(null)}
            onUpdated={(next) => {
              setLeads((prev) =>
                prev.map((l) => (l.id === openLeadId ? { ...l, ...next } : l))
              )
            }}
          />
        )
      })()}
    </div>
  )
}
