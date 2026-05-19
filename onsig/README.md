# OnSig — Online Sözleşme & İmza Platformu

**OnSig**, online sözleşme oluşturma + online imza ağırlıklı bir mobil + web SaaS ürünüdür.
Başlangıçta **emlak sektörüne özel** matbu/uzun şablonlar (kira, yetki, alım-satım, yer gösterme) ile yola çıkıyoruz; mimari **çoklu sektör + çoklu kiracı (multi-tenant)** olacak şekilde tasarlanır.

> Bu klasör, mevcut `candarliuzmangm.com.tr` projesinin **bağımsız** bir ticari ürünüdür.
> Mevcut sözleşme modülü çekirdek olarak alındı; ürünleşme yolculuğu burada devam edecek.

## Vizyon

- Bir **emlak ofisi** veya KOBİ, telefondan veya tabletten 60 saniyede sözleşme oluştursun, müşterisine **link/QR ile imza** göndersin.
- **Karşı taraf**, uygulamayı kurmadan tarayıcıda ya da OnSig mobil uygulamasında imzalasın.
- Her imzaya **zaman damgası, IP, cihaz parmak izi, GPS (opsiyonel), kabul beyanı** eklensin.
- Sözleşmeler **PDF + arşiv hash’i** ile saklanır; sonradan değişmediği kanıtlanabilir.
- Ücretlendirme: **abonelik (Pro)** + **sözleşme başına ek pulluk** modeli.

## Hedef sektörler (sıralama)

1. **Emlak** (kira, yetki, alım-satım, yer gösterme, ön sözleşme) — MVP
2. **Hizmet / freelance** (proje sözleşmesi, gizlilik, fikri mülkiyet devri)
3. **KOBİ / ticari** (cari hesap, bayilik, distribütör, hizmet)
4. **Eğitim / kurs** (öğrenci kayıt, taksitli ödeme taahhüdü)
5. **Sağlık & estetik** (onam / aydınlatılmış rıza formları)

## Yasal çerçeve (özet)

- **Türkiye:** 5070 Sayılı Elektronik İmza Kanunu güvenli e-imza için **ESHS** sertifikası ve **kalifiye sertifika** gerektirir.
  - **MVP (v1)**: 5070 “güvenli e-imza” yerine **6098 TBK m.14 + 6098 m.16** çerçevesinde **basit elektronik imza + iradeyi gösteren delil zinciri** (audit trail + IP + zaman damgası + e-posta/SMS onayı) kullanılır.
  - **v2**: KEP entegrasyonu (PTT KEP, Türkkep).
  - **v3**: Mobil İmza (operatörler) + Güvenli e-imza (E-Güven, Türktrust, vb. ESHS sağlayıcıları).
- **AB / eIDAS:** Basit elektronik imza (SES) ile başlar; ileride **AES/QES** seviyesi.
- **KVKK / GDPR:** Veriler **Türkiye/AB** içinde, **rıza, saklama süresi, silme talebi** akışları zorunlu.

## Klasör yapısı

```
onsig/
├── README.md                       (bu dosya)
├── docs/
│   ├── ARCHITECTURE.md             (mimari & teknoloji kararları)
│   ├── ROADMAP.md                  (MVP → v2 → v3 yol haritası)
│   ├── LEGAL.md                    (TBK, KVKK, eIDAS notları, KVKK metni şablonu)
│   ├── PRICING.md                  (abonelik & ek paket fiyatlandırması)
│   └── BRAND.md                    (logo, palet, ton)
├── shared/
│   ├── contracts/                  (sektörden bağımsız sözleşme motoru)
│   │   ├── types.ts
│   │   ├── templates/              (her sektör için klasör)
│   │   │   ├── real-estate/        (kira, yetki, alım-satım, yer gösterme)
│   │   │   ├── freelance/          (v1.1)
│   │   │   └── ...
│   │   └── render.ts               (HTML/PDF render)
│   └── types/                      (kullanıcı, tenant, sözleşme, oturum vb.)
├── backend/                        (Next.js 14 — API + admin web paneli)
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/               (telefon OTP + e-posta)
│   │   │   ├── tenants/            (firma kayıt + ayarlar)
│   │   │   ├── contracts/          (CRUD + render)
│   │   │   ├── sign-sessions/      (imza oturumu yönetimi)
│   │   │   ├── sign/[token]/       (public imza)
│   │   │   ├── audit/              (delil zinciri)
│   │   │   └── webhooks/           (Stripe / iyzico, KEP)
│   │   └── (admin)/                (firma yöneticisi web paneli)
│   ├── lib/                        (db, mail, otp, pdf, timestamp)
│   ├── prisma/ veya db.ts          (Postgres şema)
│   └── package.json
├── mobile/                         (React Native + Expo, iOS & Android)
│   ├── app/                        (Expo Router)
│   │   ├── (auth)/login.tsx
│   │   ├── (tabs)/                 (Sözleşmeler / Yeni / Profil)
│   │   ├── contract/[id].tsx
│   │   └── sign/[token].tsx        (public link aynı uygulamada da açılabilir)
│   ├── components/
│   ├── lib/                        (api client, secure storage, signature pad)
│   └── package.json
└── reference-from-cugm/            (orijinal projeden alınan referans dosyalar)
```

## Lisans & ticari model (kabataslak)

- **Ücretsiz**: ayda 3 sözleşme, 1 kullanıcı, OnSig markası altında.
- **Pro** (₺/ay, ofis başına): sınırsız sözleşme, 5 kullanıcı, kendi logosu, mail gönderim.
- **Business**: KEP entegrasyonu, çoklu lokasyon, API erişimi, özel sözleşme şablonu desteği.
- **Pul/Stamp paketi**: KEP veya zaman damgası başına ek ücret.

## Hızlı başlangıç (bu reposu için)

Bu klasör **henüz çalışır halde değil** — yapısal iskelet ve karar/dokümantasyon mevcuttur.
Detaylı kararlar verildikten sonra `backend/` ve `mobile/` projelerini ayağa kaldıracağız.

Sıradaki adımlar için `docs/ROADMAP.md` ve `docs/ARCHITECTURE.md`’ye bakın.
