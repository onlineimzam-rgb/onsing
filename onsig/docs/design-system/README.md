# OnSig — Design System

> Premium legal-tech UI sistemi. Stripe, Linear, Notion, Ramp komşuluğunda.
> Versiyon: **1.1.0**

OnSig'in design system'i üç katman + dört spec dokümanından oluşur. Bu klasör spec'leri içerir; kod karşılıkları `backend/components/ui/onsig-design-system/`, `backend/components/admin/ui/` ve `backend/components/marketing/` altındadır.

## Dokümanlar

| Doküman | İçerik |
| --- | --- |
| [`tokens.md`](./tokens.md) | Renk, spacing, radius, shadow, typography, z-index, breakpoint, icon, focus, container |
| [`motion.md`](./motion.md) | Duration & easing scale, framer-motion variants, reduced-motion kuralları, keyframe registry |
| [`architecture.md`](./architecture.md) | Üç katmanlı UI mimarisi, server/client kuralları, folder layout, naming, composition |
| [`../brand/guidelines.md`](../brand/guidelines.md) | Voice & tone, logo, color, typography, do/don'ts |

## Hızlı başlangıç

```tsx
// Customer app
import { Card, Button, Stat } from '@/components/ui/onsig-design-system'

// Operator console
import { Panel, AdminButton, DataTable } from '@/components/admin/ui'

// Marketing
import { SectionHeading, FeatureTile } from '@/components/marketing/primitives'
import { FadeIn, FadeInStagger } from '@/components/marketing/Motion'

// Tokens (runtime, dynamic styles)
import { tokens } from '@/components/ui/onsig-design-system/tokens'

// Motion variants (framer-motion)
import { variants, stagger, duration, easing } from '@/components/ui/onsig-design-system/motion'
```

## Karar prensipleri

1. **Tek doğru** — bir token sadece bir yerde tanımlıdır.
2. **Server-first** — `'use client'` zorunlu olduğunda kullanılır.
3. **Üç katman, asla karışmaz** — admin marketing'i import etmez, marketing app'i bilmez.
4. **Reduced motion mutlak** — animasyon hiçbir zaman zorunlu değildir.
5. **Erişilebilirlik müzakere edilmez** — focus halkası, klavye nav, kontrast → ihlal yok.

## Genişletme rehberi

Yeni bir component eklerken:

1. Hangi katmana ait? → [`architecture.md → §4`](./architecture.md)
2. Hangi katman dizinine konacak? → [`architecture.md → §2`](./architecture.md)
3. Hangi token'ları kullanacak? → [`tokens.md`](./tokens.md)
4. Hareket gerekiyor mu? → [`motion.md → §10`](./motion.md)
5. Voice/tone uyumlu mu? → [`../brand/guidelines.md`](../brand/guidelines.md)
6. `cn`, `Panel`, `Card` gibi mevcut bir primitive ile kompozisyon mümkün mü?
7. Primitive **iki defadan fazla** tekrarlanıyor mu? → DS'e yükselt.

## Sürüm günlüğü

- **1.1.0** — Operator console (`components/admin/ui/*`) eklendi, motion variants framer-motion için genişledi, z-index ve breakpoint token'ları formalize edildi, brand guidelines yazıldı.
- **1.0.0** — İlk customer app + marketing tabanlı UI yayınlandı.
