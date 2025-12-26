'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations, Language } from './translations';

type I18nContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Load saved language
  useEffect(() => {
    const saved = localStorage.getItem('bookme-language');
    if (saved === 'en' || saved === 'es') {
      setLanguageState(saved);
    } else {
      localStorage.setItem('bookme-language', 'en');
      setLanguageState('en');
    }
  }, []);

  // Save language
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('bookme-language', lang);
  };

  // Translation function (SAFE)
  const t = (key: string): string => {
    const dict = translations[language] as Record<string, any>;
    const value = key
      .split('.')
      .reduce((acc, part) => (acc ? acc[part] : undefined), dict);

    // Hide missing / raw keys like "client.subtitle"
    if (value === undefined || value === null) return '';
    if (typeof value === 'string' && value.trim() === key) return '';

    return String(value);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}