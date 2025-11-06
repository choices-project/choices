// Global type declarations
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'set',
      targetId: string,
      config?: Record<string, any>
    ) => void;
    
    // PWA Installation properties
    deferredPrompt?: {
      prompt(): Promise<void>;
      userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
      }>;
    };
    
    // PWA Notification properties
    lastNotification?: Notification;
    notificationClicked?: boolean;
    
    // Console extensions for testing
    console?: Console & {
      filter?(predicate: (msg: any) => boolean): any[];
    };
    
    // Webpack properties for testing
    __webpack_require__?: any;
  }
  
  // Service Worker extensions
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface ServiceWorkerRegistration {
    sync?: {
      register(tag: string): Promise<void>;
      getTags(): Promise<string[]>;
    };
  }
  
  // Navigator extensions
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Navigator {
    serviceWorker: ServiceWorkerContainer & {
      sync?: {
        register(tag: string): Promise<void>;
        getTags(): Promise<string[]>;
      };
    };
  }
}

export {}
