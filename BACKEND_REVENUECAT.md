# Backend change request — Guest packs via RevenueCat (Model A: one-off consumables)

**Audience:** the Everly backend (Laravel + Sanctum). This supersedes the PIX/plan-based
monetization for guest capacity. Implement to this spec and the mobile app works with no
further client changes beyond the one client contract noted in §3.

---

## 1. What changed and why

Guest capacity is **no longer** sold as a subscription or a PIX plan. It is sold as
**one-off consumable in-app purchases** ("guest packs") through the App Store / Google Play,
brokered by RevenueCat. Each purchase **adds participant slots to a single event**.

- The source of truth for an event's guest allowance is **`events.participant_limit`**.
- That column is credited **server-side by the RevenueCat webhook** — never by the client.
- A consumable purchase **never** appears in `customerInfo.entitlements.active`, so the
  client cannot and must not grant slots optimistically. It refetches the event after a
  purchase and reads the new `participant_limit`.

Entitlement/project (for reference; the backend does not gate on the entitlement):
- RevenueCat project `everly` (`proj5959e0b0`), entitlement key `everly_guests`.

---

## 2. Product → guests mapping (authoritative)

Store product IDs are `com.get.everly.guests.<n>`. Each pack is a **tier upgrade**, not an
increment: the number is the event's **total** guest capacity, not slots added. The client
UI is a single-select tier picker showing these totals ("upgrade anytime"), so map each
**`product_id`** to the total capacity it unlocks. `unlimited` = "no cap"
(`participant_limit = null`).

| RevenueCat package | Store product_id                     | Total capacity |
|--------------------|--------------------------------------|----------------|
| `guests_10`        | `com.get.everly.guests.10`           | 10             |
| `guests_25`        | `com.get.everly.guests.25`           | 25             |
| `guests_50`        | `com.get.everly.guests.50`           | 50             |
| `guests_100`       | `com.get.everly.guests.100`          | 100            |
| `guests_150`       | `com.get.everly.guests.150`          | 150            |
| `guests_unlimited` | `com.get.everly.guests.unlimited`    | ∞ (null)       |

Store this mapping in config (e.g. `config/guest_packs.php`) keyed by `product_id`, so
adding a pack later is a config change, not a code change. Value `null` = unlimited.

