# OnSig — Sözleşme Motoru (shared/contracts)

Sektörden bağımsız sözleşme motoru. CUGM’den taşınacak temel parçalar:

```
shared/contracts/
├── types.ts             // ContractType, ContractFormState ve sektör soyutlaması
├── render.ts            // HTML render (mevcut render.ts tabanlı)
├── templates/
│   ├── real-estate/     // kira, yetki, alım-satım, yer gösterme
│   ├── freelance/       // v0.3+
│   └── ...
└── index.ts
```

## Tasarım kararları

- Şablonlar **deklaratif** (JSON yapısı + render fonksiyonu) tutulur ki ileride DB’de yayınlanabilsin.
- Her şablonun **JSON schema**’sı vardır (form alanları); mobil/web form bu schema’dan üretilir.
- **Imza rolleri** şablon tarafından tanımlanır (`signers: SignerKey[]`).
- Yargı yetkisi, lisans no, KVKK metni gibi **tenant-bound** alanlar render zamanında inject edilir.
- Şablon **versiyonludur** (`version`, `validFrom`, `validTo`); imzalı sözleşme **versiyonu kilitler**.

## Yapılacaklar

- [ ] Mevcut `render.ts` ve `templates.ts` `real-estate` klasörüne kopyala, **bağımsızlaştır**.
- [ ] `template-schema.ts`: alan tanımları (input, select, multiline, date, money...).
- [ ] `render-html.ts`: çıktı = HTML; imza alanları için placeholder işaretleri.
- [ ] `render-pdf.ts`: `@react-pdf/renderer` veya puppeteer ile A4 PDF.
- [ ] Birim test: render snapshot’ları.
