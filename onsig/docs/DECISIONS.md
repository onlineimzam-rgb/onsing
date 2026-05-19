# OnSig — Karar Kayıtları (ADR)

> Her karar tarih sırasıyla yazılır. İleride değişiklik gerekirse **yeni bir ADR** eklenir,
> eski kayıt silinmez; "Superseded by ADR-XXX" notu eklenir.

---

## ADR-001 — Marka adı: OnSig
- **Tarih:** 2026-05-17
- **Durum:** Kabul edildi
- **Bağlam:** Ürün ismi + domain seçimi.
- **Karar:** Ürün adı **OnSig**, ana domain **`onsig.app`**.
- **Sonuçları:** Logo + app store başlığı + mail gönderim adresi (`no-reply@onsig.app`) bu çatı altında oluşturulacak. TR pazarı için `onsig.com.tr` ayrıca alınması önerilir.

---

## ADR-002 — Bağımsız backend projesi
- **Tarih:** 2026-05-17
- **Durum:** Kabul edildi
- **Bağlam:** OnSig backend, mevcut CUGM içine eklenmek yerine ticari ürün olarak ayrı yola çıkmalı mı?
- **Karar:** **Ayrı proje (`onsig/backend`)**. Kendi DB şeması, kendi auth, kendi deploy hattı.
- **Gerekçeleri:**
  - Ticari ürün → kendi marka, kendi destek kanalı, kendi SLAlar.
  - Mevcut CUGM ile DB iç içe geçerse v0.2'de göç çok pahalı olur.
  - Pilot kullanıcı (CUGM) `onsig.app`'i de aynı zamanda **müşteri** olarak kullanır.
- **Sonuçları:** İlk haftada `onsig/backend` Next.js 14 projesi ayağa kalkar; bağımsız Postgres veritabanı (Neon veya Vercel Postgres ayrı proje).

---

## ADR-003 — Mobil framework: React Native + Expo
- **Tarih:** 2026-05-17
- **Durum:** Kabul edildi
- **Bağlam:** iOS + Android tek codebase ile yazılacak.
- **Karar:** **React Native + Expo (SDK 51+)**, Expo Router, EAS Build.
- **Reddedilenler:** Native (Kotlin/Swift), Flutter.
- **Gerekçeleri:**
  - Mevcut TS bilgi seti birebir uyumlu.
  - OTA (Expo Updates) ile App Store onayı beklemeden hotfix.
  - `react-native-signature-canvas` (webview tabanlı) imza pad sorunsuz.
  - EAS Build iOS sertifika yönetimini otomatize ediyor.
- **Sonuçları:** Mobile projesi `onsig/mobile` altında Expo template ile başlatılır.

---

## ADR-004 — MVP yolu: önce backend + public imza web sayfası
- **Tarih:** 2026-05-17
- **Durum:** Kabul edildi
- **Bağlam:** 4-6 hafta içinde canlıya çıkmak için en yüksek değer üreten katmandan başlanmalı.
- **Karar:** İlk faz **backend + web imza ekranı**. Mobil app v0.1.1'de eklenir.
- **Gerekçeleri:**
  - Mobil app olmadan da link/QR ile imza alınabilir (karşı taraf tarayıcı kullanır).
  - Backend doğru oturmadan mobil tasarımı boşa çıkar.
  - Sektör genişlemesi de backend → web admin → mobil sırasıyla daha hızlı.
- **Sonuçları:** İlk 3 haftalık iş paketi: backend iskelet, sözleşme motoru göçü, public sign sayfası, audit + PDF + mail.

---

## ADR-005 — Tek tenant MVP, multi-tenant v0.2
- **Tarih:** 2026-05-17
- **Durum:** Kabul edildi
- **Bağlam:** Pilot tek müşteri (CUGM) ile çıkış mı, sıfırdan multi-tenant mı?
- **Karar:** MVP'de **tek tenant** çalışır; ancak veri modeli **`tenant_id`** kolonunu **başından** taşır (NULL'lanır, default tenant).
- **Gerekçeleri:**
  - Pilot hız + öğrenme avantajı.
  - `tenant_id` başından şemaya konunca v0.2 göçü trivial olur (yalnızca tenant kayıt + onboarding UI eklenir).
- **Sonuçları:** Şemada `tenant_id NOT NULL DEFAULT '...'` ile başlanır; ileride default kaldırılır.

---

## ADR-006 — Veritabanı + ORM
- **Tarih:** 2026-05-17
- **Durum:** Önerilen (uygulama detayı; ADR-002'nin uzantısı)
- **Karar:** **Postgres (Neon)** + **Drizzle ORM**.
- **Gerekçeleri:** Tip güvenli, edge uyumlu, sade migration; mevcut Postgres deneyimi.
- **Alternatif:** Prisma (daha ağır, daha resmi). Reddedildi.

---

## ADR-007 — İmza akışında ek doğrulama
- **Tarih:** 2026-05-17
- **Durum:** Önerilen (MVP kapsamında devam)
- **Karar:** Public imza sayfasında **e-posta veya SMS OTP** zorunlu;
  yalnızca CUGM iç akışında **OTP atlanabilir** (broker = imza alan kişi yanında ofiste).
- **Sebep:** TBK m.16 + KVKK delil zinciri açısından OTP "iradeyi tespit eden" en güçlü ek delildir.
