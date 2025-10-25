/**
 * Internationalization (i18n) System
 * 
 * Multi-language support for the Choices platform
 * Supports 10 languages with dynamic translation loading
 * 
 * Created: January 23, 2025
 * Status: ✅ ACTIVE
 */

import { LANGUAGE_OPTIONS } from '@/features/profile/utils/profile-constants';

export type SupportedLanguage = typeof LANGUAGE_OPTIONS[number]['code'];

export interface Translation {
  [key: string]: string | Translation;
}

export interface I18nConfig {
  defaultLanguage: SupportedLanguage;
  fallbackLanguage: SupportedLanguage;
  supportedLanguages: SupportedLanguage[];
  namespace: string;
}

export interface I18nState {
  currentLanguage: SupportedLanguage;
  translations: Record<SupportedLanguage, Translation>;
  isLoading: boolean;
  error: string | null;
}

// Default configuration
export const I18N_CONFIG: I18nConfig = {
  defaultLanguage: 'en',
  fallbackLanguage: 'en',
  supportedLanguages: LANGUAGE_OPTIONS.map(lang => lang.code),
  namespace: 'common'
};

// Translation cache
const translationCache = new Map<string, Translation>();

// Current language state
let currentLanguage: SupportedLanguage = 'en';
const translations: Record<SupportedLanguage, Translation> = {} as any;

/**
 * Load translations for a specific language
 */
export async function loadTranslations(language: SupportedLanguage): Promise<Translation> {
  const cacheKey = `${I18N_CONFIG.namespace}-${language}`;
  
  // Check cache first
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    // Dynamic import of translation files
    const translationModule = await import(`./locales/${language}.json`);
    const translation = translationModule.default || translationModule;
    
    // Cache the translation
    translationCache.set(cacheKey, translation);
    
    return translation;
  } catch (error) {
    console.warn(`Failed to load translations for ${language}:`, error);
    
    // Fallback to English if available
    if (language !== I18N_CONFIG.fallbackLanguage) {
      return loadTranslations(I18N_CONFIG.fallbackLanguage);
    }
    
    // Return empty translation as last resort
    return {};
  }
}

/**
 * Get translation for a key
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const translation = getTranslation(key, currentLanguage);
  
  if (!translation) {
    console.warn(`Translation missing for key: ${key}`);
    return key;
  }
  
  // Replace parameters in translation
  if (params) {
    return Object.entries(params).reduce((str, [param, value]) => {
      return str.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
    }, translation);
  }
  
  return translation;
}

/**
 * Get translation for a specific language
 */
export function getTranslation(key: string, language: SupportedLanguage): string {
  const translation = translations[language];
  if (!translation) {
    return key;
  }
  
  const keys = key.split('.');
  let value: any = translation;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key;
    }
  }
  
  return typeof value === 'string' ? value : key;
}

/**
 * Set current language
 */
export async function setLanguage(language: SupportedLanguage): Promise<void> {
  if (!I18N_CONFIG.supportedLanguages.includes(language)) {
    console.warn(`Unsupported language: ${language}`);
    return;
  }
  
  currentLanguage = language;
  
  // Load translations if not already loaded
  if (!translations[language]) {
    translations[language] = await loadTranslations(language);
  }
  
  // Update document language
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language;
  }
}

/**
 * Get current language
 */
export function getCurrentLanguage(): SupportedLanguage {
  return currentLanguage;
}

/**
 * Get all loaded translations
 */
export function getTranslations(): Record<SupportedLanguage, Translation> {
  return translations;
}

/**
 * Check if language is supported
 */
export function isLanguageSupported(language: string): language is SupportedLanguage {
  return I18N_CONFIG.supportedLanguages.includes(language as SupportedLanguage);
}

/**
 * Get language display name
 */
export function getLanguageDisplayName(language: SupportedLanguage): string {
  const langOption = LANGUAGE_OPTIONS.find(lang => lang.code === language);
  return langOption?.native || (langOption as any)?.name || language;
}

/**
 * Initialize i18n system
 */
export async function initializeI18n(language?: SupportedLanguage): Promise<void> {
  const targetLanguage = language || I18N_CONFIG.defaultLanguage;
  
  try {
    await setLanguage(targetLanguage);
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
    // Fallback to default language
    await setLanguage(I18N_CONFIG.defaultLanguage);
  }
}

/**
 * Format number according to locale
 */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  try {
    return new Intl.NumberFormat(currentLanguage, options).format(value);
  } catch (error) {
    console.warn('Number formatting failed:', error);
    return String(value);
  }
}

/**
 * Format date according to locale
 */
export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(currentLanguage, options).format(date);
  } catch (error) {
    console.warn('Date formatting failed:', error);
    return date.toLocaleDateString();
  }
}

/**
 * Format currency according to locale
 */
export function formatCurrency(value: number, currency = 'USD', options?: Intl.NumberFormatOptions): string {
  try {
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency,
      ...options
    }).format(value);
  } catch (error) {
    console.warn('Currency formatting failed:', error);
    return `${currency} ${value}`;
  }
}

// Export default instance
export default {
  t,
  setLanguage,
  getCurrentLanguage,
  getTranslations,
  isLanguageSupported,
  getLanguageDisplayName,
  initializeI18n,
  formatNumber,
  formatDate,
  formatCurrency
};
