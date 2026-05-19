/**
 * Notification dispatcher — e-mail + SMS with graceful provider fallbacks.
 *
 * - Resend: if `RESEND_API_KEY` is set, sends real e-mails; otherwise logs.
 * - Netgsm: if `NETGSM_USER` & `NETGSM_PASS` are set, sends real SMS; otherwise logs.
 *
 * Returns a `delivery` record so callers can render "dev mode" indicators
 * (the OTP code is included in the response only when NODE_ENV !== 'production').
 */

import { Resend } from 'resend'
import { env } from './env'

export type Channel = 'email' | 'sms'

export interface NotifyResult {
  delivered: boolean
  provider: 'resend' | 'netgsm' | 'mock'
  externalId: string | null
  /** Visible only in dev mode for debugging (do not return in prod responses). */
  preview?: string
}

const DEV = process.env.NODE_ENV !== 'production'

let resendClient: Resend | null = null
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY)
  return resendClient
}

// ---------------------------------------------------------------------------
// E-mail
// ---------------------------------------------------------------------------
export interface SendEmailInput {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmail(input: SendEmailInput): Promise<NotifyResult> {
  // env.MAIL_FROM is either a plain address ("noreply@x.com") or RFC 5322
  // formatted ("OnSig <noreply@x.com>"). Both are accepted by Resend.
  const from = env.MAIL_FROM

  const client = getResend()
  if (!client) {
    if (DEV) {
      console.info('[notify:email:mock]', { to: input.to, subject: input.subject, text: input.text })
    }
    return {
      delivered: false,
      provider: 'mock',
      externalId: null,
      preview: DEV ? `${input.subject}\n${input.text}` : undefined,
    }
  }

  try {
    const res = await client.emails.send({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html,
    })
    return {
      delivered: !res.error,
      provider: 'resend',
      externalId: res.data?.id ?? null,
    }
  } catch (e) {
    console.error('[notify:email:error]', (e as Error).message)
    return { delivered: false, provider: 'resend', externalId: null }
  }
}

// ---------------------------------------------------------------------------
// SMS (Netgsm) — minimal HTTP integration; replaced with full client in v0.2.
// ---------------------------------------------------------------------------
export interface SendSmsInput {
  to: string // E.164 (+90...)
  text: string
}

export async function sendSms(input: SendSmsInput): Promise<NotifyResult> {
  const user = process.env.NETGSM_USER
  const pass = process.env.NETGSM_PASS
  const header = process.env.NETGSM_HEADER || 'OnSig'

  const number = input.to.replace(/^\+/, '')

  if (!user || !pass) {
    if (DEV) console.info('[notify:sms:mock]', { to: input.to, text: input.text })
    return {
      delivered: false,
      provider: 'mock',
      externalId: null,
      preview: DEV ? input.text : undefined,
    }
  }

  try {
    const url = new URL('https://api.netgsm.com.tr/sms/send/get')
    url.searchParams.set('usercode', user)
    url.searchParams.set('password', pass)
    url.searchParams.set('gsmno', number)
    url.searchParams.set('message', input.text)
    url.searchParams.set('msgheader', header)
    url.searchParams.set('filter', '0')

    const res = await fetch(url.toString(), { method: 'GET' })
    const body = (await res.text()).trim()
    const ok = body.startsWith('00') || body.startsWith('01') || body.startsWith('02')
    return {
      delivered: ok,
      provider: 'netgsm',
      externalId: ok ? body : null,
    }
  } catch (e) {
    console.error('[notify:sms:error]', (e as Error).message)
    return { delivered: false, provider: 'netgsm', externalId: null }
  }
}

// ---------------------------------------------------------------------------
// High-level helpers
// ---------------------------------------------------------------------------
export interface SendOtpInput {
  channel: Channel
  target: string
  code: string
  contextLabel?: string // e.g. "Sözleşme #12"
}

export async function deliverOtp(input: SendOtpInput): Promise<NotifyResult> {
  const label = input.contextLabel ? ` (${input.contextLabel})` : ''
  const text = `OnSig doğrulama kodunuz${label}: ${input.code}\nKod 5 dakika geçerlidir. Bu kodu kimseyle paylaşmayın.`
  if (input.channel === 'email') {
    return sendEmail({
      to: input.target,
      subject: `OnSig doğrulama kodu: ${input.code}`,
      text,
      html: `<p>OnSig doğrulama kodunuz${label}:</p><p style="font:600 24px ui-monospace,monospace;letter-spacing:.2em">${input.code}</p><p style="color:#64748B">Kod 5 dakika geçerlidir. Bu kodu kimseyle paylaşmayın.</p>`,
    })
  }
  return sendSms({ to: input.target, text })
}

export function isDevMode(): boolean {
  return DEV
}
