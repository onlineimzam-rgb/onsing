'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Building2,
  Download,
  Filter,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react'
import {
  AdminAvatar,
  AdminBadge,
  AdminButton,
  AdminSelect,
  Column,
  ConfirmDialog,
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  FilterChip,
  IconButton,
  Panel,
  SearchInput,
  Toolbar,
  ToolbarLeft,
  ToolbarRight,
} from '@/components/admin/ui'

export interface TenantRow {
  id: number
  slug: string
  name: string
  plan: string
  createdAt: string
  contractsTotal: number
  contractsLast30d: number
  membersCount: number
  subscriptionStatus: string | null
  subscriptionPriceTRY: number
}

const PLAN_TONE: Record<string, 'neutral' | 'iris' | 'success' | 'warning' | 'info'> = {
  free: 'neutral',
  pro: 'iris',
  business: 'success',
  enterprise: 'warning',
}

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  active: 'success',
  trialing: 'info',
  past_due: 'warning',
  canceled: 'danger',
  paused: 'warning',
}

const PLANS = ['all', 'free', 'pro', 'business', 'enterprise'] as const

type Plan = 'free' | 'pro' | 'business' | 'enterprise'
type SubAction = 'pause' | 'resume' | 'cancel'

interface PendingAction {
  kind: 'pause' | 'resume' | 'cancel' | 'delete'
  ids: number[]
  /** When a single tenant is targeted, its display name. */
  label?: string
}

interface PendingPlanBulk {
  ids: number[]
  plan: Plan
}

