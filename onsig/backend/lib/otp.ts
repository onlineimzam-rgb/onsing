/**
 * OTP — short-lived numeric codes for sign flow & login (ADR-007).
 *
 * Codes are stored as argon2 hashes; we never persist the plaintext.
 * Default policy: 6 digits, 5 minute TTL, 5 attempts max, sliding window.
 */

import { and, desc, eq, gt, isNull } from 'drizzle-orm'
import { db, schema } from '@/db'
import { hashPassword, verifyPassword } from './auth'

const OTP_TTL_SECONDS = 5 * 60
const OTP_MAX_ATTEMPTS = 5

export type OtpPurpose = 'sign' | 'login' | 'verify_phone' | 'verify_email'
export type OtpChannel = 'sms' | 'email'

function generateCode(): string {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  const n = buf[0]! % 1_000_000
  return String(n).padStart(6, '0')
}

export interface IssueOtpInput {
  purpose: OtpPurpose
  channel: OtpChannel
  target: string
}

export interface IssueOtpResult {
  code: string // returned for delivery; not stored plain
  expiresAt: Date
}

export async function issueOtp(input: IssueOtpInput): Promise<IssueOtpResult> {
  const code = generateCode()
  const codeHash = await hashPassword(code)
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000)

  await db.insert(schema.otpCodes).values({
    purpose: input.purpose,
    channel: input.channel,
    target: input.target.toLowerCase().trim(),
    codeHash,
    expiresAt,
  })

  return { code, expiresAt }
}

export interface VerifyOtpResult {
  ok: boolean
  reason?: 'not_found' | 'expired' | 'consumed' | 'too_many' | 'mismatch'
}

export async function verifyOtp(
  purpose: OtpPurpose,
  target: string,
  code: string
): Promise<VerifyOtpResult> {
  const normalized = target.toLowerCase().trim()
  const rows = await db
    .select()
    .from(schema.otpCodes)
    .where(
      and(
        eq(schema.otpCodes.purpose, purpose),
        eq(schema.otpCodes.target, normalized),
        isNull(schema.otpCodes.consumedAt),
        gt(schema.otpCodes.expiresAt, new Date())
      )
    )
    .orderBy(desc(schema.otpCodes.createdAt))
    .limit(1)

  if (rows.length === 0) return { ok: false, reason: 'not_found' }

  const row = rows[0]!
  if (row.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, reason: 'too_many' }

  const ok = await verifyPassword(code, row.codeHash)
  if (!ok) {
    await db
      .update(schema.otpCodes)
      .set({ attempts: row.attempts + 1 })
      .where(eq(schema.otpCodes.id, row.id))
    return { ok: false, reason: 'mismatch' }
  }

  await db
    .update(schema.otpCodes)
    .set({ consumedAt: new Date() })
    .where(eq(schema.otpCodes.id, row.id))

  return { ok: true }
}
