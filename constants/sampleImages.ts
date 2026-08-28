// Curated Unsplash imagery (verified 200) + a shared vintage look.
// Real event photos give the pastel cards a warm, analog feel.

// Served at a 4:3 crop so the composition reads full and un-squished.
export const unsplash = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${Math.round(
    (w * 3) / 4
  )}&q=80&auto=format&fit=crop`;

// Same source, cropped tall — a cover fills a phone screen, so a landscape crop
// would be letterboxed away.
export const unsplashPortrait = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${Math.round(
    (w * 16) / 9
  )}&q=80&auto=format&fit=crop`;

// Vintage/analog grade — applied via RN's `filter` style prop (same pattern the
// app already uses in EventPreviewCard / the filter picker).
export const VINTAGE_FILTER = [
  { sepia: 0.3 },
  { contrast: 1.08 },
  { brightness: 1.02 },
  { saturate: 0.88 },
];

// Extra warm wash layered over the image to deepen the vintage tone.
export const VINTAGE_WASH = "rgba(120,74,38,0.12)";

// One per entry in EVENT_TYPES (app/(tabs)/create.tsx) — a card with no image
// renders blank, so the two lists move together.
export const EVENT_TYPE_IMAGE: Record<string, string> = {
  Wedding: unsplash("1519741497674-611481863552"), // couple + bouquet, golden light
  Birthday: unsplash("1530103862676-de8c9debad1d"), // colorful balloons
  Party: unsplash("1533174072545-7a4b6ad7a6c3"), // confetti crowd
  Trip: unsplash("1478146896981-b80fe463b330"), // floral dress on open road
  Anniversary: unsplash("1522673607200-164d1b6ce486"), // "Mr & Mrs" chairs
  Graduation: unsplash("1627556704302-624286467c65"), // cap held against a facade
  Engagement: unsplash("1591604466107-ec97de577aff"), // couple by the water
  "Baby Shower": unsplash("1555252333-9f8e92e65df9"), // baby feet in a white blanket
  "Sweet 15": unsplash("1464349095431-e9a21285b5f3"), // layered cake with stars
  Reunion: unsplash("1519671482749-fd09be7ccebf"), // glasses raised over a table
  Corporate: unsplash("1511578314322-379afb476865"), // round tables, big screens
  Holiday: unsplash("1607344645866-009c320b63e0"), // gold-ribboned gifts
  Other: unsplash("1543269865-cbf427effbad"), // friends gathered
};

// Every event shows a cover — events created without one fall back to this.
// Misty forest: desaturated and cool, so white overlay text stays readable and
// it doesn't fight the blush accent.
export const DEFAULT_EVENT_COVER = unsplash("1470071459604-3b5ec3a7fe05", 1200);

/** Resolves an event's cover, falling back to the default when none is set. */
export const eventCover = (url?: string | null) => url || DEFAULT_EVENT_COVER;

// Arc of hero cards on the welcome screen — fanned across the top, bleeding off
// both edges. Five distinct shots so the arc reads full.
export const WELCOME_HERO_IMAGES = [
  unsplash("1519741497674-611481863552"), // wedding couple, golden light
  unsplash("1530103862676-de8c9debad1d"), // birthday balloons
  unsplash("1522673607200-164d1b6ce486"), // Mr & Mrs chairs
  unsplash("1533174072545-7a4b6ad7a6c3"), // confetti crowd
  unsplash("1478146896981-b80fe463b330"), // open road / trip
  unsplash("1543269865-cbf427effbad"), //    friends gathered
  unsplash("1470071459604-3b5ec3a7fe05"), // misty forest
];

// ─── Stock covers ─────────────────────────────────────────────────────────────

// Offered in the create wizard so an event is never coverless. These are hosted
// URLs rather than bundled files on purpose: the API takes a cover either as a
// `cover_image_url` in the JSON body or as an uploaded file, and a preset that
// already lives at a URL skips the upload entirely (see `buildEventBody`).
//
// Ids are drawn from the set already verified in this file — a stock cover that
// 404s is worse than a plain one.
export const COVER_PRESETS = [
  { key: "golden", id: "1519741497674-611481863552" }, // couple, golden light
  { key: "confetti", id: "1533174072545-7a4b6ad7a6c3" }, // confetti crowd
  { key: "table", id: "1543269865-cbf427effbad" }, // friends gathered
  { key: "balloons", id: "1530103862676-de8c9debad1d" }, // balloons
  { key: "vows", id: "1522673607200-164d1b6ce486" }, // "Mr & Mrs" chairs
  { key: "road", id: "1478146896981-b80fe463b330" }, // open road
  { key: "mist", id: "1470071459604-3b5ec3a7fe05" }, // misty forest
].map((preset) => ({
  ...preset,
  uri: unsplashPortrait(preset.id, 1200),
  thumb: unsplashPortrait(preset.id, 200),
}));

/** True when a cover is already hosted — a preset, not a file from the picker. */
export const isHostedCover = (uri: string | null | undefined) =>
  !!uri && /^https?:\/\//.test(uri);
