'use client'

import { useEffect, useState } from 'react'
import { Loader2, Phone, Mail, X, ExternalLink, ScrollText } from 'lucide-react'
import { getAdminKey } from './AdminLogin'
import { formatPrice } from '@/lib/format'
import type { Currency } from '@/lib/config'

function asCurrency(c: unknown): Currency {
  return c === 'EUR' ? 'EUR' : 'TRY'
}

export type CrmDetailKind = 'owner' | 'lead' | 'valuation' | 'contract'

export type CrmDetailRow = Record<string, unknown>

export function CrmContactDetailModal({
  open,
  kind,
  row,
  onClose,
  onSaved,
  onOpenContract,
}: {
  open: boolean
  kind: CrmDetailKind
  row: CrmDetailRow | null
  onClose: () => void
  onSaved: () => void
  onOpenContract?: (contractId: number) => void
}) {
  const [saving, setSaving] = useState(false)
  const [ownerName, setOwnerName] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerNotes, setOwnerNotes] = useState('')
  const [leadStatus, setLeadStatus] = useState('')
  const [crmNotes, setCrmNotes] = useState('')
  const [crmActivity, setCrmActivity] = useState('')
  const [message, setMessage] = useState('')
  const [locationNote, setLocationNote] = useState('')
  const [valCrmNotes, setValCrmNotes] = useState('')

  useEffect(() => {
    if (!open || !row) return
    if (kind === 'owner') {
      setOwnerName(String(row.owner_name || ''))
      setOwnerPhone(String(row.owner_phone || ''))
      setOwnerEmail(String(row.owner_email || ''))
      setOwnerNotes(String(row.owner_notes || ''))
    }
    if (kind === 'lead') {
      setLeadStatus(String(row.status || ''))
      setCrmNotes(String(row.crm_notes || ''))
      setCrmActivity(String(row.crm_activity_summary || ''))
      setMessage(String(row.message || ''))
      setLocationNote(String(row.location_note || ''))
    }
    if (kind === 'valuation') {
      setValCrmNotes(String(row.crm_notes || ''))
    }
  }, [open, kind, row])

  if (!open || !row) return null

  const key = getAdminKey()

  const save = async () => {
    if (!key) return
    setSaving(true)
    try {
      if (kind === 'owner') {
        const id = Number(row.id)
        const res = await fetch(`/api/admin/properties/${id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
          body: JSON.stringify({
            owner_name: ownerName,
            owner_phone: ownerPhone,
            owner_email: ownerEmail,
            owner_notes: ownerNotes,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Kaydedilemedi')
      } else if (kind === 'lead') {
        const id = Number(row.id)
        const res = await fetch(`/api/admin/leads/${id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
          body: JSON.stringify({
            status: leadStatus || null,
            crm_notes: crmNotes,
            crm_activity_summary: crmActivity,
            message,
            location_note: locationNote,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Kaydedilemedi')
      } else if (kind === 'valuation') {
        const id = Number(row.id)
        const res = await fetch(`/api/admin/valuations/${id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
          body: JSON.stringify({ crm_notes: valCrmNotes }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Kaydedilemedi')
      }
      onSaved()
      onClose()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const title =
    kind === 'owner'
      ? String(row.owner_name || 'Portföy sahibi')
      : kind === 'contract'
        ? String(row.name || 'Sözleşme tarafı')
        : String(row.name || 'Kayıt')

  const contractId = row.contract_id != null ? Number(row.contract_id) : 0

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="px-4 py-3 border-b border-navy-100 flex items-start justify-between gap-2 flex-shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-gold-800 mb-0.5">
              {kind === 'owner'
                ? 'Portföy sahibi'
                : kind === 'lead'
                  ? 'Müşteri talebi'
                  : kind === 'valuation'
                    ? 'Değerleme'
                    : 'Sözleşme (imza)'}
            </p>
            <h3 className="font-display text-lg font-bold text-navy-950 truncate">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-navy-50 text-navy-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4 flex-1 text-sm">
          {(kind === 'owner' || kind === 'lead' || kind === 'valuation' || kind === 'contract') && (
            <div className="flex flex-wrap gap-2 text-xs">
              {row.owner_phone != null && String(row.owner_phone) && kind === 'owner' && (
                <a
                  href={`tel:${row.owner_phone}`}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gold-50 text-gold-900 font-semibold"
                >
                  <Phone className="w-3.5 h-3.5" /> Ara
                </a>
              )}
              {row.phone != null && String(row.phone) && kind !== 'owner' && (
                <a
                  href={`tel:${row.phone}`}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gold-50 text-gold-900 font-semibold"
                >
                  <Phone className="w-3.5 h-3.5" /> Ara
                </a>
              )}
              {row.owner_email != null && String(row.owner_email) && kind === 'owner' && (
                <a
                  href={`mailto:${row.owner_email}`}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-navy-50 text-navy-800 font-semibold"
                >
                  <Mail className="w-3.5 h-3.5" /> Mail
                </a>
              )}
              {row.email != null && String(row.email) && kind !== 'owner' && (
                <a
                  href={`mailto:${row.email}`}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-navy-50 text-navy-800 font-semibold"
                >
                  <Mail className="w-3.5 h-3.5" /> Mail
                </a>
              )}
            </div>
          )}

          {kind === 'owner' && (
            <>
              {row.slug && (
                <a
                  href={`/tr/emlak/${encodeURIComponent(String(row.slug))}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-gold-800 font-semibold text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> İlanı sitede aç
                </a>
              )}
              <p className="text-navy-600 text-xs">
                <span className="font-semibold text-navy-800">{String(row.reference_no || '')}</span>{' '}
                {String(row.title_tr || '')}
              </p>
              {row.price != null && (
                <p className="text-xs text-navy-700">
                  Liste:{' '}
                  <span className="font-semibold">
                    {formatPrice(Number(row.price), asCurrency(row.currency))}
                  </span>
                </p>
              )}
              <label className="label text-xs">Ad soyad</label>
              <input className="input text-sm" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
              <label className="label text-xs">Telefon</label>
              <input className="input text-sm" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} />
              <label className="label text-xs">E-posta</label>
              <input className="input text-sm" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
              <label className="label text-xs">Sahip notu / portföy notu</label>
              <textarea
                className="input text-sm min-h-[100px]"
                value={ownerNotes}
                onChange={(e) => setOwnerNotes(e.target.value)}
                placeholder="Fiyat beklentisi, görüşme özeti, tapu durumu vb."
              />
            </>
          )}

          {kind === 'lead' && (
            <>
              <label className="label text-xs">Durum</label>
              <input className="input text-sm" value={leadStatus} onChange={(e) => setLeadStatus(e.target.value)} />
              <label className="label text-xs">CRM notları</label>
              <textarea
                className="input text-sm min-h-[80px]"
                value={crmNotes}
                onChange={(e) => setCrmNotes(e.target.value)}
                placeholder="Görüşülen portföyler, eşleşen ilanlar, satın alınan / kiralanan bilgisi"
              />
              <label className="label text-xs">Aktivite özeti</label>
              <textarea
                className="input text-sm min-h-[60px]"
                value={crmActivity}
                onChange={(e) => setCrmActivity(e.target.value)}
              />
              <label className="label text-xs">Orijinal mesaj</label>
              <textarea className="input text-sm min-h-[60px]" value={message} onChange={(e) => setMessage(e.target.value)} />
              <label className="label text-xs">Bölge / konum notu</label>
              <input className="input text-sm" value={locationNote} onChange={(e) => setLocationNote(e.target.value)} />
            </>
          )}

          {kind === 'valuation' && (
            <>
              <p className="text-xs text-navy-600">
                {String(row.property_type || '')} · {String(row.district || '')} · {String(row.status || '')}
              </p>
              <label className="label text-xs">CRM notları</label>
              <textarea
                className="input text-sm min-h-[100px]"
                value={valCrmNotes}
                onChange={(e) => setValCrmNotes(e.target.value)}
              />
            </>
          )}

          {kind === 'contract' && (
            <div className="space-y-2 text-navy-800 text-xs">
              <p>
                <span className="font-semibold">Sözleşme:</span> {String(row.contract_title || '—')}
              </p>
              <p>
                <span className="font-semibold">Tür:</span> {String(row.contract_type || '—')}
              </p>
              <p>
                <span className="font-semibold">Kayıt durumu:</span> {String(row.contract_status || '—')}
              </p>
              <p>
                <span className="font-semibold">İmza oturumu:</span> {signStatusTr(String(row.sign_status || ''))}
              </p>
              {row.signed_at != null && String(row.signed_at) !== '' && (
                <p>
                  <span className="font-semibold">İmza zamanı:</span>{' '}
                  {new Date(String(row.signed_at)).toLocaleString('tr-TR')}
                </p>
              )}
              {row.role != null && String(row.role) && (
                <p>
                  <span className="font-semibold">Rol:</span> {roleTr(String(row.role))}
                </p>
              )}
              {contractId > 0 && onOpenContract && (
                <button
                  type="button"
                  onClick={() => onOpenContract(contractId)}
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-navy-950 text-white text-sm font-semibold"
                >
                  <ScrollText className="w-4 h-4" />
                  Sözleşmeyi aç
                </button>
              )}
            </div>
          )}
        </div>

        {kind !== 'contract' && (
          <div className="p-4 border-t border-navy-100 flex gap-2 flex-shrink-0">
            <button type="button" onClick={onClose} className="btn-ghost border-2 border-navy-200 flex-1 text-sm">
              Kapat
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="btn-primary flex-1 inline-flex items-center justify-center gap-1 text-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Kaydet
            </button>
          </div>
        )}

        {kind === 'contract' && (
          <div className="p-4 border-t border-navy-100 flex-shrink-0">
            <button type="button" onClick={onClose} className="btn-ghost border-2 border-navy-200 w-full text-sm">
              Kapat
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function signStatusTr(s: string) {
  if (s === 'imzalandi') return 'İmzalandı'
  if (s === 'bekliyor') return 'Bekliyor'
  if (s === 'iptal') return 'İptal'
  return s || '—'
}

function roleTr(role: string) {
  const m: Record<string, string> = {
    'kiraya-veren': 'Kiraya veren',
    kefil: 'Kefil',
    kiraci: 'Kiracı',
    satici: 'Satıcı',
    alici: 'Alıcı',
    komisyoncu: 'Komisyoncu',
    'mal-sahibi': 'Mal sahibi',
    'yer-goren': 'Yer gören',
  }
  return m[role] || role
}
