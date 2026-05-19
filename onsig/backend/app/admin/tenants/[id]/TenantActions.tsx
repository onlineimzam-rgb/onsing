'use client'

/**
 * TenantActions — operator-side write surface for a single tenant.
 *
 * Wires four destructive / stateful flows that were previously cosmetic:
 *
 *   1. Plan değiştir          → POST /api/admin/tenants/:id/subscription
 *   2. Aboneliği duraklat     → POST /api/admin/tenants/:id/subscription/status (pause/resume)
 *   3. Aboneliği iptal et     → POST .../status (cancel)
 *   4. Tenant'ı sil           → DELETE /api/admin/tenants/:id
 *
 * Each flow goes through ConfirmDialog or Sheet (focus-trap, ESC, glass overlay)
 * and triggers a router.refresh() so the surrounding RSC reflects new state.
 */

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  CheckCircle2,
  Pause,
  Play,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react'

import {
  AdminBadge,
  AdminButton,
  AdminInput,
  AdminSelect,
  ConfirmDialog,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
} from '@/components/admin/ui'

type Plan = 'free' | 'pro' | 'business' | 'enterprise'
type SubStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused'

interface SubscriptionSnapshot {
  plan: Plan
  status: SubStatus
  pricePerMonth: number
  seats: number
}

interface TenantActionsProps {
  tenantId: number
  tenantName: string
  /** Snapshot of current subscription (or null when none exists yet). */
  subscription: SubscriptionSnapshot | null
  /** Current plan from the parent `tenants` row (fallback when no sub). */
  currentPlan: Plan
}

const PLAN_OPTIONS: { value: Plan; label: string; price: number }[] = [
  { value: 'free', label: 'Free', price: 0 },
  { value: 'pro', label: 'Pro', price: 699 },
  { value: 'business', label: 'Business', price: 2499 },
  { value: 'enterprise', label: 'Enterprise', price: 9999 },
]

const STATUS_OPTIONS: { value: SubStatus; label: string }[] = [
  { value: 'active', label: 'Aktif' },
  { value: 'trialing', label: 'Deneme' },
  { value: 'past_due', label: 'Vadesi geçti' },
  { value: 'paused', label: 'Duraklatılmış' },
  { value: 'canceled', label: 'İptal edildi' },
]

