# Çandarlı Uzman Gayrimenkul – Yönetim Rehberi

Bu rehber, sitenin yönetim panelini günlük olarak nasıl kullanacağınızı anlatır.

---

## 1. Admin Paneline Giriş

- URL: <https://candarliuzmangm.com.tr/tr/admin/> (NS yayıldıktan sonra) veya geçici Vercel URL
- Sayfa açıldığında `Admin Anahtarı` ister.
- Anahtarı bir kez girersiniz; tarayıcı bunu hatırlar (`localStorage`).
- Çıkış yapmak için sağ üstteki **Çıkış** butonuna basın.

> Anahtar size ayrıca verildi. Anahtarı kaybederseniz sıfırlanabilir.

---

## 2. İlk Kurulum (Bir Defa)

Sağ üstte iki yardımcı buton vardır:

- **DB Setup** → Veritabanı tablolarını oluşturur (yalnızca ilk girişte gereklidir; sonra dokunmayın).
- **Mail Testi** → Resend bildirim sisteminin çalıştığını doğrulayan bir test maili atar.

---

## 3. Sekmeler

Üstte 5 sekme bulunur:

1. **Portföy** – Emlak ilanları
2. **Talepler** – Müşteri portföy toplama formundan gelen başvurular
3. **Değerleme** – Mülk değerleme formundan gelenler
4. **Blog** – Blog yazıları
5. **Galeri** – Galeri fotoğrafları

---

## 4. Emlak (Portföy) Ekleme

**Portföy → "Yeni Emlak"** butonuna basın.

### Temel Alanlar

