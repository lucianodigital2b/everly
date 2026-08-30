import axios, { AxiosRequestConfig } from "axios";
import * as StorageHelper from "../utils/StorageHelper";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Axios instance ───────────────────────────────────────────────────────────

// Trailing slashes are stripped: uploadApi builds `${BASE_URL}/upload/...`, and a
// double slash makes Laravel fail to match the route at all (404 before it ever
// looks the event up).
//
// The URL is hardcoded here on purpose rather than read from
// `EXPO_PUBLIC_API_URL`. Metro inlines env vars at *bundle* time and caches the
// result, so editing `.env.local` while the dev server is up changes nothing
// until a restart with `--clear` — the app keeps calling the previous tunnel
// and every failure, sign-in included, looks like a broken feature instead of a
// stale bundle. `.env*.local` is also gitignored, so EAS builds never receive it
// at all. Editing the constant below invalidates the module and forces a real
// rebuild, which is the behaviour we actually want.

/** Local backend (Laragon) exposed over an ngrok tunnel. Changes on every
 *  `ngrok http` restart — paste the new URL here when it does. */
const DEV_BASE_URL =
  "https://73d8-2804-56c-a5da-6600-351a-eeb1-ed9d-947f.ngrok-free.app/everly/public/api";

/** Production backend. Used by every release build. */
const PROD_BASE_URL = "https://api.everly.app/api";

export const API_BASE_URL = (__DEV__ ? DEV_BASE_URL : PROD_BASE_URL).replace(
  /\/+$/,
  ""
);

const BASE_URL = API_BASE_URL;

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// The endpoint that establishes a session — Sign in with Apple is the only
// account path left. A leftover token in storage — an expired one, or one the
// server has already revoked — must never ride along on it: Sanctum rejects the
// dead credential before the request body is ever read, so a perfectly good
// Apple sign-in fails with a 401, and the response interceptor below then wipes
// storage and makes it look like a random logout.
const PUBLIC_AUTH_PATHS = ["/auth/apple/callback"];

const isPublicAuthPath = (url?: string) =>
  !!url && PUBLIC_AUTH_PATHS.some((p) => url.startsWith(p));

// Attach Bearer token to every authenticated request
client.interceptors.request.use(async (config) => {
  if (isPublicAuthPath(config.url)) {
    delete config.headers.Authorization;
    return config;
  }
  const token = await StorageHelper.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 → clear session.
// The cleanup is wrapped so a storage failure can never replace the original
// axios error with its own — callers branch on `error.response.status`, and
// losing that turns an expired token into an unreadable crash.
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    // A 401 from a sign-in attempt means "those credentials are wrong", not
    // "this session died" — clearing storage there would be wrong.
    if (
      error.response?.status === 401 &&
      !isPublicAuthPath(error.config?.url)
    ) {
      try {
        // Both halves of the session: the persisted zustand store and the
        // Bearer token the request interceptor reads. Dropping only the store
        // leaves the dead token attached to every subsequent request.
        await AsyncStorage.removeMany(["auth-store"]);
        await StorageHelper.removeItem("token");
      } catch {
        // Best effort — surfacing the 401 matters more than the cleanup.
      }
    }
    return Promise.reject(error);
  }
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const auth = <T = any>(config: AxiosRequestConfig) =>
  client.request<T>(config).then((r) => r.data);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: number;
  name: string;
  price_cents: number;
  currency: string;
  max_uploads: number;
  allow_download: boolean;
  allow_slideshow: boolean;
  white_label: boolean;
  duration_days: number;
}

export interface Event {
  id: number;
  user_id: number;
  plan_id: number;
  qr_code_token: string;
  status: "active" | "pending_payment" | string;
  public: boolean;
  name: string;
  title: string | null;
  event_date: string | null;
  shot_limit: number | null;
  participant_limit: number | null;
  reveal_time: string | null;
  /** Only meaningful when `reveal_time` is "Scheduled" — the moment it opens. */
  reveal_at: string | null;
  filter: string | null;
  tier: string | null;
  is_revealed: boolean;
  cover_image_url: string | null;
  activated_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  plan: Plan;
}

