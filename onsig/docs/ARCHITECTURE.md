# OnSig — Mimari & Teknoloji Kararları

## Yüksek seviye mimari

```
┌──────────────────────┐         ┌──────────────────────┐
│   Mobile (iOS/AND)   │◀────▶  │  OnSig Backend (Next) │
│  Expo SDK 51+        │  HTTPS  │  REST + Server Acts   │
│  React Native + TS   │         │  Postgres (Neon/RDS)  │
└──────────┬───────────┘         └─────────┬────────────┘
           │                                │
           ▼                                ▼
   Public Sign URL                   Mail (Resend) / SMS
   (web, herkes açabilir)            KEP / Stripe / iyzico
```

## Teknoloji seçimi

| Katman | Seçim | Gerekçe |
|---|---|---|
| Mobil | **React Native + Expo (SDK 51+)** | Tek codebase iOS & Android; mevcut TS ekosistemi; OTA güncelleme. |
| İmza pad | `@simonbiocchi/react-native-signature-canvas` veya **`react-native-signature-canvas`** | Webview tabanlı, ufak; native lib derdi yok. |
| Auth (mobil) | **expo-secure-store + JWT (refresh token rotation)** | Native KeyChain/Keystore içinde token saklama. |
| Backend | **Next.js 14 (App Router) + Route Handlers** | Mevcut ekibin alıştığı stack; tek deploy; Vercel/Render uyumlu. |
| DB | **Postgres** (Vercel Postgres / Neon) | Mevcut deneyim; JSONB + UUID destek. |
| ORM | **Drizzle ORM** (tercih) veya Prisma | Hafif, edge-friendly; raw SQL fallback. |
| Storage | **Vercel Blob** veya **AWS S3** | İmza PNG, PDF arşivleri. |
| PDF | **pdfkit / puppeteer-core+chrome-aws-lambda** veya **@react-pdf/renderer** | Yazdırılabilir A4 sözleşme PDF’i. |
| Mail | **Resend** (mevcut mail altyapısı uyumlu) | Yüksek deliverability. |
| SMS / OTP | **Netgsm / İletimerkezi / Twilio** | TR pazarı için Netgsm. |
| Zaman damgası | **TÜBİTAK Kamu SM Time-Stamp** (TS) | Ücretli; ileride v2’de. |
| Ödeme | **iyzico (TR)** + **Stripe (yurtdışı)** | Çift sağlayıcı. |
| Loglama | **Sentry** + **Vercel Logs** | Sentry RN’de native destek var. |
| CI / Build | **EAS Build** (Expo) + GitHub Actions | iOS sertifikası EAS yönetir. |

## Multi-tenant model

- `tenants` tablosu: her firma (emlak ofisi, KOBİ) bir tenant.
- `users` ↔ `tenant_memberships` çoktan çoğa (bir kişi birden fazla ofiste olabilir).
- Her **contract**, **sign_session**, **audit_log** kaydı `tenant_id` taşır.
- API katmanında `tenantId` her isteğin context’inde; sorgular daima `WHERE tenant_id = ?` filtresi ile.
- Mobil uygulamada kullanıcının aktif tenant’ı session’a yazılır; switch UI vardır.

## Sözleşme akışı (sequence)

```
1. Firma yöneticisi mobil/web’den "Yeni Sözleşme" → şablon seç → alanları doldur.
2. Backend kaydeder; rendered_text + form_snapshot tutulur.
3. Yönetici bir veya birden fazla "İmza oturumu" ekler (rol + alıcı bilgileri).
   - Her oturum için unique TOKEN üretilir; URL/SMS/Mail ile gönderilir.
4. İmzalayan link açar (browser veya app deep link onsig://sign/<token>).
   - Sözleşme metni gösterilir, KVKK + okudum onay kutuları, ardından imza çizim.
   - Submit: signaturePng (PNG base64), IP, UA, GPS (ops.), zaman damgası DB’ye.
5. Tüm imza oturumları "imzalandi" → contract.status = "tamamlandi".
6. Sistem PDF oluşturur, SHA-256 hash hesaplar; audit_log’a yazar.
   - PDF + hash + zaman damgası token bilgisi taraflara mail/WhatsApp ile gönderilir.
```

## Delil zinciri (audit trail)

Her olay `audit_log` tablosuna kaydedilir:
- `created_at` (server clock + NTP), `actor_id`, `tenant_id`, `entity_kind`, `entity_id`,
- `event_type` (`contract.created`, `session.created`, `session.opened`, `session.signed`,
   `contract.completed`, `pdf.generated`, `tsa.stamped`), `metadata JSONB`,
- `ip`, `user_agent`, `geo` (latitude, longitude — opsiyonel), `hash_prev`,
- `record_hash` = SHA-256(json(record) || hash_prev) — **chain-of-records**.

## Güvenlik

- **TLS 1.2+**, HSTS, security headers (CSP, X-Frame-Options, Referrer-Policy).
- **Rate limit** (sign endpoint için IP+token bazlı, max 5 deneme/15dk).
- **Token**: 256-bit URL-safe; tek kullanımlık.
- **PII şifreleme**: TC kimlik, telefon, e-posta `pgcrypto` ile sütun bazlı şifreli (key KMS’te).
- **Backup**: Postgres günlük snapshot + WAL; aylık dışa aktarım S3.
- **Audit erişim**: 2FA zorunlu (TOTP).

## API yüzey özeti (taslak)

```
POST   /api/auth/otp/request          {phone|email}
POST   /api/auth/otp/verify           {code, ...} → JWT (access+refresh)
POST   /api/auth/refresh
GET    /api/me

POST   /api/tenants                   firma oluştur
GET    /api/tenants/:id/members
POST   /api/tenants/:id/members       davet

GET    /api/contracts
POST   /api/contracts
GET    /api/contracts/:id
PATCH  /api/contracts/:id
DELETE /api/contracts/:id

POST   /api/contracts/:id/sign-sessions
DELETE /api/sign-sessions/:id

GET    /api/sign/:token               public — sözleşme metni
POST   /api/sign/:token               public — imzala

GET    /api/contracts/:id/pdf
GET    /api/contracts/:id/audit       audit zinciri
```

## Veri modeli (özet)

```
tenants(id, name, plan, billing, created_at, ...)
users(id, name, email, phone, password_hash, totp_secret, created_at)
tenant_memberships(tenant_id, user_id, role)  -- owner/admin/member

contract_templates(id, tenant_id NULL, sector, type, name, schema JSONB, version, is_official)
contracts(id, tenant_id, created_by, template_id, type, title, form JSONB, rendered_text, status, created_at, updated_at)
sign_sessions(id, contract_id, role, token (unique), recipient_name, recipient_email, recipient_phone,
              status, signature_png, signer_tc, signer_ip, signer_ua, signer_geo, signed_at, expires_at, created_at)
documents(id, contract_id, kind, storage_url, sha256_hex, tsa_token, created_at)
audit_logs(id, tenant_id, actor_id, entity_kind, entity_id, event_type, metadata, ip, ua, geo, hash_prev, record_hash, created_at)

usage_counters(tenant_id, month, contracts_created, sign_sessions_created, stamps_used)
subscriptions(tenant_id, plan, status, started_at, current_period_end, provider, provider_ref)
```

## Konvansiyonlar

- TypeScript everywhere; `strict: true`.
- Postgres tabloları snake_case; TS tipleri camelCase (mapping `db.ts`’te).
- API yanıtları: `{ ok: true, data: ... }` veya `{ ok: false, error: { code, message } }`.
- Tüm para birimleri `bigint` (kuruş cinsinden).
- Tarihler ISO 8601, UTC.
