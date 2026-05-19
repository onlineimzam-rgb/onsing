# OnSig — Design Tokens

> Tek doğru kaynak: [`backend/components/ui/onsig-design-system/tokens.ts`](../../backend/components/ui/onsig-design-system/tokens.ts)
> Tailwind tarafı: [`backend/tailwind.config.ts`](../../backend/tailwind.config.ts)
> Versiyon: `tokens.version`

## Tüketim kuralları

| Senaryo | Yöntem | Örnek |
| --- | --- | --- |
| HTML / JSX | **Tailwind class** | `bg-ink-2 text-ink-12` |
| Chart, canvas, SVG, dinamik inline style | TS sabiti | `tokens.color.chart.iris` |
| Operator console (dark) | CSS var (`--a-*`) | `bg-[var(--a-panel)]` |
| Customer app (light) | CSS var (`--onsig-*`) veya Tailwind | `var(--onsig-iris-9)` |

> **Asla** token değerini kopyala-yapıştır kullanma. Yeni bir sabit gerekiyorsa `tokens.ts`'e ekle, sonra Tailwind config / `globals.css` ile senkronize et.

---

## 1. Color

### Ink (neutral) — 12 adım

Ölçek soldan sağa açıktan koyuya gider. Metin için 7–12, yüzeyler için 1–4 kullan.

| Token | Hex | Kullanım |
| --- | --- | --- |
| `ink.1` | `#FBFBFD` | Sayfa zemini (light) |
| `ink.2` | `#F6F7F9` | Hover / soft surface |
| `ink.3` | `#EFF0F4` | Kart iç bölme arka planı |
| `ink.4` | `#E5E7EC` | Divider strong |
| `ink.5` | `#D2D5DD` | Input border / disabled chip |
| `ink.6` | `#A7ABB7` | Icon idle |
| `ink.7` | `#7D8294` | Sub-text |
| `ink.8` | `#5C6173` | Body secondary |
| `ink.9` | `#3F4658` | Body |
| `ink.10`| `#262C3E` | Heading h3-h6 |
| `ink.11`| `#161B2A` | Heading h1-h2 |
| `ink.12`| `#0B0F1B` | Logo, hero text, primary dark surface |

### Iris (brand)

Marka birinci rengi. CTA, badge ve hero gradient'leri için kullan.
`iris.7–iris.10` gradient stop'larıdır (`iris-hero` Tailwind class'ı bunu çağırır).

### Admin (dark operator console)

Yalnızca `.admin-shell` içinde geçerlidir. `--a-*` CSS değişkenleri olarak emit edilir.

```ts
tokens.color.admin.bg      // #0A0D14  — sayfa zemini
tokens.color.admin.panel   // #121724  — kart yüzeyi
tokens.color.admin.line    // rgba(...) — ana divider
tokens.color.admin.accent  // #7C77FF  — focus / aktif satır
```

### Semantic

Her tonun 4 alt-token'ı vardır: `bg`, `fg`, `solid`, `ring`.

```tsx
const t = tokens.color.semantic.success
<span style={{ background: t.bg, color: t.fg, boxShadow: `0 0 0 1px ${t.ring}` }}>
  İmzalandı
</span>
```

| Tone | İçerik |
| --- | --- |
| `success` | İmza tamamlandı, kayıt onaylandı |
| `warning` | OTP süresi azalıyor, plan limiti yaklaşıyor |
| `danger` | İmza reddedildi, kritik hata |
| `info` | Bilgi / nötr durum bildirimi |

### Chart palette

RSC uyumlu olması için **ayrı bir dosyada** durur:
[`components/admin/ui/chart-tokens.ts`](../../backend/components/admin/ui/chart-tokens.ts)
ve `tokens.color.chart` üzerinden de erişilebilir.

> `'use client'` dosyalardan sabit nesne export etmek RSC manifest hatalarına yol açar. Chart renkleri bu yüzden ayrı dosyada.

---

## 2. Spacing

4-pt baseline. Üç sınıflandırma:

- **Dense UI** (admin tablolar, kompakt form satırları): `1`–`6` (4–24px)
- **App shell** (customer card, sidebar): `8`–`16` (32–64px)
- **Marketing** (hero blok, section padding): `20`–`32` (80–128px)

```ts
tokens.space['4']  // '16px'
```

### Density presets

Tablo / panel / liste satırları için hazır setler:

| Preset | rowH | gutter | fontSize |
| --- | --- | --- | --- |
| `compact` | 28 | 8 | 12.5 |
| `normal` | 36 | 12 | 13 |
| `spacious` | 44 | 16 | 14 |

