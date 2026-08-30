// Curated in-house imagery (the everly moodboard) + a shared vintage look.
// Real event photos give the pastel cards a warm, analog feel.
//
// These used to be Unsplash URLs. They're bundled files now, which changes two
// things worth knowing:
//   1. Nothing here needs the network — the create wizard, the welcome arc and
//      every cover fallback render offline and on first launch, with no
//      flash-of-empty-card while a remote image loads.
//   2. A stock cover is no longer a URL the API can store as-is, so picking one
//      now *uploads* the file (see `coverUploadFile`).
import { Image } from "react-native";
import { Asset } from "expo-asset";

// ─── Bundled photos ───────────────────────────────────────────────────────────

// One entry per file in assets/images/moodboard. Metro only bundles what's
// `require`d, so an unused key here is the only thing keeping a photo out of
// the app — keep the list and the folder in sync.
const PHOTO = {
  brideCar: require("../assets/images/moodboard/bride-vintage-car.jpg"),
  bridesmaids: require("../assets/images/moodboard/bridesmaids-toast.jpg"),
  coupleDancing: require("../assets/images/moodboard/couple-dancing-dusk.jpg"),
  birthdayPhones: require("../assets/images/moodboard/birthday-candles-phones.jpg"),
  birthdayCake: require("../assets/images/moodboard/birthday-cake-portrait.jpg"),
  champagne: require("../assets/images/moodboard/champagne-pour.jpg"),
  neonShots: require("../assets/images/moodboard/neon-shots.jpg"),
  elevator: require("../assets/images/moodboard/friends-elevator.jpg"),
  goldFrame: require("../assets/images/moodboard/gold-frame-toast.jpg"),
  flashNight: require("../assets/images/moodboard/flash-night-friends.jpg"),
  petsCocktails: require("../assets/images/moodboard/pets-cocktails.jpg"),
  banquet: require("../assets/images/moodboard/banquet-toast.jpg"),
  festival: require("../assets/images/moodboard/festival-crowd.jpg"),
  cocktails: require("../assets/images/moodboard/cocktails-overhead.jpg"),
  polaroid: require("../assets/images/moodboard/festival-polaroid.jpg"),
} as const;

export type PhotoKey = keyof typeof PHOTO;

/**
 * A bundled photo as a plain `uri` string.
 *
 * Every consumer in the app passes `{ uri }` to `<Image>` (covers arrive from
 * the API as URLs, so that's the shape the components speak). Resolving the
 * module here keeps local and remote imagery interchangeable instead of forcing
 * an `ImageSourcePropType` union through eight files.
 */
export const photo = (key: PhotoKey) => Image.resolveAssetSource(PHOTO[key]).uri;

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
  Wedding: photo("brideCar"), // bride stepping out of a vintage car
  Birthday: photo("birthdayPhones"), // cake lit up, everyone filming it
  Party: photo("champagne"), // champagne poured straight from the bottle
  Trip: photo("elevator"), // packed friends piled into a lift
  Anniversary: photo("coupleDancing"), // couple dancing alone at dusk
  Graduation: photo("flashNight"), // flash-lit friends, bottles up
  Engagement: photo("bridesmaids"), // toast raised around the bride
  "Baby Shower": photo("goldFrame"), // gilded frame held up at a reception
  "Sweet 15": photo("neonShots"), // neon blur of glasses meeting
  Reunion: photo("banquet"), // long table, every glass in the air
  Corporate: photo("cocktails"), // cocktails from above on a dark table
  Holiday: photo("festival"), // summer crowd, beer balanced on a head
  Other: photo("petsCocktails"), // the one that refuses a category
};

// Every event shows a cover — events created without one fall back to this.
// The dusk shot is dark and desaturated, so white overlay text stays readable
// and it doesn't fight the blush accent.
export const DEFAULT_EVENT_COVER = photo("coupleDancing");

/** Resolves an event's cover, falling back to the default when none is set. */
export const eventCover = (url?: string | null) => url || DEFAULT_EVENT_COVER;

// Arc of hero cards on the welcome screen — fanned across the top, bleeding off
// both edges. Seven distinct shots so the arc reads full.
export const WELCOME_HERO_IMAGES = [
  photo("brideCar"),
  photo("birthdayPhones"),
  photo("bridesmaids"),
  photo("champagne"),
  photo("elevator"),
  photo("cocktails"),
  photo("coupleDancing"),
];

// Two stand-in guest shots for the reveal preview in the create wizard.
export const REVEAL_PREVIEW_IMAGES = [
  photo("flashNight"),
  photo("polaroid"),
];

// Thumbnails on the camera deck in ShotsPerPerson.
export const SAMPLE_SHOT_IMAGES = [
  photo("birthdayPhones"),
  photo("champagne"),
];

// Shown behind the filter picker when the event has no cover yet — the step is
// about a photo, so it always needs one.
export const FILTER_PREVIEW_IMAGE = photo("brideCar");

// ─── Stock covers ─────────────────────────────────────────────────────────────

// Offered in the create wizard so an event is never coverless. Portrait shots:
// a cover fills a phone screen, so a landscape frame would be letterboxed away.
export const COVER_PRESETS = [
  { key: "wedding", photo: "brideCar" },
  { key: "dusk", photo: "coupleDancing" },
  { key: "toast", photo: "bridesmaids" },
  { key: "banquet", photo: "banquet" },
  { key: "cocktails", photo: "cocktails" },
  { key: "birthday", photo: "birthdayPhones" },
  { key: "trip", photo: "elevator" },
].map((preset) => ({
  ...preset,
  uri: photo(preset.photo as PhotoKey),
  // Same file — a bundled asset has no server-side resize to ask for, and the
  // largest of these is under 170 KB.
  thumb: photo(preset.photo as PhotoKey),
}));

const PRESET_URIS = new Set(COVER_PRESETS.map((preset) => preset.uri));

/** True when a cover is one of the bundled stock covers. */
export const isPresetCover = (uri: string | null | undefined) =>
  !!uri && PRESET_URIS.has(uri);

/**
 * True when a cover is a remote URL the API can store as-is.
 *
 * The preset check isn't redundant: Metro serves bundled assets over `http://`
 * in development, so a stock cover would otherwise look "hosted" and the create
 * request would hand the backend a dev-server URL that dies with the tunnel.
 */
export const isHostedCover = (uri: string | null | undefined) =>
  !!uri && !isPresetCover(uri) && /^https?:\/\//.test(uri);

/** True when a cover came from the user's own library. */
export const isOwnCover = (uri: string | null | undefined) =>
  !!uri && !isPresetCover(uri) && !isHostedCover(uri);

/**
 * The cover as something `eventsApi.store` can upload, or `undefined` when
 * there's nothing to upload (no cover, or one already hosted).
 *
 * A bundled preset lives inside the app package, which `FormData` can't read on
 * Android — `downloadAsync()` copies it into the cache and hands back a real
 * `file://` URI that can.
 */
export const coverUploadFile = async (uri: string | null | undefined) => {
  if (!uri || isHostedCover(uri)) return undefined;

  const preset = COVER_PRESETS.find((p) => p.uri === uri);
  if (!preset) return { uri, name: "cover.jpg", type: "image/jpeg" };

  const asset = Asset.fromModule(PHOTO[preset.photo as PhotoKey]);
  if (!asset.localUri) await asset.downloadAsync();
  return {
    uri: asset.localUri ?? asset.uri,
    name: `${preset.key}.jpg`,
    type: "image/jpeg",
  };
};
