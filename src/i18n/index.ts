import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { uz } from './locales/uz';
import { ru } from './locales/ru';

// Local storange dan o'qish (agar ilojisi bo'lsa)
const savedLanguage = localStorage.getItem('i18nextLng');
const initialLanguage = savedLanguage === 'ru' || savedLanguage === 'uz' ? savedLanguage : 'uz';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      uz,
      ru,
    },
    lng: initialLanguage, // Boshlang'ich til
    fallbackLng: 'uz',
    interpolation: {
      escapeValue: false, // React o'zi XSS himoyasiga ega
    },
  });

// Til o'zgarishini saqlash
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
  document.documentElement.lang = lng;
});

export default i18n;
