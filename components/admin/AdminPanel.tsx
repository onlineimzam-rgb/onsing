'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Building2, Inbox, Calculator, FileText, Image as ImageIcon, LogOut,
  Loader2, Database, Mail, LayoutDashboard, ExternalLink, UsersRound, ScrollText,
  Rocket, Briefcase, Activity, Bell,
} from 'lucide-react'
import AdminLogin, { getAdminKey, clearAdminKey } from './AdminLogin'
import PropertiesAdmin from './PropertiesAdmin'
import LeadsAdmin from './LeadsAdmin'
import ValuationsAdmin from './ValuationsAdmin'
import BlogAdmin from './BlogAdmin'
import GalleryAdmin from './GalleryAdmin'
import CrmAdmin from './CrmAdmin'
import ContractsAdmin from './ContractsAdmin'
import SalesAdmin from './SalesAdmin'
import DashboardAdmin from './DashboardAdmin'
import TasksAdmin from './TasksAdmin'
import { useSiteSettings } from '@/lib/settings/useSiteSettings'

const TABS = [
  { id: 'dashboard', label: 'Genel Bakış', icon: Activity },
  { id: 'tasks', label: 'Görevler', icon: Bell },
  { id: 'properties', label: 'Portföy', icon: Building2 },
  { id: 'leads', label: 'Talepler', icon: Inbox },
  { id: 'crm', label: 'Müşteriler', icon: UsersRound },
  { id: 'valuations', label: 'Değerleme', icon: Calculator },
  { id: 'contracts', label: 'Sözleşmeler', icon: ScrollText },
  { id: 'sales', label: 'İşler', icon: Briefcase },
  { id: 'blog', label: 'Blog', icon: FileText },
  { id: 'gallery', label: 'Galeri', icon: ImageIcon },
] as const

type TabId = (typeof TABS)[number]['id']

