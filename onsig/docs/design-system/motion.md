# OnSig — Motion System

> Hareketin amacı **anlam taşımak**. Süs değildir, fonksiyondur.
> Kaynak: [`backend/components/ui/onsig-design-system/motion.ts`](../../backend/components/ui/onsig-design-system/motion.ts)

## 1. Felsefe

OnSig'de animasyon üç işten birini yapar:

1. **Hierarchy bildirimi** — bir element zaten orada *değildi*, şimdi *oraya geldi*. (KPI grid stagger reveal)
2. **State transition** — kayıt değişti, kullanıcıya küçük bir tekme. (button hover, status dot pulse)
3. **Spatial relationship** — bu panel nereden geldi? (sheet right-slide, dialog pop-in)

> Decoratif animasyon **yok**. Confetti, parallax-just-because, hover-wobble, marquee logos hariç (eşitlik için stylized) — hepsi yasaktır.

---

## 2. Motion families

| Family | Süre | Easing | Kullanım |
| --- | --- | --- | --- |
| **subtle** | ≤ 180ms | gentle | Buton hover, badge ringe geçiş, status dot, icon swap |
| **emphasized** | 220–320ms | emphasized | Card reveal, sheet/dialog open, sidebar collapse |
| **narrative** | 420ms+ | emphasized + stagger | Marketing hero, onboarding |
| **cinematic** | 620ms | emphasized | Sadece marketing hero — şirket vitrini |

Bir interaction'da en fazla **bir** `narrative` veya `cinematic` hareket olabilir. Diğer her şey `subtle`'dır.

---

## 3. Duration scale

```ts
duration.instant     // 50  — opacity flip, no transform
duration.micro       // 120 — tap feedback, icon swap
duration.base        // 180 — default hover, color shift
duration.emphasized  // 220 — card reveal, fade-in
duration.pronounced  // 320 — drawer / sidebar transform
duration.narrative   // 420 — marketing card row
duration.cinematic   // 620 — marketing hero reveal (rare)
```

Framer Motion için ms değil **saniye** (`duration.base / 1000`) kullan. Helper:

```ts
import { duration } from '@/components/ui/onsig-design-system/motion'

<motion.div transition={{ duration: duration.emphasized }} />
```

---

## 4. Easing curves

| Token | Curve | Karakteristik |
| --- | --- | --- |
| `emphasized` | `0.16, 1, 0.3, 1` | Sert ease-out. UI element'i "yerine oturur". |
| `gentle` | `0.4, 0, 0.2, 1` | Dengeli, materialish. Hover/press için. |
| `spring` | `0.34, 1.56, 0.64, 1` | Hafif overshoot. Dialog pop-in, success toast. |
| `linear` | — | Shimmer, progress bar, marquee. |

### Hangi easing'i ne zaman?

- **State transition (color)** → `gentle`
- **Reveal (yeni gelen element)** → `emphasized`
- **Pop / celebrate** → `spring`
- **Loop / progress** → `linear`

### Karşılaştırma

```
ease-out-emphasized:  hızlı çıkar, yavaşça oturur. UI default.
ease-in-out-gentle:   hızlı başlayıp hızlı biter. Hover ideal.
spring:               hedefi geçer, geri toplar. "Yapıldı" hissi.
```

---

## 5. CSS transitions (Tailwind dışı)

`motion.ts → transition` hazır CSS string'leri verir:

```ts
import { transition } from '@/components/ui/onsig-design-system/motion'

const Card = styled.div`
  transition: ${transition.card};
`
```

| Token | Properties |
| --- | --- |
| `transition.button` | `all` |
| `transition.card`   | `transform + box-shadow + border-color` |
| `transition.tone`   | `background-color + color` |
| `transition.layout` | `width + transform + opacity` |
| `transition.drawer` | `transform + opacity` |

> Inline / dinamik durumlar dışında, Tailwind'in `transition-*` utility'lerini tercih et.

---

## 6. Framer Motion variants

`motion.ts → variants` canlı kütüphane.

### `fadeIn` — opacity only

```tsx
<motion.div initial="hidden" animate="visible" variants={variants.fadeIn}>
  …
</motion.div>
```

Kullan: skeleton → real content swap. Spatial bilgi taşımaz.

### `riseIn` — opacity + 12px yukarı

UI default. KPI tile, card, kompozit panel. **Bunu varsayılan olarak kullan**.

```tsx
<motion.section initial="hidden" whileInView="visible" viewport={{ once: true }}
  variants={variants.riseIn}>
```

### `riseInLg` — 24px lift, narrative timing

Sadece marketing hero subtext, feature row için.

### `slideInRight` / `slideInLeft`

Sheet / drawer. Genelde `<Sheet>` component'i içinde otomatik uygulanır, bağımsız kullanma.

### `popIn` — scale 0.96 → 1 + opacity

Dialog content. Backdrop ayrı `fadeIn` ile gelmeli.

### `toastIn` — `y: -20` → 0

Toast / notification. Üstten gelir, 4s sonra `exit`.

### Stagger orchestrator

```tsx
<motion.div variants={stagger.default} initial="hidden" animate="visible">
  {items.map((item) => (
    <motion.div key={item.id} variants={variants.riseIn}>
      …
    </motion.div>
  ))}
</motion.div>
```

