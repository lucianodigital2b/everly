import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager, NativeModules, Platform } from 'react-native';

import en from './locales/en.json';
import pt from './locales/pt.json';

export type AppLanguage = 'en' | 'pt';

// The device's preferred locale tag ("pt-BR", "en_US").
// expo-localization is required lazily: in a binary built before it was added
// the native module is missing and a top-level import throws, taking every
// screen down with it. Without it, fall back to what React Native exposes. On
// iOS that is AppleLanguages, not Intl: Intl is capped by the localizations the
// bundle declares and reads "en" on a Portuguese phone (see nameSuggestions.ts).
function deviceLocaleTag(): string {
  try {
    const Localization = require('expo-localization');
    const tag = Localization.getLocales()[0]?.languageTag;
    if (tag) return String(tag);
  } catch {
    // Native module not in this build.
  }

  try {
    if (Platform.OS === 'ios') {
      const manager: any = NativeModules.SettingsManager;
      const settings = manager?.settings ?? manager?.getConstants?.().settings;
      const preferred = settings?.AppleLanguages?.[0] ?? settings?.AppleLocale;
      if (preferred) return String(preferred);
    } else if (Platform.OS === 'android') {
      const tag = I18nManager.getConstants?.().localeIdentifier;
      if (tag) return String(tag);
    }
  } catch {
    // Fall through.
  }

  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || 'en';
  } catch {
    return 'en';
  }
}

// The device language, read once at startup. Portuguese (any region) gets pt-BR
// copy; everything else gets English.
function deviceLanguage(): AppLanguage {
  return deviceLocaleTag().toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

export const LANGUAGE: AppLanguage = deviceLanguage();
/** BCP 47 tag for dates and numbers (toLocaleDateString, Intl). */
export const LOCALE_TAG = LANGUAGE === 'pt' ? 'pt-BR' : 'en-US';

// Initialised synchronously at import, so modules that build copy at load time
// (the plan's task list, option labels) can call i18n.t() right after importing
// this file.
i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, pt: { translation: pt } },
  lng: LANGUAGE,
  fallbackLng: 'en',
  initAsync: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
  returnNull: false,
});

export const t = i18n.t.bind(i18n);
export default i18n;
