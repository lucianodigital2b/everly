import { uploadApi } from "../../services/api";
import { queryClient } from "../../services/queryClient";
import { captureStore } from "./index";
import { t } from '../../i18n';

/**
 * Uploads a roll *while it is being shot*, instead of after.
 *
 * The old flow held every capture on the camera screen and only started
 * uploading once "Done" was tapped — so the user sat on a full-screen spinner
 * for as long as the whole roll took, having already finished the part they
 * cared about. Here each frame is queued the instant the shutter fires and
 * goes up in the background, so by the time "Done" is tapped the roll is
 * usually already on the server and the screen can just move on.
 *
 * Two things force the queue to be *serial* rather than parallel:
 *
 * - The upload route is the guest one, and the first response is what mints
 *   the `guest_token`. Firing shots concurrently would race that, and each
 *   one without the header would be credited to a *different* anonymous guest
 *   in the gallery.
 * - A phone uplink is the bottleneck anyway; parallel multipart POSTs of
 *   full-res JPEGs mostly just make all of them slower.
 */

type Session = {
  /** The event's `qr_code_token` — captured up front. */
  token: string;
  /** Credit shown under the photos; the host uploads through the guest route too. */
  name?: string;
  eventId: number;
};

let session: Session | null = null;
let guestToken: string | undefined;
let queue: string[] = [];
let draining = false;

/**
 * Starts a fresh roll. Called by the camera screen when it opens with an
 * upload target set, so a previous roll's `guest_token` can't leak into it.
 */
export function startUploadSession(next: Session) {
  session = next;
  guestToken = undefined;
  queue = [];
  captureStore.getState().resetUploads();
}

export function enqueueUpload(uri: string) {
  if (!session) return;
  captureStore.getState().addUpload(uri);
  queue.push(uri);
  void drain();
}

/** Re-queues everything that failed, keeping the same guest identity. */
export function retryFailedUploads() {
  const failed = captureStore
    .getState()
    .uploads.filter((u) => u.status === "failed");
  if (!failed.length || !session) return;
  for (const item of failed) {
    captureStore.getState().markUpload(item.uri, "pending");
    queue.push(item.uri);
  }
  void drain();
}

async function drain() {
  if (draining) return;
  draining = true;
  try {
    while (queue.length) {
      const uri = queue[0];
      const current = session;
      if (!current) {
        queue = [];
        break;
      }

      try {
        const form = new FormData();
        form.append("photo", {
          uri,
          name: `everly-${Date.now()}.jpg`,
          type: "image/jpeg",
        } as any);

        const res = await uploadApi.store(
          current.token,
          form,
          guestToken,
          current.name,
        );
        if (res?.guest_token) guestToken = res.guest_token;
        captureStore.getState().markUpload(uri, "done");

        // Invalidate per photo, not once at the end: the user is already
        // looking at the event, and this is what makes the shots appear there
        // one by one instead of all at once after a wait.
        void queryClient.invalidateQueries({
          queryKey: ["event-photos", String(current.eventId)],
        });
      } catch (e: any) {
        const reason =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          t('uploader.uploadFailed');
        console.warn("[uploader] photo upload failed", e?.response?.status, reason);
        captureStore.getState().markUpload(uri, "failed", reason);
      }

      queue.shift();
    }
  } finally {
    draining = false;
  }

  if (!queue.length && session) {
    void queryClient.invalidateQueries({
      queryKey: ["event", String(session.eventId)],
    });
    void queryClient.invalidateQueries({ queryKey: ["events"] });
  }
}
