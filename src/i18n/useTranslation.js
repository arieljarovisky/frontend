// src/i18n/useTranslation.js
import { useLanguage } from '../context/LanguageContext';
import { useMemo } from 'react';
import esTranslations from './translations/es.json';
import enTranslations from './translations/en.json';

const translations = {
  es: esTranslations,
  en: enTranslations,
};

export function useTranslation() {
  const { language } = useLanguage();

  const t = useMemo(() => {
    return (key, params = {}) => {
      const keys = key.split('.');
      let value = translations[language];
      
      // Debug: solo en desarrollo
      if (import.meta.env.DEV && key === 'whatsapp.botPersonalization') {
        console.log('[i18n] Language:', language, 'Key:', key, 'Translations available:', Object.keys(translations[language] || {}));
      }

      // Navegar por las claves anidadas
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
  }, [language]);

  return { t, language };
}

