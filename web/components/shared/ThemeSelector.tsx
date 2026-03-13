/**
 * @fileoverview Theme Selector Component
 *
 * Dropdown component for selecting application theme (light/dark/system).
 * Integrates with app store for theme management.
 *
 * @author Choices Platform Team
 * @created 2025-01-XX
 * @version 1.0.0
 */

'use client';

import { Moon, Sun, Monitor, ChevronDown } from 'lucide-react';
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { ScreenReaderSupport } from '@/lib/accessibility/screen-reader';
import {
  useAppActions,
  useTheme,
  useResolvedTheme,
  type ThemePreference,
} from '@/lib/stores/appStore';
import logger from '@/lib/utils/logger';

import { useI18n } from '@/hooks/useI18n';

type ThemeSelectorProps = {
  className?: string;
  variant?: 'dropdown' | 'buttons' | 'compact';
  showLabel?: boolean;
};

const THEME_OPTIONS_CONFIG: Array<{
  value: ThemePreference;
  icon: React.ReactNode;
  labelKey: string;
  descriptionKey: string;
}> = [
  { value: 'light', icon: <Sun className="h-4 w-4" />, labelKey: 'common.theme.light', descriptionKey: 'common.theme.lightDescription' },
  { value: 'dark', icon: <Moon className="h-4 w-4" />, labelKey: 'common.theme.dark', descriptionKey: 'common.theme.darkDescription' },
  { value: 'system', icon: <Monitor className="h-4 w-4" />, labelKey: 'common.theme.system', descriptionKey: 'common.theme.systemDescription' },
];

export default function ThemeSelector({
  className = '',
  variant = 'dropdown',
  showLabel = true,
}: ThemeSelectorProps) {
  const { t } = useI18n();
  const theme = useTheme();
  const themeOptions = useMemo(
    () =>
      THEME_OPTIONS_CONFIG.map((opt) => ({
        value: opt.value,
        label: t(opt.labelKey),
        description: t(opt.descriptionKey),
        icon: opt.icon,
      })),
    [t]
  );
  const resolvedTheme = useResolvedTheme();
  const { setTheme } = useAppActions();
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const [liveMessage, setLiveMessage] = useState('');

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

  const getCurrentThemeLabel = () => {
    const option = themeOptions.find((opt) => opt.value === theme);
    return option?.label ?? t('common.theme.system');
  };

  const handleThemeChange = useCallback(
    (newTheme: ThemePreference) => {
      try {
        setTheme(newTheme);
        const themeLabel = themeOptions.find((opt) => opt.value === newTheme)?.label ?? newTheme;
        announce(t('common.theme.changed', { theme: themeLabel }), 'polite');
        logger.info('Theme changed', { theme: newTheme });
      } catch (error) {
        logger.error('Failed to change theme:', error);
        announce('Failed to change theme', 'assertive');
      } finally {
        setIsOpen(false);
      }
    },
    [setTheme, announce, t, themeOptions],
  );

  const LiveRegion = () => (
    <div
      aria-live="polite"
      role="status"
      className="sr-only"
      data-testid="theme-selector-live-message"
    >
      {liveMessage}
    </div>
  );

  if (variant === 'buttons') {
    return (
      <div className={`space-y-2 ${className}`} data-testid="theme-selector">
        <LiveRegion />
        {showLabel && (
          <label className="block text-sm font-medium text-foreground/80">
            {t('common.theme.label')}
          </label>
        )}
        <div className="flex flex-wrap gap-2">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleThemeChange(option.value)}
              data-theme-option={option.value}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                theme === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground/80 hover:bg-muted'
              }`}
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`} data-testid="theme-selector">
        <LiveRegion />
        <button
          ref={toggleRef}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-foreground/80 hover:text-foreground transition-colors"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={`${menuId}-menu`}
          aria-label={t('common.theme.select')}
        >
          {themeOptions.find((opt) => opt.value === theme)?.icon}
          <span>{getCurrentThemeLabel()}</span>
          <ChevronDown className="h-4 w-4" />
        </button>

        {isOpen && (
          <div
            id={`${menuId}-menu`}
            role="listbox"
            aria-label={t('common.theme.options')}
            className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border z-50"
          >
            <div className="py-1">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  className={`w-full flex items-center space-x-3 text-left px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    theme === option.value
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/80 hover:bg-muted'
                  }`}
                  role="option"
                  aria-selected={theme === option.value}
                  data-theme-option={option.value}
                >
                  <span className="flex-shrink-0" aria-hidden="true">{option.icon}</span>
                  <div className="flex-1 flex items-center justify-between">
                    <span>{option.label}</span>
                    {theme === option.value && (
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
    <div className={`space-y-2 ${className}`} data-testid="theme-selector">
      <LiveRegion />
      {showLabel && (
        <label className="block text-sm font-medium text-foreground/80">
          {t('common.theme.label')}
        </label>
      )}
      <div className="relative">
        <button
          ref={toggleRef}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 border border-border rounded-lg bg-card text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={`${menuId}-menu`}
          aria-label={t('common.theme.select')}
        >
          <div className="flex items-center space-x-2">
            {themeOptions.find((opt) => opt.value === theme)?.icon}
            <span>{getCurrentThemeLabel()}</span>
            {theme === 'system' && (
              <span className="text-xs text-muted-foreground">
                ({resolvedTheme})
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>

        {isOpen && (
          <div
            id={`${menuId}-menu`}
            role="listbox"
            aria-label={t('common.theme.options')}
            className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg"
          >
            <div className="py-1">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  className={`w-full flex items-center space-x-3 text-left px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    theme === option.value
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/80 hover:bg-muted'
                  }`}
                  role="option"
                  aria-selected={theme === option.value}
                  data-theme-option={option.value}
                >
                  <span className="flex-shrink-0" aria-hidden="true">{option.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {option.description}
                    </div>
                  </div>
                  {theme === option.value && (
                    <span className="text-primary" aria-hidden="true">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

