# OnSig — Yol Haritası

## MVP (v0.1) — 4-6 hafta — **Backend + Web Admin + Public İmza Sayfası**

**Hedef:** Çandarlı Uzman GM, OnSig'i pilot olarak gerçek hayatta kullansın.
Mobil app v0.1.1'de eklenir (ADR-004).

### Kapsam
- [ ] **`onsig/backend`** Next.js 14 + Postgres (Neon) + Drizzle ORM iskeleti.
- [ ] **Auth:** e-posta + parola (TOTP 2FA ops.) **veya** telefon OTP. **Tek tenant** (default tenant kaydı ADR-005).
- [ ] **Sözleşme motoru:** `onsig/shared/contracts` — `real-estate` şablonları (kira, yetki, alım-satım, yer gösterme) CUGM'den port + bağımsızlaştır.
- [ ] **Admin web panel** (Next.js içinde): sözleşme listesi, yeni sözleşme, detay, imza oturumu üret.
- [ ] **Public imza sayfası** (`/sign/[token]`): metin + KVKK + **e-posta/SMS OTP** + çizim imzası + IP/UA/zaman damgası (ADR-007).
- [ ] **Audit log** (chain-of-records, SHA-256).
- [ ] **PDF üretimi** (A4) + Resend ile mail gönderim.
- [ ] **Doğrulama portalı**: `onsig.app/d/<hash>` ile imzalı belgenin kim/ne zaman/nereden imzalandığını sorgula.

### Dışarıda kalan (v0.1'de yok)
- **Mobil app** (v0.1.1 — pilot çalıştıktan ~2 hafta sonra)
- Multi-tenant UI (v0.2)
- Ödeme / abonelik (v0.2)
- KEP / zaman damgası servisi (v0.3)
- API entegrasyonları (v0.3)

---

## v0.1.1 — Mobil app (2 hafta)

- [ ] **`onsig/mobile`** Expo + EAS Build.
- [ ] Auth (aynı backend), sözleşme listesi, yeni sözleşme, paylaş, "tablet imzala" modu.

---

## v0.2 — Çoklu tenant + ödeme (4-6 hafta)

- [ ] **Multi-tenant**: kayıt akışı, davet, rol bazlı erişim.
- [ ] **Abonelik**: Stripe + iyzico; Free/Pro/Business planlar.
- [ ] **Kullanım metrikleri**: aylık sözleşme/oturum sayacı, limit aşımı uyarısı.
- [ ] **Firma branding**: logo, renkler, mail/WhatsApp gönderim adı.
- [ ] **Şablon kütüphanesi**: official + tenant’a özel custom şablonlar.
- [ ] **Mobil app store** çıkışı (TestFlight + Play Internal).

---

## v0.3 — Sektör genişleme + gelişmiş imza (6-8 hafta)

- [ ] **Yeni sektör şablonları**: freelance, hizmet, KOBİ ticari.
- [ ] **KEP entegrasyonu** (PTT KEP veya Türkkep).
- [ ] **Mobil imza** (operatörler — Turkcell/Vodafone/Türk Telekom).
- [ ] **Zaman damgası**: Kamu SM TSA bağlantısı.
- [ ] **Toplu sözleşme** (CSV ile birden fazla taraf için aynı şablon).
- [ ] **API token + webhook**: 3rd party entegrasyon.
- [ ] **Kanıt paketi**: imzalanmış PDF + audit log JSON + hash sertifikası tek ZIP olarak indir.

---

## v1.0 — Genel kullanıma açılış (yıl sonu)

- [ ] Güvenli e-imza (5070): ESHS entegrasyonu (E-Güven / Türktrust / E-Tugra).
- [ ] eIDAS QES (AB pazarı).
- [ ] Çoklu dil (TR/EN/DE) + lokalize şablonlar.
- [ ] Sektör market yeri: avukat, mali müşavir, danışman gibi profesyoneller şablon yayınlasın.
- [ ] Doğrulama portalı: `onsig.app/d/<hash>` → kim, ne zaman, nereden imzaladı.

---

## Hemen başlanabilecek 7 madde (öneri)

> Bu yedi madde MVP’nin **çekirdek omurgasıdır**. Sırayla yapılınca canlıya çıkar.

1. **Mimari onay & marka karar** (1 gün)
   - İsim: `OnSig` mi `İmza.app` mi? Domain: `onsig.app` `imza.com.tr` `onsig.com.tr`?
   - Logo / marka kimlik (Mor + Anthrazit?).
2. **Backend iskelet** (3-4 gün)
   - `onsig/backend` Next.js 14 + Drizzle ORM + Postgres + auth.
3. **Sözleşme motoru** (2-3 gün)
   - `onsig/shared/contracts` — CUGM port + sektör soyutlaması.
4. **Public imza akışı** (3 gün)
   - `/sign/[token]` sayfası + audit log + PDF.
5. **Mobil iskelet** (4-5 gün)
   - Expo + auth + sözleşme listesi.
6. **Yeni sözleşme & imza alma ekranları** (4-5 gün)
   - Mobil form + push imza.
7. **Pilot uygulama** (1 hafta canlı kullanım, geri bildirim).

---

## Risk & gözden geçirme

- Apple/Play store onay süreçleri (1-2 hafta) — paralel ilerletilmeli.
- KEP/TSA entegrasyonu gecikebilir → MVP’de bağımsız audit ile başlanır.
- Hukuki danışmanlık: KVKK aydınlatma metni + ETBİS kapsamı.
