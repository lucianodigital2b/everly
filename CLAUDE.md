# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start development server
npx expo start

# Run on specific platform
npx expo run:ios
npx expo run:android

# Start with web
npx expo start --web
```

No lint or test scripts are configured. Type checking is via `tsc --noEmit`.

## Environment Variables

Required in `.env.local`:

- `EXPO_PUBLIC_RC_IOS` — RevenueCat API key for iOS
- `EXPO_PUBLIC_RC_ANDROID` — RevenueCat API key for Android
- `EXPO_PUBLIC_API_URL` — Backend base URL (e.g. `https://your-domain.com/api`)

## Architecture

**Everly** is a premium iOS/Android mobile app (Expo managed workflow) for collaborative photo experiences — users create events, guests upload a limited number of photos, and the gallery "reveals" at a scheduled time.

### Routing

Uses Expo Router (file-based, like Next.js):

- `app/(tabs)/` — Main tab navigation: Events (home), Create, Settings
- `app/(auth)/` — Auth flow
- `app/(bottomSheet)/` — Bottom sheet modals
- `app/event/[id].tsx` — Event detail modal

The tab bar has a center "create" button that is custom-styled (see `app/(tabs)/_layout.tsx`).

### State Management

Zustand stores in `zustand/` with AsyncStorage persistence:

- `auth-store/` — Authentication state (Redux-pattern with reducer)
- `theme-store/` — Reserved, currently empty

### Monetization

RevenueCat handles all in-app purchases. Entitlement key is `healthlyst_pro` (legacy name, do not rename without checking RevenueCat dashboard).

- `services/revenuecat.ts` — SDK initialization and wrapper functions
- `hooks/useRevenueCat.ts` — React hook for components (`presentPaywall()`, `restore()`, `openCustomerCenter()`)
- `components/PaywallModal.tsx` — Custom paywall UI

Tiers: Free (5 participants), Intimate (30), Celebration (100), Grand (unlimited).

### API

`services/api.ts` — real implementation of the CasamentoApp API (Laravel Sanctum, Bearer token). Exports:
- `authApi` — register, login, logout, user
- `plansApi` — index
- `eventsApi` — CRUD
- `checkoutApi` — PIX checkout + payment status
- `uploadApi` — guest QR upload (no auth)
- `referralApi` — redeem referral code
- `api` — backward-compat wrapper used by existing components

### Styling

NativeWind (Tailwind CSS for React Native) — use `className` props. Custom design tokens:

- Accent color: `#C6A96B` (gold)
- Fonts: Playfair Display (serif, headings) + Inter (sans, body)
- See `tailwind.config.js` for full custom palette and `constants/` for spacing/typography scales

Design language: soft, romantic, editorial, Apple-like, minimal, premium. Avoid bright gradients, gamification elements, or tech startup aesthetics.

### Key Tech

- React Native 0.79.5 + Expo 53 with New Architecture enabled
- TypeScript 5.8 (`tsconfig.json` extends `expo/tsconfig.base`)
- React Query for server state, Zustand for client state
- i18n: EN, ES, PT-BR via `localization/i18n.ts`
- Lottie for animations, Lucide for icons
- SVG support via custom Metro + Babel config
