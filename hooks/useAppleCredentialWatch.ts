import { useEffect } from "react";
import { Platform } from "react-native";
import { router } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";

import { appleAuth } from "../services/appleAuth";
import { authStore } from "../zustand/auth-store";
import actions from "../zustand/auth-store/actions";

/**
 * Keeps the session honest with iOS. A user can sever the link at any time from
 * Settings → Apple ID → Sign in with Apple → Everly → Stop Using Apple ID, and
 * Apple expects the app to notice — leaving someone signed in on a credential
 * they just revoked is exactly what App Review checks for.
 *
 * Two triggers, because neither covers the other:
 *  - `addRevokeListener` fires while the app is running.
 *  - `getCredentialStateAsync` catches a revocation that happened while the app
 *    was closed, checked once on mount.
 *
 * Both end the same way: sign out locally and return to welcome. iOS-only, and
 * inert unless the current session actually came from Apple.
 */
export function useAppleCredentialWatch() {
  useEffect(() => {
    if (Platform.OS !== "ios") return;

    let cancelled = false;

    const signOut = async () => {
      if (cancelled) return;
      const { logout } = actions(authStore.getState().dispatch);
      await logout();
      // Root index re-reads the cleared token and routes to welcome; see the
      // same handoff in settings' sign-out.
      router.replace("/");
    };

    (async () => {
      const appleUserId = await appleAuth.getUserIdentifier();
      if (cancelled || !appleUserId) return;

      try {
        const state = await AppleAuthentication.getCredentialStateAsync(
          appleUserId
        );
        if (
          state ===
          AppleAuthentication.AppleAuthenticationCredentialState.REVOKED
        ) {
          await signOut();
        }
      } catch {
        // NOT_FOUND or a transient read error: leave the session alone rather
        // than signing someone out on a bad answer.
      }
    })();

    // Gated on the stored Apple identifier as well as the token: the listener
    // fires for the app's Apple grant regardless of how the current session was
    // created, and signing an email user out of their own account because
    // someone revoked an unrelated Apple link is not the intent.
    const subscription = AppleAuthentication.addRevokeListener(async () => {
      if (!authStore.getState().data?.token) return;
      if (!(await appleAuth.getUserIdentifier())) return;
      signOut();
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);
}
