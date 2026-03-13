'use client';

/**
 * FeedPWAEnhancer Component
 * 
 * Wraps feed components with PWA features:
 * - Service Worker registration
 * - Offline/online detection
 * - Push notification integration
 * - Background sync
 * - Install prompt
 * 
 * Created: November 5, 2025
 * Status: ✅ Optional enhancement wrapper
 */

import React, { useEffect, useState, useCallback } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import logger from '@/lib/utils/logger';

type FeedPWAEnhancerProps = {
  children: React.ReactNode;
  /** @deprecated Offline indicator is now global in layout */
  enableOfflineIndicator?: boolean;
  enableInstallPrompt?: boolean;
  enablePushNotifications?: boolean;
};

/**
 * Enhancer component that adds PWA features to any feed
 * Uses composition pattern for clean separation
 */
export default function FeedPWAEnhancer({
  children,
  enableOfflineIndicator: _enableOfflineIndicator = true,
  enableInstallPrompt = false,
  enablePushNotifications: _enablePushNotifications = false
}: FeedPWAEnhancerProps) {
  const [isClient, setIsClient] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  // Check if app is installed (running in standalone mode)
  const isInstalled =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(display-mode: standalone)').matches;
  
  // Client-side only
  useEffect(() => {
    setIsClient(true);
    
    // Check if app should show install prompt
    if (enableInstallPrompt && !isInstalled) {
      const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-shown');
      if (!hasSeenPrompt) {
        // Wait a bit before showing
        const timer = setTimeout(() => setShowInstallPrompt(true), 30000); // 30 seconds
        return () => clearTimeout(timer);
      }
    }
    
    return undefined;
  }, [enableInstallPrompt, isInstalled]);

  const handleInstallDismiss = useCallback(() => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-prompt-shown', 'true');
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    // Trigger install prompt if available
    const deferredPrompt = (window as any).deferredPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      logger.info('[PWA] Install prompt result:', result);
      (window as any).deferredPrompt = null;
    }
    handleInstallDismiss();
  }, [handleInstallDismiss]);

  if (!isClient) {
    // SSR: just render children
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Offline indicator: global banner from layout handles offline state */}

      {/* Install Prompt */}
      {enableInstallPrompt && showInstallPrompt && !isInstalled && (
        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>📱</span>
              <span>Install Choices app for a better experience</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleInstallDismiss}
              >
                Not now
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleInstallClick}
              >
                Install
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Render children */}
      {children}
    </div>
  );
}

