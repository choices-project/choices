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

import { ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

import { LANGUAGE_OPTIONS } from '@/features/profile/utils/profile-constants';
import { useI18n } from '@/hooks/useI18n';
import { useAppActions } from '@/lib/stores/appStore';
import logger from '@/lib/utils/logger';

type LanguageSelectorProps = {
  className?: string;
  variant?: 'dropdown' | 'buttons' | 'compact';
  showLabel?: boolean;
  showNativeNames?: boolean;
}

export default function LanguageSelector({ 
  className = '',
  variant = 'dropdown',
  showLabel = true,
  showNativeNames = true
}: LanguageSelectorProps) {
  const { t, currentLanguage, changeLanguage } = useI18n();
  const isLoading = false;
  const getDisplayName = (code: string) => {
    const opt = LANGUAGE_OPTIONS.find(o => o.code === code);
    return showNativeNames ? (opt?.native ?? code) : (opt?.name ?? code);
  };
  const { updateSettings } = useAppActions();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = async (language: string) => {
    try {
      await changeLanguage(language);
      updateSettings({ language });
      setIsOpen(false);
    } catch (error) {
      logger.error('Failed to change language:', error);
    }
  };

  if (variant === 'buttons') {
    return (
      <div className={`space-y-2 ${className}`} data-testid="language-selector">
        {showLabel && (
          <label className="block text-sm font-medium text-gray-700">
            {t('settings.language')}
          </label>
        )}
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              disabled={isLoading}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentLanguage === lang.code
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
        >
          <GlobeAltIcon className="h-4 w-4" />
          <span>{getDisplayName(currentLanguage)}</span>
          <ChevronDownIcon className="h-4 w-4" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="py-1">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    currentLanguage === lang.code
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{showNativeNames ? lang.native : lang.name}</span>
                    {currentLanguage === lang.code && (
                      <span className="text-blue-600">✓</span>
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
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700">
          {t('settings.language')}
        </label>
      )}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <div className="flex items-center space-x-2">
            <GlobeAltIcon className="h-4 w-4 text-gray-400" />
            <span>{getDisplayName(currentLanguage)}</span>
          </div>
          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
            <div className="py-1">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    currentLanguage === lang.code
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {showNativeNames ? lang.native : lang.name}
                      </div>
                      {showNativeNames && (
                        <div className="text-xs text-gray-500">
                          {lang.name}
                        </div>
                      )}
                    </div>
                    {currentLanguage === lang.code && (
                      <span className="text-blue-600">✓</span>
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
