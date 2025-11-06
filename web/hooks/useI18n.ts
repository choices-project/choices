/**
 * Internationalization Hook (Stub Implementation)
 * 
 * Provides a minimal i18n interface for future internationalization support.
 * Currently returns keys as-is with simple parameter substitution.
 * 
 * @remarks
 * This is a stub implementation to support i18n-ready code patterns.
 * Full internationalization can be added by integrating a library like
 * next-i18next or react-intl and implementing the translation logic.
 * 
 * @example
 * ```typescript
 * const { t, changeLanguage, currentLanguage } = useI18n();
 * 
 * // Simple translation
 * const greeting = t('hello.world');
 * 
 * // Translation with parameters
 * const welcome = t('welcome.user', { name: 'Alice' });
 * ```
 */

export type I18nConfig = {
  locale: string;
  fallbackLocale: string;
  translations: Record<string, Record<string, string>>;
}

/**
 * Internationalization hook for translation and locale management
 * 
 * @returns Translation utilities and locale information
 */
export const useI18n = () => {
  /**
   * Translate a key with optional parameter substitution
   * 
   * @param key - Translation key
   * @param params - Optional parameters for interpolation
   * @returns Translated string (currently returns key as-is)
   */
  const t = (key: string, params?: Record<string, string>): string => {
    // Stub implementation: return key with parameter substitution
    if (params) {
      return key.replace(/\{(\w+)\}/g, (match, param) => params[param] || match);
    }
    return key;
  };

  /**
   * Change the current language/locale
   * 
   * @param locale - Locale code (e.g., 'en', 'es', 'fr')
   */
  const changeLanguage = (_locale: string) => {
    // Stub implementation: no-op (prefix with _ to indicate intentionally unused)
    // Real implementation would update context/state and reload translations
  };

  const currentLanguage = 'en'; // Default to English

  return {
    t,
    changeLanguage,
    currentLanguage,
    isReady: true,
  };
};
