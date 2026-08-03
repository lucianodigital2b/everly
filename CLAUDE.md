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
- `EXPO_PUBLIC_AF_DEV_KEY` — AppsFlyer dev key (Settings → App details), shared across platforms
- `EXPO_PUBLIC_AF_APPLE_APP_ID` — Numeric Apple App Store id (iOS attribution only; Android keys off the package name)

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

RevenueCat handles all in-app purchases. There are no subscriptions — guest packs are **one-off consumables** that add participant slots to a single event.

- `services/revenuecat.ts` — SDK init, `logIn()`, `getGuestPacks()`, `purchaseGuestPack(pkg, eventId)`
- `hooks/useRevenueCat.ts` — React hook (`guestPacks`, `purchaseGuestPack()`, `identifyUser()`, `presentPaywall()`, `restore()`, `openCustomerCenter()`)
- `components/PaywallModal.tsx` — Custom paywall UI

Entitlement key is `everly_guests` (RevenueCat project `everly`, `proj5959e0b0`).

**A consumable purchase never appears in `customerInfo.entitlements.active`.** The source of truth for a guest allowance is `Event.participant_limit`, credited server-side by the RevenueCat webhook. After a purchase, refetch the event — never grant slots optimistically on the client, and never gate on `hasActiveEntitlement()` for guest packs.

**Event attribution is mandatory.** A consumable carries no event context by itself, so the webhook can't know which event to credit. Before every purchase, `purchaseGuestPack(pkg, eventId)` sets the `everly_event_id` RevenueCat subscriber attribute, and the user is identified with `logIn(users.id)` so the purchase's `app_user_id` matches the API user (the backend cross-checks ownership). A purchase with no `everly_event_id` lands `unattributed` on the backend and grants nothing — so `purchaseGuestPack` refuses to run without an `eventId`. `create.tsx` creates the event first, then buys the pack for the paid tier attributed to that new event id; a cancelled purchase leaves the event at its free baseline. See `BACKEND_REVENUECAT.md` for the webhook/crediting contract.

**A cancelled purchase must not reset the wizard.** Because the event is created *before* the purchase, the create flow can't just start over on failure. `createdEventRef` in `create.tsx` holds that event for the rest of the wizard run: on cancel/failure the user stays on the guest-tier step with every answer intact, and "Try again" or a different tier reuses the same event (`ensureEvent()` PATCHes any edits onto it) instead of creating a duplicate. "Continue with 5 guests" drops `plan_id` back to Starter, since nothing was charged. The ref is cleared only by `resetForm()`, once the flow actually reaches the camera.

Tiers are defined in `GUEST_TIERS` (`app/(tabs)/create.tsx`), each linked to its RevenueCat package via `lookupKey`:

| Tier | Guests | Price | Package | plan_id |
|---|---:|---:|---|---:|
| Starter | 5 | free | — | 1 |
| Small | 10 | $1.99 | `guests_10` | 2 |
| Medium | 25 | $4.99 | `guests_25` | 3 |
| Large | 50 | $14.99 | `guests_50` | 4 |
| XL | 100 | $25.99 | `guests_100` | 5 |
| XXL | 150 | $45.99 | `guests_150` | 6 |
| Enterprise | unlimited | $69.99 | `guests_unlimited` | 8 |

Store product IDs are `com.get.everly.guests.<n>`. The `price` field is a display fallback only — the charged amount comes from the store via the package. `plan_id` is listed explicitly per tier, not derived from the array index; `7` is retired along with a removed 200-guest tier. Plans are being phased out, but `plan_id` stays required until the backend makes it optional.

### Attribution (AppsFlyer)

`react-native-appsflyer` (Expo config plugin in `app.json`) measures installs and in-app events.

