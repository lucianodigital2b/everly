// ─── Guest tiers ──────────────────────────────────────────────────────────────
//
// Shared by the create wizard's stepper and the event settings sheet, which
// sells the same packs against an event that already exists. One table, so a
// tier can never mean two different things depending on where it was bought.

// `price` is a display fallback only — the charged amount comes from the store
// via the RevenueCat package. `lookupKey` links the tier to that package;
// null means no purchase (free tier).
//
// `planId` is sent as the event's `plan_id`, which the backend still requires.
// It is listed explicitly rather than derived from the array index so that
// adding or removing a tier can never silently remap existing events. The
// values keep the original index+1 numbering, and 7 stays retired with the
// removed 200-guest tier.
export const GUEST_TIERS = [
  { title: "Starter", participants: 5, price: 0, lookupKey: null, planId: 1 },
  {
    title: "Small",
    participants: 10,
    price: 1.99,
    lookupKey: "guests_10",
    planId: 2,
  },
  {
    title: "Medium",
    participants: 25,
    price: 4.99,
    lookupKey: "guests_25",
    planId: 3,
  },
  {
    title: "Large",
    participants: 50,
    price: 14.99,
    lookupKey: "guests_50",
    planId: 4,
  },
  {
    title: "XL",
    participants: 100,
    price: 25.99,
    lookupKey: "guests_100",
    planId: 5,
  },
  {
    title: "XXL",
    participants: 150,
    price: 45.99,
    lookupKey: "guests_150",
    planId: 6,
  },
  {
    title: "Enterprise",
    participants: "custom",
    price: 69.99,
    lookupKey: "guests_unlimited",
    planId: 8,
  },
] as const;

export type GuestTier = (typeof GUEST_TIERS)[number];

/** The tier an event's current allowance corresponds to, if any. */
export const tierForParticipants = (limit: number | null | undefined) =>
  GUEST_TIERS.find((tier) =>
    tier.participants === "custom" ? limit === null : tier.participants === limit,
  );
