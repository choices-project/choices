/**
 * PWA Installation Manager
 * 
 * Handles PWA installation prompts, detection, and user experience.
 */

import { logger } from '@/lib/logger';

export type BeforeInstallPromptEvent = {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
} & Event;

export type InstallationStatus = {
  isInstallable: boolean;
  isInstalled: boolean;
  canPrompt: boolean;
  platform: string | null;
  deferredPrompt: BeforeInstallPromptEvent | null;
};

export type InstallationResult = {
  success: boolean;
  outcome: 'accepted' | 'dismissed' | 'error';
  platform?: string;
  error?: string;
};

class PWAInstallationManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;
  private listeners: Array<(status: InstallationStatus) => void> = [];

  constructor() {
    this.initialize();
  }

  /**
   * Initialize installation manager
   */
  private initialize(): void {
    // Check if already installed
    this.checkInstallationStatus();

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt.bind(this));

    // Listen for appinstalled event
    window.addEventListener('appinstalled', this.handleAppInstalled.bind(this));

    // Listen for display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', this.handleDisplayModeChange.bind(this));
  }

  /**
   * Check if PWA is already installed
   */
  private checkInstallationStatus(): void {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    
    this.isInstalled = isStandalone || isIOSStandalone;
    this.notifyListeners();
  }

  /**
   * Handle beforeinstallprompt event
   */
  private handleBeforeInstallPrompt(event: Event): void {
    logger.info('PWA: Before install prompt event received');
    
    // Prevent the default install prompt
    event.preventDefault();
    
    // Store the event for later use
    this.deferredPrompt = event as BeforeInstallPromptEvent;
    
    this.notifyListeners();
  }

  /**
   * Handle appinstalled event
   */
  private handleAppInstalled(): void {
    logger.info('PWA: App installed successfully');
    
    this.isInstalled = true;
    this.deferredPrompt = null;
    
    this.notifyListeners();
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('pwa-installed', {
      detail: { timestamp: new Date().toISOString() }
    }));
  }

  /**
   * Handle display mode changes
   */
  private handleDisplayModeChange(event: MediaQueryListEvent): void {
    this.isInstalled = event.matches;
    this.notifyListeners();
  }

  /**
   * Get current installation status
   */
  getStatus(): InstallationStatus {
    return {
      isInstallable: !!this.deferredPrompt,
      isInstalled: this.isInstalled,
      canPrompt: !!this.deferredPrompt && !this.isInstalled,
      platform: this.deferredPrompt?.platforms?.[0] ?? null,
      deferredPrompt: this.deferredPrompt
    };
  }

  /**
   * Show installation prompt
   */
  async promptInstallation(): Promise<InstallationResult> {
    if (!this.deferredPrompt) {
      return {
        success: false,
        outcome: 'error',
        error: 'Installation prompt not available'
      };
    }

    try {
      logger.info('PWA: Showing installation prompt');
      
      // Show the install prompt
      await this.deferredPrompt.prompt();
      
      // Wait for the user to respond
      const choiceResult = await this.deferredPrompt.userChoice;
      
      logger.info('PWA: Installation choice:', choiceResult.outcome);
      
      // Clear the deferred prompt
      this.deferredPrompt = null;
      this.notifyListeners();
      
      return {
        success: true,
        outcome: choiceResult.outcome,
        platform: choiceResult.platform
      };

    } catch (error) {
      logger.error('PWA: Installation prompt failed:', error);
      
      return {
        success: false,
        outcome: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if PWA is installable
   */
  isInstallable(): boolean {
    return !!this.deferredPrompt;
  }

  /**
   * Check if PWA is installed
   */
  isPWAInstalled(): boolean {
    return this.isInstalled;
  }

  /**
   * Get installation criteria
   */
  getInstallationCriteria(): {
    hasServiceWorker: boolean;
    hasManifest: boolean;
    isHTTPS: boolean;
    isEngaging: boolean;
  } {
    return {
      hasServiceWorker: 'serviceWorker' in navigator,
      hasManifest: !!document.querySelector('link[rel="manifest"]'),
      isHTTPS: location.protocol === 'https:' || location.hostname === 'localhost',
      isEngaging: this.isEngaging()
    };
  }

  /**
   * Check if user has been engaging with the app
   */
  private isEngaging(): boolean {
    // Simple engagement check - can be enhanced
    const sessionStart = sessionStorage.getItem('sessionStart');
    if (!sessionStart) {
      sessionStorage.setItem('sessionStart', Date.now().toString());
      return false;
    }
    
    const sessionDuration = Date.now() - parseInt(sessionStart);
    return sessionDuration > 30000; // 30 seconds
  }

  /**
   * Subscribe to installation status changes
   */
  subscribe(listener: (status: InstallationStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify listeners of status changes
   */
  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        logger.error('PWA: Error in installation status listener:', error);
      }
    });
  }

  /**
   * Get installation benefits for display
   */
  getInstallationBenefits(): string[] {
    return [
      'Access Choices directly from your home screen',
      'Faster loading and better performance',
      'Works offline - vote even without internet',
      'Get notifications for new polls and results',
      'Native app-like experience'
    ];
  }

  /**
   * Get installation instructions for different platforms
   */
  getInstallationInstructions(): Record<string, string[]> {
    return {
      chrome: [
        'Click the install button in the address bar',
        'Or click the three dots menu and select "Install Choices"',
        'Follow the installation prompts'
      ],
      firefox: [
        'Click the install button in the address bar',
        'Or click the three dots menu and select "Install"',
        'Follow the installation prompts'
      ],
      safari: [
        'Tap the share button in Safari',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" to install'
      ],
      edge: [
        'Click the install button in the address bar',
        'Or click the three dots menu and select "Apps" > "Install this site as an app"',
        'Follow the installation prompts'
      ]
    };
  }
}

// Create singleton instance
export const pwaInstallationManager = new PWAInstallationManager();

/**
 * Get PWA installation status
 */
export function getInstallationStatus(): InstallationStatus {
  return pwaInstallationManager.getStatus();
}

/**
 * Prompt PWA installation
 */
export async function promptPWAInstallation(): Promise<InstallationResult> {
  return await pwaInstallationManager.promptInstallation();
}

/**
 * Check if PWA is installable
 */
export function isPWAInstallable(): boolean {
  return pwaInstallationManager.isInstallable();
}

/**
 * Check if PWA is installed
 */
export function isPWAInstalled(): boolean {
  return pwaInstallationManager.isPWAInstalled();
}

/**
 * Subscribe to installation status changes
 */
export function subscribeToInstallationStatus(
  listener: (status: InstallationStatus) => void
): () => void {
  return pwaInstallationManager.subscribe(listener);
}

/**
 * Get installation benefits
 */
export function getInstallationBenefits(): string[] {
  return pwaInstallationManager.getInstallationBenefits();
}

/**
 * Get installation instructions
 */
export function getInstallationInstructions(): Record<string, string[]> {
  return pwaInstallationManager.getInstallationInstructions();
}
