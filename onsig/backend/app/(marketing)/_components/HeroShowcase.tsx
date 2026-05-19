'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Clock,
  FileSignature,
  Hash,
  ShieldCheck,
  Send,
} from 'lucide-react'

/**
 * Hero showcase — a composite "snapshot" of OnSig: a contract card, a live
 * audit feed, and a status pill. Built to feel real but stays animation-light.
 */

const FEED = [
  { time: '12:11', text: 'OTP doğrulandı', icon: ShieldCheck, tone: 'success' },
  {
    time: '12:11',
    text: 'Bülent K. sözleşmeyi imzaladı',
    icon: FileSignature,
    tone: 'iris',
  },
  { time: '12:12', text: 'PDF arşivlendi', icon: Hash, tone: 'ink' },
  {
    time: '12:12',
    text: 'Karşı tarafa kopya gönderildi',
    icon: Send,
    tone: 'ink',
  },
] as const

export function HeroShowcase() {
  return (
    <div className="relative w-full max-w-[560px] mx-auto lg:mx-0">
      {/* Glow halo */}
      <div
        aria-hidden
        className="absolute -inset-12 -z-10 rounded-[40px] bg-gradient-to-br from-iris-9/25 via-iris-9/10 to-transparent blur-3xl"
      />

      {/* Primary contract card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-card bg-paper ring-1 ring-divider shadow-[0_30px_60px_-25px_rgba(11,15,27,0.35),0_15px_30px_-15px_rgba(11,15,27,0.18)]"
      >
        {/* Window chrome */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-divider bg-ink-1">
          <div className="flex items-center gap-1.5">
            <span className="block w-2 h-2 rounded-full bg-ink-4" />
            <span className="block w-2 h-2 rounded-full bg-ink-4" />
            <span className="block w-2 h-2 rounded-full bg-ink-4" />
          </div>
          <div className="text-2xs font-mono text-ink-7 truncate">
            onsig.app/contracts/ks-2087
          </div>
          <span className="inline-flex items-center gap-1 text-2xs font-semibold text-success-deep">
            <span className="block w-1.5 h-1.5 rounded-full bg-success-deep animate-pulse-soft" />
            Canlı
          </span>
        </div>

        {/* Header strip */}
        <div className="px-5 sm:px-6 pt-6 pb-4 border-b border-divider">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-2xs uppercase tracking-widest text-ink-7 font-semibold">
                Kira sözleşmesi · KS-2087
              </div>
              <div className="mt-1 font-display text-lg font-bold tracking-tightest text-ink-12 truncate">
                Çetin Şahbaz ↔ Bülent Karaca
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-soft text-success-deep ring-1 ring-success-soft text-2xs font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              İmzalandı
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="grid sm:grid-cols-2 gap-5 px-5 sm:px-6 py-5">
          <FieldRow label="Konut" value="Beşiktaş, İstanbul" />
          <FieldRow label="Aylık" value="24.500 ₺ / ay" />
          <FieldRow label="Başlangıç" value="01.06.2025" />
          <FieldRow label="Süre" value="12 ay" />
        </div>

        {/* Signature strip */}
        <div className="grid grid-cols-2 gap-0 border-t border-divider">
          <SignatureBlock
            who="Çetin Şahbaz"
            role="Kiraya veren"
            path="M5 30 Q15 8 30 24 T60 18 Q78 6 95 28"
          />
          <SignatureBlock
            who="Bülent Karaca"
            role="Kiracı"
            path="M8 24 Q22 4 38 20 T70 28 Q85 14 98 22"
          />
        </div>

        {/* Hash footer */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-3 bg-ink-1 border-t border-divider text-2xs font-mono text-ink-7">
          <span className="inline-flex items-center gap-1.5">
            <Hash className="w-3 h-3" />
            6c87…f24
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            14 May 2026 · 12:12
          </span>
        </div>
      </motion.div>

      {/* Floating audit feed */}
      <motion.div
        initial={{ opacity: 0, x: 24, y: 18 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:block absolute -right-6 -bottom-10 w-[260px] rounded-card bg-paper ring-1 ring-divider shadow-card overflow-hidden"
      >
        <div className="px-3.5 py-2.5 border-b border-divider flex items-center justify-between">
          <span className="text-2xs uppercase tracking-widest font-semibold text-ink-7">
            Audit feed
          </span>
          <span className="block w-1.5 h-1.5 rounded-full bg-success-deep animate-pulse-soft" />
        </div>
        <ul className="px-2 py-2">
          {FEED.map((row, i) => {
            const Icon = row.icon
            return (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.12 }}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-ink-1"
              >
                <span
                  className={`grid place-items-center w-5 h-5 rounded-full ${
                    row.tone === 'success'
                      ? 'bg-success-soft text-success-deep'
                      : row.tone === 'iris'
                        ? 'bg-iris-1 text-iris-11'
                        : 'bg-ink-2 text-ink-9'
                  }`}
                >
                  <Icon className="w-2.5 h-2.5" />
                </span>
                <span className="text-xs text-ink-11 flex-1 truncate">
                  {row.text}
                </span>
                <span className="text-2xs font-mono text-ink-7 num">
                  {row.time}
                </span>
              </motion.li>
            )
          })}
        </ul>
      </motion.div>
    </div>
  )
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-2xs uppercase tracking-widest text-ink-7 font-semibold">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-ink-12 num truncate">
        {value}
      </div>
    </div>
  )
}

function SignatureBlock({
  who,
  role,
  path,
}: {
  who: string
  role: string
  path: string
}) {
  return (
    <div className="px-5 sm:px-6 py-4 first:border-r border-divider">
      <div className="text-2xs uppercase tracking-widest text-ink-7 font-semibold">
        {role}
      </div>
      <div className="mt-0.5 text-sm font-semibold text-ink-12 truncate">
        {who}
      </div>
      <svg
        viewBox="0 0 100 32"
        className="mt-2 w-full h-8 text-iris-11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d={path}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, delay: 0.6, ease: 'easeInOut' }}
        />
      </svg>
    </div>
  )
}
