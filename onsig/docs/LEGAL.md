# OnSig — Hukuki Çerçeve (Özet)

> Bu döküman bilgi amaçlıdır, hukuki mütalaa yerine geçmez. Üretim öncesi avukat görüşü alınmalıdır.

## Türkiye

### 6098 sayılı Türk Borçlar Kanunu (TBK)
- **Madde 14:** “Yazılı şekilde yapılması öngörülen bir sözleşmenin **elektronik veya benzeri bir araçla**
  düzenlenmesi de yazılı şekildir.”
- **Madde 15:** Borç altına girenin imzası bulunmadıkça borç hâlleri geçerli değildir; **güvenli elektronik imza** elle atılan imzaya eşdeğer kabul edilir.
- **Madde 16:** Borç altına girenin iradesi her türlü delille ispatlanabilir.

### 5070 sayılı Elektronik İmza Kanunu
- “Güvenli elektronik imza” için **Nitelikli Sertifika** (NES) ve **ESHS** zorunludur.
- BTK tarafından yetkilendirilmiş sağlayıcılar: **E-Güven, Türktrust, E-Tugra, TÜBİTAK Kamu SM** (kurumsal).
- **OnSig v1**, 5070 anlamında güvenli e-imza **DEĞİLDİR**;
  imza, **TBK m.14 + m.16** kapsamında **iradeyi gösteren delil** olarak konumlandırılır.

### 6502 sayılı Tüketicinin Korunması Hakkında Kanun
- Mesafeli sözleşmelerde tüketici taraf ise **ön bilgilendirme** ve **cayma hakkı** zorunludur.
- KVKK ile birlikte aydınlatma + açık rıza metinleri zorunludur.

### KVKK (6698)
- Veri sorumlusu: OnSig (firma + alt tenant ortak sorumlu).
- Veri kategorileri: kimlik, iletişim, hukuki işlem, biyometrik (imza görseli), lokasyon.
- Saklama süresi: TBK m.146 → 10 yıl genel zamanaşımı.
- Aydınlatma metni + açık rıza, imza ekranında zorunlu.
- VERBİS kaydı gereklidir.

### ETBİS
- Elektronik ticaret yapılıyorsa Ticaret Bakanlığı ETBİS kaydı (KOBİ’ler için ayrı limit).

## AB / eIDAS

- **Basit elektronik imza (SES)**: OnSig v1 bu seviyededir; mahkemede delil değerine sahiptir, hukuki geçerlilik tartışılabilir.
- **Gelişmiş (AES)**: imzalayanı tek tanımlayan ve imzalayan kontrolünde olan veriyle bağlanmış.
- **Nitelikli (QES)**: AES + nitelikli sertifika + güvenli imza oluşturma cihazı (QSCD).

## Veri akışı diyagramı

```
İmzalayan → /sign/<token>
   ▼ (TLS)
OnSig Backend
   ▼
  - Postgres (Neon TR/AB region)
  - Vercel Blob (PDF, imza PNG)
  - Audit log (chain-of-records)
   ▼
Mail (Resend) → İmzalayan + Yönetici
```

## Aydınlatma metni şablonu (kısa)

> İşbu form aracılığıyla işlenen kişisel verileriniz (ad, soyad, T.C. kimlik no, telefon,
> e-posta, imza görseli, IP adresi, kullanıcı aracısı, varsa konum bilgisi), **OnSig … Ltd. Şti.**
> (“Veri Sorumlusu”) ve hizmet aldığınız taraf (“Veri İşleyen”) tarafından,
> 6698 sayılı KVKK m.5/2-c (sözleşmenin kurulması ve ifası) ve m.5/2-f (meşru menfaat)
> uyarınca işlenir. Veriler **10 yıl** süre ile saklanır; KVKK m.11 kapsamında her zaman silme/erişim talep edebilirsiniz.

## İmza ekranında zorunlu onaylar

1. Aydınlatma metnini okudum, anladım.
2. Sözleşme metnini okudum, kabul ediyorum.
3. Açık rıza: biyometrik veri kategorisindeki imza görselimin işlenmesine onay veriyorum.

## Saklama & silme

- İmzalı sözleşme: 10 yıl.
- Tamamlanmamış (bekleyen) oturum: 30 gün sonra TOKEN imhası, 6 ay sonra kayıt arşivi.
- Audit log: 10 yıl, sonra anonimleştirme.
