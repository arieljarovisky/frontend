import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';

const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
    // Recargar la página para aplicar todos los cambios de idioma
    window.location.reload();
  };

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-background-secondary transition-colors border border-border/50"
        aria-label="Select language"
        title={currentLanguage.nativeName}
      >
        <span className="text-2xl leading-none" role="img" aria-label={currentLanguage.nativeName}>
          {currentLanguage.flag}
        </span>
        <Globe className="w-4 h-4 text-foreground-muted" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-background-secondary border border-border rounded-lg shadow-xl z-50 overflow-hidden backdrop-blur-sm">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
              Idioma / Language
            </p>
          </div>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-background transition-colors ${
                i18n.language === lang.code ? 'bg-background border-l-2 border-primary' : ''
              }`}
            >
              <span className="text-2xl leading-none" role="img" aria-label={lang.nativeName}>
                {lang.flag}
              </span>
              <div className="flex-1">
                <span className="text-sm font-medium text-foreground block">{lang.nativeName}</span>
                <span className="text-xs text-foreground-muted">{lang.name}</span>
              </div>
              {i18n.language === lang.code && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

