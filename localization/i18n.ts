import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import ptBR from './pt-br';
import es from './es';

const resources = { // list of languages
 en,
 ptBR,
 es,
};
i18n.use(initReactI18next) // passes i18n down to react-i18next
 .init({
  compatibilityJSON: 'v4', //To make it work for Android devices, add this line.
  resources,
  lng: 'en', // default language to use.
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common', 'home', 'auth', 'onboarding', 'notifications', 'language'],
  // if you're using a language detector, do not define the lng option
  interpolation: {
   escapeValue: false,
  },
  debug: true,
 });
export default i18n;