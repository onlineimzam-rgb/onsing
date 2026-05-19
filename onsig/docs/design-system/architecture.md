# OnSig — Component Architecture

> Üç katmanlı UI mimarisi: **Marketing**, **App (customer)**, **Admin (operator)**.
> Tek source-of-truth: `backend/components/*` + `backend/app/*`.

## 1. Üç katman, üç kişilik

OnSig'in üç ayrı kullanıcı bağlamı var. Her birinin **kendi** UI dili ve component kütüphanesi var. Yan yana çalışırlar, **birbirini import etmezler**.

| Katman | URL | Tonal | Tema | Yoğunluk | UI kütüphanesi |
| --- | --- | --- | --- | --- | --- |
| Marketing | `/` (root group `(marketing)`) | Premium, narrative | Light + dark accents | Düşük (cömert spacing) | `components/marketing/*` |
| App (customer) | `/dashboard`, `/contracts`, `/settings` | Direkt, ürün | Light | Orta | `components/ui/onsig-design-system/*` |
| Admin (operator) | `/admin/*` | Operasyonel, fintech-ops | Dark-only | **Yüksek** (compact tables) | `components/admin/ui/*` |

```
                       MARKETING
                  ┌──────────────────┐
                  │ Hero, Feature,   │
                  │ Pricing, FAQ,    │
                  │ Industry pages   │
                  └────────┬─────────┘
                           ▼
                           ▼  redirect on auth
                           ▼
        ┌──────────────────┴─────────────────┐
        │              APP                   │
        │  Dashboard · Contracts · Settings  │
        │            (light)                 │
        └──────────────────┬─────────────────┘
                           │ super_admin shortcut
                           ▼
                  ┌──────────────────┐
                  │     ADMIN        │
                  │  Operator console│
                  │   (dark)         │
                  └──────────────────┘
```

---

## 2. Folder layout

```
backend/
├── app/
│   ├── (marketing)/           # Public landing
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Home
│   │   ├── features/page.tsx
│   │   ├── pricing/page.tsx
│   │   ├── security/page.tsx
│   │   ├── industries/page.tsx
│   │   ├── contact/page.tsx
│   │   └── _components/       # Page-local (Hero, MobileShowcase, etc.)
│   ├── (auth)/                # /login, /register
│   │   ├── layout.tsx         # Split-screen hero
│   │   └── ...
│   ├── (app)/                 # Authenticated customer surface
│   │   ├── layout.tsx         # Sidebar + TopBar
│   │   ├── Nav.tsx
│   │   ├── TopBar.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── contracts/...
│   │   └── settings/...
│   ├── admin/                 # Operator console
│   │   ├── layout.tsx         # Dark shell + sidebar guard
│   │   ├── AdminNav.tsx
│   │   ├── AdminTopBar.tsx
│   │   ├── page.tsx           # Overview
│   │   ├── tenants/[id]/...
│   │   ├── billing/...
│   │   └── _components/       # Page-local widgets
│   ├── api/                   # All HTTP endpoints
│   │   ├── auth/...
│   │   ├── contracts/...
│   │   └── admin/...          # super_admin gated
│   ├── globals.css            # Global tokens + admin-shell vars
│   ├── sitemap.ts / robots.ts
│   └── ...
│
├── components/
│   ├── ui/
│   │   ├── onsig-design-system/   # Customer app + marketing-shared primitives
│   │   │   ├── tokens.ts          # ⭐ token tek doğrusu
│   │   │   ├── motion.ts          # ⭐ motion vocabulary
│   │   │   ├── cn.ts              # className combiner
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Stat.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Kbd.tsx
│   │   │   ├── LegalDoc.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Surface.tsx
│   │   │   ├── Section.tsx
│   │   │   └── index.ts           # barrel
│   │   └── Field.tsx              # Form field wrapper (auth + settings)
│   ├── marketing/                 # Marketing-only primitives
│   │   ├── Motion.tsx             # FadeIn, FadeInStagger, RevealLine
│   │   ├── primitives.tsx         # Eyebrow, SectionHeading, GradientText, CTABand…
│   │   ├── Accordion.tsx          # Radix-based FAQ
│   │   ├── Nav.tsx                # Public header
│   │   └── Footer.tsx
│   ├── admin/                     # Operator console primitives
│   │   └── ui/
│   │       ├── cn.ts
│   │       ├── Panel.tsx
│   │       ├── Button.tsx         # AdminButton, IconButton
│   │       ├── Badge.tsx          # AdminBadge, StatusDot
│   │       ├── Toolbar.tsx        # SearchInput, FilterChip, AdminInput…
│   │       ├── Kpi.tsx
│   │       ├── DataTable.tsx
│   │       ├── Sheet.tsx          # Radix Dialog wrapper
│   │       ├── Menu.tsx           # Dropdown, Tooltip, Switch
│   │       ├── Sparkline.tsx
│   │       ├── Charts.tsx         # Recharts wrappers
│   │       ├── chart-tokens.ts    # RSC-safe constants
│   │       ├── Misc.tsx           # AdminAvatar, MonoTag, UsageBar, AdminEmpty
│   │       └── index.ts
│   ├── SignatureCanvas.tsx        # Cross-surface (sign flow)
│   └── ...
│
├── lib/                            # Server-side helpers
│   ├── session.ts                  # getOptionalUser/Admin, requireSuperAdmin
│   ├── auth.ts                     # JWT, argon2, cookies
│   ├── contracts.ts                # Domain
│   ├── admin.ts                    # Admin-side aggregations
│   ├── audit.ts                    # SHA-256 chain
│   ├── pdf.tsx                     # @react-pdf/renderer
│   ├── notify.ts                   # Resend + Netgsm
│   ├── storage.ts
│   └── client/api.ts               # Browser fetch wrapper
│
├── db/
│   ├── index.ts                    # Drizzle client (singleton)
│   └── schema.ts                   # ⭐ tek schema
│
├── shared/contracts/               # Contract templates + types
│   ├── types.ts
│   ├── templates.ts
│   ├── registry.ts
│   ├── fields.ts
│   ├── render-html.ts
│   └── index.ts
│
└── scripts/                        # CLI ops
    ├── grant-admin.mjs
    ├── list-users.mjs
    └── smoke-admin.mjs
```

