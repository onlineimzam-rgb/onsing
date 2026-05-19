'use client'

import * as React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  FileSignature,
  Send,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Smartphone,
  Hash,
  Clock,
} from 'lucide-react'

/**
 * Live workflow preview — auto-cycling 4-step illustration showing what OnSig
 * actually does. Each step shows a faux UI snapshot styled like the real app.
 */

const STEPS = [
  {
    key: 'create',
    badge: 'Adım 01',
    title: 'Sözleşmeyi hazırla',
    description:
      'Şablon seç, bilgileri doldur. Sistem metni otomatik kurar.',
    icon: FileSignature,
  },
  {
    key: 'send',
    badge: 'Adım 02',
    title: 'Linki gönder',
    description:
      'WhatsApp, e-posta veya SMS ile imza linki karşı tarafa gider.',
    icon: Send,
  },
  {
    key: 'sign',
    badge: 'Adım 03',
    title: 'OTP + Mobil imza',
    description:
      'Karşı taraf KVKK onayı verir, SMS koduyla doğrular ve imzalar.',
    icon: ShieldCheck,
  },
  {
    key: 'archive',
    badge: 'Adım 04',
    title: 'Audit zinciri',
    description:
      'PDF, IP, zaman damgası ve SHA-256 hash zinciriyle arşivlenir.',
    icon: Hash,
  },
] as const

type StepKey = (typeof STEPS)[number]['key']

export function WorkflowPreview() {
  const reduced = useReducedMotion()
  const [active, setActive] = React.useState<StepKey>('create')

  React.useEffect(() => {
    if (reduced) return
    const id = setInterval(() => {
      setActive((prev) => {
        const idx = STEPS.findIndex((s) => s.key === prev)
        return STEPS[(idx + 1) % STEPS.length].key
      })
    }, 3600)
    return () => clearInterval(id)
  }, [reduced])

  const activeIdx = STEPS.findIndex((s) => s.key === active)

  return (
    <div className="grid lg:grid-cols-[280px,1fr] gap-6 lg:gap-10">
      {/* Step list (rail) */}
      <ol className="relative space-y-1">
        <span
          aria-hidden
          className="absolute left-4 top-4 bottom-4 w-px bg-divider"
        />
        {STEPS.map((step, i) => {
          const isActive = step.key === active
          const isDone = i < activeIdx
          const Icon = step.icon
          return (
            <li key={step.key}>
              <button
                type="button"
                onClick={() => setActive(step.key)}
                className={`relative w-full text-left px-3 py-3 rounded-lg transition-colors duration-220 ${
                  isActive
                    ? 'bg-iris-1 ring-1 ring-iris-3'
                    : 'hover:bg-ink-2'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`relative z-10 grid place-items-center w-8 h-8 rounded-full ring-1 transition-colors ${
                      isActive
                        ? 'bg-iris-9 ring-iris-9 text-white shadow-[0_4px_12px_rgba(91,77,255,0.35)]'
                        : isDone
                          ? 'bg-success-soft ring-success-soft text-success-deep'
                          : 'bg-paper ring-divider text-ink-7'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-2xs font-semibold uppercase tracking-widest text-ink-7 num">
                      {step.badge}
                    </span>
                    <span
                      className={`block text-sm font-semibold tracking-tight mt-0.5 ${
                        isActive ? 'text-ink-12' : 'text-ink-10'
                      }`}
                    >
                      {step.title}
                    </span>
                  </span>
                </div>
              </button>
            </li>
          )
        })}
      </ol>

      {/* Stage */}
      <div className="relative">
        <div className="relative overflow-hidden rounded-card bg-paper ring-1 ring-divider shadow-card">
          {/* Faux window chrome */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-divider bg-ink-1">
            <div className="flex items-center gap-1.5">
              <span className="block w-2 h-2 rounded-full bg-ink-4" />
              <span className="block w-2 h-2 rounded-full bg-ink-4" />
              <span className="block w-2 h-2 rounded-full bg-ink-4" />
            </div>
            <div className="text-2xs font-mono text-ink-7 truncate">
              onsig.app/contracts
            </div>
            <div className="text-2xs text-ink-7">●</div>
          </div>

          {/* Stage content */}
          <div className="relative min-h-[340px] sm:min-h-[420px]">
            <AnimatePresence mode="wait">
              {active === 'create' && <StageCreate key="create" />}
              {active === 'send' && <StageSend key="send" />}
              {active === 'sign' && <StageSign key="sign" />}
              {active === 'archive' && <StageArchive key="archive" />}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom description */}
        <div className="mt-4 px-1">
          <p className="text-sm text-ink-8 leading-relaxed">
            {STEPS[activeIdx].description}
          </p>
        </div>
      </div>
    </div>
  )
}

const stageAnim = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
  transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
} as const

function StageCreate() {
  return (
    <motion.div {...stageAnim} className="p-5 sm:p-7">
      <div className="flex items-center gap-2 mb-5">
        <span className="grid place-items-center w-7 h-7 rounded-md bg-iris-1 text-iris-11 ring-1 ring-iris-3">
          <Sparkles className="w-3.5 h-3.5" />
        </span>
        <div className="text-sm font-semibold tracking-tight">
          Yeni sözleşme — Kira sözleşmesi
        </div>
      </div>
      <div className="space-y-3">
        {[
          { label: 'Kiraya veren', value: 'Çetin Şahbaz' },
          { label: 'Kiracı', value: 'Bülent Karaca' },
          { label: 'Konut adresi', value: 'Beşiktaş, İstanbul' },
          { label: 'Aylık bedel', value: '24.500 ₺ / ay' },
          { label: 'Başlangıç', value: '01.06.2025' },
        ].map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.32 }}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-md bg-ink-1 ring-1 ring-divider"
          >
            <span className="text-xs font-medium text-ink-7">{f.label}</span>
            <span className="text-sm font-semibold text-ink-12 num">
              {f.value}
            </span>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-5 flex justify-end"
      >
        <span className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md bg-ink-12 text-paper text-sm font-semibold shadow-sm">
          Sözleşmeyi oluştur
        </span>
      </motion.div>
    </motion.div>
  )
}

