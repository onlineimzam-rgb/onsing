# OnSig Backend (v0.1)

Next.js 14 + Drizzle ORM + Postgres ile **online sözleşme ve e-imza** backend'i.
ADR-002 gereği bu, **CUGM projesinden bağımsız** bir Next.js uygulamasıdır.

> Subdomain: **`onsig.candarliuzmangm.com.tr`** (pilot)
> İlerde: `onsig.app` (ana domain)

## Hazır iskelet — ne var ne yok

✅ `package.json`, `tsconfig.json`, `next.config.js`, `.env.example`, `.gitignore`
✅ Tailwind v3 + marka paleti + `globals.css`
✅ Drizzle şeması: `tenants`, `users`, `memberships`, `contracts`, `sign_sessions`, `otp_codes`, `documents`, `audit_logs`
✅ `db/index.ts` Postgres pool (postgres-js)
✅ `lib/tenant.ts` MVP tek-tenant bootstrap (ADR-005)
✅ `lib/auth.ts` JWT (jose) access + refresh + argon2id
✅ `lib/audit.ts` chain-of-records hashing (SHA-256, canonical JSON)
✅ `lib/ip.ts` reverse-proxy IP/UA extractor
✅ `lib/otp.ts` 6-haneli OTP (5dk TTL, 5 deneme)
✅ Landing page (`/`) + `/api/health` smoke test endpoint

⏳ **Sıradaki (hafta 1 sonu)**
- [ ] `onsig/shared/contracts/` motorunu port et (CUGM `lib/contracts/` referans)
- [ ] `POST /api/auth/login` + `POST /api/auth/refresh` + `POST /api/auth/logout`
- [ ] `GET/POST /api/contracts` + `GET/PATCH/DELETE /api/contracts/[id]`
- [ ] `POST /api/contracts/[id]/sign-sessions`
- [ ] `GET/POST /api/sign/[token]` (public)
- [ ] `GET /sign/[token]` public sayfa (Server Component + Client signature pad)
- [ ] PDF üretimi (`/api/contracts/[id]/pdf`)
- [ ] Mail gönderim (Resend) + SMS gönderim (Netgsm)
- [ ] `GET /api/contracts/[id]/audit` + doğrulama portalı `/d/[hash]`

## Yerel kurulum

```bash
cd onsig/backend
npm install
cp .env.example .env.local
# .env.local'i editle: POSTGRES_URL (Neon free tier yeterli) + JWT_SECRET

# JWT_SECRET üret:
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

# DB şemasını oluştur (Neon DB'yi açıkken):
npm run db:generate   # migration dosyalarını üretir
npm run db:push       # şemayı doğrudan DB'ye uygular

npm run dev           # http://localhost:3001
```

## Production deploy (Vercel — subdomain)

1. Vercel'de **yeni proje** oluştur (CUGM projesinden ayrı), root directory: `onsig/backend`.
2. Env değişkenlerini Vercel UI'dan ekle (`.env.example`'taki tüm anahtarlar).
3. Custom domain olarak **`onsig.candarliuzmangm.com.tr`** ekle, DNS A/CNAME kaydı Vercel'in verdiği target'a yönlendir.
4. Postgres: Neon'da yeni proje (`onsig-prod`), region: **Frankfurt** (TR/AB yakın).
5. İlk deploy sonrası `https://onsig.candarliuzmangm.com.tr/api/health` 200 dönmeli.

## Klasör yapısı

```
backend/
├── app/                          # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx                  # Landing
│   ├── globals.css
│   └── api/
│       └── health/route.ts
├── db/
│   ├── schema.ts                 # Drizzle tablo tanımları
│   └── index.ts                  # Pool + drizzle client
├── lib/
│   ├── auth.ts                   # JWT + argon2 + cookies
│   ├── audit.ts                  # chain-of-records
│   ├── ip.ts
│   ├── otp.ts
│   └── tenant.ts                 # default tenant helper
├── drizzle.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── tsconfig.json
├── .env.example
└── package.json
```

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme (port 3001) |
| `npm run build` | Production build |
| `npm run start` | Production sunucu |
| `npm run type-check` | TS doğrulama |
| `npm run db:generate` | Drizzle migration üret |
| `npm run db:push` | Şemayı DB'ye uygula |
| `npm run db:studio` | Drizzle Studio (web GUI) |

## Notlar

- **JWT_SECRET** üretim ortamında en az 48 byte olmalı (`openssl rand -base64url 48`).
- Argon2id ile parola hash; memoryCost 19MiB (OWASP önerisi).
- IP başlığı sırası: `cf-connecting-ip` > `x-real-ip` > `x-forwarded-for[0]`.
- Audit zinciri her tenant için ayrı linked-list; ilk kayıt `hash_prev = NULL`.
- TLS, HSTS, X-Frame-Options DENY → `next.config.js` üzerinden.
