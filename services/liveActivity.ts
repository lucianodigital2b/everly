import { Platform } from "react-native";
import * as Linking from "expo-linking";
import NativeLiveActivity from "../modules/everly-live-activity";
import type { Event } from "./api";

// The Lock Screen / Dynamic Island card that runs alongside a live event.
//
// iOS only, and only in a dev/production build — the native module resolves to
// null in Expo Go, on Android and on web, so every call below degrades to a
// no-op there (same pattern as services/revenuecat.ts and services/appsflyer.ts).

const supported = Platform.OS === "ios" && !!NativeLiveActivity;

// ─── When an event is "live" ──────────────────────────────────────────────────

export type EventWindow = {
  /** The event has started and hasn't ended — the only state that shows a card. */
  live: boolean;
  /** Epoch ms the event closes, or null when the backend never set an end. */
  endsAt: number | null;
};

/**
 * An event is live between the moment it starts and `expires_at`.
 *
 * `activated_at` is when the plan was paid for / granted (BACKEND.md), which is
 * when the event actually opens for uploads. `event_date` is the date of the
 * occasion itself and is optional — when it's set and later, that's the real
 * start, so the card doesn't appear days before the party.
 */
export const eventWindow = (event: Pick<
  Event,
  "status" | "activated_at" | "event_date" | "expires_at"
> | null | undefined): EventWindow => {
  if (!event || event.status !== "active" || !event.activated_at) {
    return { live: false, endsAt: null };
  }

  const time = (value: string | null) => {
    if (!value) return null;
    const ms = new Date(value).getTime();
    return Number.isFinite(ms) ? ms : null;
  };

  const activated = time(event.activated_at);
  const scheduled = time(event.event_date);
  const endsAt = time(event.expires_at);
  if (activated === null || endsAt === null) return { live: false, endsAt };

  const startsAt = scheduled !== null ? Math.max(activated, scheduled) : activated;
  const now = Date.now();

  return { live: now >= startsAt && now < endsAt, endsAt };
};

// ─── Controls ─────────────────────────────────────────────────────────────────

/** True when this device can actually show one (iOS 16.2+, not switched off). */
export const isAvailable = () => {
  if (!supported) return false;
  try {
    return NativeLiveActivity!.isAvailable();
  } catch {
    return false;
  }
};

type StartArgs = {
  event: Pick<Event, "id" | "name" | "qr_code_token">;
  endsAt: number;
  photoCount: number;
};

/**
 * Start the card, or update the one already running for this event. Idempotent,
 * so it's safe to call on every data refresh.
 */
export const start = async ({ event, endsAt, photoCount }: StartArgs) => {
  if (!isAvailable()) return null;
  try {
    return await NativeLiveActivity!.start({
      eventId: String(event.id),
      eventName: event.name,
      endsAt,
      photoCount,
      // Built here rather than natively so the dev / preview / production
      // schemes resolve on their own (everly://, everly-dev://, …).
      eventURL: Linking.createURL(`/event/${event.id}`),
      captureURL: Linking.createURL(`/upload/${event.qr_code_token}`),
    });
  } catch (e) {
    console.warn("[LiveActivity] couldn't start", e);
    return null;
  }
};

export const end = async (eventId: number | string) => {
  if (!supported) return;
  try {
    await NativeLiveActivity!.end(String(eventId));
  } catch (e) {
    console.warn("[LiveActivity] couldn't end", e);
  }
};

export const endAll = async () => {
  if (!supported) return;
  try {
    await NativeLiveActivity!.endAll();
  } catch (e) {
    console.warn("[LiveActivity] couldn't end all", e);
  }
};

export const liveActivity = { isAvailable, start, end, endAll, eventWindow };