---

## 3. Server vs Client Components

OnSig **Server-First**'tir. Yeni bir component dosyası açtığında:

1. Önce `'use client'` **olmadan** yaz.
2. State, ref, event handler veya browser API gerektiren bir noktaya geldiğinde:
   - O kısmı **küçük bir client subcomponent**'a ayır.
   - Parent server kalır.

### Server-only component'leri tanımak

```tsx
// app/admin/billing/page.tsx
import { getBillingOverview } from '@/lib/admin'
import { Panel, Kpi } from '@/components/admin/ui'

export default async function BillingPage() {
  const data = await getBillingOverview()   // ← server fetch
  return <Panel>{/* … */}</Panel>            // ← static markup
}
```

### Client-only patterns

```tsx
'use client'                                  // top of file

import * as React from 'react'
import { AdminSwitch } from '@/components/admin/ui'

export function FeatureFlagsTable({ initial }: { initial: FlagRow[] }) {
  const [flags, setFlags] = React.useState(initial)
  // … fetch, optimistic updates
}
```

### Karışım: sayfa = server, etkileşim = client

Bir sayfa server component olur, içindeki **etkileşim tablosu** client component'a delege edilir.

```
app/admin/tenants/
  page.tsx              ← server, fetches `listTenants()`
  TenantsTable.tsx      ← 'use client', does sort/filter/bulk select
```

### Forbidden: client → server props sızıntısı

`'use client'` dosyadan **sabit object/array export etmeyin** — RSC manifest hatası verir.

❌ Hatalı:
```tsx
// Charts.tsx
'use client'
export const CHART_COLORS = { iris: '#7C77FF', … }    // RSC bunu serialize edemez
```

✅ Doğru:
```tsx
// chart-tokens.ts      ← server-safe
export const CHART_COLORS = { iris: '#7C77FF', … }

// Charts.tsx
'use client'
import { CHART_COLORS } from './chart-tokens'
```

---

## 4. Component katmanı — sorumluluk hiyerarşisi

Her component'in dört katmandan birinde durması beklenir. Bir alt katman, üst katmanı **import etmez**.

```
4. SCREENS / PAGES               (app/**/page.tsx)
   └─ Veri çeker, alt component'leri kompoze eder.

3. FEATURE COMPONENTS            (app/**/SomeForm.tsx, app/**/*Table.tsx)
   └─ Domain'e özel ('TenantsTable', 'NewContractForm').

2. SURFACES                      (Panel, Card, Sheet, Section)
   └─ Layout primitive'i. Form veya tabloya "yer" verir.

1. PRIMITIVES                    (Button, Badge, Input, Kbd, Avatar, Stat)
   └─ En atomik. Veri ya da domain bilmez.

0. TOKENS                        (tokens.ts, motion.ts, globals.css)
   └─ Renk, spacing, motion sayıları.
```

### Bir component nereye gider?

```
Diğer katmanlar import edebilir mi?
   evet → onsig-design-system/  (level 1–2)
   hayır + admin'e özel → components/admin/ui/
   hayır + marketing'e özel → components/marketing/
   hayır + tek sayfa kullanıyor → app/<route>/_components/
```

---

## 5. Naming conventions

### Dosyalar

- **PascalCase** her component dosyası: `TenantsTable.tsx`, `AdminButton.tsx`.
- **kebab-case** veri/utility modülleri: `chart-tokens.ts`, `cn.ts`.
- **lowercase** Next.js özel dosyalar: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`.

### Component isimleri

- Admin için `Admin*` prefix (`AdminButton`, `AdminBadge`). Customer DS'iyle aynı dosyada bulunmuyorlar — prefix sadece import sırasında çakışmayı önler.
- Marketing için prefix yok; lokal `_components` klasöründe yaşar.
- Hook'lar `use*` ile başlar: `useNow`, `useReducedMotion`.

### Variant API

Variant prop'ları **string union**, asla boolean kombinasyonu değil:

```tsx
// ✅
<AdminButton variant="primary" size="sm" />

