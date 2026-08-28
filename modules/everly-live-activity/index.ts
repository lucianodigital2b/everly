import { requireOptionalNativeModule } from "expo";

export type EverlyActivityOptions = {
  /** Event id — identifies which running activity to update or end. */
  eventId: string;
  eventName: string;
  /** Epoch ms. Drives the live countdown and the activity's stale date. */
  endsAt: number;
  photoCount: number;
  /** Deep link opened by a tap on the card. */
  eventURL: string;
  /** Deep link opened by the camera button. */
  captureURL: string;
};

type EverlyLiveActivityModule = {
  isAvailable(): boolean;
  /** Start-or-update. Resolves to the activity id, or null if none is running. */
  start(options: EverlyActivityOptions): Promise<string | null>;
  end(eventId: string): Promise<void>;
  endAll(): Promise<void>;
};

// Optional: the native module only exists in a dev/production build on iOS, so
// Android, web and Expo Go all get `null` here instead of a throw.
export default requireOptionalNativeModule<EverlyLiveActivityModule>(
  "EverlyLiveActivity"
);
