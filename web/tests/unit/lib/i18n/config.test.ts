import { DEFAULT_LOCALE, resolveLocale } from '@/lib/i18n/config';

describe('resolveLocale', () => {
  it('returns the cookie locale when supported', () => {
    expect(resolveLocale('es', null)).toBe('es');
  });

  it('falls back to accept-language header when cookie is missing', () => {
    expect(resolveLocale(undefined, 'es-ES,es;q=0.8,en;q=0.6')).toBe('es');
  });

  it('falls back to base language from accept-language header', () => {
    expect(resolveLocale(undefined, 'fr-FR,fr;q=0.8,en;q=0.5')).toBe(DEFAULT_LOCALE);
  });

  it('returns default locale when nothing matches', () => {
    expect(resolveLocale(undefined, null)).toBe(DEFAULT_LOCALE);
  });
});

