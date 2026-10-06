import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/i18n/translations';

const languages: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
];

interface LanguageSelectorProps {
  showLabel?: boolean;
}

export const LanguageSelector = React.forwardRef<HTMLDivElement, LanguageSelectorProps>(
  ({ showLabel = true }, ref) => {
    const [langMenuOpen, setLangMenuOpen] = React.useState(false);
    const { language, setLanguage } = useLanguage();

    const currentLang = languages.find((l) => l.code === language) || languages[0];

    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setLangMenuOpen(!langMenuOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
        >
          {showLabel && (
            <span className="text-sm font-medium">{currentLang.label}</span>
          )}
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>

        {langMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setLangMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-40 bg-card rounded-lg shadow-lg border border-border z-20 overflow-hidden">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setLangMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary transition-colors ${language === lang.code ? 'bg-secondary font-medium' : ''
                    }`}
                >
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }
);

LanguageSelector.displayName = 'LanguageSelector';
