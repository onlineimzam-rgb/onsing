# Çandarlı Uzman Gayrimenkul

Modern, çok dilli (TR/EN) gayrimenkul portföy ve hizmet web sitesi.
Bölge: Çandarlı, Dikili, İzmir + Türkiye geneli + Yunanistan.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** (özel altın + lacivert palet)
- **Framer Motion**, Lucide icons
- **Neon Postgres** (`@neondatabase/serverless`)
- **Vercel Blob** (görsel yüklemeleri)
- **Resend** (mail bildirimleri)
- **Vercel** üzerinde host

## Klasör Yapısı

```
app/
  layout.tsx              # Root layout
  [locale]/
    layout.tsx            # i18n provider + Navbar/Footer
    page.tsx              # Anasayfa
    emlak/                # Portföy listesi + detay
    hizmetler/
    mulk-degerleme/       # Ücretsiz değerleme formu
    portfoy-toplama/      # Alıcı/satıcı talep formları
    blog/
    galeri/
    hakkimizda/
    iletisim/
    admin/                # Admin paneli (gelecek)
  api/                    # API route'ları (gelecek)
  sitemap.ts
  robots.ts
components/
  layout/                 # Navbar, Footer, WhatsAppButton, LanguageSwitcher
  sections/               # Hero, TrustBand, Services, ...
lib/
  config.ts               # Site bilgileri, sabitler
  db.ts                   # Neon client + tablo şemaları
  auth.ts                 # ADMIN_KEY / SETUP_KEY helpers
  i18n/
    config.ts
    I18nProvider.tsx
    getMessages.ts
    messages/
      tr.json
      en.json
public/
  logo-light.png          # Sarı logo (koyu zeminde)
  logo-dark.png           # Siyah/beyaz logo (açık zeminde)
```

## Veritabanı Tabloları

- `properties` — emlak portföyü (TR/EN başlık, fiyat, kategori, harita, vb.)
- `property_images` — her portföy için çoklu görsel
- `leads` — alıcı/satıcı talepleri (portföy toplama)
- `valuation_requests` — mülk değerleme talepleri
- `blog_posts` — gayrimenkul blog yazıları
- `gallery_images` — bölgemizden görseller
- `inquiries` — iletişim formu mesajları

## Renk Paleti

- **Navy** (lacivert / koyu zemin): `#0a1224 → #1c2a40`
- **Gold** (altın): `#ffd844 → #f5b800 → #d49100`

## Geliştirme

```bash
npm install
cp .env.example .env.local   # gerekli env'leri doldur
npm run dev
```

Açılması gereken: http://localhost:3000

## Deploy

Vercel'de proje oluştur, env değişkenlerini ekle, `git push` ile veya
`vercel --prod` ile deploy et.

## Yol Haritası

- [x] İskelet (Next + Tailwind + i18n + DB schema)
- [x] Hero + Trust + Services
- [x] Navbar + Footer + WhatsApp
- [ ] Portföy listesi (filtre, arama, sayfalama)
- [ ] Portföy detay sayfası (galeri + harita)
- [ ] Portföy toplama formu (alıcı/satıcı)
- [ ] Mülk değerleme formu
- [ ] Blog (liste + detay)
- [ ] Galeri sayfası
- [ ] Admin paneli (portföy CRUD, talepler, blog, galeri)
- [ ] Schema.org RealEstateListing
- [ ] Vercel deploy
