import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'de',
        load: 'languageOnly', // Only load 'de', 'en', etc., not 'de-DE'
        debug: import.meta.env.DEV,

        backend: {
            loadPath: import.meta.env.BASE_URL + 'locales/{{lng}}/{{ns}}.json',
        },

        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },

        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
    });

export default i18n;
