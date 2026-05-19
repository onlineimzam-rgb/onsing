# OnSig Mobile

React Native + Expo SDK 54 (Expo Router, TypeScript, NativeWind).

Backend: production at <https://onsig-prod.fly.dev> (configurable via `EXPO_PUBLIC_API_URL`).

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Routing | **Expo Router 6** (file-based) | Native deep-links + typed routes out of the box |
| Styling | **NativeWind 4** + Tailwind 3.4 | Reuses the design tokens from `stitch_onsig_premium_mobil_aray_z/onsig_design_system/DESIGN.md` 1:1 |
| State (client) | **zustand 5** + **expo-secure-store** | Tiny, no Context boilerplate; token lives in OS keychain |
| State (server) | **TanStack Query 5** | Caching, retries, optimistic updates |
| HTTP | **ky 2** | Tiny, auth interceptor via hook |
| Forms | **react-hook-form** + **zod** | Typed validation matching the backend's Zod schemas |
| Icons | **@expo/vector-icons** (MaterialIcons) | Covers the Material Symbols used in Stitch mocks |
| Fonts | `@expo-google-fonts/inter`, `.../geist` | DESIGN.md typography scale |
| Signature pad (Phase 3) | `react-native-signature-canvas` (WebView) | No native build required |

## Folder layout

```
mobile/
├── app/                     # Expo Router (file-based routes)
│   ├── _layout.tsx          # Root: fonts, providers, AuthGate
│   ├── index.tsx            # Initial route (redirect via AuthGate)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx      # Brand splash
│   │   ├── onboarding.tsx   # Feature intro
│   │   └── login.tsx        # Email + password → /api/auth/login
│   └── (tabs)/
│       ├── _layout.tsx      # Floating bottom nav
│       ├── index.tsx        # Dashboard (Phase 1 placeholder)
│       └── profile.tsx      # Profile + logout
│   ├── contract/[id].tsx    # Sözleşme detay (gradient avatar, progress bar, sticky CTA)
│   └── settings/            # Settings stack (profile, password)
├── components/
│   ├── avatar.tsx           # Hash-stable gradient initials + optional status dot
│   ├── button.tsx           # primary | brand | soft | outline | ghost | danger | dark | accent
│   ├── card.tsx             # 22px-radius surface with soft elevation (xs..lg)
│   ├── icon.tsx             # MaterialIcons wrapper with Material Symbols aliases
│   ├── section-header.tsx   # "Title · 3 · Tümü →" pattern
│   ├── skeleton.tsx         # Pulsing loaders (full + per-row)
│   ├── status-badge.tsx     # Premium pill with leading status dot
│   └── text-field.tsx       # Focus-aware input with eye-toggle for passwords
├── lib/
│   ├── api.ts               # ky client + JWT/401 hooks
│   ├── auth.ts              # zustand store + SecureStore + pending-route hand-off
│   ├── format.ts            # relativeTime / shortDate / weekdayLabels (Hermes-safe)
│   ├── haptic.ts            # tap/light/medium/heavy/success/warning/error wrappers
│   ├── queryClient.ts       # TanStack Query default config
│   ├── shadow.ts            # xs/sm/md/lg/brand ViewStyle elevation ramps
│   └── queries/             # dashboard, contracts, account (mutations)
├── tailwind.config.js       # DESIGN.md tokens (colors, type, spacing, radius)
├── global.css               # @tailwind directives (loaded by NativeWind)
├── babel.config.js          # NativeWind babel preset
├── metro.config.js          # NativeWind metro wrapper
├── app.json                 # Scheme: `onsig://`, App Links: onsig-prod.fly.dev/sign/*
└── .env.local               # EXPO_PUBLIC_API_URL=https://onsig-prod.fly.dev/api
```

## Running locally

```bash
cd onsig/mobile
npm start                    # Opens Expo Dev Tools
# then either:
# - press `i` to launch iOS simulator (macOS only)
# - press `a` to launch Android emulator
# - or scan the QR with Expo Go on your physical device
```

Login credentials for the production backend are the super-admin you created
during deploy (`bulenttum@gmail.com` / `Bt_15761576`).

## Phase plan

- ✅ **Phase 0** — Bootstrap, design tokens, fonts, providers, splash + onboarding
- ✅ **Phase 1** — Email/password login + logout
- ✅ **Phase 2** — Full dashboard (Komuta Merkezi), contract list, contract detail
- ⏳ **Phase 3** — Signature flow (stepper + on-device pad → backend POST)
- ✅ **Phase 4** — Profile / password / deep links / EAS Build profiles
- 🧊 **Phase 5** — Push notifications, biometric unlock, offline cache

## Phase 4 surface area

### Account self-service

| Screen | File | Backend |
|---|---|---|
| Profilim (edit name) | `app/settings/profile.tsx` | `PATCH /api/auth/me` |
| Şifre değiştir | `app/settings/password.tsx` | `POST /api/auth/change-password` |
| Hesap durumu (GET) | (planned) | `GET /api/auth/me` |

The password screen ships with a live strength meter (length + character
class scoring 0–4) and inline error mapping for the three backend failure
codes (`invalid_current`, `same_password`, `rate_limited`).

### Deep linking

- **Custom scheme:** `onsig://` — every Expo Router file route is addressable
  via this scheme. Example: `onsig:///contract/123` opens the contract detail
  screen.
- **Universal Links (iOS):** `applinks:onsig-prod.fly.dev` — once the
  `apple-app-site-association` file is published from the backend.
- **App Links (Android):** auto-verified for `/sign/*` and `/contracts/*`
  on `https://onsig-prod.fly.dev`.
- **Pending-route hand-off:** if the user opens a deep link while logged out,
  the intended pathname is parked in the zustand auth store and replayed
  right after a successful login (see `AuthGate` in `app/_layout.tsx`).

### EAS Build & Submit

The `eas.json` profile matrix lives at the repo root:

```bash
cd onsig/mobile

# One-time: create an EAS project (interactive — picks org + project name)
eas init

# Development build (dev client APK / iOS simulator binary)
eas build --profile development --platform android
eas build --profile development --platform ios

# Internal preview (APK + signed IPA you can hand to QA)
eas build --profile preview --platform all

# Store-ready release (AAB + IPA)
eas build --profile production --platform all

# OTA hot-fix once the binary is on the stores
eas update --branch production --message "fix: dashboard skeleton flicker"
```

#### Required secrets before the first production build

- **iOS:** Apple Developer membership + App Store Connect app entry. Fill in
  `submit.production.ios.{appleId, ascAppId, appleTeamId}` in `eas.json`.
- **Android:** Google Play Console + service-account JSON. Drop it at
  `mobile/play-service-account.json` (ignored by git) or override the path
  in `eas.json`.

## Signature pad notes (Phase 3)

`react-native-signature-canvas` is WebView-based, no native build needed.
Output is **base64 PNG**, which the existing backend `POST /api/sign/[token]`
endpoint accepts as-is — same payload shape as the web flow.
