import { Types } from './types';
import { unstable_batchedUpdates } from 'react-native' // or 'react-native'
import notificationsActions from '../notifications/actions';
import { authStore } from '.';
import apis from '../../apis/index';
import { notificationsStore } from '../notifications';
import Api from '../../apis/index';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { StorageHelper } from '../../utils';

const actions = (dispatch: any) => ({

  changeFields: (payload: { key: 'email' | 'password', value: string }) => {
    dispatch({ type: Types.AUTH_CHANGE_FIELDS, payload })
  },
  changeRegisterFields: (payload: { key: 'name' | 'email' | 'password' | 'password_confirmation', value: string }) => {
    dispatch({ type: Types.AUTH_CHANGE_REGISTER_FIELDS, payload })
  },
  login: async () => {
    const { fields } = authStore.getState();
    const notifications = notificationsStore.getState();
    const { notificationsShow } = notificationsActions(notifications.dispatch);

    dispatch({ type: Types.AUTH_LOGIN_REQUEST });

    try {
      const { data } = await Api.auth.login(fields);
      
      console.log(data);

      if (data?.token) {
        await StorageHelper.saveAccessToken(data.token);
        dispatch({ type: Types.AUTH_LOGIN_FULFILLED, payload: data });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (e) {
      console.log(e);
      
      const errorData = e?.response?.data;
      const errorMessage = errorData?.error || errorData?.message || 'Invalid credentials or server error';
      
      // Handle Laravel validation errors (error bag)
      if (errorData?.errors) {
        dispatch({ type: Types.AUTH_SET_ERRORS, payload: errorData.errors });
      }
      
      // Show error notification
      notificationsShow({
        message: errorMessage,
        title: 'Login Failed',
        type: 'error'
      });
      
      dispatch({ type: Types.AUTH_LOGIN_REJECTED, payload: errorMessage });
    }
  },

  // Google Sign-In
  googleSignIn: async () => {
    const notifications = notificationsStore.getState();
    const { notificationsShow } = notificationsActions(notifications.dispatch);
    
    dispatch({ type: Types.AUTH_LOGIN_REQUEST });
    
    try {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      
      // Import config
      const authConfig = require('../../config/auth.js').authConfig;
      
      
      // Configure Google Sign-In
      GoogleSignin.configure({
        webClientId: authConfig.google.webClientId, // From Google Cloud Console
        iosClientId: authConfig.google.iosClientId,
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
      });
      
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices();
      
      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      
      // console.log('Google userInfo:', userInfo);
      
      if (userInfo?.data?.idToken) {
        // Send the ID token to your Laravel backend
        const { data } = await Api.auth.googleLogin({
          id_token: userInfo.data.idToken,
          access_token: userInfo.data.accessToken,
        });
        
        console.log(data);
        
        if (data?.token) {
          await StorageHelper.saveAccessToken(data.token);
          dispatch({ type: Types.AUTH_LOGIN_FULFILLED, payload: data });
        } else {
          throw new Error('Invalid response from server');
        }
      }else {
        dispatch({ type: Types.AUTH_LOGIN_REJECTED, payload: '' });

      }
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      
      let errorMessage = 'Google Sign-In failed';
      
      if (error.code === 'SIGN_IN_CANCELLED') {
        errorMessage = 'Sign-in was cancelled';
      } else if (error.code === 'IN_PROGRESS') {
        errorMessage = 'Sign-in is already in progress';
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        errorMessage = 'Google Play Services not available';
      } else {
        errorMessage = error?.response?.data?.error || 'Google Sign-In failed';
      }
      
      // Show error notification
      notificationsShow({
        message: errorMessage,
        title: 'Google Sign-In Failed',
        type: 'error'
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
        // Send the credential to your Laravel backend
        const { data } = await Api.auth.appleLogin(credential);
        console.log(data);
        
        if (data?.token) {
          await StorageHelper.saveAccessToken(data.token);
          dispatch({ type: Types.AUTH_LOGIN_FULFILLED, payload: data });
        } else {
          throw new Error('Invalid response from server');
        }
      }
    } catch (error) {
      console.error('Apple Sign-In failed:', error);
      
      const errorMessage = error?.response?.data?.error || 'Apple Sign-In failed';
      
      // Show error notification
      notificationsShow({
        message: errorMessage,
        title: 'Apple Sign-In Failed',
        type: 'error'
      });
      
      dispatch({ type: Types.AUTH_LOGIN_REJECTED, payload: errorMessage });
    }
  },

  register: async () => {
    const { registerFields } = authStore.getState();
    const notifications = notificationsStore.getState();
    const { notificationsShow } = notificationsActions(notifications.dispatch);

    dispatch({ type: Types.AUTH_REGISTER_REQUEST });
    console.log(registerFields);

    try {
      const { data } = await Api.auth.signup(registerFields);
      
      console.log('data', data);
      
      if (data?.token) {
        await StorageHelper.saveAccessToken(data.token);
        dispatch({ type: Types.AUTH_REGISTER_FULFILLED, payload: data });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (e) {
      console.log(e.response.data);
      
      const errorData = e?.response?.data;
      const errorMessage = errorData?.error || errorData?.message || 'Registration failed or server error';
      
      // Handle Laravel validation errors (error bag)
      if (errorData?.errors) {
        dispatch({ type: Types.AUTH_SET_ERRORS, payload: errorData.errors });
      }
      
      // Show error notification
      notificationsShow({
        message: errorMessage,
        title: 'Registration Failed',
        type: 'error'
      });
      
      dispatch({ type: Types.AUTH_REGISTER_REJECTED, payload: errorMessage });
    }
  },

  reset: async () => {
    // Clear AsyncStorage for this store
    await AsyncStorage.removeItem('auth-store');
    // Reset to initial state
    dispatch({ type: 'RESET_STATE' });
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

  logout: async () => {
    try {
      // Clear the stored token
      await StorageHelper.removeItem('token');
      // Clear the persisted auth store
      await AsyncStorage.removeItem('auth-store');
      // Reset the auth state
      dispatch({ type: Types.AUTH_LOGOUT });
    } catch (error) {
      console.error('Error during logout:', error);
      // Still reset the state even if token removal fails
      dispatch({ type: Types.AUTH_LOGOUT });
    }
  }
})

export default actions;