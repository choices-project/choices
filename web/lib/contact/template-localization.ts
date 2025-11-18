/**
 * Template Localization Utilities
 * 
 * Provides functions to localize message templates for i18n support.
 * 
 * Created: January 2025
 * Status: ✅ PRODUCTION
 */

import type { MessageTemplate } from './message-templates';

export type LocalizedTemplate = Omit<MessageTemplate, 'title' | 'description' | 'placeholders'> & {
  title: string;
  description: string;
  placeholders: Array<{
    key: string;
    label: string;
    example: string;
    required: boolean;
  }>;
};

/**
 * Localize a template using translation function
 */
export function localizeTemplate(
  template: MessageTemplate,
  t: (key: string, params?: Record<string, string>) => string
): LocalizedTemplate {
  const baseKey = `contact.templates.${template.id}`;
  
  return {
    ...template,
    title: t(`${baseKey}.title`),
    description: t(`${baseKey}.description`),
    placeholders: template.placeholders.map(placeholder => ({
      ...placeholder,
      label: t(`${baseKey}.placeholders.${placeholder.key}.label`),
      example: t(`${baseKey}.placeholders.${placeholder.key}.example`),
    })),
  };
}

/**
 * Localize an array of templates
 */
export function localizeTemplates(
  templates: MessageTemplate[],
  t: (key: string, params?: Record<string, string>) => string
): LocalizedTemplate[] {
  return templates.map(template => localizeTemplate(template, t));
}

