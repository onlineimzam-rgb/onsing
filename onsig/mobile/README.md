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
├── components/
│   ├── button.tsx           # Primary / Secondary / Accent / Dark
│   └── icon.tsx             # MaterialIcons wrapper with Material Symbols aliases
├── lib/
│   ├── api.ts               # ky client + JWT/401 hooks
│   ├── auth.ts              # zustand store + SecureStore
│   └── queryClient.ts       # TanStack Query default config
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
- ⏳ **Phase 2** — Full dashboard (Komuta Merkezi), contract list, contract detail
- ⏳ **Phase 3** — Signature flow (stepper + on-device pad → backend POST)
- ⏳ **Phase 4** — Profile refinement + deep links + EAS Build / Submit

## EAS Build & Submit (Phase 4)

- **iOS:** Apple Developer account + App Store Connect API key, EAS handles credentials
- **Android:** Google Play Console + service-account JSON, EAS uploads internal-testing track
- **OTA:** `eas update` for JS-only hot-fixes once the binary is on the stores

## Deep link

- Scheme: `onsig://`
- Universal Links: `https://onsig-prod.fly.dev/sign/<token>` opens the app if installed,
  falls back to the web sign page otherwise (already configured in `app.json` `intentFilters`).

## Signature pad notes (Phase 3)

`react-native-signature-canvas` is WebView-based, no native build needed.
Output is **base64 PNG**, which the existing backend `POST /api/sign/[token]`
endpoint accepts as-is — same payload shape as the web flow.
