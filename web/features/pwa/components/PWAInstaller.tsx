/**
 * @fileoverview PWA Installer Component
 * 
 * Main PWA installation interface with prompts and status indicators.
 * Handles installation flow and offline vote synchronization.
 * 
 * @author Choices Platform Team
 * @migrated Zustand migration complete - November 4, 2025
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react';

import { initializeOfflineOutbox } from '@/features/pwa/lib/offline-outbox'
import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
import { useAccessibleDialog } from '@/lib/accessibility/useAccessibleDialog';
import { useNotificationActions } from '@/lib/stores';
import { usePWAInstallation, usePWAOffline, usePWAPreferences, usePWAActions } from '@/lib/stores/pwaStore';
import type { Notification } from '@/lib/stores/types';
import { logger } from '@/lib/utils/logger';
import { useI18n } from '@/hooks/useI18n';

/**
 * PWA Installer Component
 * 
 * Comprehensive PWA installation interface featuring:
 * - Installation prompts with benefits
 * - Offline vote status and sync
 * - Connection status indicators
 * - Toast notifications for user feedback
 * 
 * Initializes offline outbox on mount.
 * 
 * @returns Installation UI or null if PWA already installed/not supported
 */
export default function PWAInstaller() {
  const { t } = useI18n();
  const installation = usePWAInstallation();
  const offline = usePWAOffline();
  const preferences = usePWAPreferences();
  const { installPWA, syncData } = usePWAActions();
  const { addNotification } = useNotificationActions();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [showOfflineStatus, setShowOfflineStatus] = useState(false)

  const showNotification = useCallback(
    (title: string, message: string, type: Notification['type'] = 'info') => {
      addNotification({
        type,
        title,
        message,
        duration: type === 'error' ? 0 : undefined,
        source: 'system',
        context: {
          kind: 'pwa',
          surface: 'installer',
          state: type,
        },
        metadata: {
          component: 'PWAInstaller',
        },
      });
    },
    [addNotification],
  );
  
  const installDialogRef = useRef<HTMLDivElement>(null)
  const installButtonRef = useRef<HTMLButtonElement>(null)
  
  const hasOfflineData = offline.offlineData.queuedActions.length > 0
  const offlineVotes = offline.offlineData.queuedActions.length
  const isOnline = offline.isOnline
  const isSupported = 'serviceWorker' in navigator
  const isEnabled = preferences.installPrompt
  const benefitKeys = [
    'pwa.installer.benefits.homeScreen',
    'pwa.installer.benefits.performance',
    'pwa.installer.benefits.offline',
    'pwa.installer.benefits.notifications',
    'pwa.installer.benefits.native',
  ]

  useAccessibleDialog({
    isOpen: showInstallPrompt,
    dialogRef: installDialogRef,
    ...(showInstallPrompt ? { initialFocusRef: installButtonRef } : {}),
    onClose: () => setShowInstallPrompt(false),
    liveMessage: 'Install Choices prompt available.',
    ariaLabelId: 'pwa-install-title',
  })

  useEffect(() => {
    // Initialize offline outbox
    initializeOfflineOutbox();

    // Show install prompt when PWA becomes installable
    if (installation.canInstall && !installation.isInstalled) {
      setShowInstallPrompt(true);
    }

    // Show offline status when there are offline votes
    if (hasOfflineData) {
      setShowOfflineStatus(true);
    }

    // Listen for offline votes synced event
    const handleOfflineVotesSynced = (event: CustomEvent) => {
      const { syncedCount } = event.detail;
      if (syncedCount > 0) {
        const title = t('pwa.installer.notifications.syncSuccess.title');
        const message = t('pwa.installer.notifications.syncSuccess.message', {
          count: syncedCount,
        });
        showNotification(title, message, 'success');
        ScreenReaderSupport.announce(message, 'polite');
      }
    };

    window.addEventListener('offlineVotesSynced', handleOfflineVotesSynced as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('offlineVotesSynced', handleOfflineVotesSynced as EventListener);
    };
  }, [installation.canInstall, installation.isInstalled, hasOfflineData, showNotification, t]);

  useEffect(() => {
    if (showInstallPrompt) {
      const message = t('pwa.installer.live.installPrompt');
      ScreenReaderSupport.announce(message, 'polite');
    }
  }, [showInstallPrompt, t]);

  useEffect(() => {
    if (showOfflineStatus) {
      const message = t('pwa.installer.live.offlineVotesPending', { count: offlineVotes });
      ScreenReaderSupport.announce(message, offline.isOnline ? 'polite' : 'assertive');
    }
  }, [showOfflineStatus, offlineVotes, offline.isOnline, t]);

  useEffect(() => {
    if (!isOnline) {
      ScreenReaderSupport.announce(t('pwa.installer.live.offline'), 'assertive');
    }
  }, [isOnline, t]);

  const handleInstallClick = async () => {
    try {
      await installPWA()

      if (installation.isInstalled) {
        logger.info('User accepted the install prompt')
        const title = t('pwa.installer.notifications.installSuccess.title')
        const message = t('pwa.installer.notifications.installSuccess.message')
        showNotification(title, message, 'success')
        ScreenReaderSupport.announce(t('pwa.installer.live.installSuccess'), 'polite');
      }
    } catch (error) {
      logger.error('Installation failed:', error instanceof Error ? error : new Error(String(error)))
      const title = t('pwa.installer.notifications.installError.title')
      const message = t('pwa.installer.notifications.installError.message')
      showNotification(title, message, 'error')
      ScreenReaderSupport.announce(t('pwa.installer.live.installError'), 'assertive');
    } finally {
      setShowInstallPrompt(false)
    }
  }

  const handleSyncOfflineVotes = async () => {
    try {
      await syncData();
      const title = t('pwa.installer.notifications.syncSuccess.title');
      const message = t('pwa.installer.notifications.syncSuccess.message', { count: offlineVotes });
      showNotification(title, message, 'success');
      ScreenReaderSupport.announce(message, 'polite');
    } catch (error) {
      logger.error('Failed to sync offline votes:', error instanceof Error ? error : new Error(String(error)));
      const title = t('pwa.installer.notifications.syncError.title');
      const message = t('pwa.installer.notifications.syncError.message');
      showNotification(title, message, 'error');
      ScreenReaderSupport.announce(message, 'assertive');
    }
  }

  // Don't show anything if PWA is already installed or not supported
  if (installation.isInstalled || !isSupported || !isEnabled) {
    return null
  }

  return (
    <>
          {/* Install Prompt */}
          {showInstallPrompt && (
            <div
              className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50"
              data-testid="pwa-install-prompt"
              role="dialog"
              aria-modal="true"
              aria-labelledby="pwa-install-title"
              aria-describedby="pwa-install-benefits"
              ref={installDialogRef}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center" aria-hidden="true">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 id="pwa-install-title" className="font-semibold text-gray-900">
                      {t('pwa.installer.prompt.title')}
                    </h3>
                    <p className="text-sm text-gray-600">{t('pwa.installer.prompt.subtitle')}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowInstallPrompt(false)}
                    className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
                    aria-label={t('pwa.installer.prompt.dismiss')}
                  >
                    {t('pwa.installer.prompt.dismiss')}
                  </button>
                  <button
                    onClick={handleInstallClick}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    data-testid="pwa-install-button"
                    aria-label={t('pwa.installer.prompt.installAria')}
                    ref={installButtonRef}
                  >
                    {t('pwa.installer.prompt.install')}
                  </button>
                </div>
              </div>
              {/* Installation Benefits */}
              <div
                className="mt-4 pt-4 border-t border-gray-200"
                data-testid="pwa-install-benefits"
                id="pwa-install-benefits"
              >
                <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                  {benefitKeys.map((key) => (
                    <div key={key} className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{t(key)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Offline Status */}
          {showOfflineStatus && (
            <div
              className="fixed bottom-4 left-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 z-40"
              data-testid="offline-votes-indicator"
              role="status"
              aria-live={isOnline ? 'polite' : 'assertive'}
            >
              <div className="flex items-center justify_between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center" aria-hidden="true">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-800">
                      {isOnline
                        ? t('pwa.installer.offlineStatus.titleOnline')
                        : t('pwa.installer.offlineStatus.titleOffline')}
                    </h3>
                    <p className="text-sm text-yellow-700" id="offline-votes-description">
                      {t('pwa.installer.offlineStatus.description', { count: offlineVotes })}
                    </p>
                  </div>
                </div>
                {isOnline && (
                  <button
                    onClick={handleSyncOfflineVotes}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    data-testid="sync-offline-data-button"
                    aria-describedby="offline-votes-description"
                  >
                    {t('pwa.installer.offlineStatus.syncButton')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Connection Status */}
          {!isOnline && (
            <div
              className="fixed top-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg shadow-lg p-3 z-30"
              data-testid="offline-indicator"
              role="status"
              aria-live="assertive"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
                </svg>
                <span className="text-sm font-medium text-red-800">
                  {t('pwa.installer.offlineBanner')}
                </span>
              </div>
            </div>
          )}
    </>
  )
}
