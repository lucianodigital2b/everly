import { create } from "zustand";

// Tiny buffer to hand captured photos from the camera screen back to whatever
// opened it (the guest upload flow), since expo-router can't pass arrays back.
interface CaptureState {
  photos: string[];
  setPhotos: (photos: string[]) => void;
  clear: () => void;
}

export const captureStore = create<CaptureState>((set) => ({
  photos: [],
  setPhotos: (photos) => set({ photos }),
  clear: () => set({ photos: [] }),
}));
