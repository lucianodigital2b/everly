import { create } from "zustand";

/**
 * Where a roll of captures belongs once the camera hands it back.
 *
 * This lives in the store rather than in the screen that opened the camera:
 * the create wizard resets itself the moment the camera is pushed, and the tab
 * behind it is free to be torn down (a dev reload, a re-render at the router
 * root, an inactive-screen policy change). Anything holding the destination in
 * `useState` therefore loses it, and the photos come back with nowhere to go —
 * which reads as "the shots never reached the event".
 */
export interface CaptureTarget {
  eventId: number;
  /** The event's `qr_code_token` — the only upload route the API exposes. */
  token: string;
}

// Tiny buffer to hand captured photos from the camera screen back to whatever
// opened it (the create wizard, the guest upload flow), since expo-router can't
// pass arrays back.
/**
 * Progress for one frame of a roll being uploaded in the background as it's
 * shot. Driven by `./uploader`; read by the camera and the create wizard to
 * show how far along the roll is without ever blocking on it.
 */
export interface UploadItem {
  uri: string;
  status: "pending" | "done" | "failed";
  error?: string;
}

interface CaptureState {
  photos: string[];
  target: CaptureTarget | null;
  uploads: UploadItem[];
  setPhotos: (photos: string[]) => void;
  /** Set just before the camera is pushed; cleared once the roll is uploaded. */
  setTarget: (target: CaptureTarget | null) => void;
  addUpload: (uri: string) => void;
  markUpload: (
    uri: string,
    status: UploadItem["status"],
    error?: string,
  ) => void;
  resetUploads: () => void;
  clear: () => void;
}

export const captureStore = create<CaptureState>((set) => ({
  photos: [],
  target: null,
  uploads: [],
  setPhotos: (photos) => set({ photos }),
  setTarget: (target) => set({ target }),
  addUpload: (uri) =>
    set((s) => ({ uploads: [...s.uploads, { uri, status: "pending" }] })),
  markUpload: (uri, status, error) =>
    set((s) => ({
      uploads: s.uploads.map((u) =>
        u.uri === uri ? { ...u, status, error } : u,
      ),
    })),
  resetUploads: () => set({ uploads: [] }),
  // Photos and destination are one unit — dropping the photos while leaving a
  // target behind would let the next batch (a guest's, say) upload to it.
  // Upload progress is deliberately *not* cleared here: the wizard clears the
  // handoff the moment it navigates away, while the roll is often still going
  // up, and wiping it would erase the failures it needs to report.
  clear: () => set({ photos: [], target: null }),
}));