function StageSend() {
  return (
    <motion.div {...stageAnim} className="p-5 sm:p-7">
      <div className="flex items-center gap-2 mb-5">
        <span className="grid place-items-center w-7 h-7 rounded-md bg-iris-1 text-iris-11 ring-1 ring-iris-3">
          <Send className="w-3.5 h-3.5" />
        </span>
        <div className="text-sm font-semibold tracking-tight">
          İmza linki gönder
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { who: 'Çetin Şahbaz', role: 'Kiraya veren', channel: 'SMS' },
          { who: 'Bülent Karaca', role: 'Kiracı', channel: 'E-posta' },
        ].map((p, i) => (
          <motion.div
            key={p.who}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.12 }}
            className="p-4 rounded-md bg-paper ring-1 ring-divider"
          >
            <div className="text-2xs uppercase tracking-widest text-ink-7 font-semibold">
              {p.role}
            </div>
            <div className="mt-1 text-sm font-semibold text-ink-12">
              {p.who}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 text-xs">
              <span className="font-mono text-ink-7 truncate">
                onsig.app/sign/4t2…q9
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-iris-1 text-iris-11 ring-1 ring-iris-3 font-semibold">
                {p.channel}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-5 p-3.5 rounded-md bg-success-soft/60 ring-1 ring-success-soft"
      >
        <div className="flex items-center gap-2 text-xs">
          <span className="grid place-items-center w-5 h-5 rounded-full bg-success-deep text-paper">
            <CheckCircle2 className="w-3 h-3" />
          </span>
          <span className="font-semibold text-success-deep">
            2 imzacıya bildirim gönderildi
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

function StageSign() {
  return (
    <motion.div {...stageAnim} className="p-5 sm:p-7 flex justify-center">
      <div className="relative w-full max-w-[280px]">
        {/* Phone frame */}
        <div className="relative aspect-[9/19] rounded-[28px] bg-ink-12 ring-1 ring-ink-11 shadow-[0_24px_60px_-12px_rgba(11,15,27,0.35)] p-2.5">
          <div className="relative w-full h-full rounded-[20px] bg-paper overflow-hidden">
            {/* Top */}
            <div className="flex items-center justify-between px-3 py-2 text-2xs text-ink-9 num">
              <span>9:41</span>
              <Smartphone className="w-3 h-3" />
            </div>
            <div className="px-4 pt-2">
              <div className="text-2xs uppercase tracking-widest text-iris-11 font-semibold">
                OnSig · İmza
              </div>
              <div className="mt-1 text-[13px] font-bold tracking-tight text-ink-12">
                Kira sözleşmesi
              </div>
              <div className="mt-3 px-3 py-2 rounded-md bg-ink-1 ring-1 ring-divider text-2xs text-ink-9">
                Tek seferlik kod
                <div className="mt-1 flex gap-1">
                  {['8', '4', '6', '2', '0', '1'].map((d, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.06 }}
                      className="flex-1 grid place-items-center h-7 rounded-sm bg-paper ring-1 ring-divider font-mono font-bold text-ink-12"
                    >
                      {d}
                    </motion.span>
                  ))}
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-3 px-3 py-3 rounded-md bg-paper ring-1 ring-divider"
              >
                <div className="text-2xs font-semibold text-ink-7 mb-1.5">
                  İmza
                </div>
                <svg
                  viewBox="0 0 200 60"
                  className="w-full h-12 text-ink-12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    d="M8 42 Q20 12 36 36 T70 32 Q90 12 110 42 T156 36 Q176 14 192 30"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      delay: 0.8,
                      duration: 1.5,
                      ease: 'easeInOut',
                    }}
                  />
                </svg>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8 }}
                className="mt-3 grid place-items-center h-9 rounded-md bg-iris-hero text-paper text-xs font-semibold shadow-sm"
              >
                Onayla & imzala
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function StageArchive() {
  return (
    <motion.div {...stageAnim} className="p-5 sm:p-7">
      <div className="flex items-center gap-2 mb-5">
        <span className="grid place-items-center w-7 h-7 rounded-md bg-iris-1 text-iris-11 ring-1 ring-iris-3">
          <Hash className="w-3.5 h-3.5" />
        </span>
        <div className="text-sm font-semibold tracking-tight">
          Audit zinciri — chain of records
        </div>
      </div>
      <ul className="space-y-2.5">
        {[
          { evt: 'contract.created', hash: 'a4e2…39c', t: '12:04:21' },
          { evt: 'session.opened', hash: '8b91…1f7', t: '12:11:08' },
          { evt: 'otp.verified', hash: 'd5fa…b02', t: '12:11:53' },
          { evt: 'contract.signed', hash: '6c87…f24', t: '12:12:17' },
          { evt: 'pdf.archived', hash: '0fb1…aa9', t: '12:12:18' },
        ].map((row, i) => (
          <motion.li
            key={row.evt}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 + i * 0.08 }}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-md bg-ink-1 ring-1 ring-divider"
          >
            <span className="grid place-items-center w-6 h-6 rounded-md bg-paper ring-1 ring-divider text-ink-9 num text-2xs font-bold">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="text-xs font-mono font-medium text-ink-11">
              {row.evt}
            </span>
            <span className="ml-auto text-2xs font-mono text-ink-7 num inline-flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {row.t}
              </span>
              <span>#{row.hash}</span>
            </span>
          </motion.li>
        ))}
      </ul>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-5 px-3.5 py-2.5 rounded-md bg-iris-1 ring-1 ring-iris-3 text-xs text-iris-11 font-semibold"
      >
        SHA-256 zincir bütünlüğü doğrulandı — 5 olay
      </motion.div>
    </motion.div>
  )
}
