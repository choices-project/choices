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

import { MoonIcon, SunIcon, ComputerDesktopIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

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

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    value: 'light',
    label: 'Light',
    description: 'Light theme',
    icon: <SunIcon className="h-4 w-4" />,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Dark theme',
    icon: <MoonIcon className="h-4 w-4" />,
  },
  {
    value: 'system',
    label: 'System',
    description: 'Use system preference',
    icon: <ComputerDesktopIcon className="h-4 w-4" />,
  },
];

export default function ThemeSelector({
  className = '',
  variant = 'dropdown',
  showLabel = true,
}: ThemeSelectorProps) {
  const { t } = useI18n();
  const theme = useTheme();
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
    const option = THEME_OPTIONS.find((opt) => opt.value === theme);
    return option?.label ?? 'System';
  };

  const handleThemeChange = useCallback(
    (newTheme: ThemePreference) => {
      try {
        setTheme(newTheme);
        const themeLabel = THEME_OPTIONS.find((opt) => opt.value === newTheme)?.label ?? newTheme;
        announce(t('common.theme.changed', { theme: themeLabel }), 'polite');
        logger.info('Theme changed', { theme: newTheme });
      } catch (error) {
        logger.error('Failed to change theme:', error);
        announce('Failed to change theme', 'assertive');
      } finally {
        setIsOpen(false);
      }
    },
    [setTheme, announce, t],
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Theme
          </label>
        )}
        <div className="flex flex-wrap gap-2">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleThemeChange(option.value)}
              data-theme-option={option.value}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                theme === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
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
          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={`${menuId}-menu`}
          aria-label={t('common.theme.select')}
        >
          {THEME_OPTIONS.find((opt) => opt.value === theme)?.icon}
          <span>{getCurrentThemeLabel()}</span>
          <ChevronDownIcon className="h-4 w-4" />
        </button>

        {isOpen && (
          <div
            id={`${menuId}-menu`}
            role="listbox"
            aria-label={t('common.theme.options')}
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
          >
            <div className="py-1">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  className={`w-full flex items-center space-x-3 text-left px-4 py-2 text-sm transition-colors ${
                    theme === option.value
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  role="option"
                  aria-selected={theme === option.value}
                  data-theme-option={option.value}
                >
                  <span className="flex-shrink-0">{option.icon}</span>
                  <div className="flex-1 flex items-center justify-between">
                    <span>{option.label}</span>
                    {theme === option.value && (
                      <span className="text-blue-600 dark:text-blue-400">✓</span>
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('common.theme.label')}
        </label>
      )}
      <div className="relative">
        <button
          ref={toggleRef}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={`${menuId}-menu`}
          aria-label={t('common.theme.select')}
        >
          <div className="flex items-center space-x-2">
            {THEME_OPTIONS.find((opt) => opt.value === theme)?.icon}
            <span>{getCurrentThemeLabel()}</span>
            {theme === 'system' && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({resolvedTheme})
              </span>
            )}
          </div>
          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
        </button>

        {isOpen && (
          <div
            id={`${menuId}-menu`}
            role="listbox"
            aria-label={t('common.theme.options')}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg"
          >
            <div className="py-1">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  className={`w-full flex items-center space-x-3 text-left px-4 py-2 text-sm transition-colors ${
                    theme === option.value
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  role="option"
                  aria-selected={theme === option.value}
                  data-theme-option={option.value}
                >
                  <span className="flex-shrink-0">{option.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {option.description}
                    </div>
                  </div>
                  {theme === option.value && (
                    <span className="text-blue-600 dark:text-blue-400">✓</span>
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