export function TenantsTable({ rows }: { rows: TenantRow[] }) {
  const router = useRouter()
  const [plan, setPlan] = React.useState<(typeof PLANS)[number]>('all')
  const [query, setQuery] = React.useState('')
  const [pending, setPending] = React.useState<PendingAction | null>(null)
  const [planBulk, setPlanBulk] = React.useState<PendingPlanBulk | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [toast, setToast] = React.useState<{ ok: number; fail: number } | null>(null)

  const filtered = React.useMemo(() => {
    return rows.filter((r) => {
      if (plan !== 'all' && r.plan !== plan) return false
      if (query) {
        const q = query.toLowerCase()
        return (
          r.name.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q) ||
          String(r.id).includes(q)
        )
      }
      return true
    })
  }, [rows, plan, query])

  const planCounts = React.useMemo(() => {
    const map = new Map<string, number>()
    rows.forEach((r) => map.set(r.plan, (map.get(r.plan) ?? 0) + 1))
    return map
  }, [rows])

  // ─── Bulk runners ────────────────────────────────────────────────────────

  async function runSubStatus(ids: number[], action: SubAction) {
    setBusy(true)
    setError(null)
    let ok = 0
    let fail = 0
    for (const id of ids) {
      try {
        const res = await fetch(`/api/admin/tenants/${id}/subscription/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ action }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json?.ok === false) {
          fail += 1
        } else {
          ok += 1
        }
      } catch {
        fail += 1
      }
    }
    setBusy(false)
    setPending(null)
    setToast({ ok, fail })
    router.refresh()
  }

  async function runDelete(ids: number[]) {
    setBusy(true)
    setError(null)
    let ok = 0
    let fail = 0
    for (const id of ids) {
      try {
        const res = await fetch(`/api/admin/tenants/${id}`, {
          method: 'DELETE',
          cache: 'no-store',
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json?.ok === false) {
          fail += 1
        } else {
          ok += 1
        }
      } catch {
        fail += 1
      }
    }
    setBusy(false)
    setPending(null)
    setToast({ ok, fail })
    router.refresh()
  }

  async function runBulkPlan(ids: number[], nextPlan: Plan) {
    const priceMap: Record<Plan, number> = {
      free: 0,
      pro: 699,
      business: 2499,
      enterprise: 9999,
    }
    setBusy(true)
    setError(null)
    let ok = 0
    let fail = 0
    for (const id of ids) {
      try {
        const r = rows.find((x) => x.id === id)
        const res = await fetch(`/api/admin/tenants/${id}/subscription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            plan: nextPlan,
            pricePerMonth: priceMap[nextPlan],
            seats: r && r.membersCount > 0 ? Math.max(r.membersCount, 1) : 5,
            status: 'active',
          }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json?.ok === false) fail += 1
        else ok += 1
      } catch {
        fail += 1
      }
    }
    setBusy(false)
    setPlanBulk(null)
    setToast({ ok, fail })
    router.refresh()
  }

  // ─── CSV export ──────────────────────────────────────────────────────────

  function exportCSV() {
    const header = [
      'id',
      'slug',
      'name',
      'plan',
      'subscription_status',
      'price_per_month_try',
      'contracts_total',
      'contracts_last_30d',
      'members',
      'created_at',
    ]
    const lines = [header.join(',')]
    for (const r of filtered) {
      lines.push(
        [
          r.id,
          r.slug,
          csvEscape(r.name),
          r.plan,
          r.subscriptionStatus ?? '',
          r.subscriptionPriceTRY,
          r.contractsTotal,
          r.contractsLast30d,
          r.membersCount,
          r.createdAt,
        ].join(',')
      )
    }
    const blob = new Blob(['\ufeff' + lines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tenants-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ─── Columns ─────────────────────────────────────────────────────────────

  const columns: Column<TenantRow>[] = [
    {
      id: 'tenant',
      header: 'Tenant',
      width: '32%',
      cell: (r) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <AdminAvatar name={r.name} size={24} />
          <div className="min-w-0">
            <Link
              href={`/admin/tenants/${r.id}`}
              className="text-[12.5px] font-semibold text-[var(--a-text-1)] hover:text-[var(--a-accent)] truncate block leading-tight"
            >
              {r.name}
            </Link>
            <span className="block text-[10.5px] font-mono text-[var(--a-text-4)] truncate leading-tight">
              @{r.slug} · #{r.id}
            </span>
          </div>
        </div>
      ),
      sortValue: (r) => r.name.toLowerCase(),
    },
    {
      id: 'plan',
      header: 'Plan',
      cell: (r) => (
        <AdminBadge tone={PLAN_TONE[r.plan] ?? 'neutral'} dot>
          {r.plan}
        </AdminBadge>
      ),
      sortValue: (r) => r.plan,
    },
    {
      id: 'status',
      header: 'Sub',
      cell: (r) => (
        <AdminBadge tone={STATUS_TONE[r.subscriptionStatus ?? ''] ?? 'neutral'} dot>
          {r.subscriptionStatus ?? '—'}
        </AdminBadge>
      ),
      sortValue: (r) => r.subscriptionStatus ?? '',
    },
    {
      id: 'mrr',
      header: '₺ / ay',
      align: 'right',
      cell: (r) => (
        <span className="font-mono num text-[var(--a-text-1)] font-semibold">
          {r.subscriptionPriceTRY > 0
            ? new Intl.NumberFormat('tr-TR').format(r.subscriptionPriceTRY)
            : '—'}
        </span>
      ),
      sortValue: (r) => r.subscriptionPriceTRY,
    },
    {
      id: 'contracts30',
      header: 'Sözleşme · 30g',
      align: 'right',
      cell: (r) => (
        <span className="num text-[var(--a-text-2)]">{r.contractsLast30d}</span>
      ),
      sortValue: (r) => r.contractsLast30d,
    },
    {
      id: 'contractsTotal',
      header: 'Toplam',
      align: 'right',
      cell: (r) => (
        <span className="num text-[var(--a-text-3)]">{r.contractsTotal}</span>
      ),
      sortValue: (r) => r.contractsTotal,
    },
    {
      id: 'members',
      header: 'Üye',
      align: 'right',
      cell: (r) => <span className="num text-[var(--a-text-3)]">{r.membersCount}</span>,
      sortValue: (r) => r.membersCount,
    },
    {
      id: 'createdAt',
      header: 'Kayıt',
      cell: (r) => (
        <span className="text-[11.5px] text-[var(--a-text-4)] num">
          {fmtDate(r.createdAt)}
        </span>
      ),
      sortValue: (r) => r.createdAt,
    },
    {
      id: 'actions',
      header: '',
      width: 38,
      align: 'right',
      cell: (r) => {
        const isPaused = r.subscriptionStatus === 'paused'
        const isCanceled = r.subscriptionStatus === 'canceled'
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton
                variant="ghost"
                size="xs"
                onClick={(e) => e.stopPropagation()}
                aria-label="Aksiyonlar"
              >
                <MoreHorizontal className="w-3 h-3" />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                icon={<Building2 className="w-3 h-3" />}
                onSelect={() => router.push(`/admin/tenants/${r.id}`)}
              >
                Tenant&apos;ı aç
              </DropdownMenuItem>
              <DropdownMenuItem
                icon={<Filter className="w-3 h-3" />}
                onSelect={() => router.push(`/admin/contracts?tenant=${r.id}`)}
              >
                Sözleşmeleri filtrele
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!isCanceled && (
                <DropdownMenuItem
                  icon={
                    isPaused ? (
                      <Play className="w-3 h-3" />
                    ) : (
                      <Pause className="w-3 h-3" />
                    )
                  }
                  onSelect={() =>
                    setPending({
                      kind: isPaused ? 'resume' : 'pause',
                      ids: [r.id],
                      label: r.name,
                    })
                  }
                >
                  {isPaused ? 'Aboneliği başlat' : 'Aboneliği duraklat'}
                </DropdownMenuItem>
              )}
              {!isCanceled && r.subscriptionStatus && (
                <DropdownMenuItem
                  icon={<XCircle className="w-3 h-3" />}
                  destructive
                  onSelect={() =>
                    setPending({ kind: 'cancel', ids: [r.id], label: r.name })
                  }
                >
                  Aboneliği iptal et
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                icon={<Trash2 className="w-3 h-3" />}
                destructive
                onSelect={() =>
                  setPending({ kind: 'delete', ids: [r.id], label: r.name })
                }
              >
                Tenant&apos;ı sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  // ─── Bulk dialog content ─────────────────────────────────────────────────

  const bulkDialog = pending && (
    <ConfirmDialog
      open={!!pending}
      onOpenChange={(o) => !o && setPending(null)}
      title={titleFor(pending)}
      description={descFor(pending)}
      intent={pending.kind === 'delete' || pending.kind === 'cancel' ? 'danger' : 'warning'}
      confirmLabel={confirmFor(pending)}
      confirmPhrase={
        pending.kind === 'delete'
          ? pending.ids.length === 1
            ? pending.label ?? `tenant-${pending.ids[0]}`
            : `sil ${pending.ids.length}`
          : pending.kind === 'cancel'
            ? 'iptal et'
            : undefined
      }
      loading={busy}
      onConfirm={() => {
        if (pending.kind === 'delete') return runDelete(pending.ids)
        return runSubStatus(pending.ids, pending.kind)
      }}
    />
  )

  const planBulkDialog = planBulk && (
    <ConfirmDialog
      open={!!planBulk}
      onOpenChange={(o) => !o && setPlanBulk(null)}
      title={`${planBulk.ids.length} tenant için plan değişimi`}
      description={
        <>
          Seçili tenantların aboneliği <strong className="text-[var(--a-text-1)]">{planBulk.plan}</strong> planına geçirilecek
          ve durum <code className="font-mono">active</code> olarak işaretlenecek.
        </>
      }
      intent="warning"
      confirmLabel={`${planBulk.ids.length} tenant'a uygula`}
      loading={busy}
      onConfirm={() => runBulkPlan(planBulk.ids, planBulk.plan)}
    >
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--a-text-3)] mb-1.5">
          Hedef plan
        </label>
        <AdminSelect
          value={planBulk.plan}
          onChange={(e) => setPlanBulk({ ...planBulk, plan: e.target.value as Plan })}
        >
          <option value="free">Free — ₺0</option>
          <option value="pro">Pro — ₺699</option>
          <option value="business">Business — ₺2499</option>
          <option value="enterprise">Enterprise — ₺9999</option>
        </AdminSelect>
      </div>
    </ConfirmDialog>
  )

  return (
    <>
      <Panel flush>
        <Toolbar>
          <ToolbarLeft>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Tenant adı, slug, id..."
            />
            <span className="h-6 w-px bg-[var(--a-line)] mx-1" />
            {PLANS.map((p) => (
              <FilterChip
                key={p}
                active={plan === p}
                onClick={() => setPlan(p)}
                count={p === 'all' ? rows.length : planCounts.get(p) ?? 0}
              >
                {p === 'all' ? 'Hepsi' : p}
              </FilterChip>
            ))}
          </ToolbarLeft>
          <ToolbarRight>
            <AdminButton variant="secondary" size="sm" onClick={exportCSV}>
              <Download className="w-3 h-3" />
              CSV
            </AdminButton>
            <AdminButton
              variant="primary"
              size="sm"
              onClick={() => router.push('/register?from=admin')}
              title="Yeni tenant kaydı için public register akışını aç"
            >
              <Plus className="w-3 h-3" />
              Tenant ekle
            </AdminButton>
          </ToolbarRight>
        </Toolbar>

        <DataTable<TenantRow>
          rows={filtered}
          columns={columns}
          getRowId={(r) => r.id}
          density="compact"
          renderBulkActions={(rawIds) => {
            const ids = rawIds.map((x) => Number(x))
            return (
              <>
                <AdminButton
                  variant="secondary"
                  size="xs"
                  onClick={() => setPlanBulk({ ids, plan: 'pro' })}
                >
                  <Sparkles className="w-3 h-3" />
                  Plan değiştir
                </AdminButton>
                <AdminButton
                  variant="secondary"
                  size="xs"
                  onClick={() => setPending({ kind: 'pause', ids })}
                >
                  <Pause className="w-3 h-3" />
                  Duraklat
                </AdminButton>
                <AdminButton
                  variant="secondary"
                  size="xs"
                  onClick={() => setPending({ kind: 'resume', ids })}
                >
                  <Play className="w-3 h-3" />
                  Başlat
                </AdminButton>
                <AdminButton
                  variant="danger"
                  size="xs"
                  onClick={() => setPending({ kind: 'delete', ids })}
                >
                  <Trash2 className="w-3 h-3" />
                  Sil ({ids.length})
                </AdminButton>
              </>
            )
          }}
        />
      </Panel>

      {bulkDialog}
      {planBulkDialog}

      {toast && (
        <FloatingToast
          ok={toast.ok}
          fail={toast.fail}
          onDismiss={() => setToast(null)}
        />
      )}
      {error && (
        <FloatingToast
          ok={0}
          fail={0}
          error={error}
          onDismiss={() => setError(null)}
        />
      )}
    </>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function titleFor(p: PendingAction): string {
  const n = p.ids.length
  const target = n === 1 && p.label ? `"${p.label}"` : `${n} tenant`
  switch (p.kind) {
    case 'pause':
      return `${target} için aboneliği duraklat?`
    case 'resume':
      return `${target} için aboneliği başlat?`
    case 'cancel':
      return `${target} için aboneliği iptal et?`
    case 'delete':
      return `${target} için silme onayı`
  }
}

function descFor(p: PendingAction): React.ReactNode {
  switch (p.kind) {
    case 'pause':
      return 'Tenant okunabilir kalır, ancak yeni sözleşme oluşturamaz. İstendiğinde aynı yerden yeniden başlatılabilir.'
    case 'resume':
      return 'Abonelik tekrar aktif edilecek. Tüm yazma yetkileri geri açılacak.'
    case 'cancel':
      return 'Abonelik iptal edilecek. Bu işlem geri alınamaz; iptal sonrası yeni bir abonelik oluşturmanız gerekir.'
    case 'delete':
      return (
        <>
          <strong className="text-[var(--a-text-1)]">Tüm veriler silinecek:</strong> üyeler, sözleşmeler, sign sessions,
          faturalar, şubeler. Bu işlem <strong className="text-red-300">geri alınamaz</strong>.
        </>
      )
  }
}

function confirmFor(p: PendingAction): string {
  switch (p.kind) {
    case 'pause':
      return 'Duraklat'
    case 'resume':
      return 'Aboneliği başlat'
    case 'cancel':
      return 'Aboneliği iptal et'
    case 'delete':
      return p.ids.length === 1 ? "Tenant'ı sil" : `${p.ids.length} tenant'ı sil`
  }
}

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Minimal floating toast ────────────────────────────────────────────────

function FloatingToast({
  ok,
  fail,
  error,
  onDismiss,
}: {
  ok: number
  fail: number
  error?: string
  onDismiss: () => void
}) {
  React.useEffect(() => {
    const t = setTimeout(onDismiss, 4200)
    return () => clearTimeout(t)
  }, [onDismiss])

  const intent = error || fail > 0 ? 'warning' : 'success'

  return (
    <div className="fixed bottom-5 right-5 z-[60] animate-slide-up">
      <div
        className={[
          'min-w-[280px] max-w-[420px] px-3.5 py-3 rounded-lg shadow-[0_24px_64px_-24px_rgba(0,0,0,0.7)]',
          'bg-[var(--a-bg-elev)] border border-[var(--a-line-2)]',
          'text-[12.5px] text-[var(--a-text-1)] flex items-start gap-2.5',
        ].join(' ')}
      >
        <AlertTriangle
          className={[
            'w-4 h-4 mt-0.5 shrink-0',
            intent === 'warning' ? 'text-orange-400' : 'text-emerald-400',
          ].join(' ')}
        />
        <div className="min-w-0 flex-1">
          {error ? (
            <div className="text-red-300">{error}</div>
          ) : (
            <div>
              <span className="text-emerald-300 font-semibold">{ok}</span> başarılı
              {fail > 0 && (
                <>
                  {' · '}
                  <span className="text-red-300 font-semibold">{fail}</span> başarısız
                </>
              )}
            </div>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-[11px] text-[var(--a-text-4)] hover:text-[var(--a-text-1)]"
        >
          Kapat
        </button>
      </div>
    </div>
  )
}