// ❌
<AdminButton primary small />
```

### Boolean prop'lar

İki durumdan birini açan boolean'lar pozitif isim alır: `flush`, `elevated`, `dot`, `pulse`. Negative isim (`hideHeader`) yasak.

---

## 6. Composition patterns

### Slot pattern

`Panel + PanelHeader + PanelSubTitle` (örnek). Header alt-component'tir, ana component'in prop'u değil.

```tsx
<Panel flush>
  <PanelHeader title="Üyeler" hint={`${members.length} üye`} />
  <PanelSubTitle>Sub-section</PanelSubTitle>
  {children}
</Panel>
```

### Render-prop slot (bulk actions, columns)

`DataTable` `renderBulkActions={(ids) => …}` alır. Toolbar üzerinde aksiyonları **kontrolü çağırana** verir.

### Generic primitives

`DataTable<Row>`, `Column<Row>` jenerik tip alır — TS inference ile call site'ta otomatik dolar.

```tsx
const columns: Column<TenantRow>[] = [{ id: 'plan', cell: (r) => <Badge>{r.plan}</Badge>, … }]
<DataTable<TenantRow> rows={…} columns={columns} getRowId={(r) => r.id} />
```

### "as" / polymorphic

OnSig'de **polymorphic component yok** (`as` prop yok). Bir `Button` her zaman `<button>` render eder. Link gerekiyorsa `<Link><Button>…</Button></Link>` ya da component özelinde `<ButtonLink>` ekleyin.

---

## 7. Form pattern

```
client component
   ↓ useState
   ↓ Field (label + input + error)
   ↓ submit → api('/api/...') (lib/client/api.ts)
   ↓ on success → router.push / router.refresh
```

- Validation: client-side hint (zorunlu, format) + server Zod schema (`shared/contracts/types.ts`-tarzı).
- Error mesajları **Türkçe**, ikinci tekil şahıs, çözüm sunucu.
- Submit butonu disable + label değişimi (`İmza gönderiliyor…`).

---

## 8. Data flow

```
Server Component
    │
    ├── Domain helpers (lib/admin.ts, lib/contracts.ts)
    │       │
    │       └── Drizzle (db/index.ts) ─→ Postgres
    │
    └── Props to Client Component
              │
              └── api(...) for mutations ─→ /api/* route handler
                        │
                        └── requireUser / requireSuperAdmin
                                  └── Drizzle ─→ Postgres
                                  └── auditLogs.insert(...)
```

- **GET** veri için → server component direct DB query.
- **POST/PATCH/DELETE** için → `/api/*` route handler, her zaman audit yazar.
- Client-side state **optimistic** olur, response gelmezse rollback yapar (örn. `FeatureFlagsTable.toggle`).

---

## 9. Accessibility

- Tüm interactive primitive'ler **klavye-only** ile kullanılabilir olmalı.
- Focus-visible halkası tüm focusable element'lerde (admin shell global rule var, app DS'de `:focus-visible` Tailwind class'ı).
- `aria-label` her **icon-only button** için zorunlu.
- Dialog / Sheet → Radix → otomatik focus trap, escape close.
- Form field'larda `htmlFor` + `id` çifti.
- Renk tek başına anlam taşımaz: success ikon + label, danger ikon + label.

---

## 10. Testing & verification

Şu an manuel smoke test setimiz:

```
scripts/smoke-admin.mjs    # Admin 12 sayfa + 1 API → 200
scripts/list-users.mjs     # DB sanity
scripts/grant-admin.mjs    # Role rotation
```

Eklenecek:
- Playwright e2e: register → create contract → sign session flow
- Axe accessibility tarayıcısı (CI'da PR başına)
- Visual regression (Chromatic) — onsig-design-system + admin-ui

---

## 11. Karar günlüğü (ADR snippet'ları)

Aşağıdaki kararlar mimarinin temelini oluşturur. Değiştirmek için RFC açın.

| # | Karar | Gerekçe |
| --- | --- | --- |
| ADR-001 | Audit-trail SHA-256 zinciri | Mahkeme önünde immutability |
| ADR-002 | Üç ayrı UI katmanı | Marketing / product / ops tonal farklılığı |
| ADR-003 | `app/admin/` ayrı segment | `(app)/layout`'un user-sidebar'ından kaçınmak |
| ADR-004 | Server-first | Bundle küçük, SEO + ilk yükleme hızlı |
| ADR-005 | Platform role DB-side | JWT'den okumama, anında revoke |
| ADR-006 | Recharts (admin) | shadcn'le uyumlu, RSC-uyumlu wrapper |
| ADR-007 | Radix Dialog / Dropdown / Tooltip / Switch | Erişilebilirlik + custom styling |
| ADR-008 | Lucide tek icon kaynağı | Stroke uniformluğu |
| ADR-009 | Tek Drizzle schema | `db/schema.ts` |
| ADR-010 | Tek motion vocab | `motion.ts` → tüm animasyonlar buradan türer |
