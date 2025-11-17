/**
 * Hook for Message Templates
 * 
 * Provides React hooks for managing and using message templates
 * 
 * Created: January 26, 2025
 * Status: ✅ PRODUCTION
 */

import { useState, useCallback, useMemo } from 'react';

import { useI18n } from '@/hooks/useI18n';
import {
  MESSAGE_TEMPLATES,
  type MessageTemplate,
  getTemplateById,
  fillTemplate,
} from '@/lib/contact/message-templates';
import { localizeTemplate, localizeTemplates, type LocalizedTemplate } from '@/lib/contact/template-localization';
// withOptional removed
import logger from '@/lib/utils/logger';

export function useMessageTemplates() {
  const { t } = useI18n();
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});
  const [userInfo, setUserInfo] = useState<{
    name?: string;
    email?: string;
    address?: string;
  }>({});

  // Get all templates (localized)
  const allTemplates = useMemo(() => localizeTemplates(MESSAGE_TEMPLATES, t), [t]);

  // Get templates by category (localized)
  const templatesByCategory = useMemo(() => {
    const categories: Record<string, LocalizedTemplate[]> = {};
    const localized = localizeTemplates(MESSAGE_TEMPLATES, t);
    localized.forEach(template => {
      const category = template.category;
      if (category) {
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(template);
      }
    });
    return categories;
  }, [t]);

  // Select a template
  const selectTemplate = useCallback((templateId: string | null) => {
    if (!templateId) {
      setSelectedTemplate(null);
      setTemplateValues({});
      return;
    }

    const template = getTemplateById(templateId);
    if (template) {
      setSelectedTemplate(template);
      // Initialize with empty values
      const initialValues: Record<string, string> = {};
      template.placeholders.forEach(placeholder => {
        initialValues[placeholder.key] = '';
      });
      setTemplateValues(initialValues);
    }
  }, []);

  // Get localized selected template
  const localizedSelectedTemplate = useMemo(() => {
    if (!selectedTemplate) return null;
    return localizeTemplate(selectedTemplate, t);
  }, [selectedTemplate, t]);

  // Update a template value
  const updateTemplateValue = useCallback((key: string, value: string) => {
    setTemplateValues(prev => ({ ...prev, [key]: value }));
  }, []);

  // Fill the template with current values
  const filledTemplate = useMemo(() => {
    if (!selectedTemplate) return null;

    try {
      return fillTemplate(selectedTemplate, templateValues, userInfo);
    } catch (error) {
      logger.error('Error filling template:', error);
      return null;
    }
  }, [selectedTemplate, templateValues, userInfo]);

  // Validate template values (using localized template for error messages)
  const validation = useMemo(() => {
    if (!localizedSelectedTemplate) return { valid: true, missing: [] };
    // Use localized template for validation so error messages are translated
    const missing: string[] = [];
    localizedSelectedTemplate.placeholders.forEach(placeholder => {
      if (placeholder.required && !templateValues[placeholder.key]) {
        missing.push(placeholder.label);
      }
    });
    return {
      valid: missing.length === 0,
      missing,
    };
  }, [localizedSelectedTemplate, templateValues]);

  // Reset template selection
  const resetTemplate = useCallback(() => {
    setSelectedTemplate(null);
    setTemplateValues({});
  }, []);

  return {
    // Templates (localized)
    allTemplates,
    templatesByCategory,
    selectedTemplate: localizedSelectedTemplate,
    
    // Template management
    selectTemplate,
    updateTemplateValue,
    resetTemplate,
    
    // Filled template
    filledTemplate,
    
    // Validation
    validation,
    
    // User info
    userInfo,
    setUserInfo,
  };
}

