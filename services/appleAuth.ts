import * as AppleAuthentication from "expo-apple-authentication";

import * as StorageHelper from "../utils/StorageHelper";

export type AppleProfile = {
  fullName: { givenName?: string | null; familyName?: string | null } | null;
  email: string | null;
};

const PROFILE_KEY = (userIdentifier: string) => `apple-profile:${userIdentifier}`;
const USER_ID_KEY = "apple-user-id";

const readJSON = async <T>(key: string): Promise<T | null> => {
  try {
    const raw = await StorageHelper.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    // A corrupt entry is never worth failing a sign-in over.
    return null;
  }
};

/** A name object is only worth keeping if it actually carries a name. */
const nameOrNull = (
  name: AppleAuthentication.AppleAuthenticationFullName | null | undefined
): AppleProfile["fullName"] =>
  name && (name.givenName || name.familyName)
    ? { givenName: name.givenName, familyName: name.familyName }
    : null;

/**
 * Local state that Sign in with Apple needs but neither Apple nor our backend
 * will hand back a second time.
 */
export const appleAuth = {
  /**
   * Apple returns the name and email only on a user's *first* authorization;
   * every later sign-in sends nulls. If that first round-trip dies before the
   * backend stores it (offline, 500, app killed), the data is gone for good —
   * short of the user revoking the app in iOS Settings. So the first values seen
   * are stashed and replayed on every retry until a login actually succeeds.
   *
   * Returns what should be sent to the backend for this attempt.
   */
  mergeProfile: async (
    credential: AppleAuthentication.AppleAuthenticationCredential
  ): Promise<AppleProfile> => {
    const stored = await readJSON<AppleProfile>(PROFILE_KEY(credential.user));

    const merged: AppleProfile = {
      // On repeat sign-ins Apple hands back a *populated object with null
      // fields*, not null — `{ givenName: null, familyName: null, … }`. Left
      // as-is it is truthy, so it would get cached as if it were a real name and
      // then replayed forever, permanently shadowing the one good value.
      fullName: nameOrNull(credential.fullName) ?? stored?.fullName ?? null,
      email: credential.email ?? stored?.email ?? null,
    };

    if (merged.fullName || merged.email) {
      try {
        await StorageHelper.setItem(PROFILE_KEY(credential.user), merged);
      } catch {
        // Best effort — the merged value still gets used for this attempt.
      }
    }

    return merged;
  },

  /**
   * Called once the session exists. Drops the replay cache and records the Apple
   * user identifier, which is what `getCredentialStateAsync` needs later to tell
   * whether the credential has since been revoked — the API `User` doesn't carry
   * an `apple_id`, so it has to live on the device.
   */
  rememberSession: async (userIdentifier: string) => {
    try {
      await StorageHelper.removeItem(PROFILE_KEY(userIdentifier));
      await StorageHelper.setItem(USER_ID_KEY, userIdentifier);
    } catch {
      // Non-fatal: the user is signed in either way.
    }
  },

  /** The Apple user identifier of the current session, if it came from Apple. */
  getUserIdentifier: () => readJSON<string>(USER_ID_KEY),

  /** Cleared on logout so a later email session isn't watched as Apple's. */
  forgetSession: async () => {
    try {
      await StorageHelper.removeItem(USER_ID_KEY);
    } catch {
      // Nothing to recover from.
    }
  },
};
