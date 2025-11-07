/**
 * @fileoverview Service Worker Provider Component
 * 
 * Registers and manages service worker lifecycle.
 * Include once in root layout to enable PWA functionality.
 * 
 * Features:
 * - Automatic service worker registration
 * - Update detection and user notification
 * - Offline/online status tracking
 * 
 * @author Choices Platform Team
 */

'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { logger } from '@/lib/utils/logger';

import { 
  register, 
  activateUpdate, 
  isServiceWorkerSupported,
  isUpdateAvailable as checkUpdateAvailable 
} from '../lib/service-worker-registration';

/**
 * Service Worker Provider Props
 */
type ServiceWorkerProviderProps = {
  /**
   * Child components
   */
  children?: React.ReactNode;
  
  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
  
  /**
   * Show update notification banner
   * @default true
   */
  showUpdateBanner?: boolean;
}

/**
 * Service Worker Provider Component
 * 
 * Registers service worker and provides update notifications.
 * Place this in your root layout.tsx file.
 * 
 * @example
 * ```tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <ServiceWorkerProvider debug={process.env.NODE_ENV === 'development'}>
 *           {children}
 *         </ServiceWorkerProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function ServiceWorkerProvider({ 
  children, 
  debug = false,
  showUpdateBanner = true 
}: ServiceWorkerProviderProps) {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    // Check if service workers supported
    if (!isServiceWorkerSupported()) {
      logger.info('Service workers not supported in this browser');
      return;
    }
    
    // Register service worker
    register({
      onSuccess: (registration) => {
        setIsRegistered(true);
        logger.info('Service worker registered successfully', {
          scope: registration.scope,
        });
      },
      
      onUpdate: (registration) => {
        setIsUpdateAvailable(true);
        logger.info('Service worker update available', {
          waiting: !!registration.waiting,
        });
      },
      
      onError: (error) => {
        logger.error('Service worker registration failed', { error });
      },
      
      onActive: () => {
        logger.info('Service worker activated');
      },
      
      debug,
    });
    
    // Set up online/offline listeners
    const handleOnline = () => {
      setIsOffline(false);
      logger.info('App is online');
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      logger.warn('App is offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial offline state
    setIsOffline(!navigator.onLine);
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [debug]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    if (isRegistered) {
      document.documentElement.setAttribute('data-sw-registered', 'true');
      return () => {
        document.documentElement.removeAttribute('data-sw-registered');
      };
    }

    document.documentElement.removeAttribute('data-sw-registered');
    return undefined;
  }, [isRegistered]);
  
  /**
   * Handle user clicking "Update Now" button
   */
  const handleUpdate = async () => {
    try {
      await activateUpdate();
      logger.info('Service worker update activated, reloading...');
      window.location.reload();
    } catch (error) {
      logger.error('Failed to activate update', { error });
    }
  };
  
  /**
   * Dismiss update notification
   */
  const dismissUpdate = () => {
    setIsUpdateAvailable(false);
  };
  
  return (
    <>
      {children}
      
      {/* Update Available Banner */}
      {showUpdateBanner && isUpdateAvailable && (
        <div 
          className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-4 shadow-lg z-50"
          role="alert"
          aria-live="polite"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="font-semibold">App Update Available</p>
              <p className="text-sm text-blue-100">
                A new version of Choices is ready. Update now for the latest features and improvements.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleUpdate}
                className="bg-white text-blue-600 px-4 py-2 rounded-md font-semibold hover:bg-blue-50 transition-colors"
              >
                Update Now
              </button>
              
              <button
                onClick={dismissUpdate}
                className="p-2 hover:bg-blue-700 rounded-md transition-colors"
                aria-label="Dismiss update notification"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Offline Indicator */}
      {isOffline && (
        <div 
          className="fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium z-50"
          role="alert"
          aria-live="polite"
        >
          📡 You&apos;re offline. Some features may be limited.
        </div>
      )}
    </>
  );
}

/**
 * Hook to use service worker state in components
 * 
 * @returns Service worker state and utilities
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isOffline, isUpdateAvailable, update } = useServiceWorker();
 *   
 *   if (isOffline) {
 *     return <div>Offline mode</div>;
 *   }
 *   
 *   return <div>Online</div>;
 * }
 * ```
 */
export function useServiceWorker() {
  const [isOffline, setIsOffline] = useState(() => (
    typeof navigator === 'undefined' ? false : !navigator.onLine
  ));
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check update status
    setIsUpdateAvailable(checkUpdateAvailable());
    let isMounted = true;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(() => {
          if (isMounted) {
            setIsRegistered(true);
          }
        })
        .catch(() => {
          if (isMounted) {
            setIsRegistered(false);
          }
        });
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      isMounted = false;
    };
  }, []);
  
  return {
    isOffline,
    isUpdateAvailable,
    isRegistered,
    update: activateUpdate,
  };
}

