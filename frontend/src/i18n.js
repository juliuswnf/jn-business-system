import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import commonDE from './locales/de/common.json';
import commonEN from './locales/en/common.json';
import bookingDE from './locales/de/booking.json';
import bookingEN from './locales/en/booking.json';
import emailsDE from './locales/de/emails.json';
import emailsEN from './locales/en/emails.json';
import dashboardDE from './locales/de/dashboard.json';
import dashboardEN from './locales/en/dashboard.json';

const resources = {
  de: {
    common: commonDE,
    booking: bookingDE,
    emails: emailsDE,
    dashboard: dashboardDE,
  },
  en: {
    common: commonEN,
    booking: bookingEN,
    emails: emailsEN,
    dashboard: dashboardEN,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'booking', 'emails', 'dashboard'],

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
