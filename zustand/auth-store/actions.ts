import { Types } from "./types";
import notificationsActions from "../notifications/actions";
import { authStore } from ".";
import { notificationsStore } from "../notifications";
import * as AppleAuthentication from "expo-apple-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi } from "../../services/api";
import { appleAuth } from "../../services/appleAuth";
import { appsFlyerService } from "../../services/appsflyer";
import { StorageHelper } from "../../utils";

/**
 * A dismissed Apple sheet. Which code comes back depends on the iOS version and
 * how the sheet was closed — expo-apple-authentication surfaces
 * `ERR_REQUEST_CANCELED`, but the underlying ASAuthorizationError 1001 also
 * reaches us as `ERR_CANCELED` on some builds. Any of them mean "the user
 * changed their mind", and an error toast for that is just wrong.
 */
const isAppleCancel = (error: any) => {
  const code = String(error?.code ?? "");
  return (
    code === "ERR_REQUEST_CANCELED" ||
    code === "ERR_CANCELED" ||
    code === "1001" ||
    /cancel/i.test(String(error?.message ?? ""))
  );
};

const actions = (dispatch: any) => ({
  changeFields: (payload: { key: "email" | "password"; value: string }) => {
    dispatch({ type: Types.AUTH_CHANGE_FIELDS, payload });
  },

  changeRegisterFields: (payload: {
    key: "name" | "email" | "password" | "password_confirmation";
    value: string;
  }) => {
    dispatch({ type: Types.AUTH_CHANGE_REGISTER_FIELDS, payload });
  },

  login: async () => {
    const { fields } = authStore.getState();
    const notifications = notificationsStore.getState();
    const { notificationsShow } = notificationsActions(notifications.dispatch);

    dispatch({ type: Types.AUTH_LOGIN_REQUEST });

    try {
      const data = await authApi.login({
        email: fields.email,
        password: fields.password,
      });

      if (data?.token) {
        await StorageHelper.saveAccessToken(data.token);
        dispatch({ type: Types.AUTH_LOGIN_FULFILLED, payload: data });
        appsFlyerService.setUserId(data.user?.id);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (e: any) {
      const errorData = e?.response?.data;
      const errorMessage =
        errorData?.error ||
        errorData?.message ||
        "Invalid credentials or server error";

      if (errorData?.errors) {
        dispatch({ type: Types.AUTH_SET_ERRORS, payload: errorData.errors });
      }

      notificationsShow({
        message: errorMessage,
        title: "Login Failed",
        type: "error",
      });

      dispatch({ type: Types.AUTH_LOGIN_REJECTED, payload: errorMessage });
    }
  },

  appleSignIn: async () => {
    const notifications = notificationsStore.getState();
    const { notificationsShow } = notificationsActions(notifications.dispatch);

    dispatch({ type: Types.AUTH_LOGIN_REQUEST });

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential?.identityToken) {
        throw new Error("Apple did not return an identity token");
      }

      // Name/email only ever arrive on the first authorization — mergeProfile
      // caches them so a failed attempt doesn't lose them for good.
      const profile = await appleAuth.mergeProfile(credential);

      const data = await authApi.appleLogin({
        identity_token: credential.identityToken,
        authorization_code: credential.authorizationCode ?? null,
        user_identifier: credential.user,
        full_name: profile.fullName,
        email: profile.email,
      });

      if (!data?.token) {
        throw new Error("Invalid response from server");
      }

      // Both of these run before the store flips to signed-in: the moment
      // AUTH_LOGIN_FULFILLED lands, the welcome screen navigates away, and the
      // token has to already be on disk for the request interceptor to find.
      await StorageHelper.saveAccessToken(data.token);
      await appleAuth.rememberSession(credential.user);

      dispatch({ type: Types.AUTH_LOGIN_FULFILLED, payload: data });
      appsFlyerService.setUserId(data.user?.id);
    } catch (error: any) {
      // Dismissing the Apple sheet is not a failure — reset quietly, no toast.
      if (isAppleCancel(error)) {
        dispatch({ type: Types.AUTH_LOGIN_REJECTED, payload: "" });
        return;
      }

      // Order matters. A server answer is the most specific thing we have; below
      // that, an error with no `response` never reached the backend at all, and
      // its own message (a dead/unset API URL, a refused connection) says far
      // more than "Apple Sign-In failed" — which is what every misconfigured
      // build used to report.
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        (error?.message === "Network Error"
          ? "Couldn't reach Everly. Check your connection and try again."
          : error?.message || "Apple Sign-In failed");

      notificationsShow({
        message: errorMessage,
        title: "Apple Sign-In Failed",
        type: "error",
      });

      dispatch({ type: Types.AUTH_LOGIN_REJECTED, payload: errorMessage });
    }
  },

  register: async () => {
    const { registerFields } = authStore.getState();
    const notifications = notificationsStore.getState();
    const { notificationsShow } = notificationsActions(notifications.dispatch);

    dispatch({ type: Types.AUTH_REGISTER_REQUEST });

    try {
      const data = await authApi.register(registerFields);

      if (data?.token) {
        await StorageHelper.saveAccessToken(data.token);
        dispatch({ type: Types.AUTH_REGISTER_FULFILLED, payload: data });
        appsFlyerService.setUserId(data.user?.id);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (e: any) {
      const errorData = e?.response?.data;

      console.log(errorData);

      const errorMessage =
        errorData?.error ||
        errorData?.message ||
        "Registration failed or server error";

      if (errorData?.errors) {
        dispatch({ type: Types.AUTH_SET_ERRORS, payload: errorData.errors });
      }

      notificationsShow({
        message: errorMessage,
        title: "Registration Failed",
        type: "error",
      });

      dispatch({ type: Types.AUTH_REGISTER_REJECTED, payload: errorMessage });
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // best-effort — clear local state regardless
    } finally {
      await StorageHelper.removeItem("token");
      await AsyncStorage.removeItem("auth-store");
      await appleAuth.forgetSession();
      dispatch({ type: Types.AUTH_LOGOUT });
    }
  },

  reset: async () => {
    await AsyncStorage.removeItem("auth-store");
    dispatch({ type: "RESET_STATE" });
  },

  clearErrors: () => {
    dispatch({ type: Types.AUTH_CLEAR_ERRORS });
  },

  setErrors: (errors: Record<string, string[]>) => {
    dispatch({ type: Types.AUTH_SET_ERRORS, payload: errors });
  },

  updateUser: (userData: any) => {
    dispatch({ type: Types.AUTH_UPDATE_USER, payload: userData });
  },
});

export default actions;
