import { Types } from "./types";
import notificationsActions from "../notifications/actions";
import { authStore } from ".";
import { notificationsStore } from "../notifications";
import * as AppleAuthentication from "expo-apple-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi } from "../../services/api";
import { StorageHelper } from "../../utils";

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

  googleSignIn: async () => {
    const notifications = notificationsStore.getState();
    const { notificationsShow } = notificationsActions(notifications.dispatch);

    dispatch({ type: Types.AUTH_LOGIN_REQUEST });

    try {
      const { GoogleSignin } = require("@react-native-google-signin/google-signin");
      const authConfig = require("../../config/auth.js").authConfig;

      GoogleSignin.configure({
        webClientId: authConfig.google.webClientId,
        iosClientId: authConfig.google.iosClientId,
        offlineAccess: true,
        forceCodeForRefreshToken: true,
      });

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      if (userInfo?.data?.idToken) {
        const data = await authApi.googleLogin({
          id_token: userInfo.data.idToken,
          access_token: userInfo.data.accessToken,
        });

        if (data?.token) {
          await StorageHelper.saveAccessToken(data.token);
          dispatch({ type: Types.AUTH_LOGIN_FULFILLED, payload: data });
        } else {
          throw new Error("Invalid response from server");
        }
      } else {
        dispatch({ type: Types.AUTH_LOGIN_REJECTED, payload: "" });
      }
    } catch (error: any) {
      let errorMessage = "Google Sign-In failed";

      if (error.code === "SIGN_IN_CANCELLED") {
        errorMessage = "Sign-in was cancelled";
      } else if (error.code === "IN_PROGRESS") {
        errorMessage = "Sign-in is already in progress";
      } else if (error.code === "PLAY_SERVICES_NOT_AVAILABLE") {
        errorMessage = "Google Play Services not available";
      } else {
        errorMessage = error?.response?.data?.error || "Google Sign-In failed";
      }

      notificationsShow({
        message: errorMessage,
        title: "Google Sign-In Failed",
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

      if (credential) {
        const data = await authApi.appleLogin({
          identity_token: credential.identityToken ?? "",
          user_identifier: credential.user,
          full_name: credential.fullName,
          email: credential.email,
        });

        if (data?.token) {
          await StorageHelper.saveAccessToken(data.token);
          dispatch({ type: Types.AUTH_LOGIN_FULFILLED, payload: data });
        } else {
          throw new Error("Invalid response from server");
        }
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error || "Apple Sign-In failed";

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
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (e: any) {
      const errorData = e?.response?.data;
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
