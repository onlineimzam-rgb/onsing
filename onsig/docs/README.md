# OnSig — Documentation

Ürünün spec'leri, mimarisi ve marka rehberi.

## İçindekiler

### Brand & design system (yeni, formal)
- [`brand/guidelines.md`](./brand/guidelines.md) — marka pozisyonu, logo, voice & tone, renk, tipografi, do/don'ts
- [`design-system/README.md`](./design-system/README.md) — özet ve nasıl başlanır
- [`design-system/tokens.md`](./design-system/tokens.md) — renk, spacing, radius, shadow, typography, z-index, breakpoint, motion (özet)
- [`design-system/motion.md`](./design-system/motion.md) — hareket sistemi, framer-motion variants, reduced-motion
- [`design-system/architecture.md`](./design-system/architecture.md) — üç katmanlı UI mimarisi, folder layout, naming, composition patterns, data flow, accessibility

### Product & ops (taslak / planlama dosyaları)
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — yüksek seviye sistem mimarisi, mobil + backend stack
- [`BRAND.md`](./BRAND.md) — ilk marka taslağı (yeni `brand/guidelines.md` bunun üzerine inşa edildi)
- [`DECISIONS.md`](./DECISIONS.md) — ADR günlüğü
- [`ROADMAP.md`](./ROADMAP.md) — sprint planı
- [`LEGAL.md`](./LEGAL.md) — KVKK / TBK uyum notları
- [`PRICING.md`](./PRICING.md) — fiyat stratejisi taslağı

> **Not:** `BRAND.md` ve `ARCHITECTURE.md` projeyle birlikte büyüyen taslaklardır. Premium kanonik spec'ler için `brand/guidelines.md` ve `design-system/architecture.md`'i okuyun.

## Kod karşılıkları

| Spec | Kod |
| --- | --- |
| Tokens | [`backend/components/ui/onsig-design-system/tokens.ts`](../backend/components/ui/onsig-design-system/tokens.ts) |
| Motion | [`backend/components/ui/onsig-design-system/motion.ts`](../backend/components/ui/onsig-design-system/motion.ts) |
| Chart palette | [`backend/components/admin/ui/chart-tokens.ts`](../backend/components/admin/ui/chart-tokens.ts) |
| Customer DS | [`backend/components/ui/onsig-design-system/`](../backend/components/ui/onsig-design-system/) |
| Admin DS | [`backend/components/admin/ui/`](../backend/components/admin/ui/) |
| Marketing primitives | [`backend/components/marketing/`](../backend/components/marketing/) |
| Tailwind config | [`backend/tailwind.config.ts`](../backend/tailwind.config.ts) |
| Global CSS (CSS vars) | [`backend/app/globals.css`](../backend/app/globals.css) |

## Karar günlüğü

Mimari kararlar `architecture.md → §11` altında özetlendi. Yeni bir karar gerektiğinde:

1. RFC yaz (kısa: problem, seçenekler, karar, trade-off).
2. Architecture doc'a ADR satırı olarak ekle.
3. Token / motion / brand etkisi varsa ilgili dokümanı bump'la.
