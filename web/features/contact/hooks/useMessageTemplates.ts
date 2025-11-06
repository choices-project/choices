/**
 * Hook for Message Templates
 * 
 * Provides React hooks for managing and using message templates
 * 
 * Created: January 26, 2025
 * Status: ✅ PRODUCTION
 */

import { useState, useCallback, useMemo } from 'react';

import {
  MESSAGE_TEMPLATES,
  type MessageTemplate,
  getTemplateById,
  fillTemplate,
  validateTemplateValues,
} from '@/lib/contact/message-templates';

export function useMessageTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});
  const [userInfo, setUserInfo] = useState<{
    name?: string;
    email?: string;
    address?: string;
  }>({});

  // Get all templates
  const allTemplates = useMemo(() => MESSAGE_TEMPLATES, []);

  // Get templates by category
  const templatesByCategory = useMemo(() => {
    const categories: Record<string, MessageTemplate[]> = {};
    MESSAGE_TEMPLATES.forEach(template => {
      const category = template.category;
      if (category) {
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(template);
      }
    });
    return categories;
  }, []);

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

  // Update a template value
  const updateTemplateValue = useCallback((key: string, value: string) => {
    setTemplateValues(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Fill the template with current values
  const filledTemplate = useMemo(() => {
    if (!selectedTemplate) return null;

    try {
      return fillTemplate(selectedTemplate, templateValues, userInfo);
    } catch (error) {
      console.error('Error filling template:', error);
      return null;
    }
  }, [selectedTemplate, templateValues, userInfo]);

  // Validate template values
  const validation = useMemo(() => {
    if (!selectedTemplate) return { valid: true, missing: [] };
    return validateTemplateValues(selectedTemplate, templateValues);
  }, [selectedTemplate, templateValues]);

  // Reset template selection
  const resetTemplate = useCallback(() => {
    setSelectedTemplate(null);
    setTemplateValues({});
  }, []);

  return {
    // Templates
    allTemplates,
    templatesByCategory,
    selectedTemplate,
    
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