export interface EventGates {
  canUpload: boolean;
  canDownload: boolean;
  canSlideshow: boolean;
  whiteLabel: boolean;
}

export interface Payment {
  status: string;
  amount_cents?: number;
  currency?: string;
  invoiceUrl: string | null;
  created_at?: string;
}

export interface EventDetail {
  event: Event;
  gates: EventGates;
  uploadCount: number;
  latestPayment: Pick<Payment, "status" | "invoiceUrl"> | null;
}

export interface EventPhoto {
  id: number;
  url: string;
  thumbnail_url: string | null;
  media_type: "image" | "video";
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  created_at: string;
  /** Who uploaded it — the name the guest gave at upload time. The gallery
   *  credits each tile with it; absent means the server hasn't stored one, and
   *  the tile falls back to a plain "Guest". */
  guest_name?: string | null;
  guest?: { id: number; name: string | null } | null;
}

export interface UploadToken {
  active: boolean;
  event: {
    name: string;
    title: string | null;
    cover_image_url: string | null;
    canUpload?: boolean;
    /** Photos this guest may still upload (null = unlimited). */
    shotLimit?: number | null;
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  logout: () =>
    auth<{ message: string }>({ method: "POST", url: "/auth/logout" }),

  user: () => auth<User>({ method: "GET", url: "/auth/user" }),

  /**
   * Permanently deletes the account and its events. Required by App Store
   * guideline 5.1.1(v) — the server also revokes the Sign in with Apple grant
   * before deleting, using the refresh token from `authorization_code`.
   */
  deleteAccount: () =>
    auth<{ message: string }>({ method: "DELETE", url: "/auth/user" }),

  /**
   * `full_name` / `email` only arrive on a user's *first* authorization — every
   * later sign-in sends them as null, so the backend must persist what it gets
   * the first time and never overwrite a stored name with null.
   *
   * `authorization_code` is a one-time code the server exchanges with Apple for
   * a refresh token. It has to be stored so `DELETE /auth/user` can call Apple's
   * token revocation endpoint — App Store guideline 5.1.1(v) requires an app
   * offering Sign in with Apple to revoke the token when the account is deleted.
   */
  appleLogin: (body: {
    identity_token: string;
    authorization_code: string | null;
    user_identifier: string;
    full_name: { givenName?: string | null; familyName?: string | null } | null;
    email: string | null;
  }) =>
    auth<{ user: User; token: string }>({
      method: "POST",
      url: "/auth/apple/callback",
      data: body,
    }),
};

// ─── Plans ────────────────────────────────────────────────────────────────────

export const plansApi = {
  index: () => auth<Plan[]>({ method: "GET", url: "/plans" }),
};

// ─── Events ───────────────────────────────────────────────────────────────────

export type EventStoreBody = {
  name: string;
  plan_id: number;
  title?: string;
  event_date?: string;
  expires_at?: string;
  /** `null` is "unlimited". Omitting the key leaves whatever the event has —
   *  only an explicit null clears the limit on a PATCH. */
  shot_limit?: number | null;
  participant_limit?: number;
  reveal_time?: string;
  /** Required by the API whenever `reveal_time` is "Scheduled". */
  reveal_at?: string;
  filter?: string;
  tier?: string;
  is_revealed?: boolean;
  cover_image_url?: string;
  /** Everyone sees every photo. Documented on update; sent on create too — see
   *  the create wizard, which re-PATCHes it if the store response disagrees. */
  public?: boolean;
};

export type EventUpdateBody = Partial<EventStoreBody & { public: boolean }>;

/** A local (device) image to upload — file:// or content:// URI from the picker. */
export type CoverImageFile = { uri: string; name?: string; type?: string };

/**
 * A body plus a cover file, as multipart. Every scalar is stringified: a
 * FormData part is text on the wire, and Laravel reads "1"/"0" as booleans and
 * numeric strings as integers, so the validation rules still hold.
 */
const coverForm = (
  body: EventStoreBody | EventUpdateBody,
  coverImage: CoverImageFile,
) => {
  const form = new FormData();
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined || value === null) continue;
    form.append(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
  }
  form.append("cover_image", {
    uri: coverImage.uri,
    name: coverImage.name ?? "cover.jpg",
    type: coverImage.type ?? "image/jpeg",
  } as any);
  return form;
};

