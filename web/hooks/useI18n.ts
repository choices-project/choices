/**
 * useI18n Hook
 * 
 * React hook for internationalization functionality
 * Provides translation functions and language management
 * 
 * Created: January 23, 2025
 * Status: ✅ ACTIVE
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  t as i18nT, 
  setLanguage, 
  getCurrentLanguage, 
  getTranslations,
  isLanguageSupported,
  getLanguageDisplayName,
  formatNumber,
  formatDate,
  formatCurrency,
  type SupportedLanguage 
} from '@/lib/i18n';

export interface UseI18nReturn {
  // Translation function
  t: (key: string, params?: Record<string, string | number>) => string;
  
  // Language management
  currentLanguage: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => Promise<void>;
  isLanguageSupported: (language: string) => language is SupportedLanguage;
  getLanguageDisplayName: (language: SupportedLanguage) => string;
  
  // Formatting functions
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatCurrency: (value: number, currency?: string, options?: Intl.NumberFormatOptions) => string;
  
  // State
  isLoading: boolean;
  error: string | null;
  translations: Record<SupportedLanguage, any>;
}

export function useI18n(): UseI18nReturn {
  const [currentLanguage, setCurrentLanguageState] = useState<SupportedLanguage>(getCurrentLanguage());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<SupportedLanguage, any>>(getTranslations());

  // Translation function with error handling
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    try {
      return i18nT(key, params);
    } catch (err) {
      console.warn(`Translation error for key "${key}":`, err);
      return key;
    }
  }, []);

  // Language change handler
  const handleSetLanguage = useCallback(async (language: SupportedLanguage) => {
    if (!isLanguageSupported(language)) {
      setError(`Unsupported language: ${language}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await setLanguage(language);
      setCurrentLanguageState(language);
      setTranslations(getTranslations());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change language';
      setError(errorMessage);
      console.error('Language change failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize i18n on mount
  useEffect(() => {
    const initializeI18n = async () => {
      setIsLoading(true);
      try {
        // Get language from localStorage or browser preference
        const savedLanguage = localStorage.getItem('choices-language');
        const browserLanguage = navigator.language.split('-')[0] as SupportedLanguage;
        const targetLanguage = savedLanguage && isLanguageSupported(savedLanguage) 
          ? savedLanguage
          : isLanguageSupported(browserLanguage) 
            ? browserLanguage 
            : 'en';

        await handleSetLanguage(targetLanguage);
      } catch (err) {
        console.error('Failed to initialize i18n:', err);
        setError('Failed to initialize internationalization');
      } finally {
        setIsLoading(false);
      }
    };

    initializeI18n();
  }, [handleSetLanguage]);

  // Save language preference
  useEffect(() => {
    if (currentLanguage) {
      localStorage.setItem('choices-language', currentLanguage);
    }
  }, [currentLanguage]);

  return {
    t,
    currentLanguage,
    setLanguage: handleSetLanguage,
    isLanguageSupported,
    getLanguageDisplayName,
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => {
      try {
        return formatNumber(value, options);
      } catch (err) {
        console.warn('Number formatting failed:', err);
        return String(value);
      }
    },
    formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => {
      try {
        return formatDate(date, options);
      } catch (err) {
        console.warn('Date formatting failed:', err);
        return date.toLocaleDateString();
      }
    },
    formatCurrency: (value: number, currency = 'USD', options?: Intl.NumberFormatOptions) => {
      try {
        return formatCurrency(value, currency, options);
      } catch (err) {
        console.warn('Currency formatting failed:', err);
        return `${currency} ${value}`;
      }
    },
    isLoading,
    error,
    translations
  };
}

// Export individual functions for direct use
export { 
  t, 
  setLanguage, 
  getCurrentLanguage, 
  getTranslations,
  isLanguageSupported,
  getLanguageDisplayName,
  formatNumber,
  formatDate,
  formatCurrency 
} from '@/lib/i18n';
