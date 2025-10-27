/**
 * PWA Types
 * 
 * Type definitions for Progressive Web App functionality
 */

export interface PWAManifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: string;
  background_color: string;
  theme_color: string;
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
  }>;
}

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWANotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}
