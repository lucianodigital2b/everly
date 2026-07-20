// Curated Unsplash imagery (verified 200) + a shared vintage look.
// Real event photos give the pastel cards a warm, analog feel.

// Served at a 4:3 crop so the composition reads full and un-squished.
export const unsplash = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${Math.round(
    (w * 3) / 4
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

export const EVENT_TYPE_IMAGE: Record<string, string> = {
  Wedding: unsplash("1519741497674-611481863552"), // couple + bouquet, golden light
  Birthday: unsplash("1530103862676-de8c9debad1d"), // colorful balloons
  Trip: unsplash("1478146896981-b80fe463b330"), // floral dress on open road
  Anniversary: unsplash("1522673607200-164d1b6ce486"), // "Mr & Mrs" chairs
  Party: unsplash("1533174072545-7a4b6ad7a6c3"), // confetti crowd
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