Admin DataTable varsayılan olarak `compact` kullanır.

---

## 3. Radius

```
xs  4   sm  6   md 10   lg 12   xl 14
2xl 18  3xl 24  pill ∞
```

**Kural:** primitive component'lerin (Button, Input, Badge) radius'u kendi içinde sabittir; üst-katman component'ler (Card, Panel, Sheet) bir adım büyük seçer.

| Component | Radius |
| --- | --- |
| Badge / chip | `sm` |
| Button / Input | `md` (admin: `sm`) |
| Card | `lg` |
| Panel | `md` (admin) |
| Modal / Sheet | `xl`–`2xl` |

---

## 4. Shadow

Light tarafta 5 elevation katmanı:

```
xs   →  baseline border
sm   →  resting card
md   →  hovering card
lg   →  popovers, dropdowns
pop  →  modals, command palette
```

Dark / operator console için `shadow.admin.{ring,pop,glow}` kullan. Beyaz şeffaflık halkalı, derin gölgeli.

---

## 5. Typography

### Font ailesi

| Token | Kullanım |
| --- | --- |
| `display` | Hero, dashboard başlığı, KPI değerleri — `Inter Tight` |
| `sans` | Body / UI — `Inter` |
| `mono` | ID'ler, IP'ler, hash'ler — `JetBrains Mono` |
| `serif` | Legal doc body — `Source Serif Pro` (opt-in) |

### Type scale

Customer app + admin için **product scale** (`2xs` → `5xl`).
Marketing landing için **display scale** (`displaySm` → `display2xl`).

> Display scale **sadece** marketing rotalarında. Ürün içinde `4xl`'i geçme.

### Tracking opinions

- Marka heading'leri (`display-*`): `tracking-tightest` (-0.04em)
- Body: `tracking-snug` (-0.01em)
- Overline / uppercase mini başlık: `tracking-overline` (0.16em)
- Hiçbir zaman default `tracking-normal` ile heading kullanma.

---

## 6. Z-index scale

Stacking war'ları önlemek için tek bir ölçek var:

```
base 0          raised 10
sidebar 20      topbar 30
sticky 35       dropdown 40
popover 45      overlay 50
modal/sheet 55  toast 65
tooltip 70      cmdPalette 80
inspector 90    devOverlay 9999
```

Yeni bir floating element eklerken yukarıdaki listeye danış. Custom z-index sayısı yazmak için PR onayı gerekir.

---

## 7. Breakpoints

Tailwind `theme.screens` ile birebir eşleşir:

```
sm 640   md 768   lg 1024   xl 1280   2xl 1536
```

Mobile-first yaz. Admin layout `lg` üstünde sidebar gösterir; `lg` altı mobile top strip + bottom nav kullanır.

---

## 8. Motion (özet)

Tam dökümantasyon: [`./motion.md`](./motion.md)

```
duration:  instant 50 → micro 120 → base 180 → emphasized 220 → pronounced 320 → narrative 420
easing:    emphasized | gentle | spring | linear
```

Kural: bir interaction'da en fazla **bir** "narrative" hareket olabilir. Diğer her şey `subtle` ailesinden gelir.

---

## 9. Icon

Lucide tek ikonografi kaynağıdır.

| Token | px |
| --- | --- |
| `icon.size.xs` | 12 |
| `icon.size.sm` | 14 |
| `icon.size.md` | 16 |
| `icon.size.lg` | 18 |
| `icon.size.xl` | 20 |
| `icon.size.2xl`| 24 |

`strokeWidth: 1.75` standardı tüm ikonlara uygulanır.

---

## 10. Focus

Klavye kullanıcıları için her zaman görünür halka:

```css
outline: 2px solid rgba(94,85,229,0.55);
outline-offset: 2px;
border-radius: 6px;
```

Admin shell aynı renkten daha düşük opacity (0.55 yerine 0.55 — fakat fonu dark olduğu için çok daha belirgindir).

---

## 11. Container widths

```
app        72rem  (1152px)  — customer dashboard card
marketing  76rem  (1216px)  — landing pages
admin      88rem  (1408px)  — operator console (dense)
article    40rem  ( 640px)  — legal docs, blog
```

---

## Drift kontrolü

`tokens.version` Tailwind config'in major versiyonuyla aynı olmalıdır. Bir token değiştirirken:

1. `tokens.ts`'i güncelle.
2. `tailwind.config.ts` mirror'u güncelle.
3. `globals.css` `:root` CSS değişkenini güncelle (varsa).
4. `tokens.version` bump'la.
5. CHANGELOG'a `chore(tokens): bump x.y → x.z` ekle.
