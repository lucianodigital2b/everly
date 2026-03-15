import axios, { AxiosRequestConfig } from "axios";
import * as StorageHelper from "../utils/StorageHelper";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Axios instance ───────────────────────────────────────────────────────────

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://example.com/api";

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

// 401 → clear session
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(["auth-store"]);
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

export interface UploadToken {
  active: boolean;
  event: {
    name: string;
    title: string | null;
    cover_image_url: string | null;
    canUpload?: boolean;
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

  user: () => auth<User>({ method: "GET", url: "/auth/user" }),

  googleLogin: (body: { id_token: string; access_token?: string }) =>
    auth<{ user: User; token: string }>({
      method: "POST",
      url: "/auth/google/callback",
      data: body,
    }),

  appleLogin: (body: {
    identity_token: string;
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
};

export type EventUpdateBody = Partial<EventStoreBody & { public: boolean }>;

export const eventsApi = {
  index: () => auth<Event[]>({ method: "GET", url: "/events" }),

  store: (body: EventStoreBody) =>
    auth<Event>({ method: "POST", url: "/events", data: body }),

  show: (eventId: number | string) =>
    auth<EventDetail>({ method: "GET", url: `/events/${eventId}` }),

  update: (eventId: number | string, body: EventUpdateBody) =>
    auth<Event>({ method: "PATCH", url: `/events/${eventId}`, data: body }),

  destroy: (eventId: number | string) =>
    client.delete(`/events/${eventId}`).then(() => undefined),
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
  store: (token: string, formData: FormData, guestToken?: string) => {
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

// ─── Referral ─────────────────────────────────────────────────────────────────

export const referralApi = {
  redeem: (code: string) =>
    auth<{ success: boolean; reward: unknown }>({
      method: "POST",
      url: "/referrals/redeem",
      data: { code },
    }),
};

// ─── Unified export (replaces the mock `api` object) ─────────────────────────

export const api = {
  // kept for backward-compat with settings.tsx referral call
  redeemReferralCode: (code: string, _userId: string) =>
    referralApi.redeem(code),

  // events (backward-compat with index.tsx)
  getEvents: () => eventsApi.index(),
  createEvent: (data: EventStoreBody) => eventsApi.store(data),
  getEventDetails: (id: string) => eventsApi.show(id),
};