export default function AdminPanel() {
  const siteSettings = useSiteSettings()
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [tab, setTab] = useState<TabId>('dashboard')
  const [openSalesContractId, setOpenSalesContractId] = useState<number | null>(null)
  const [setupRunning, setSetupRunning] = useState(false)
  const [setupMsg, setSetupMsg] = useState<string | null>(null)
  const [mailTesting, setMailTesting] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [openContractFromCrm, setOpenContractFromCrm] = useState<number | null>(null)

  const clearOpenContractFromCrm = useCallback(() => setOpenContractFromCrm(null), [])

  useEffect(() => {
    setAuthed(!!getAdminKey())
  }, [])

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
      </div>
    )
  }
  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} />
  }

  const runSetup = async () => {
    if (!confirm('Veritabanı tabloları oluşturulsun/kontrol edilsin mi?')) return
    setSetupRunning(true)
    setSetupMsg(null)
    try {
      const res = await fetch('/api/admin/setup/', {
        method: 'POST',
        headers: { 'x-admin-key': getAdminKey() || '' },
      })
      const data = await res.json()
      if (res.ok) setSetupMsg('✓ ' + (data.message || 'Tamam.'))
      else setSetupMsg('✗ ' + (data.error || 'Hata'))
    } catch (e) {
      setSetupMsg('✗ ' + (e as Error).message)
    } finally {
      setSetupRunning(false)
    }
  }

  const testMail = async () => {
    setMailTesting(true)
    setSetupMsg(null)
    try {
      const res = await fetch('/api/admin/test-email/', {
        method: 'POST',
        headers: { 'x-admin-key': getAdminKey() || '' },
      })
      const data = await res.json()
      if (res.ok) {
        setSetupMsg(`✓ Test mail gönderildi → ${data.sent_to}`)
      } else {
        setSetupMsg(`✗ ${data.error || 'Hata'}`)
      }
    } catch (e) {
      setSetupMsg('✗ ' + (e as Error).message)
    } finally {
      setMailTesting(false)
    }
  }

  const triggerDeploy = async () => {
    if (
      !confirm(
        'Vercel üzerinde yeni bir production deploy tetiklensin mi? (Git’e push ettiğiniz son commit derlenir.)'
      )
    ) {
      return
    }
    setDeploying(true)
    setSetupMsg(null)
    try {
      const res = await fetch('/api/admin/deploy/', {
        method: 'POST',
        headers: { 'x-admin-key': getAdminKey() || '' },
      })
      const data = await res.json()
      if (res.ok) {
        setSetupMsg('✓ Deploy kuyruğa alındı. Vercel panelinden ilerlemeyi izleyebilirsiniz.')
      } else {
        setSetupMsg(`✗ ${data.error || 'Deploy başarısız'}`)
      }
    } catch (e) {
      setSetupMsg('✗ ' + (e as Error).message)
    } finally {
      setDeploying(false)
    }
  }

  const logout = () => {
    clearAdminKey()
    setAuthed(false)
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] min-h-screen">
        <aside className="bg-navy-950 text-white lg:sticky lg:top-0 lg:h-screen flex flex-col">
          <div className="p-5 border-b border-white/10">
            <img src={siteSettings.logoLightUrl} alt="Çandarlı Uzman Gayrimenkul" className="h-24 md:h-28 w-auto object-contain mb-4" />
            <div className="inline-flex items-center gap-2 text-gold-300 text-xs uppercase tracking-[0.18em] font-semibold">
              <LayoutDashboard className="w-4 h-4" />
              Yönetim Merkezi
            </div>
            <h1 className="font-display text-2xl font-bold mt-2">Admin Paneli</h1>
            <p className="text-xs text-navy-300 mt-1">Portföy, talepler, değerleme, blog ve galeri yönetimi</p>
          </div>

          <nav className="p-3 space-y-1 overflow-x-auto lg:overflow-visible flex lg:block gap-1">
            {TABS.map((t) => {
              const Icon = t.icon
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full inline-flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-gold-gradient text-navy-950 shadow-gold'
                      : 'text-navy-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {t.label}
                </button>
              )
            })}
          </nav>

          <div className="mt-auto p-4 border-t border-white/10 space-y-2">
            <a
              href="/tr/"
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold"
            >
              <ExternalLink className="w-4 h-4" />
              Siteyi Aç
            </a>
            <button
              onClick={logout}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-100 text-sm font-semibold"
            >
              <LogOut className="w-4 h-4" />
              Çıkış
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
            <div className="px-4 md:px-8 py-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">Aktif Modül</p>
                <h2 className="font-display text-xl md:text-2xl font-bold text-navy-950">
                  {TABS.find((t) => t.id === tab)?.label}
                </h2>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  onClick={runSetup}
                  disabled={setupRunning}
                  className="text-xs inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-50"
                  title="Veritabanı tablolarını oluştur"
                >
                  {setupRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                  DB Setup
                </button>
                <button
                  onClick={testMail}
                  disabled={mailTesting}
                  className="text-xs inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-50"
                  title="Mail bildirim sistemini test et"
                >
                  {mailTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  Mail Testi
                </button>
                <button
                  onClick={triggerDeploy}
                  disabled={deploying || setupRunning || mailTesting}
                  className="text-xs inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-navy-200 bg-navy-950/5 hover:bg-navy-950/10 text-navy-900 disabled:opacity-50"
                  title="VERCEL_DEPLOY_HOOK_URL ile production deploy tetikle"
                >
                  {deploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
                  Deploy
                </button>
              </div>
            </div>
            {setupMsg && (
              <div className="px-4 md:px-8 pb-3 text-xs text-navy-700">{setupMsg}</div>
            )}
          </header>

          <main className="p-4 md:p-8">
            {tab === 'dashboard' && <DashboardAdmin onJumpTab={(t) => setTab(t as TabId)} />}
            {tab === 'tasks' && <TasksAdmin />}
            {tab === 'properties' && <PropertiesAdmin />}
            {tab === 'leads' && <LeadsAdmin />}
            {tab === 'crm' && (
              <CrmAdmin
                onOpenContract={(id) => {
                  setOpenContractFromCrm(id)
                  setTab('contracts')
                }}
              />
            )}
            {tab === 'valuations' && <ValuationsAdmin />}
            {tab === 'contracts' && (
              <ContractsAdmin
                openDetailContractId={openContractFromCrm}
                onConsumedOpenDetail={clearOpenContractFromCrm}
                onCreatedSale={(contractId) => {
                  setOpenSalesContractId(contractId)
                  setTab('sales')
                }}
              />
            )}
            {tab === 'sales' && (
              <SalesAdmin
                highlightContractId={openSalesContractId}
                onConsumedHighlight={() => setOpenSalesContractId(null)}
              />
            )}
            {tab === 'blog' && <BlogAdmin />}
            {tab === 'gallery' && <GalleryAdmin />}
          </main>
        </div>
      </div>
    </div>
  )
}
