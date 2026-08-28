import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { eventWindow, liveActivity } from "../services/liveActivity";
import type { Event } from "../services/api";

// setTimeout stores its delay in a 32-bit int, so anything past ~24.8 days
// fires immediately. Events can run for weeks, so a boundary further out than
// this is simply not scheduled — the next foreground or refetch picks it up,
// and iOS culls a Live Activity on its own long before then anyway.
const MAX_TIMEOUT = 24 * 60 * 60 * 1000;

/**
 * Keeps this event's Live Activity in step with the event itself.
 *
 * The card exists only while the event is running: it starts at the moment the
 * event opens, updates as photos come in, and is torn down the instant the
 * event closes. Everything is a no-op off iOS, or without a dev build.
 */
export const useEventLiveActivity = (
  event: Event | null | undefined,
  photoCount: number
) => {
  // Held in a ref so the activity can still be ended after the event object has
  // gone (navigating away, a refetch returning nothing).
  const startedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!event) return;

    const eventId = event.id;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const reconcile = () => {
      if (cancelled) return;
      const { live, endsAt } = eventWindow(event);

      if (live && endsAt !== null) {
        startedIdRef.current = String(eventId);
        void liveActivity.start({ event, endsAt, photoCount });
      } else if (startedIdRef.current) {
        startedIdRef.current = null;
        void liveActivity.end(eventId);
      }

      // Re-check at the next boundary — the end of the event, or (for one that
      // hasn't opened yet) whenever the window might have changed.
      const untilEnd = endsAt !== null ? endsAt - Date.now() : null;
      if (untilEnd !== null && untilEnd > 0 && untilEnd <= MAX_TIMEOUT) {
        timer = setTimeout(reconcile, untilEnd + 1000);
      }
    };

    reconcile();

    // Coming back from the background is the other moment the window may have
    // passed while nothing was running.
    const onAppState = (next: AppStateStatus) => {
      if (next === "active") reconcile();
    };
    const subscription = AppState.addEventListener("change", onAppState);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      subscription.remove();
    };
    // The card is left running on unmount by design — that's the whole point of
    // a Live Activity. It's ended by the boundary above, or by the next mount
    // seeing a closed event.
  }, [
    event?.id,
    event?.name,
    event?.status,
    event?.activated_at,
    event?.event_date,
    event?.expires_at,
    event?.qr_code_token,
    photoCount,
  ]);
};
