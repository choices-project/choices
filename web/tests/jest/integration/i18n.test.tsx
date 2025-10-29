import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useI18n } from '@/hooks/useI18n';
import { useAppStore } from '@/lib/stores/appStore';
import LanguageSelector from '@/components/shared/LanguageSelector';
import TranslatedText from '@/components/shared/TranslatedText';

// Mock the i18n module
jest.mock('@/lib/i18n', () => ({
  loadTranslations: jest.fn(),
  t: jest.fn((key: string, replacements?: Record<string, string>) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        'common.welcome': 'Welcome to Choices!',
        'common.hello': 'Hello',
        'common.loading': 'Loading...',
        'dashboard.title': 'Dashboard',
        'dashboard.welcome_message': 'Welcome back, {{username}}!'
      },
      es: {
        'common.welcome': '¡Bienvenido a Choices!',
        'common.hello': 'Hola',
        'common.loading': 'Cargando...',
        'dashboard.title': 'Panel de control',
        'dashboard.welcome_message': '¡Bienvenido de nuevo, {{username}}!'
      },
      fr: {
        'common.welcome': 'Bienvenue sur Choices !',
        'common.hello': 'Bonjour',
        'common.loading': 'Chargement...',
        'dashboard.title': 'Tableau de bord',
        'dashboard.welcome_message': 'Bon retour, {{username}} !'
      },
      de: {
        'common.welcome': 'Willkommen bei Choices',
        'common.hello': 'Hallo',
        'common.loading': 'Laden...',
        'dashboard.title': 'Dashboard',
        'dashboard.welcome_message': 'Willkommen zurück, {{username}}!'
      },
      it: {
        'common.welcome': 'Benvenuto in Choices',
        'common.hello': 'Ciao',
        'common.loading': 'Caricamento...',
        'dashboard.title': 'Dashboard',
        'dashboard.welcome_message': 'Bentornato, {{username}}!'
      }
    };

    const currentLang = useAppStore.getState().i18n.currentLanguage;
    const translation = translations[currentLang]?.[key] || key;

    if (replacements) {
      return translation.replace(/\{\{(\w+)\}\}/g, (match, key) => replacements[key] || match);
    }

    return translation;
  })
}));

// Test component that uses i18n
function TestI18nComponent() {
  const { t, currentLanguage, setLanguage } = useI18n();

  return (
    <div>
      <h1 data-testid="welcome">{t('common.welcome')}</h1>
      <p data-testid="hello">{t('common.hello')}</p>
      <p data-testid="current-lang">Current: {currentLanguage}</p>
      <button 
        data-testid="change-to-es" 
        onClick={() => setLanguage('es')}
      >
        Change to Spanish
      </button>
      <button 
        data-testid="change-to-fr" 
        onClick={() => setLanguage('fr')}
      >
        Change to French
      </button>
      <button 
        data-testid="change-to-de" 
        onClick={() => setLanguage('de')}
      >
        Change to German
      </button>
      <button 
        data-testid="change-to-it" 
        onClick={() => setLanguage('it')}
      >
        Change to Italian
      </button>
    </div>
  );
}

