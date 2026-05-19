# OnSig — Brand Guidelines

> Premium legal-tech. Hukuksal güvenin görsel dili.

## 1. Marka pozisyonu

**OnSig**, e-imza ve online sözleşme yönetimini Türk hukukuna uygun, audit-zincirli ve mobile-first olarak sunan bir SaaS platformudur.

**Kategori:** Legal-tech / fintech-adjacent
**Audience:** Emlak, hukuk, mali müşavirlik, lojistik, KOBİ
**Tonal komşular:** Stripe, Linear, Notion, Ramp, DocuSign

### Marka vaadi

> "Sözleşmeyi imzalandığı anda, imzalandığı şekilde — her zaman ispatlanabilir kılarız."

### Üç çekirdek değer

1. **Kanıt** — her olay SHA-256 ile zincirlenir; "olmuş olabilir" yerine "şu zamanda, şu IP'den, şu cihazla oldu".
2. **Hız** — sözleşme oluşturma → imza → arşiv tek oturumda biter.
3. **Saygı** — kullanıcının zamanına, gözüne ve KVKK'sına saygı duyarız.

---

## 2. Logo

### Sembol

- 9×9'luk grid üzerinde, kenarları yumuşatılmış kare içine yerleştirilmiş **"O" + imza çentik** kombinasyonu.
- Düz arkaplanlarda `iris-hero` gradient'iyle (#5E55E5 → #3B33C0) kullanılır.
- Dark arkaplanlarda monokrom beyaz veya `ink.1` (#FBFBFD).
- Asgari kullanım boyutu: **20×20 px** (favicon hariç).
- Etrafında her zaman **logo-h** kadar bir clear-space bırak (logo yüksekliği kadar).

### Wordmark

- "OnSig" — `Inter Tight Bold`, `tracking: -0.04em`.
- "On" ile "Sig" arasında **görünür ayrım yok**; tek kelime hissi verir.
- Hiçbir zaman:
  - `outline` veya `stroke` uygulama
  - Eğri / italik versiyon kullanma
  - Renk inversiyon dışında renkli wordmark üretme
  - Sembolü wordmark'tan koparıp tek başına büyütme (favicon hariç)

### Lockup varyantları

```
Horizontal:   [◇] OnSig
Stacked:      [◇]
              OnSig
Mark only:    [◇]
```

Tablet / mobile header: horizontal. Auth split-screen hero: stacked.

---

## 3. Ses ve ton (voice & tone)

OnSig **akıllı arkadaş** gibi konuşur, **şirket dili** değil.

| Özellik | Evet | Hayır |
| --- | --- | --- |
| Açıklık | "İmza saniyeler içinde tamamlanır." | "Müşterilerimize hızlı imza tecrübesi sunmaktayız." |
| Spesifik | "SHA-256 zinciri her olayı bağlar." | "Yüksek güvenlikli altyapı." |
| Sade | "Şube ekle." | "Lokasyon konfigürasyonu işlemini başlatınız." |
| Saygılı | "Talebinizi aldık. Yarın size döneriz." | "İsteğiniz değerlendirmeye alınmıştır." |

### Tonal modlar

- **Marketing** — özgüvenli, kısa cümle, görsele güvenir. Slogan kalıbı.
- **Product (customer app)** — direkt, ikinci tekil şahıs. "İmzala", "Gönder".
- **Operator console (admin)** — operasyonel, jargon ekleyebilir. Mono numerikler. "MRR", "rollout %".
- **Legal / audit** — resmi, mahkeme önünde geçerli. "Tarafların özgür iradeleriyle..."
- **Error states** — empatik, çözüm sunan. "Bağlantı kesildi. Biraz sonra tekrar dene." → kullanıcıya kendini kötü hissettirme.

### Türkçe yazım kuralları

- Kısa cümle (≤ 12 kelime).
- Yabancı kelime gerekmediği sürece kullanma. (İstisna: **MRR**, **API**, **OTP**, **PDF**, **KVKK** gibi sektörel sabitler.)
- Hitap **siz** değil **sen** (premium-but-friendly amaç). İstisna: legal doc body ve operator audit log'ları.
- Sayılar Türkçe biçimde: `2.500 TL`, `%18`, `5–15 dakika`.

### Yasak ifadeler

- "Devrim yarattık", "bir numaralı", "lider", "platformumuz size sunuyor".
- Karşılaştırmalı reklamcılık ("DocuSign'dan daha hızlı") — yasal risk.
- Boş büyük laflar ("AI-powered everything", "next-gen contracts").

---

## 4. Renk paleti

### Primary

| Token | Hex | Kullanım |
| --- | --- | --- |
| `iris-9` | `#4F46E5` | CTA, primary button |
| `iris-10` | `#3B33C0` | Gradient bottom stop |
| `iris-2` | `#EDECFF` | Soft badge bg, hover tone |

### Neutrals

`ink-1` (paper) → `ink-12` (near-black). Detaylı tablo: [`design-system/tokens.md`](../design-system/tokens.md).

### Semantic

`success` (yeşil) sadece imza tamamlandı / KVKK onaylandı için.
`warning` (amber) plan limiti, OTP süresi, eski tarayıcı uyarısı.
`danger` (kırmızı) iptal, fraud, ödeme başarısız.
`info` (sky) bilgilendirme — agresif değil.

### Renk kullanım kuralları

1. **Tek aksen kuralı:** bir görüntüde tek bir primary aksen rengi olur.
2. **%60–30–10:** zemin %60 nötr, ikincil yüzey %30 nötr, aksen %10 iris.
3. **Asla** semantic rengi marka aksanı olarak kullanma (yeşil CTA yapma).
4. Dark UI yalnızca `.admin-shell` veya marketing hero'larda. Customer app her zaman light.

---

## 5. Tipografi

| Yer | Font | Size | Weight | Tracking |
| --- | --- | --- | --- | --- |
| Hero başlık (marketing) | Inter Tight | display-xl (60) | 700 | -0.04em |
| Page heading (product) | Inter Tight | 2xl/3xl | 700 | -0.04em |
| Body (product) | Inter | sm (13) | 400 | -0.01em |
| Body (marketing) | Inter | md/lg (15–17) | 400 | -0.005em |
| Overline | Inter | 2xs (11) UPPER | 600 | 0.16em |
| Code / ID / IP | JetBrains Mono | 2xs/xs | 500 | normal |
| Legal doc body | Source Serif Pro | base | 400 | normal |

### Yazım hierarşisi örneği

```
Overline:    OPERASYONS · TENANTS    (ink-7, uppercase)
H1:          Tüm tenants              (display-md, ink-12, tracking-tightest)
Lead:        Tablo doğrudan Postgres'ten… (md, ink-8)
Body:        ...                       (sm, ink-9)
```

### Hata: yapma

- Heading'i `tracking-normal` bırakma.
- Body'yi `tracking-tight` ile sıkıştırma.
- 5 satırdan uzun "lead" paragraf yazma.
- Bir kartta 3 farklı font-size kullanma — `header` (overline) + `value` (display) + `hint` (body-sm) yeter.

---

## 6. Iconography

- **Lucide** tek kaynak. Custom illüstrasyonlar marketing özelinde, ürünün içinde değil.
- Stroke `1.75`, asla `1` veya `2.5`.
- Icon button'lar **kare** ve **opsiyonel tooltip**. Pure-icon button + emoji yasak.
- Iconlar metnin sonunda değil **başında** (LTR akış).

---

## 7. Görsel dil (illüstrasyon & fotoğraf)

### Marketing landing

- Fotoğraf yerine **abstract gradient + grid backdrop** + bir contract showcase mock'ı.
- Hero'larda canlı / animasyonlu mockup (`HeroShowcase.tsx`).
- Stock fotoğraf yasak (özellikle "el sıkışan iki iş insanı" — kategori clichesi).

### Product

- Boş durumlar için minimal, mono-color tek-line illüstrasyon ya da Lucide icon `EmptyState`.
- Avatar deterministik gradient. Profil fotoğrafı isteğe bağlı, hiçbir zaman zorunlu değil.

---

## 8. Motion

Tam liste: [`design-system/motion.md`](../design-system/motion.md)

**Marka için iki kural:**

1. **Fonksiyonel olmayan hareketi göstermeyiz.** Confetti, parallax-only-for-fun, hover wobble — yasak.
2. **Reduced motion mutlaktır.** Hiçbir animasyon, `prefers-reduced-motion: reduce` altında zorunlu olamaz.

---

## 9. Yasal & accessibility

- Marketing kopyasında "bedava" değil **"ücretsiz"** kullan (yasal tüketici dili).
- Her form field'ı için label var. Placeholder label yerine geçmez.
- Renk tek başına anlam taşımaz: her semantic renge bir ikon ya da kelime eşlik eder.
- Kontrast oranı: body için `≥ 4.5:1`, large text için `≥ 3:1`. Light arkaplan üzerinde `ink-7` ve daha koyu metin kullan.
- Klavye ile her interactive eleman erişilebilir + görünür focus halkası olmalı.

---

## 10. Don'ts (özet)

- ❌ Logo'yu eğme, döndürme, gradyan dışı renklendirme
- ❌ Marka rengini semantic role'de kullanma (yeşil CTA, kırmızı brand)
- ❌ Custom emoji + button kombinasyonu
- ❌ Aşırı blur / glassmorphism (light hint OK, opaque arkaplanın üzerinde değil)
- ❌ Mock fotoğraf / stock (özellikle handshake)
- ❌ "Bir numarayız" tarzı superlatif iddia
- ❌ Hiç gerekmediği halde animasyonu (özellikle hero parallax)
