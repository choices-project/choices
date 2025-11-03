/**
 * Translated Text Component
 * 
 * Component for displaying translated text with automatic language updates
 * Supports parameter interpolation and formatting
 * 
 * Created: January 23, 2025
 * Status: ✅ ACTIVE
 */

'use client';

import React from 'react';

import { useI18n } from '@/hooks/useI18n';

type TranslatedTextProps = {
  translationKey: string;
  params?: Record<string, string | number>;
  fallback?: string;
  className?: string;
  as?: React.ElementType;
  children?: React.ReactNode;
}

export default function TranslatedText({
  translationKey,
  params,
  fallback,
  className = '',
  as: Component = 'span',
  children,
  ...props
}: TranslatedTextProps) {
  const { t } = useI18n();
  
  // Convert params to string-only format for t function
  const stringParams = params ? Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  ) : undefined;
  
  const translatedText = t(translationKey, stringParams);
  const displayText = translatedText === translationKey ? (fallback ?? translationKey) : translatedText;

  return (
    <Component className={className} {...props}>
      {children ?? displayText}
    </Component>
  );
}

// Convenience components for common use cases
export function TranslatedHeading({ 
  level = 1, 
  translationKey, 
  params, 
  fallback, 
  className = '',
  ...props 
}: {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  translationKey: string;
  params?: Record<string, string | number>;
  fallback?: string;
  className?: string;
} & React.HTMLAttributes<HTMLHeadingElement>) {
  const { t } = useI18n();
  
  // Convert params to string-only format for t function
  const stringParams = params ? Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  ) : undefined;
  
  const translatedText = t(translationKey, stringParams);
  const displayText = translatedText === translationKey ? (fallback ?? translationKey) : translatedText;
  const HeadingTag = `h${level}` as React.ElementType;

  return (
    <HeadingTag className={className} {...props}>
      {displayText}
    </HeadingTag>
  );
}

export function TranslatedButton({
  translationKey,
  params,
  fallback,
  className = '',
  ...props
}: {
  translationKey: string;
  params?: Record<string, string | number>;
  fallback?: string;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { t } = useI18n();
  
  // Convert params to string-only format for t function
  const stringParams = params ? Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  ) : undefined;
  
  const translatedText = t(translationKey, stringParams);
  const displayText = translatedText === translationKey ? (fallback ?? translationKey) : translatedText;

  return (
    <button className={className} {...props}>
      {displayText}
    </button>
  );
}

export function TranslatedLabel({
  translationKey,
  params,
  fallback,
  className = '',
  ...props
}: {
  translationKey: string;
  params?: Record<string, string | number>;
  fallback?: string;
  className?: string;
} & React.LabelHTMLAttributes<HTMLLabelElement>) {
  const { t } = useI18n();
  
  // Convert params to string-only format for t function
  const stringParams = params ? Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  ) : undefined;
  
  const translatedText = t(translationKey, stringParams);
  const displayText = translatedText === translationKey ? (fallback ?? translationKey) : translatedText;

  return (
    <label className={className} {...props}>
      {displayText}
    </label>
  );
}