describe('Internationalization (i18n) System', () => {
  beforeEach(() => {
    // Reset the store to default state
    useAppStore.setState({
      i18n: {
        currentLanguage: 'en',
        isLoading: false,
        error: null
      },
      settings: {
        language: 'en',
        timezone: 'UTC',
        animations: true,
        haptics: true,
        sound: true,
        autoSave: true,
        compactMode: false,
        showTooltips: true,
        enableAnalytics: true,
        enableCrashReporting: true
      }
    });
  });

  describe('useI18n Hook', () => {
    it('should provide translation function and language state', () => {
      render(<TestI18nComponent />);
      
      expect(screen.getByTestId('welcome')).toContain('Welcome to Choices!');
      expect(screen.getByTestId('hello')).toContain('Hello');
      expect(screen.getByTestId('current-lang')).toContain('Current: en');
    });

    it('should change language when setLanguage is called', async () => {
      render(<TestI18nComponent />);
      
      // Change to Spanish
      fireEvent.click(screen.getByTestId('change-to-es'));
      
      await waitFor(() => {
        expect(screen.getByTestId('welcome')).toContain('¡Bienvenido a Choices!');
        expect(screen.getByTestId('hello')).toContain('Hola');
        expect(screen.getByTestId('current-lang')).toContain('Current: es');
      });
    });

    it('should handle multiple language changes', async () => {
      render(<TestI18nComponent />);
      
      // Change to French
      fireEvent.click(screen.getByTestId('change-to-fr'));
      
      await waitFor(() => {
        expect(screen.getByTestId('welcome')).toContain('Bienvenue sur Choices !');
        expect(screen.getByTestId('hello')).toContain('Bonjour');
      });

      // Change to German
      fireEvent.click(screen.getByTestId('change-to-de'));
      
      await waitFor(() => {
        expect(screen.getByTestId('welcome')).toContain('Willkommen bei Choices');
        expect(screen.getByTestId('hello')).toContain('Hallo');
      });

      // Change to Italian
      fireEvent.click(screen.getByTestId('change-to-it'));
      
      await waitFor(() => {
        expect(screen.getByTestId('welcome')).toContain('Benvenuto in Choices');
        expect(screen.getByTestId('hello')).toContain('Ciao');
      });
    });
  });

  describe('LanguageSelector Component', () => {
    it('should render with current language selected', () => {
      render(<LanguageSelector />);
      
      // Should show current language (English by default)
      expect(screen.getByRole('combobox')).toHaveProperty('value', 'en');
    });

    it('should change language when selection changes', async () => {
      render(<LanguageSelector />);
      
      const selector = screen.getByRole('combobox');
      
      // Change to Spanish
      fireEvent.change(selector, { target: { value: 'es' } });
      
      await waitFor(() => {
        expect(useAppStore.getState().i18n.currentLanguage).toBe('es');
        expect(useAppStore.getState().settings.language).toBe('es');
      });
    });
  });

  describe('TranslatedText Component', () => {
    it('should render translated text', () => {
      render(
        <TranslatedText 
          textKey="common.welcome" 
          {...({ 'data-testid': 'translated-welcome' } as any)}
        />
      );
      
      expect(screen.getByTestId('translated-welcome')).toContain('Welcome to Choices!');
    });

    it('should render with custom HTML element', () => {
      render(
        <TranslatedText 
          textKey="common.welcome" 
          {...({ as: 'h1', 'data-testid': 'translated-welcome' } as any)}
        />
      );
      
      const element = screen.getByTestId('translated-welcome');
      expect(element.tagName).toBe('H1');
      expect(element).toContain('Welcome to Choices!');
    });

    it('should handle replacements in translations', () => {
      render(
        <TranslatedText 
          textKey="dashboard.welcome_message" 
          replacements={{ username: 'John' }}
          {...({ 'data-testid': 'welcome-message' } as any)}
        />
      );
      
      expect(screen.getByTestId('welcome-message')).toContain('Welcome back, John!');
    });

    it('should show loading state when translations are loading', () => {
      // Set loading state
      useAppStore.setState({
        i18n: {
          currentLanguage: 'en',
          isLoading: true,
          error: null
        }
      });

      render(
        <TranslatedText 
          textKey="common.welcome" 
          {...({ 'data-testid': 'translated-welcome' } as any)}
        />
      );
      
      expect(screen.getByTestId('translated-welcome')).toContain('Loading translation...');
    });

    it('should show error state when translations fail to load', () => {
      // Set error state
      useAppStore.setState({
        i18n: {
          currentLanguage: 'en',
          isLoading: false,
          error: 'Failed to load translations'
        }
      });

      render(
        <TranslatedText 
          textKey="common.welcome" 
          {...({ 'data-testid': 'translated-welcome' } as any)}
        />
      );
      
      expect(screen.getByTestId('translated-welcome')).toContain('Error: Failed to load translations');
    });
  });

  describe('Translation Key Coverage', () => {
    it('should have translations for all common keys', () => {
      const commonKeys = [
        'common.welcome',
        'common.hello',
        'common.loading',
        'common.error',
        'common.success',
        'common.cancel',
        'common.save',
        'common.delete',
        'common.edit',
        'common.create',
        'common.update',
        'common.search',
        'common.filter',
        'common.sort',
        'common.back',
        'common.next',
        'common.close'
      ];

      commonKeys.forEach(key => {
        const { t } = useI18n();
        const translation = t(key);
        expect(translation).toBeDefined();
        expect(translation).not.toBe(key); // Should not return the key itself
      });
    });

    it('should have translations for all navigation keys', () => {
      const navigationKeys = [
        'navigation.home',
        'navigation.dashboard',
        'navigation.polls',
        'navigation.representatives',
        'navigation.analytics',
        'navigation.profile',
        'navigation.settings',
        'navigation.admin',
        'navigation.logout',
        'navigation.login',
        'navigation.register'
      ];

      navigationKeys.forEach(key => {
        const { t } = useI18n();
        const translation = t(key);
        expect(translation).toBeDefined();
        expect(translation).not.toBe(key);
      });
    });

    it('should have translations for all dashboard keys', () => {
      const dashboardKeys = [
        'dashboard.title',
        'dashboard.welcome',
        'dashboard.recentActivity',
        'dashboard.quickActions',
        'dashboard.createPoll',
        'dashboard.viewPolls',
        'dashboard.contactRepresentatives',
        'dashboard.viewAnalytics'
      ];

      dashboardKeys.forEach(key => {
        const { t } = useI18n();
        const translation = t(key);
        expect(translation).toBeDefined();
        expect(translation).not.toBe(key);
      });
    });
  });

  describe('Language Persistence', () => {
    it('should persist language selection in app store', async () => {
      render(<TestI18nComponent />);
      
      // Change language
      fireEvent.click(screen.getByTestId('change-to-es'));
      
      await waitFor(() => {
        const state = useAppStore.getState();
        expect(state.i18n.currentLanguage).toBe('es');
        expect(state.settings.language).toBe('es');
      });
    });

    it('should maintain language across component re-renders', async () => {
      const { rerender } = render(<TestI18nComponent />);
      
      // Change language
      fireEvent.click(screen.getByTestId('change-to-fr'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-lang')).toContain('Current: fr');
      });

      // Re-render component
      rerender(<TestI18nComponent />);
      
      // Language should be maintained
      expect(screen.getByTestId('current-lang')).toContain('Current: fr');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing translation keys gracefully', () => {
      const { t } = useI18n();
      const translation = t('nonexistent.key');
      expect(translation).toBe('nonexistent.key'); // Should return the key itself
    });

    it('should handle translation loading errors', () => {
      useAppStore.setState({
        i18n: {
          currentLanguage: 'en',
          isLoading: false,
          error: 'Translation loading failed'
        }
      });

      render(
        <TranslatedText 
          textKey="common.welcome" 
          {...({ 'data-testid': 'translated-welcome' } as any)}
        />
      );
      
      expect(screen.getByTestId('translated-welcome')).toContain('Error: Translation loading failed');
    });
  });
});
