/**
 * Auth — JWT (jose) issuance + verification.
 *
 * Two tokens: access (short, default 15min) + refresh (longer, default 7d).
 * `argon2` for password hashing (memory-cost > bcrypt).
 *
 * MVP scope: e-mail + password + (optional) TOTP 2FA. Phone OTP flow lives in
 * lib/otp.ts and is wired into /api/auth/* routes in a follow-up commit.
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { cookies, headers } from 'next/headers'

const ACCESS_TTL = Number(process.env.JWT_ACCESS_TTL_SECONDS || 900)
const REFRESH_TTL = Number(process.env.JWT_REFRESH_TTL_SECONDS || 60 * 60 * 24 * 7)

function getSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET
  if (!raw || raw.length < 32) {
    throw new Error('JWT_SECRET missing or too short. Generate one with `openssl rand -base64url 48`.')
  }
  return new TextEncoder().encode(raw)
}

export interface AccessTokenPayload extends JWTPayload {
  sub: string // user id
  tid: number // tenant id (single tenant for MVP)
  role: 'owner' | 'admin' | 'member'
  typ: 'access'
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string
  tid: number
  typ: 'refresh'
  jti: string
}

export async function signAccessToken(payload: Omit<AccessTokenPayload, 'typ' | 'iat' | 'exp'>) {
  return await new SignJWT({ ...payload, typ: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL}s`)
    .sign(getSecret())
}

export async function signRefreshToken(payload: Omit<RefreshTokenPayload, 'typ' | 'iat' | 'exp'>) {
  return await new SignJWT({ ...payload, typ: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TTL}s`)
    .sign(getSecret())
}

export async function verifyAccess(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] })
    if (payload.typ !== 'access') return null
    return payload as AccessTokenPayload
  } catch {
    return null
  }
}

export async function verifyRefresh(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] })
    if (payload.typ !== 'refresh') return null
    return payload as RefreshTokenPayload
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Password hashing (argon2id)
// ---------------------------------------------------------------------------
import argon2 from 'argon2'

export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 })
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, plain)
}

// ---------------------------------------------------------------------------
// HTTP-level helpers
// ---------------------------------------------------------------------------
export const ACCESS_COOKIE = 'onsig_at'
export const REFRESH_COOKIE = 'onsig_rt'

export function setAuthCookies(accessToken: string, refreshToken: string) {
  const c = cookies()
  c.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TTL,
  })
  c.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: REFRESH_TTL,
  })
}

export function clearAuthCookies() {
  const c = cookies()
  c.set(ACCESS_COOKIE, '', { path: '/', maxAge: 0 })
  c.set(REFRESH_COOKIE, '', { path: '/api/auth', maxAge: 0 })
}

/**
 * Resolves the access token from the current request, preferring `Authorization:
 * Bearer <token>` (native/mobile clients) and falling back to the httpOnly
 * `onsig_at` cookie (web). Token shape is identical in both transports — the
 * same JWT issued by `setAuthCookies` is what we expect over the header too.
 */
export function readAccessToken(): string | null {
  const auth = headers().get('authorization')
  if (auth) {
    const m = /^Bearer\s+(.+)$/i.exec(auth.trim())
    if (m && m[1]) return m[1].trim()
  }
  return cookies().get(ACCESS_COOKIE)?.value ?? null
}

export async function getCurrentSession(): Promise<AccessTokenPayload | null> {
  const token = readAccessToken()
  if (!token) return null
  return verifyAccess(token)
}