- `services/appsflyer.ts` — `configure()` (initSdk), `setUserId()`, `getUID()`, `logEvent()`. Lazy-requires the native module and no-ops off `EXPO_PUBLIC_AF_DEV_KEY`, so it degrades gracefully in Expo Go / web (same pattern as `revenuecat.ts`).
- `configure()` runs once at startup in `app/_layout.tsx`, next to `revenueCat.configure()`.
- Customer User ID is set to `users.id` after every login/register (`zustand/auth-store/actions.ts`) and before a purchase (`create.tsx`), so AppsFlyer, RevenueCat, and the backend all key off the same id.

**Revenue goes through RevenueCat, not the client.** RevenueCat's native AppsFlyer integration forwards purchase events server-side (consumables arrive as `non_renewing_purchase`). At startup `revenueCat.linkAppsFlyer(afUid)` calls `collectDeviceIdentifiers()` + `setAppsflyerID()` so RC can attribute and forward. **Never log `af_purchase` from the client** — it would double-count. This requires the AppsFlyer integration to be enabled in the RevenueCat dashboard (AppsFlyer app id + dev key).

- The plugin adds `com.get.everly.guests.<n>` unique bundle ids per **app variant** — the `.dev`/`.preview` builds are separate AppsFlyer apps, so use the production Apple App ID / package for the live AppsFlyer app.
- **ATT is wired.** `expo-tracking-transparency` (plugin in `app.json` sets `NSUserTrackingUsageDescription`) shows the iOS prompt via `requestATT()` in `services/appsflyer.ts`, fired right after `initSdk`. The SDK holds the install event up to 10s (`timeToWaitForATTUserAuthorization`) for the user's choice, so a granted IDFA is attached. iOS-only; no-op elsewhere. Pairs with AppsFlyer's SKAN setup step.

### API

`services/api.ts` — real implementation of the CasamentoApp API (Laravel Sanctum, Bearer token). Exports:
- `authApi` — register, login, logout, user
- `plansApi` — index
- `eventsApi` — CRUD
- `checkoutApi` — PIX checkout + payment status
- `uploadApi` — guest QR upload (no auth)
- `referralApi` — redeem referral code
- `api` — backward-compat wrapper used by existing components

### Auth

Sign-in lives in `zustand/auth-store/actions.ts` (`login`, `register`, `googleSignIn`, `appleSignIn`); the buttons are on `app/(auth)/welcome.tsx`. Every path ends the same way: save the token via `StorageHelper`, dispatch `AUTH_LOGIN_FULFILLED`, then `appsFlyerService.setUserId(user.id)` so AppsFlyer/RevenueCat/backend share one id.

**Sign in with Apple** (`usesAppleSignIn` + the `expo-apple-authentication` plugin in `app.json`; iOS-only, the button hides elsewhere). Three things are easy to get wrong:

- **The name and email come back exactly once** — on the user's first authorization. Every later sign-in sends `null`. `services/appleAuth.ts` caches the first values against the Apple user identifier and replays them until a login actually succeeds, so a failed round-trip doesn't cost the account its name forever. The backend must likewise never overwrite a stored name with `null`.
- **`authorization_code` is sent so the server can revoke.** It's exchanged for a refresh token that `DELETE /auth/user` posts to Apple's revoke endpoint — required by App Store guideline 5.1.1(v) for any app offering Apple sign-in.
- **Revocation is watched.** `hooks/useAppleCredentialWatch` (mounted in `app/_layout.tsx`) signs the user out if they revoke access from iOS Settings, via `addRevokeListener` plus a `getCredentialStateAsync` check on launch.

A dismissed Apple sheet throws `ERR_REQUEST_CANCELED` — treated as a silent no-op, not an error toast.

Each bundle id (`com.get.everly`, `.dev`, `.preview`) needs the Sign In with Apple capability enabled on its App ID in the Apple Developer portal, and the backend must accept all three as valid `aud` values. See `BACKEND.md` §2.1 for the full server-side contract.

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
- UI copy is English-only (hardcoded in screens); there is no i18n layer
- Lottie for animations, Lucide for icons
- SVG support via custom Metro + Babel config
