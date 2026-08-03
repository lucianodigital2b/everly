import axios, { AxiosRequestConfig } from "axios";
import * as StorageHelper from "../utils/StorageHelper";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Axios instance ───────────────────────────────────────────────────────────

// Trailing slashes are stripped: uploadApi builds `${BASE_URL}/upload/...`, and a
// double slash makes Laravel fail to match the route at all (404 before it ever
// looks the event up).
const BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  "https://4e82-2804-56c-a41f-7100-b08e-ef3c-f971-472e.ngrok-free.app/everly/public/api"
).replace(/\/+$/, "");

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Attach Bearer token to every request
client.interceptors.request.use(async (config) => {
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
    if (error.response?.status === 401) {
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

const auth = <T = any>(config: AxiosRequestConfig) => {
  console.log(client);
  return client.request<T>(config).then((r) => r.data);
};

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
  register: (body: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) =>
    auth<{ user: User; token: string }>({
      method: "POST",
      url: "/auth/register",
      data: body,
    }),

  login: (body: { email: string; password: string; device_name?: string }) =>
    auth<{ user: User; token: string }>({
      method: "POST",
      url: "/auth/login",
      data: body,
    }),

  logout: () =>
    auth<{ message: string }>({ method: "POST", url: "/auth/logout" }),

  /**
   * Sends a password-reset email. Returns 200 even for unknown addresses so the
   * endpoint can't be used to probe which emails have accounts.
   * NOTE: this route is not in BACKEND.md yet — the app is ready, the server
   * still has to implement POST /auth/forgot-password.
   */
  forgotPassword: (body: { email: string }) =>
    auth<{ message: string }>({
      method: "POST",
      url: "/auth/forgot-password",
      data: body,
    }),

  user: () => auth<User>({ method: "GET", url: "/auth/user" }),

  /**
   * Permanently deletes the account and its events. Required by App Store
   * guideline 5.1.1(v) — the server also revokes the Sign in with Apple grant
   * before deleting, using the refresh token from `authorization_code`.
   */
  deleteAccount: () =>
    auth<{ message: string }>({ method: "DELETE", url: "/auth/user" }),

  googleLogin: (body: { id_token: string; access_token?: string }) =>
    auth<{ user: User; token: string }>({
      method: "POST",
      url: "/auth/google/callback",
      data: body,
    }),

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
  shot_limit?: number;
  participant_limit?: number;
  reveal_time?: string;
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
    const form = new FormData();
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined && value !== null)
        form.append(key, String(value));
    }
    form.append("cover_image", {
      uri: coverImage.uri,
      name: coverImage.name ?? "cover.jpg",
      type: coverImage.type ?? "image/jpeg",
    } as any);
    return auth<Event>({
      method: "POST",
      url: "/events",
      data: form,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  show: (eventId: number | string) =>
    auth<EventDetail>({ method: "GET", url: `/events/${eventId}` }),

  update: (eventId: number | string, body: EventUpdateBody) =>
    auth<Event>({ method: "PATCH", url: `/events/${eventId}`, data: body }),

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

  /** Upload a photo as a guest (no auth — uses X-Guest-Token header) */
  store: async (token: string, formData: FormData, guestToken?: string) => {
    const headers: Record<string, string> = {
      "Content-Type": "multipart/form-data",
      Accept: "application/json",
    };
    if (guestToken) headers["X-Guest-Token"] = guestToken;
    return axios
      .post<{
        guest_token: string;
      }>(`${BASE_URL}/upload/${token}`, formData, { headers })
      .then((r) => r.data);
  },
};