| Preset | Children gap | Kullanım |
| --- | --- | --- |
| `stagger.default` | 60ms | KPI grid, feature cards |
| `stagger.fast` | 30ms | Tight list, audit feed |
| `stagger.narrative` | 120ms | Marketing hero row |

---

## 7. Hover / press

Hazır objeleri spread et:

```tsx
import { hoverLift, tapPress } from '@/components/ui/onsig-design-system/motion'

<motion.button
  initial="rest" whileHover="hover" {...tapPress}
  variants={{ rest: hoverLift.rest, hover: hoverLift.hover }}
/>
```

Çoğu zaman düz Tailwind `hover:` ve `active:scale-[0.985]` yeter. `hoverLift` sadece **interactive card**'lar (template selection, tenant tile) için.

---

## 8. Reduced motion — **mutlak**

`prefers-reduced-motion: reduce` ayarı OS'tan gelir; OnSig **her zaman** ona uyar.

### CSS tarafı

`globals.css` otomatik fallback verir:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Framer Motion tarafı

İki yol:

**A) Root provider (önerilen):**

```tsx
// app/(marketing)/layout.tsx
import { MotionConfig } from 'framer-motion'

<MotionConfig reducedMotion="user">{children}</MotionConfig>
```

**B) Per-variants:**

```tsx
import { withReducedMotion, variants } from '@/components/ui/onsig-design-system/motion'

<motion.div variants={withReducedMotion(variants.riseIn)} />
```

`withReducedMotion` `visible` state'inden transform'ları çıkarır, sadece **50ms cross-fade** bırakır. Element yine "var oldu" sinyali verir — disable değil.

### Raw check

```ts
import { prefersReducedMotion } from '@/components/ui/onsig-design-system/motion'

if (prefersReducedMotion()) {
  setInstant(true)
}
```

---

## 9. Tailwind keyframes (registry)

`tailwind.config.ts → keyframes/animation`'da tanımlanan canlı liste:

| Class | Family | Süre | Kullanım |
| --- | --- | --- | --- |
| `animate-fade-in` | subtle | 180 | Skeleton → content |
| `animate-fade-out` | subtle | 180 | Element kapanması |
| `animate-slide-up` | emphasized | 220 | Bulk action toolbar |
| `animate-slide-in-right` | emphasized | 320 | Sheet content |
| `animate-scale-in` | emphasized | 220 | Dialog content |
| `animate-pulse-soft` | subtle | 1600 loop | Live status dot |
| `animate-shimmer` | subtle | 1400 loop | Skeleton loading |
| `animate-accordion-down` | emphasized | 260 | Radix accordion open |
| `animate-accordion-up` | emphasized | 220 | Radix accordion close |
| `animate-marquee` | subtle | 32000 loop | Marketing logo strip |

Yeni bir keyframe'in `motion.ts → keyframes` registry'sine kaydedilmesi **zorunlu** (consumers keşfedebilsin diye).

---

## 10. Use-case cheat sheet

| Use case | Yöntem |
| --- | --- |
| Buton hover | Tailwind `transition-colors duration-150` |
| Buton tap | `active:scale-[0.985]` veya `tapPress` |
| Card hover lift | `hoverLift` (interactive card) |
| KPI grid reveal | `stagger.default` + `variants.riseIn` |
| Sheet open | `<SheetContent>` (Radix + `animate-slide-in-right`) |
| Dialog open | `variants.popIn` + backdrop `fadeIn` |
| Status pulse | `<StatusDot pulse />` → `animate-pulse-soft` |
| Skeleton | `<Skeleton />` → `animate-shimmer` |
| Live ticker | Internal `setInterval(..., 8000)` + cross-fade |
| Marketing hero | `stagger.narrative` + `variants.riseInLg` |
| Audit feed cascade | `stagger.fast` + `variants.fadeIn` |
| Onboarding step | `variants.popIn` + spring easing |

---

## 11. Performance kuralları

- Animasyonu **sadece** `transform` ve `opacity` üzerinden yap. `width`, `height`, `top`, `left` yasak.
- 60 fps hedefi: tek kareye 1 element animasyonu (stagger ile gel-gel).
- Liste 50+ item ise reveal yapma — render performance düşer.
- `whileInView` kullanırken `viewport={{ once: true }}` ekle (her scroll'da tekrar tetiklenmesin).
- Mobile'da motion'u kısaltma (preset'ler zaten konservatif).

---

## 12. Brand-marka köprüsü

| Marka değeri | Motion karşılığı |
| --- | --- |
| Kanıt | **`spring` easing** — bir aksiyon "yapıldı" hissi verir |
| Hız | **`micro`/`base` durations** — ürün hızlı hisseder |
| Saygı | **reduced-motion mutlaktır** — kullanıcı tercih ederse hiçbir hareket dayatılmaz |

---

## 13. Versiyon ve drift

`motion.ts` ile `tokens.ts → tokens.motion` **birebir** uyumlu olmalı. Birini güncellerken:

1. `motion.ts → easing/duration` değer setini değiştir.
2. `tokens.ts → tokens.motion`'u eşit hale getir.
3. `tailwind.config.ts → animation/keyframes`'i mirror et.
4. `tokens.version` bump.