export const eventsApi = {
  index: () => auth<Event[]>({ method: "GET", url: "/events" }),

  /**
   * Create an event. When `coverImage` is given, the request goes out as
   * multipart/form-data with the raw image as a `cover_image` file part — the
   * backend uploads it to R2 and returns the hosted `cover_image_url` on the
   * created event. Without it, a plain JSON body is sent.
   */
  store: (body: EventStoreBody, coverImage?: CoverImageFile) => {
    if (!coverImage) {
      return auth<Event>({ method: "POST", url: "/events", data: body });
    }
    return auth<Event>({
      method: "POST",
      url: "/events",
      data: coverForm(body, coverImage),
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  show: (eventId: number | string) =>
    auth<EventDetail>({ method: "GET", url: `/events/${eventId}` }),

  /**
   * `coverImage` replaces the event's cover. It forces the request to go out as
   * multipart, and multipart only parses on POST — PHP populates neither
   * `$_POST` nor `$_FILES` for a PATCH body — so the method is spelled with
   * Laravel's `_method` override instead. Without a cover it stays a plain
   * JSON PATCH.
   */
  update: (
    eventId: number | string,
    body: EventUpdateBody,
    coverImage?: CoverImageFile,
  ) => {
    if (!coverImage) {
      return auth<Event>({
        method: "PATCH",
        url: `/events/${eventId}`,
        data: body,
      });
    }
    const form = coverForm(body, coverImage);
    form.append("_method", "PATCH");
    return auth<Event>({
      method: "POST",
      url: `/events/${eventId}`,
      data: form,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  destroy: (eventId: number | string) =>
    client.delete(`/events/${eventId}`).then(() => undefined),

  photos: (eventId: number | string) =>
    auth<{ photos: EventPhoto[] }>({
      method: "GET",
      url: `/events/${eventId}/photos`,
    }),
};

// ─── Checkout ─────────────────────────────────────────────────────────────────

export const checkoutApi = {
  create: (eventId: number | string) =>
    auth<{ status: string; invoiceUrl: string | null }>({
      method: "POST",
      url: `/events/${eventId}/checkout`,
    }),

  paymentStatus: (eventId: number | string) =>
    auth<{ payment: Payment | null }>({
      method: "GET",
      url: `/events/${eventId}/payment`,
    }),
};

// ─── Guest upload (QR token) ──────────────────────────────────────────────────

export const uploadApi = {
  /** Check if event is accepting uploads via QR token (no auth required) */
  show: (token: string) =>
    axios
      .get<UploadToken>(`${BASE_URL}/upload/${token}`, {
        headers: { Accept: "application/json" },
      })
      .then((r) => r.data),

  /**
   * Upload a photo as a guest (no auth — uses X-Guest-Token header).
   *
   * `guestName` is the credit shown under the photo in the event gallery. It
   * rides on every upload rather than only the first: the guest can fill their
   * name in after already sending a shot, and the server keeps the latest.
   */
  store: async (
    token: string,
    formData: FormData,
    guestToken?: string,
    guestName?: string,
  ) => {
    const url = `${BASE_URL}/upload/${token}`;
    const headers: Record<string, string> = {
      "Content-Type": "multipart/form-data",
      Accept: "application/json",
    };
    if (guestToken) headers["X-Guest-Token"] = guestToken;
    const name = guestName?.trim();
    if (name) formData.append("guest_name", name);
    return axios
      .post<{
        guest_token: string;
      }>(url, formData, { headers })
      .then((r) => r.data);
  },
};