**Baseline:** a newly created event starts at the free "Starter" tier = **5** participants
(`participant_limit = 5`), set server-side on create — **the client never sends
`participant_limit`** (it's the paid entitlement and would be forgeable). Buying a pack
**raises the event to that tier's total**; it does not add to the current value. Buying a
bigger pack later is an upgrade; a smaller one never downgrades. Once an event is unlimited
it stays unlimited.

**Recommended implementation — recompute, don't mutate.** Because tiers are totals, the
cleanest and fully idempotent rule is to derive `participant_limit` from the set of
non-refunded purchases on every webhook (purchase *and* refund):

```
active = guest_pack_purchases WHERE event_id = ? AND status = 'applied'
if any active pack is unlimited        → participant_limit = null
else                                   → participant_limit = max(5, max(active pack totals))
                                         (5 when there are no active packs)
```

This makes purchases, replays, and refunds all self-correcting: a refund just drops the row
out of `active` and the recompute naturally falls back to the next-highest tier (or the
baseline 5).

---

## 3. Client contract — how the webhook knows which event to credit  *(depends on a small client change)*

A RevenueCat purchase carries `app_user_id` and `product_id` but **not** the event id.
The app will attach the target event id as a **RevenueCat subscriber attribute**
immediately before purchasing:

```
everly_event_id = "<events.id>"
```

So the webhook payload will contain it under
`event.subscriber_attributes.everly_event_id.value`. **Credit that event.**

Also expect the app to identify the user to RevenueCat with `app_user_id = "<users.id>"`
(so you can cross-check ownership: the credited event must belong to that user).

> The app side of this (setting the attribute + logging in the RC user id) is a pending
> client change tracked separately — the backend can be built and unit-tested against the
> webhook payloads below in the meantime.

**Defense-in-depth:** if `everly_event_id` is missing/blank on a purchase, do **not** guess.
Record the purchase in `guest_pack_purchases` with `event_id = null` and status
`unattributed`, and expose it so it can be reconciled later (see §6 optional endpoint). Never
credit an event you can't positively identify.

---

## 4. Webhook endpoint

### Route
```
POST /webhooks/revenuecat        (no Sanctum auth; secured by shared secret — see below)
```
Add to `routes/api.php` and **exclude from CSRF / auth middleware**. Return `200` quickly
on anything you accept or intentionally ignore; return `4xx` only for auth failures so
RevenueCat's retry logic behaves.

### Authentication
In the RevenueCat dashboard the webhook is configured with an **Authorization header**
value. Verify the incoming `Authorization` header equals a secret stored in
`config/services.php` → `env('REVENUECAT_WEBHOOK_SECRET')`. Reject with `401` if it
doesn't match. (Use a constant-time compare, `hash_equals`.)

### Relevant event types
RevenueCat sends many event types; for consumables you care about:

| `event.type`            | Action                                             |
|-------------------------|----------------------------------------------------|
| `NON_RENEWING_PURCHASE` | Credit the mapped slots to the event.              |
| `CANCELLATION`          | Consumables generally don't cancel; ignore safely. |
| `REFUND`                | **Reverse** a previously credited purchase.        |
| everything else         | Return `200` and ignore.                           |

### Payload shape (the fields you need)
```json
{
  "event": {
    "type": "NON_RENEWING_PURCHASE",
    "id": "6F3...RC-EVENT-UUID",
    "app_user_id": "42",
    "product_id": "com.get.everly.guests.25",
    "transaction_id": "1000000999...",
    "purchased_at_ms": 1737331200000,
    "store": "APP_STORE",
    "environment": "SANDBOX",
    "subscriber_attributes": {
      "everly_event_id": { "value": "17", "updated_at_ms": 1737331199000 }
    }
  }
}
```

### Processing (idempotent)
1. Verify the `Authorization` secret.
2. Read `type`. If not one you handle → `200` and stop.
3. Resolve `product_id` → tier total via the §2 config map. Unknown product → log + `200`, stop.
4. Resolve the target event from `subscriber_attributes.everly_event_id.value`.
   - Missing/blank → record as `unattributed` (§3) and `200`, stop.
   - Event not found, or not owned by `app_user_id` → record as `rejected` and `200`, stop.
5. **Idempotency:** upsert into `guest_pack_purchases` keyed on the RevenueCat
   **`transaction_id`** (unique). For `NON_RENEWING_PURCHASE` mark it `applied`; for `REFUND`
   mark the matching row `refunded`. If the row is already in the target state, still fall
   through to the recompute (step 6) — it's idempotent — but you'll change nothing.
6. Inside a DB transaction with a row lock on the event, **recompute** `participant_limit`
   from the event's `applied` rows (see §2 "recompute, don't mutate"):
   - any `applied` pack is unlimited → `participant_limit = null`;
   - else → `participant_limit = max(5, max(applied pack totals))` (5 when none remain).
   This one rule handles purchases, replays, and refunds uniformly — no add/subtract math.
7. Return `200 {"ok": true}`.

### New table
```
guest_pack_purchases
- id                bigint PK
- transaction_id    string  UNIQUE   // RevenueCat transaction id — idempotency key
- rc_event_id       string           // RevenueCat event uuid (for tracing)
- app_user_id       string
- user_id           FK users nullable
- event_id          FK events nullable
- product_id        string
- tier_total        int nullable      // this pack's TOTAL capacity; null = unlimited
- environment       string            // SANDBOX | PRODUCTION
- status            enum: applied | refunded | unattributed | rejected
- raw               json              // full webhook payload, for audit
- created_at / updated_at
```

---

## 5. Plans (`plans`) — what to change

Plans are being phased out but are **not** removed yet:

- **Keep `plan_id` required** on `POST /events` for now (the client still sends it — the
  free Starter tier sends `plan_id = 1`). Do not break the existing contract.
- **Decouple capacity from the plan.** `participant_limit` is now driven by guest-pack
  purchases (and the baseline 5), **not** by `plan.max_uploads` or any plan field. If any
  current logic derives `participant_limit` from the plan, remove that.
- Plans may still legitimately drive **gates** (`allow_download`, `allow_slideshow`,
  `white_label`) and `duration_days`. Keep those working.
- The old reference tiers `Free / Intimate / Celebration / Grand` in `BACKEND.md §1 plans`
  and the enum in §3 are **stale** — they describe the retired model. The live plan_id set
  the client sends is `1,2,3,4,5,6,8` (7 retired). Update or ignore, but don't let the old
  tier names gate anything.
- **Future (not now):** once plans are fully abandoned, make `plan_id` optional. Leave a
  TODO; the client will drop it in a later release.

### PIX checkout
`POST /events/{id}/checkout` and `GET /events/{id}/payment` were for PIX-paid plans. Guest
capacity no longer flows through them. Either retire those routes or leave them dormant —
**the guest-pack money path is 100% App Store / Google Play → RevenueCat webhook**, not PIX.
Tell us which you keep so we can prune the client if needed.

---

## 6. Optional but recommended — immediate-credit reconciliation endpoint

Webhooks can lag a few seconds. For snappy UX the client refetches the event right after a
purchase; if the webhook hasn't landed, the new slots won't show yet. To avoid that race you
may add an authenticated endpoint the client calls right after a successful purchase:

```
POST /events/{id}/guest-packs/sync     (Sanctum auth; owner only)
```
Body: `{ "product_id": "com.get.everly.guests.25", "transaction_id": "100000..." }`

Server verifies the purchase is real by calling the **RevenueCat REST API**
(`GET /subscribers/{app_user_id}` with the RC **secret** API key held server-side —
`env('REVENUECAT_API_KEY')`) and confirming a matching non-renewing purchase exists, then
credits using the **same idempotent path and same `transaction_id`** as the webhook (so the
later webhook is a no-op). Return the updated `Event`.

This is belt-and-suspenders: the webhook remains the source of truth; this endpoint just
lets the credit appear instantly. If you skip it, the client will poll `GET /events/{id}`.

---

## 7. Config / env to add

```
REVENUECAT_WEBHOOK_SECRET=      # the Authorization header value set in the RC dashboard webhook
REVENUECAT_API_KEY=             # RC secret (sk_...) key — ONLY if implementing §6; server-side only
```
Never expose either to the app. (The app only ever holds the public `EXPO_PUBLIC_RC_*` SDK keys.)

---

## 8. Testing

RevenueCat is currently wired to the **Test Store** (sandbox). Webhook payloads arrive with
`"environment": "SANDBOX"`. Build and test against sandbox first:

1. Point the RC dashboard webhook at your tunnel (`https://<ngrok>/api/webhooks/revenuecat`)
   with the Authorization secret.
2. Make a sandbox purchase (e.g. `guests_25`) in the app for a known `event_id`.
3. Assert: a `guest_pack_purchases` row appears `applied`, and the event's
   `participant_limit` becomes the tier total (e.g. `25`), not `5 + 25`.
4. Replay the same webhook payload → assert **no** change (idempotent recompute).
5. Buy a bigger pack (`guests_50`) for the same event → `participant_limit` becomes `50`.
   Then `REFUND` the `guests_50` transaction → it falls back to `25` (the next active tier),
   not to `5`.
6. Send a purchase with a missing `everly_event_id` → assert it lands as `unattributed`
   and credits nothing.

---

## 9. Definition of done

- [ ] `POST /webhooks/revenuecat` authenticates via the shared secret and is idempotent on `transaction_id`.
- [ ] `participant_limit` is **recomputed** from the event's `applied` packs (tier total, not additive; unlimited = null).
- [ ] `REFUND` recomputes correctly — falls back to the next active tier, or baseline 5 when none remain.
- [ ] The client never sends `participant_limit`; the server sets the baseline 5 on create.
- [ ] `guest_pack_purchases` records every webhook with an audit `raw` payload and a clear `status`.
- [ ] Capacity is fully decoupled from `plans`; `plan_id` stays required for now.
- [ ] (Optional) `POST /events/{id}/guest-packs/sync` for instant credit, sharing the idempotent path.
- [ ] Env secrets added; nothing secret exposed to the client.
