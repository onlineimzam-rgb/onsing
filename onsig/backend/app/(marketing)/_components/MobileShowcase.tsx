'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ShieldCheck } from 'lucide-react'

/**
 * Mobile signing showcase — a phone mockup demonstrating the signer journey
 * (KVKK consent → OTP → signature). Lives in a glass slab on the homepage and
 * the Industries page.
 */
export function MobileShowcase() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 rounded-[60px] bg-gradient-to-tr from-iris-9/25 via-iris-9/5 to-transparent blur-3xl"
      />

      <div className="grid sm:grid-cols-[1fr,auto] gap-10 items-center">
        {/* Copy column */}
        <div>
          <ul className="space-y-5">
            {[
              {
                title: 'Çalışmıyor mu? Uygulama gerekmez.',
                description:
                  'Mobil tarayıcıda açılır; karşı tarafın hiçbir şey indirmesi gerekmez.',
              },
              {
                title: 'KVKK onayı + OTP',
                description:
                  'Aydınlatma metni okunup onaylanır, SMS koduyla kimlik doğrulanır.',
              },
              {
                title: 'Parmak ile akıcı imza',
                description:
                  'Pürüzsüz vektör imza pad — yeniden çiz, önizle, onayla.',
              },
              {
                title: 'Anlık PDF + audit kaydı',
                description:
                  'İmza biter, PDF + IP + zaman damgası saniyeler içinde arşivlenir.',
              },
            ].map((row, i) => (
              <motion.li
                key={row.title}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  delay: i * 0.08,
                  duration: 0.42,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex items-start gap-3"
              >
                <span className="mt-0.5 grid place-items-center w-6 h-6 rounded-full bg-success-soft text-success-deep ring-1 ring-success-soft shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
                <div>
                  <div className="text-sm font-semibold tracking-tight text-ink-12">
                    {row.title}
                  </div>
                  <div className="mt-1 text-sm text-ink-8 leading-relaxed">
                    {row.description}
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Phone */}
        <div className="relative w-[260px] sm:w-[280px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative aspect-[9/19] rounded-[36px] bg-ink-12 ring-1 ring-ink-11 shadow-[0_32px_80px_-20px_rgba(11,15,27,0.5)] p-2.5"
          >
            <div className="relative w-full h-full rounded-[26px] bg-paper overflow-hidden">
              {/* Status bar */}
              <div className="flex items-center justify-between px-4 py-2 text-2xs font-semibold text-ink-12 num">
                <span>9:41</span>
                <span className="inline-flex items-center gap-1">
                  <span className="block w-1 h-1 rounded-full bg-ink-12" />
                  <span className="block w-1 h-1 rounded-full bg-ink-12" />
                  <span className="block w-1 h-1 rounded-full bg-ink-12" />
                  <span className="ml-1">5G</span>
                </span>
              </div>

              <div className="px-5 pt-3">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-iris-1 text-iris-11 ring-1 ring-iris-3 text-[10px] font-semibold uppercase tracking-widest">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  OnSig · İmza
                </div>
                <div className="mt-2 font-display text-sm font-bold tracking-tight text-ink-12 leading-tight">
                  Kira sözleşmesi
                  <br />
                  imzanız bekleniyor
                </div>

                {/* OTP */}
                <div className="mt-4 px-3 py-3 rounded-lg bg-ink-1 ring-1 ring-divider">
                  <div className="text-[10px] uppercase tracking-widest text-ink-7 font-semibold">
                    Tek seferlik kod
                  </div>
                  <div className="mt-1.5 flex gap-1">
                    {['8', '4', '6', '2', '0', '1'].map((d, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 + i * 0.07 }}
                        className="flex-1 grid place-items-center h-8 rounded bg-paper ring-1 ring-divider font-mono font-bold text-ink-12 text-sm"
                      >
                        {d}
                      </motion.span>
                    ))}
                  </div>
                </div>

                {/* Signature */}
                <div className="mt-3 px-3 py-2.5 rounded-lg bg-paper ring-1 ring-divider">
                  <div className="text-[10px] font-semibold text-ink-7">
                    Parmağınla buraya imza at
                  </div>
                  <svg
                    viewBox="0 0 200 56"
                    className="mt-1 w-full h-12 text-ink-12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.path
                      d="M6 38 Q22 8 40 32 T78 30 Q98 8 118 40 T160 32 Q180 12 196 28"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        delay: 1,
                        duration: 1.6,
                        ease: 'easeInOut',
                      }}
                    />
                  </svg>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.8 }}
                  className="mt-3 grid place-items-center h-9 rounded-md bg-iris-hero text-paper text-xs font-semibold shadow-md"
                >
                  Onayla & imzala
                </motion.div>
              </div>
            </div>
          </motion.div>
          {/* Side notch */}
          <span
            aria-hidden
            className="absolute top-20 -right-1 w-1 h-10 rounded-full bg-ink-11"
          />
        </div>
      </div>
    </div>
  )
}
