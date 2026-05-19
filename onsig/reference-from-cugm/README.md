# Referans — Çandarlı Uzman GM sözleşme modülü

> Bu klasördeki dosyalar, **OnSig** için çekirdek alınmak üzere mevcut `candarli-uzman-gm`
> projesinden kopyalanmıştır. **Çalışmaz** (path'ler çözümlenmemiş, bağımlılıklar yok).
> Sadece **mimari + iş kuralı kaynağı** olarak inceleyin; uyarlamalar `onsig/shared/contracts`
> ve `onsig/backend/app/api` altına yapılacaktır.

## Dosyalar

- `types.ts` — `ContractType`, `ContractFormState`, `EMPTY_CONTRACT_FORM`
- `templates.ts` — şablon kataloğu (kira/yetki/alım-satım/yer-gösterme) + makro değişkenler
- `render.ts` — HTML çıktısı + imza alanları + KVKK uyarısı
- `index.ts` — barrel exports
- `ContractsAdmin.tsx` — admin web’deki tam yönetim ekranı (hub + editor + detail)
- `ContractSignPage.tsx` — public imza sayfası (sözleşme metni + canvas imza + onaylar)
- `contracts/` — backend API route handlers
  - `admin/contracts/` — CRUD + sign-session yönetimi
  - `contracts/sign/[token]/` — public imza GET/POST

## Uyarlama notları (yapılacaklar)

- [ ] `Property` ile bağlı alanları (`ada_no`, `parsel_no`, `propertyAddress`) **opsiyonel** yap.
- [ ] `competentCourt: 'İZMİR'` default'unu **tenant.settings.competentCourt**’a bağla.
- [ ] `brokerageLicenseNo` alanını **tenant** bazlı ayardan oku.
- [ ] `tenant_id` her tabloya eklenir, RLS yerine app-level filtre.
- [ ] Şablonlar sektör soyutlaması ile çoğaltılır (`sectors/real-estate/*`, `sectors/freelance/*`).
- [ ] İmza akışında **e-posta/SMS OTP** doğrulaması eklenir (KVKK kapsamı).
- [ ] PDF üretimi sunucu tarafında **puppeteer-core** ile (mevcut `renderContractHtml` çıktısı bestlenir).
