/**
 * @fileoverview Language Selector Component
 *
 * Dropdown component for selecting application language.
 * Integrates with i18n system and app store.
 *
 * @author Choices Platform Team
 * @created 2025-10-24
 * @version 2.0.0
 * @since 1.0.0
 */

'use client';

import { ChevronDown, Globe } from 'lucide-react';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

import { LANGUAGE_OPTIONS } from '@/features/profile/utils/profile-constants';

import { ScreenReaderSupport } from '@/lib/accessibility/screen-reader';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/lib/i18n/config';
import { useAppActions } from '@/lib/stores/appStore';
import logger from '@/lib/utils/logger';

import { useI18n } from '@/hooks/useI18n';

type LanguageSelectorProps = {
  className?: string;
  variant?: 'dropdown' | 'buttons' | 'compact';
  showLabel?: boolean;
  showNativeNames?: boolean;
}

const SUPPORTED_LANGUAGE_OPTIONS = LANGUAGE_OPTIONS.filter((option) =>
  SUPPORTED_LOCALES.includes(option.code as SupportedLocale),
);

export default function LanguageSelector({
  className = '',
  variant = 'dropdown',
  showLabel = true,
  showNativeNames = true
}: LanguageSelectorProps) {
  const { t, currentLanguage, changeLanguage } = useI18n();
  const isLoading = false;
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const [liveMessage, setLiveMessage] = useState('');
  // Track selected language locally for immediate UI update while router.refresh() completes
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const announce = useCallback(
    (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
      setLiveMessage(message);
      ScreenReaderSupport.announce(message, politeness);
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);
  const getDisplayName = (code: string) => {
    const opt = SUPPORTED_LANGUAGE_OPTIONS.find(o => o.code === code);
    return showNativeNames ? (opt?.native ?? code) : (opt?.name ?? code);
  };
  const { updateSettings } = useAppActions();

  // Use selectedLanguage if set (for immediate UI update), otherwise use currentLanguage from hook
  const displayLanguage = selectedLanguage ?? currentLanguage;

  const handleLanguageChange = async (language: string) => {
    try {
      // Update local state immediately for instant UI feedback
      setSelectedLanguage(language);
      updateSettings({ language });
      
      // Set locale cookie and refresh router
      await changeLanguage(language);
      
      // Force a re-render by updating state after a brief delay
      // This ensures the UI updates even if router.refresh() is slow
      setTimeout(() => {
        setSelectedLanguage(language); // Keep selected language until hook catches up
      }, 100);
      
      const languageLabel = getDisplayName(language);
      announce(t('navigation.languageSelector.live.changed', { language: languageLabel }));
    } catch (error) {
      logger.error('Failed to change language:', error);
      // Reset selected language on error
      setSelectedLanguage(null);
      announce(t('navigation.languageSelector.live.error'), 'assertive');
    } finally {
      setIsOpen(false);
    }
  };

  // Reset selectedLanguage when currentLanguage updates (after router.refresh() completes)
  // But only if they match - keep selectedLanguage if currentLanguage hasn't updated yet
  useEffect(() => {
    if (selectedLanguage && currentLanguage === selectedLanguage) {
      // Clear local state once hook has caught up
      setSelectedLanguage(null);
    }
  }, [currentLanguage, selectedLanguage]);

  const LiveRegion = () => (
    <div
      aria-live="polite"
      role="status"
      className="sr-only"
      data-testid="language-selector-live-message"
    >
      {liveMessage}
    </div>
  );

  if (variant === 'buttons') {
    return (
      <div className={`space-y-2 ${className}`} data-testid="language-selector">
        <LiveRegion />
        {showLabel && (
          <label className="block text-sm font-medium text-foreground/80">
            {t('settings.language')}
          </label>
        )}
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_LANGUAGE_OPTIONS.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              disabled={isLoading}
              data-language-option={lang.code}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentLanguage === lang.code
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground/80 hover:bg-muted'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {showNativeNames ? lang.native : lang.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`} data-testid="language-selector">
        <LiveRegion />
        <button
          ref={toggleRef}
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-foreground/80 hover:text-foreground transition-colors"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={`${menuId}-menu`}
        >
          <Globe className="h-4 w-4" />
          <span>{getDisplayName(displayLanguage)}</span>
          <ChevronDown className="h-4 w-4" />
        </button>

        {isOpen && (
          <div
            id={`${menuId}-menu`}
            role="listbox"
            aria-label={t('settings.language')}
            className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border z-50"
          >
            <div className="py-1">
              {SUPPORTED_LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    currentLanguage === lang.code
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/80 hover:bg-muted'
                  }`}
                  role="option"
                  aria-selected={currentLanguage === lang.code}
                  data-language-option={lang.code}
                >
                  <div className="flex items-center justify-between">
                    <span>{showNativeNames ? lang.native : lang.name}</span>
                    {currentLanguage === lang.code && (
                      <span className="text-primary" aria-hidden="true">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`space-y-2 ${className}`} data-testid="language-selector">
      <LiveRegion />
      {showLabel && (
        <label className="block text-sm font-medium text-foreground/80">
          {t('settings.language')}
        </label>
      )}
      <div className="relative">
        <button
            ref={toggleRef}
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className="w-full flex items-center justify-between px-3 py-2 border border-border rounded-lg bg-card text-foreground/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={`${menuId}-menu`}
        >
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span>{getDisplayName(displayLanguage)}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>

        {isOpen && (
            <div
              id={`${menuId}-menu`}
              role="listbox"
              aria-label={t('settings.language')}
              className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg"
            >
            <div className="py-1">
              {SUPPORTED_LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    currentLanguage === lang.code
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/80 hover:bg-muted'
                  }`}
                    role="option"
                    aria-selected={currentLanguage === lang.code}
                  data-language-option={lang.code}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {showNativeNames ? lang.native : lang.name}
                      </div>
                      {showNativeNames && (
                        <div className="text-xs text-muted-foreground">
                          {lang.name}
                        </div>
                      )}
                    </div>
                    {currentLanguage === lang.code && (
                      <span className="text-primary" aria-hidden="true">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