| Alan | Açıklama |
|---|---|
| Başlık (TR/EN) | "3+1 Sahil Kıyısında Daire" gibi |
| Tip | Satılık / Kiralık / Günlük Kiralık |
| Kategori | Daire / Villa / Müstakil Ev / Arsa / Tarla / İşyeri… |
| Fiyat | Sadece sayı (TL veya EUR) |
| Para Birimi | TRY / EUR |
| İl / İlçe / Mahalle | "İzmir / Dikili / Çandarlı" |
| Adres | Açık adres (haritada da işaretlenir) |
| Lat / Lng | Harita konumu (Google Maps'te sağ tık → koordinatı kopyala) |
| m² Brüt / Net | İlanın brüt ve net m² değeri |
| Oda / Banyo / Kat / Bina yaşı | Sayısal değerler |
| Isıtma / Eşya / Cephe / Manzara | Standart seçenekler |
| Tapu durumu | Kat mülkiyeti / kat irtifakı / arsa tapulu… |
| Açıklama (TR/EN) | Detaylı açıklama, paragraf paragraf yazılabilir |
| Özellikler | Kombi, asansör, otopark gibi maddeler. Liste sondaki **+** ile özel madde eklenebilir |

### Görsel Yükleme

- **Görseller** alanına tıklayın → birden fazla fotoğraf seçebilirsiniz.
- Görsel tarayıcıda otomatik sıkıştırılır (kalite kaybı olmadan boyut ufalır).
- Yüklenen görsellerden birinin üzerine gelip **"Kapak Yap"** seçeneğine tıklayarak listede gözükecek ana görseli seçebilirsiniz.
- **X** ile tek tek silebilirsiniz.

### Yayın & Öne Çıkarma

- **Durum**: `Aktif` olanlar siteye düşer. `Taslak` veya `Pasif` görünmez.
- **Öne Çıkar**: İşaretliyse anasayfa **Öne Çıkan İlanlar** bölümünde gösterilir (en fazla 6 ilan).

Kaydet'e basınca:

- Otomatik **referans no** oluşur (CUG-XXXXX).
- SEO uyumlu bir **slug** üretilir.
- İlan anında siteye yansır.

### Düzenleme & Silme

- Listedeki ilan kartında **Kalem** ikonu → düzenleme.
- **Çöp** ikonu → siler. Görseller de sunucudan silinir.
- **Göz** ikonu → ilanı sitedeki gerçek sayfasında açar.

---

## 5. Talepler (Müşteri Portföyü)

Müşteriler `/portfoy-toplama/` sayfasından **alıcı** veya **satıcı** olarak başvurabilir.

Talepler sekmesinde:

- Listelenir (yeni → eski)
- Statü güncellenir: **Yeni → İletişimde → Eşleştirildi → Kapatıldı**
- Talep silinebilir
- Her gelen başvuru ayrıca mailinize bildirim olarak düşer

---

## 6. Mülk Değerleme

Müşteriler `/mulk-degerleme/` sayfasından mülklerini değerletmek için başvurur.

Değerleme sekmesinde:

- Listelenir
- Statü: **Yeni → İncelemede → Tamamlandı**
- Tahmini değer + para birimi + dahili not eklenebilir
- Silinebilir
- Yeni başvuru mail bildirimi atar

---

## 7. Blog

**Blog → "Yeni Yazı"**

| Alan | Açıklama |
|---|---|
| Başlık (TR/EN) | Yazı başlığı |
| Slug | URL'de görünen kısa ad (otomatik üretilir, isterseniz değiştirin) |
| Özet (TR/EN) | Listede ve önizlemede görünür |
| İçerik (TR/EN) | Markdown destekli uzun metin |
| Etiketler | Virgülle ayrılmış (örn: `çandarlı, satılık, yatırım`) |
| Kapak Görseli | Yazı listesinde ve detayda görünür |
| Yayında mı? | İşaretli olanlar siteye düşer |

> Yazıları diledikten sonra düzenleyebilir, kapak görselini değiştirebilirsiniz.

---

## 8. Galeri

**Galeri → "Görsel Yükle"**

- Birden fazla görsel seçebilirsiniz.
- Bir kategori atayın (`ofis`, `bolge`, `etkinlik`, `genel` vb. — istediğiniz kategori adı olabilir).
- Görseller otomatik sıkıştırılır.
- Listeden silebilir, kategorisini güncelleyebilirsiniz.

Galeri sayfası `/galeri/` üstte kategori filtresi gösterir, fotoğraflara tıklayınca lightbox açılır.

---

## 9. Mail Bildirimleri

Şu olaylarda yöneticiye mail gider:

- Yeni mülk değerleme talebi
- Yeni alıcı/satıcı portföy talebi
- Yeni iletişim formu mesajı
- Bir mülk hakkında bilgi talebi

Şu an `onboarding@resend.dev` adresinden mail atılır (Resend test modu). NS yayıldıktan sonra `noreply@candarliuzmangm.com.tr` adresinden gönderilecek şekilde domain doğrulaması yapılır.

---

## 10. Sık Sorunlar

**"Görseli yükledim ama kapakta görünmüyor."**
→ Görsele "Kapak Yap" demediniz. Görsele üzerine gelip uygun seçeneği işaretleyin.

**"İlanı yayınladım ama sitede görünmüyor."**
→ Durum `Aktif` mi? Site genelinde 60sn'lik önbellek olabilir, sayfayı yenileyin.

**"Mail gelmiyor."**
→ Sağ üstte **Mail Testi** butonuna basın. Hata gelirse `RESEND_API_KEY` veya `ADMIN_EMAIL` envinde sorun var demektir.

**"Anahtar çalışmıyor / sıfırlamak istiyorum."**
→ Vercel → Project → Settings → Environment Variables → `ADMIN_KEY` üzerinde **Edit** ile yeni değer girin, sonra **Redeploy** yapın.

---

## 11. Faydalı Linkler

- Sitenin canlı adresi: <https://candarliuzmangm.com.tr/>
- Vercel kontrol paneli: <https://vercel.com/bulent-tum-s-projects/candarli-uzman-gm>
- Cloudflare DNS: <https://dash.cloudflare.com/>
- Resend bildirimleri: <https://resend.com/emails>
- Neon (Postgres) konsolu: Vercel → Storage sekmesi
