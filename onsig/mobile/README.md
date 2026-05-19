# OnSig Mobile (Expo)

React Native + Expo SDK 51+ ile iOS & Android.

> Henüz başlatılmadı; ilk komutlar:
> ```bash
> cd onsig/mobile
> npx create-expo-app@latest . --template
> # "Navigation (TypeScript)" şablonunu seçin
> npx expo install expo-router expo-secure-store expo-image expo-haptics expo-clipboard
> npx expo install react-native-signature-canvas react-native-webview
> npm install zustand @tanstack/react-query zod ky
> ```

## Klasör yapısı (önerilen)

```
mobile/
├── app/                      # Expo Router
│   ├── _layout.tsx
│   ├── (auth)/
│   │   ├── login.tsx         # Telefon OTP isteme
│   │   └── verify.tsx        # 6 haneli kod doğrulama
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx         # Sözleşmeler listesi
│   │   ├── new.tsx           # Yeni sözleşme (şablon seç → form)
│   │   └── profile.tsx
│   ├── contract/[id].tsx     # Sözleşme detayı + imza oturumları
│   └── sign/[token].tsx      # Public imza (kendi app'inde aç)
├── components/
│   ├── SignaturePad.tsx
│   ├── ContractForm.tsx
│   └── ...
├── lib/
│   ├── api.ts                # ky tabanlı fetch + interceptors
│   ├── auth.ts               # secure-store + zustand
│   └── format.ts
├── assets/                   # icon, splash, fontlar
├── app.json
└── eas.json
```

## EAS Build & Submit

- **iOS:** App Store Connect bağlantısı + auto-credentials.
- **Android:** Play Console + service account JSON.
- **OTA:** `expo publish` veya EAS Update ile JS-only hotfix.

## Deep link

- Scheme: `onsig://`
- Universal Links: `https://onsig.app/sign/<token>` → app açılırsa app'te aç, yoksa web sayfası.

## İmza pad notu

`react-native-signature-canvas` webview tabanlı; native build sorunu yoktur.
Çıktı **base64 PNG**; backend bunu mevcut formatla aynı şekilde alır.
