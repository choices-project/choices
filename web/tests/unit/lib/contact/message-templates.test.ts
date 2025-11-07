/**
 * Message Templates Unit Tests
 * 
 * Tests for message template system functionality
 * 
 * Created: January 26, 2025
 */

import { describe, it, expect } from '@jest/globals';

import {
  MESSAGE_TEMPLATES,
  getTemplateById,
  getTemplatesByCategory,
  getTemplatesByTag,
  fillTemplate,
  validateTemplateValues,
} from '@/lib/contact/message-templates';

describe('Message Templates', () => {
  describe('getTemplateById', () => {
    it('should return template by id', () => {
      const template = getTemplateById('support-bill');
      expect(template).toBeDefined();
      expect(template?.id).toBe('support-bill');
      expect(template?.title).toBe('Support for Legislation');
    });

    it('should return undefined for invalid id', () => {
      const template = getTemplateById('non-existent');
      expect(template).toBeUndefined();
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should return templates by category', () => {
      const supportTemplates = getTemplatesByCategory('support');
      expect(supportTemplates.length).toBeGreaterThan(0);
      expect(supportTemplates.every(t => t.category === 'support')).toBe(true);
    });

    it('should return empty array for invalid category', () => {
      const templates = getTemplatesByCategory('invalid' as any);
      expect(templates).toEqual([]);
    });
  });

  describe('getTemplatesByTag', () => {
    it('should return templates by tag', () => {
      const templates = getTemplatesByTag('legislation');
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every(t => t.tags.includes('legislation'))).toBe(true);
    });

    it('should return empty array for non-existent tag', () => {
      const templates = getTemplatesByTag('non-existent-tag');
      expect(templates).toEqual([]);
    });
  });

  describe('fillTemplate', () => {
    it('should fill template with values', () => {
      const template = getTemplateById('support-bill');
      expect(template).toBeDefined();

      if (!template) return;

      const values = {
        billName: 'Climate Action Act',
        billNumber: 'H.R. 1234',
        representativeLastName: 'Smith',
        personalStatement: 'I support this bill',
        reason1: 'It addresses climate change',
        userName: 'John Doe',
      };

      const result = fillTemplate(template, values);

      expect(result.subject).toContain('Climate Action Act');
      expect(result.body).toContain('Climate Action Act');
      expect(result.body).toContain('John Doe');
      expect(result.subject).not.toContain('{{');
      expect(result.body).not.toContain('{{');
    });

    it('should handle user info', () => {
      const template = getTemplateById('support-bill');
      expect(template).toBeDefined();

      if (!template) return;

      const values = {
        billName: 'Test Bill',
        representativeLastName: 'Smith',
        personalStatement: 'Test',
        reason1: 'Test',
      };

      const userInfo = {
        name: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St',
      };

      const result = fillTemplate(template, values, userInfo);

      // userName is added from userInfo.name
      expect(result.body).toContain('John Doe');
      // userAddress is added from userInfo.address
      expect(result.body).toContain('123 Main St');
      // Note: userEmail is only used if template has {{userEmail}} placeholder
      // The support-bill template uses {{userAddress}} but not {{userEmail}}
      // Check if email is present (may not be if template doesn't use it)
      if (template.body.includes('{{userEmail}}')) {
        expect(result.body).toContain('john@example.com');
      }
    });

    it('should preserve existing values when user info omits them', () => {
      const template = getTemplateById('support-bill');
      expect(template).toBeDefined();

      if (!template) return;

      const values = {
        billName: 'Resilient Communities Act',
        representativeLastName: 'Ortega',
        personalStatement: 'Resilience saves lives.',
        reason1: 'Protect vulnerable communities.',
        userName: 'Existing Supporter',
      };

      const userInfo = {
        email: 'supporter@example.com',
        name: undefined,
      };

      const result = fillTemplate(template, values, userInfo);

      expect(result.body).toContain('Existing Supporter');
      if (template.body.includes('{{userEmail}}')) {
        expect(result.body).toContain('supporter@example.com');
      }
    });

    it('should remove unfilled placeholders', () => {
      const template = getTemplateById('support-bill');
      expect(template).toBeDefined();

      if (!template) return;

      const values = {
        billName: 'Test Bill',
        representativeLastName: 'Smith',
        personalStatement: 'Test',
        reason1: 'Test',
        userName: 'John Doe',
      };

      const result = fillTemplate(template, values);

      // Should not contain placeholder syntax
      expect(result.subject).not.toMatch(/\{\{[^}]+\}\}/);
      expect(result.body).not.toMatch(/\{\{[^}]+\}\}/);
    });
  });

  describe('validateTemplateValues', () => {
    it('should validate required fields', () => {
      const template = getTemplateById('support-bill');
      expect(template).toBeDefined();

      if (!template) return;

      const values = {
        billName: 'Test Bill',
        // Missing required fields
      };

      const validation = validateTemplateValues(template, values);

      expect(validation.valid).toBe(false);
      expect(validation.missing.length).toBeGreaterThan(0);
    });

    it('should pass validation with all required fields', () => {
      const template = getTemplateById('support-bill');
      expect(template).toBeDefined();

      if (!template) return;

      const requiredFields: Record<string, string> = {};
      template.placeholders.forEach(placeholder => {
        if (placeholder.required) {
          requiredFields[placeholder.key] = 'test value';
        }
      });

      const validation = validateTemplateValues(template, requiredFields);

      expect(validation.valid).toBe(true);
      expect(validation.missing).toEqual([]);
    });
  });

  describe('Template Structure', () => {
    it('should have all required template properties', () => {
      MESSAGE_TEMPLATES.forEach(template => {
        expect(template.id).toBeDefined();
        expect(template.title).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.category).toBeDefined();
        expect(template.subject).toBeDefined();
        expect(template.body).toBeDefined();
        expect(Array.isArray(template.placeholders)).toBe(true);
        expect(Array.isArray(template.tags)).toBe(true);
      });
    });

    it('should have valid placeholder structure', () => {
      MESSAGE_TEMPLATES.forEach(template => {
        template.placeholders.forEach(placeholder => {
          expect(placeholder.key).toBeDefined();
          expect(placeholder.label).toBeDefined();
          expect(placeholder.example).toBeDefined();
          expect(typeof placeholder.required).toBe('boolean');
        });
      });
    });

    it('should have placeholders referenced in template strings', () => {
      MESSAGE_TEMPLATES.forEach(template => {
        const placeholdersInSubject = (template.subject.match(/\{\{(\w+)\}\}/g) ?? [])
          .map(m => m.replace(/[{}]/g, ''));
        const placeholdersInBody = (template.body.match(/\{\{(\w+)\}\}/g) ?? [])
          .map(m => m.replace(/[{}]/g, ''));
        const allPlaceholders = [...placeholdersInSubject, ...placeholdersInBody];
        const uniquePlaceholders = [...new Set(allPlaceholders)];

        const definedPlaceholderKeys = new Set(template.placeholders.map(p => p.key));

        // All placeholders in template should be defined
        uniquePlaceholders.forEach(placeholder => {
          expect(definedPlaceholderKeys.has(placeholder)).toBe(true);
        });
      });
    });
  });
});

