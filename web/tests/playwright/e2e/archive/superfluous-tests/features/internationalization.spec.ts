import { test, expect } from '@playwright/test';
import { DatabaseTracker } from '../../../utils/database-tracker';
import { T } from '@/tests/registry/testIds';

test.describe('Internationalization (i18n) System', () => {
  test.beforeEach(async ({ page }) => {
    // Initialize enhanced database tracking
    DatabaseTracker.reset();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key';
    DatabaseTracker.initializeSupabase(supabaseUrl, supabaseKey);
    
    console.log('🌍 Starting Internationalization Database Analysis');
    
    // Navigate to the dashboard
    await page.goto('/dashboard');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Track dashboard database usage for i18n
    DatabaseTracker.trackQuery('dashboard', 'select', 'i18n_analysis');
    DatabaseTracker.trackQuery('user_profiles', 'select', 'i18n_analysis');
  });

  test('should display language selector in navigation', async ({ page }) => {
    // Check if language selector is present (handle multiple selectors)
    const languageSelectors = page.getByTestId(T.i18n.languageSelector);
    
    // Language selector might be hidden initially (e.g., in mobile menu)
    // Try to find it and make it visible if needed
    if (await languageSelectors.first().isHidden()) {
      // Try to open settings or menu that might contain the language selector
      const settingsButton = page.getByTestId(T.dashboard.dashboardSettings);
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Now check if language selector is visible
    await expect(languageSelectors.first()).toBeVisible();
    
    // Check if it shows current language (button-based selector)
    const currentLanguageButton = languageSelectors.first().locator('button');
    await expect(currentLanguageButton).toBeVisible();
  });

  test('should change language when selector is used', async ({ page }) => {
    // Find the language selector button (handle multiple selectors)
    const languageSelectors = page.getByTestId(T.i18n.languageSelector);
    const languageButton = languageSelectors.first().locator('button');
    
    // Click to open the dropdown
    await languageButton.click();
    
    // Wait for dropdown to appear
    await page.waitForTimeout(500);
    
    // Look for Spanish option and click it
    const spanishOption = page.locator('text=Español').first();
    if (await spanishOption.isVisible()) {
      await spanishOption.click();
    }
    
    // Wait for language change to take effect
    await page.waitForTimeout(1000);
    
    // Check if Spanish translations are displayed
    // Look for Spanish text in common elements
    const welcomeText = page.locator('text=¡Bienvenido a Choices!');
    await expect(welcomeText).toBeVisible();
  });

  test('should persist language selection across page navigation', async ({ page }) => {
    // Change language to French
    const languageSelector = page.getByTestId(T.i18n.languageSelector);
    const languageButton = languageSelector.locator('button');
    
    // Click to open the dropdown
    await languageButton.click();
    await page.waitForTimeout(500);
    
    // Look for French option and click it
    const frenchOption = page.locator('text=Français').first();
    if (await frenchOption.isVisible()) {
      await frenchOption.click();
    }
    
    await page.waitForTimeout(1000);
    
    // Navigate to another page
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    
    // Check if French is still selected
    const languageSelectorOnPolls = page.getByTestId(T.i18n.languageSelector);
    await expect(languageSelectorOnPolls.first()).toBeVisible();
    
    // Check if French translations are still displayed
    const frenchText = page.locator('text=Bienvenue sur Choices !');
    await expect(frenchText).toBeVisible();
  });

  test('should translate all major UI elements', async ({ page }) => {
    // Test with English (default)
    await testLanguageTranslations(page, 'en', {
      welcome: 'Welcome to Choices!',
      dashboard: 'Dashboard',
      polls: 'Polls',
      representatives: 'Representatives',
      analytics: 'Analytics',
      profile: 'Profile',
      settings: 'Settings'
    });

    // Test with Spanish
    await page.getByTestId(T.i18n.languageSelector).first().selectOption('es');
    await page.waitForTimeout(1000);
    
    await testLanguageTranslations(page, 'es', {
      welcome: '¡Bienvenido a Choices!',
      dashboard: 'Panel de control',
      polls: 'Encuestas',
      representatives: 'Representantes',
      analytics: 'Análisis',
      profile: 'Perfil',
      settings: 'Configuración'
    });

    // Test with French
    await page.getByTestId(T.i18n.languageSelector).first().selectOption('fr');
    await page.waitForTimeout(1000);
    
    await testLanguageTranslations(page, 'fr', {
      welcome: 'Bienvenue sur Choices !',
      dashboard: 'Tableau de bord',
      polls: 'Sondages',
      representatives: 'Représentants',
      analytics: 'Analytique',
      profile: 'Profil',
      settings: 'Paramètres'
    });

    // Test with German
    await page.getByTestId(T.i18n.languageSelector).first().selectOption('de');
    await page.waitForTimeout(1000);
    
    await testLanguageTranslations(page, 'de', {
      welcome: 'Willkommen bei Choices',
      dashboard: 'Dashboard',
      polls: 'Umfragen',
      representatives: 'Vertreter',
      analytics: 'Analytik',
      profile: 'Profil',
      settings: 'Einstellungen'
    });

    // Test with Italian
    await page.getByTestId(T.i18n.languageSelector).first().selectOption('it');
    await page.waitForTimeout(1000);
    
    await testLanguageTranslations(page, 'it', {
      welcome: 'Benvenuto in Choices',
      dashboard: 'Dashboard',
      polls: 'Sondaggi',
      representatives: 'Rappresentanti',
      analytics: 'Analisi',
      profile: 'Profilo',
      settings: 'Impostazioni'
    });
  });

  test('should handle language switching in forms', async ({ page }) => {
    // Navigate to a form page (e.g., create poll)
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Change language to Spanish
    await page.getByTestId(T.i18n.languageSelector).first().selectOption('es');
    await page.waitForTimeout(1000);
    
    // Check if form labels are translated
    const titleLabel = page.locator('label[for="title"]');
    await expect(titleLabel).toContainText('Título');
    
    const descriptionLabel = page.locator('label[for="description"]');
    await expect(descriptionLabel).toContainText('Descripción');
    
    // Check if buttons are translated
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toContainText('Enviar');
    
    const cancelButton = page.locator('button[type="button"]').filter({ hasText: 'Cancelar' });
    await expect(cancelButton).toBeVisible();
  });

  test('should handle language switching in modals', async ({ page }) => {
    // Open a modal (e.g., contact modal)
    const contactButton = page.getByTestId(T.i18n.navigationRepresentatives).first();
    if (await contactButton.isVisible()) {
      await contactButton.click();
      await page.waitForTimeout(500);
      
      // Change language to French
      await page.getByTestId(T.i18n.languageSelector).first().selectOption('fr');
      await page.waitForTimeout(1000);
      
      // Check if modal content is translated
      const modalTitle = page.getByTestId(T.accessibility.modal);
      await expect(modalTitle).toContainText('Envoyer un message à votre représentant');
      
      const subjectLabel = page.locator('label[for="subject"]');
      await expect(subjectLabel).toContainText('Objet de votre message');
      
      const messageLabel = page.locator('label[for="message"]');
      await expect(messageLabel).toContainText('Votre message ici...');
      
      // Close modal
      await page.getByTestId(T.accessibility.dialog).click();
    }
  });

  test('should handle language switching in error messages', async ({ page }) => {
    // Trigger an error (e.g., try to access admin without permission)
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Change language to German
    await page.getByTestId(T.i18n.languageSelector).first().selectOption('de');
    await page.waitForTimeout(1000);
    
    // Check if error messages are translated
    const errorMessage = page.getByTestId(T.accessibility.errorMessage);
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText('Sie sind nicht autorisiert');
    }
  });

  test('should handle language switching in success messages', async ({ page }) => {
    // Perform an action that shows success message (e.g., vote on a poll)
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    
    // Find a poll to vote on
    const voteButton = page.getByTestId(T.voteButton).first();
    if (await voteButton.isVisible()) {
      await voteButton.click();
      await page.waitForTimeout(500);
      
      // Change language to Italian
      await page.getByTestId(T.i18n.languageSelector).first().selectOption('it');
      await page.waitForTimeout(1000);
      
      // Check if success message is translated
      const successMessage = page.getByTestId(T.successMessage);
      if (await successMessage.isVisible()) {
        await expect(successMessage).toContainText('Voto registrato con successo');
      }
    }
  });

  test('should maintain language selection after page refresh', async ({ page }) => {
    // Change language to Spanish - handle both select and button-based selectors
    const languageSelector = page.getByTestId(T.i18n.languageSelector);
    
    // Try select element first, then fall back to button-based selector
    if (await languageSelector.locator('select').isVisible()) {
      await languageSelector.locator('select').selectOption('es');
    } else {
      // For button-based selectors, click and select option
      await languageSelector.click();
      await page.waitForTimeout(500);
      const spanishOption = page.locator('text=Español').first();
      if (await spanishOption.isVisible()) {
        await spanishOption.click();
      }
    }
    await page.waitForTimeout(1000);
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check if Spanish is still selected
    const selectorAfterRefresh = page.getByTestId(T.i18n.languageSelector);
    if (await selectorAfterRefresh.first().locator('select').isVisible()) {
      await expect(selectorAfterRefresh.first().locator('select')).toHaveValue('es');
    }
    
    // Check if Spanish translations are still displayed
    const welcomeText = page.locator('text=¡Bienvenido a Choices!');
    await expect(welcomeText).toBeVisible();
  });

  test('should handle language switching in navigation menu', async ({ page }) => {
    // Open navigation menu
    const menuButton = page.getByTestId(T.mobileMenu);
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(500);
      
      // Change language to French
      await page.getByTestId(T.i18n.languageSelector).first().selectOption('fr');
      await page.waitForTimeout(1000);
      
      // Check if navigation items are translated
      const homeLink = page.getByTestId(T.i18n.navigationHome);
      await expect(homeLink).toContainText('Accueil');
      
      const dashboardLink = page.getByTestId(T.i18n.navigationDashboard);
      await expect(dashboardLink).toContainText('Tableau de bord');
      
      const pollsLink = page.getByTestId(T.i18n.navigationPolls);
      await expect(pollsLink).toContainText('Sondages');
    }
  });
});

// Helper function to test language translations
async function testLanguageTranslations(page: any, language: string, translations: Record<string, string>) {
  for (const [key, expectedText] of Object.entries(translations)) {
    const element = page.locator(`[data-testid="${key}"]`);
    if (await element.isVisible()) {
      await expect(element).toContainText(expectedText);
    }
  }
}
