// src/i18n/useTranslation.js
import { useLanguage } from '../context/LanguageContext';
import esTranslations from './translations/es.json';
import enTranslations from './translations/en.json';

const translations = {
  es: esTranslations,
  en: enTranslations,
};

export function useTranslation() {
  const { language } = useLanguage();

  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        // Si no encuentra la traducción, intentar con español como fallback
        if (language !== 'es') {
          value = translations.es;
          for (const k2 of keys) {
            if (value && typeof value === 'object') {
              value = value[k2];
            } else {
              return key; // Devolver la clave si no encuentra traducción
            }
          }
        } else {
          return key; // Devolver la clave si no encuentra traducción
        }
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Reemplazar parámetros {name}, {count}, etc.
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? params[paramKey] : match;
    });
  };

  return { t, language };
}