export function TenantActions({
  tenantId,
  tenantName,
  subscription,
  currentPlan,
}: TenantActionsProps) {
  const router = useRouter()
  const [openPlan, setOpenPlan] = React.useState(false)
  const [openPause, setOpenPause] = React.useState(false)
  const [openCancel, setOpenCancel] = React.useState(false)
  const [openDelete, setOpenDelete] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const isPaused = subscription?.status === 'paused'
  const isCanceled = subscription?.status === 'canceled'

  async function call(input: RequestInfo, init?: RequestInit) {
    setError(null)
    setBusy(true)
    try {
      const res = await fetch(input, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
        cache: 'no-store',
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.ok === false) {
        const msg =
          json?.error?.message ||
          json?.error?.code ||
          `HTTP ${res.status}`
        throw new Error(msg)
      }
      return json
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Bilinmeyen hata'
      setError(msg)
      throw e
    } finally {
      setBusy(false)
    }
  }

  async function togglePause() {
    try {
      await call(`/api/admin/tenants/${tenantId}/subscription/status`, {
        method: 'POST',
        body: JSON.stringify({ action: isPaused ? 'resume' : 'pause' }),
      })
      setOpenPause(false)
      router.refresh()
    } catch {}
  }

  async function cancelSubscription() {
    try {
      await call(`/api/admin/tenants/${tenantId}/subscription/status`, {
        method: 'POST',
        body: JSON.stringify({ action: 'cancel' }),
      })
      setOpenCancel(false)
      router.refresh()
    } catch {}
  }

  async function deleteTenant() {
    try {
      await call(`/api/admin/tenants/${tenantId}`, { method: 'DELETE' })
      setOpenDelete(false)
      router.replace('/admin/tenants')
      router.refresh()
    } catch {}
  }

  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        <AdminButton variant="secondary" size="sm" onClick={() => setOpenPlan(true)}>
          <Sparkles className="w-3 h-3" />
          Plan değiştir
        </AdminButton>

        {isCanceled ? (
          <AdminBadge tone="danger" dot>
            iptal edildi
          </AdminBadge>
        ) : (
          <AdminButton
            variant="secondary"
            size="sm"
            onClick={() => setOpenPause(true)}
          >
            {isPaused ? (
              <>
                <Play className="w-3 h-3" />
                Aboneliği başlat
              </>
            ) : (
              <>
                <Pause className="w-3 h-3" />
                Aboneliği duraklat
              </>
            )}
          </AdminButton>
        )}

        {!isCanceled && subscription && (
          <AdminButton
            variant="secondary"
            size="sm"
            onClick={() => setOpenCancel(true)}
          >
            <XCircle className="w-3 h-3" />
            Aboneliği iptal et
          </AdminButton>
        )}

        <AdminButton variant="danger" size="sm" onClick={() => setOpenDelete(true)}>
          <Trash2 className="w-3 h-3" />
          Sil
        </AdminButton>
      </div>

      {error && (
        <div className="mt-2 text-[12px] text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Plan / subscription editor */}
      <PlanSheet
        open={openPlan}
        onOpenChange={setOpenPlan}
        tenantId={tenantId}
        tenantName={tenantName}
        subscription={subscription}
        currentPlan={currentPlan}
        onSaved={() => {
          setOpenPlan(false)
          router.refresh()
        }}
      />

      {/* Pause / resume */}
      <ConfirmDialog
        open={openPause}
        onOpenChange={setOpenPause}
        title={isPaused ? 'Aboneliği yeniden başlat?' : 'Aboneliği duraklat?'}
        description={
          isPaused
            ? `${tenantName} için abonelik tekrar aktif edilecek. Tenant tüm özelliklere erişebilir.`
            : `${tenantName} için abonelik geçici olarak duraklatılacak. Tenant okunabilir kalır, ancak yeni sözleşme oluşturamaz.`
        }
        intent={isPaused ? 'info' : 'warning'}
        confirmLabel={isPaused ? 'Aboneliği başlat' : 'Duraklat'}
        loading={busy}
        onConfirm={togglePause}
      />

      {/* Cancel subscription */}
      <ConfirmDialog
        open={openCancel}
        onOpenChange={setOpenCancel}
        title="Aboneliği iptal et?"
        description={`${tenantName} için aktif abonelik iptal edilecek. Bu işlem geri alınamaz; iptal sonrası yeni bir abonelik oluşturmanız gerekir.`}
        intent="danger"
        confirmLabel="Aboneliği iptal et"
        confirmPhrase="iptal et"
        loading={busy}
        onConfirm={cancelSubscription}
      />

      {/* Delete tenant */}
      <ConfirmDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        title={`${tenantName} tenant'ını sil?`}
        description={
          <>
            <strong className="text-[var(--a-text-1)]">Tüm veriler silinecek:</strong> üyeler, sözleşmeler, sign sessions, faturalar,
            şubeler. Bu işlem <strong className="text-red-300">geri alınamaz</strong>. Sadece platform audit log&apos;da iz kalır.
          </>
        }
        intent="danger"
        confirmLabel="Tenant'ı kalıcı olarak sil"
        confirmPhrase={tenantName}
        loading={busy}
        onConfirm={deleteTenant}
      />
    </>
  )
}

// ─── Plan editor sheet ──────────────────────────────────────────────────────

function PlanSheet({
  open,
  onOpenChange,
  tenantId,
  tenantName,
  subscription,
  currentPlan,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: number
  tenantName: string
  subscription: SubscriptionSnapshot | null
  currentPlan: Plan
  onSaved: () => void
}) {
  const [plan, setPlan] = React.useState<Plan>(subscription?.plan ?? currentPlan)
  const [status, setStatus] = React.useState<SubStatus>(subscription?.status ?? 'active')
  const [price, setPrice] = React.useState<number>(
    subscription?.pricePerMonth ?? PLAN_OPTIONS.find((p) => p.value === currentPlan)?.price ?? 0
  )
  const [seats, setSeats] = React.useState<number>(subscription?.seats ?? 5)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setError(null)
      return
    }
    setPlan(subscription?.plan ?? currentPlan)
    setStatus(subscription?.status ?? 'active')
    setPrice(
      subscription?.pricePerMonth ??
        PLAN_OPTIONS.find((p) => p.value === currentPlan)?.price ??
        0
    )
    setSeats(subscription?.seats ?? 5)
  }, [open, subscription, currentPlan])

  function applyPlanDefaults(next: Plan) {
    setPlan(next)
    const def = PLAN_OPTIONS.find((p) => p.value === next)
    if (def) setPrice(def.price)
  }

  async function save() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          plan,
          pricePerMonth: Math.max(0, Math.round(price)),
          seats: Math.max(1, Math.round(seats)),
          status,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error?.message || `HTTP ${res.status}`)
      }
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bilinmeyen hata')
    } finally {
      setBusy(false)
    }
  }

  const dirty =
    plan !== (subscription?.plan ?? currentPlan) ||
    price !== (subscription?.pricePerMonth ?? 0) ||
    seats !== (subscription?.seats ?? 0) ||
    status !== (subscription?.status ?? 'active')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader
          title={subscription ? 'Aboneliği düzenle' : 'Abonelik oluştur'}
          description={
            <>
              <span className="text-[var(--a-text-2)] font-medium">{tenantName}</span>
              <span className="mx-1.5 text-[var(--a-text-4)]">·</span>
              <span className="font-mono">#{tenantId}</span>
            </>
          }
        />
        <SheetBody>
          <Field label="Plan" hint="Tenant'ın faturalama planı.">
            <div className="grid grid-cols-2 gap-2">
              {PLAN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => applyPlanDefaults(opt.value)}
                  className={[
                    'group relative text-left px-3 py-2.5 rounded-lg border transition-all',
                    plan === opt.value
                      ? 'border-[var(--a-iris-40)] bg-[color:var(--a-iris-12)] shadow-[inset_0_0_0_1px_var(--a-iris-30)]'
                      : 'border-[var(--a-line-2)] bg-[var(--a-bg)] hover:border-[var(--a-line-3)]',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[13px] font-semibold tracking-tight text-[var(--a-text-1)]">
                      {opt.label}
                    </span>
                    {plan === opt.value && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[color:var(--a-iris-50)]" />
                    )}
                  </div>
                  <div className="mt-0.5 text-[11px] font-mono text-[var(--a-text-4)]">
                    ₺{opt.price.toLocaleString('tr-TR')}/ay
                  </div>
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Fiyat (₺ / ay)" hint="Tenant'a özel fiyat varsa override.">
              <AdminInput
                type="number"
                inputMode="numeric"
                value={String(price)}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                min={0}
                step={50}
              />
            </Field>
            <Field label="Koltuk sayısı" hint="Eş zamanlı kullanıcı limiti.">
              <AdminInput
                type="number"
                inputMode="numeric"
                value={String(seats)}
                onChange={(e) => setSeats(Number(e.target.value) || 1)}
                min={1}
                step={1}
              />
            </Field>
          </div>

          <Field label="Durum" hint="Abonelik yaşam döngüsü.">
            <AdminSelect
              value={status}
              onChange={(e) => setStatus(e.target.value as SubStatus)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </AdminSelect>
          </Field>

          <div className="rounded-md border border-[var(--a-line-2)] bg-[var(--a-bg)] px-3 py-2.5 text-[11.5px] leading-relaxed text-[var(--a-text-3)]">
            <strong className="text-[var(--a-text-2)]">Not:</strong> Plan değişikliği <code className="font-mono">tenants.plan</code> kolonunu da otomatik
            günceller. İşlem <code className="font-mono">platform_audit_logs</code>&apos;a yazılır.
          </div>

          {error && (
            <div className="text-[12px] text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </SheetBody>
        <SheetFooter>
          <SheetClose asChild>
            <AdminButton variant="secondary" size="sm" disabled={busy}>
              Vazgeç
            </AdminButton>
          </SheetClose>
          <AdminButton
            variant="primary"
            size="sm"
            onClick={save}
            disabled={!dirty || busy}
            loading={busy}
          >
            {subscription ? 'Kaydet' : 'Aboneliği oluştur'}
          </AdminButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--a-text-3)]">
        {label}
      </label>
      {children}
      {hint && <div className="text-[11px] text-[var(--a-text-4)]">{hint}</div>}
    </div>
  )
}
