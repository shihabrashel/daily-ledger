import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import bn from './locales/bn.json';

const i18n = createInstance();
void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, bn: { translation: bn } },
  lng: 'en', fallbackLng: 'en', interpolation: { escapeValue: false },
});
export default i18n;
