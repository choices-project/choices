/**
 * Data Validation Pipeline
 * 
 * Comprehensive data validation pipeline for government data with
 * quality checks, deduplication, and consistency validation.
 */

import { devLog } from '@/lib/utils/logger';

import type { 
  NormalizedRepresentative,
  NormalizedBill 
} from './data-transformation';

export type ValidationRule<T = unknown> = {
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  validator: (data: T) => boolean;
  fixer?: (data: T) => T;
}

export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  fixes: ValidationFix[];
  quality: {
    completeness: number;
    accuracy: number;
    consistency: number;
    uniqueness: number;
  };
}

export type ValidationError = {
  field: string;
  message: string;
  value: unknown;
  rule: string;
  severity: 'error' | 'warning' | 'info';
}

export type ValidationWarning = {
  field: string;
  message: string;
  value: unknown;
  suggestion: string;
}

export type ValidationFix = {
  field: string;
  originalValue: unknown;
  fixedValue: unknown;
  rule: string;
}

export type DeduplicationResult = {
  originalCount: number;
  uniqueCount: number;
  duplicates: Array<{
    id: string;
    name: string;
    sources: string[];
    confidence: number;
  }>;
}

/**
 * Data validation pipeline for government data
 */
export class DataValidationPipeline {
  private rules: Map<string, ValidationRule<any>> = new Map();
  private seenRecords: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeValidationRules();
  }

  /**
   * Initialize validation rules
   */
  private initializeValidationRules(): void {
    // Representative validation rules
    this.addRule({
      name: 'representative-required-fields',
      description: 'All required fields must be present',
      severity: 'error',
      validator: ((rep: NormalizedRepresentative) => !!(
        rep.id && rep.name && rep.party && rep.office && 
        rep.level && rep.jurisdiction
      )) as any
    });

    this.addRule({
      name: 'representative-name-format',
      description: 'Name must be properly formatted',
      severity: 'error',
      validator: ((rep: NormalizedRepresentative) => {
        if (!rep.name) return false;
        const nameParts = rep.name.trim().split(' ');
        return nameParts.length >= 2 && nameParts.every(part => part.length > 0);
      }) as any,
      fixer: ((rep: NormalizedRepresentative) => Object.assign({}, rep, {
        name: rep.name.trim().replace(/\s+/g, ' ')
      })) as any
    });

    this.addRule({
      name: 'representative-party-valid',
      description: 'Party must be a valid political party',
      severity: 'warning',
      validator: ((rep: NormalizedRepresentative) => {
        const validParties = ['Republican', 'Democrat', 'Independent', 'Green', 'Libertarian', 'Other'];
        return validParties.includes(rep.party) || rep.party === 'Unknown';
      }) as any,
      fixer: ((rep: NormalizedRepresentative) => Object.assign({}, rep, {
        party: this.normalizeParty(rep.party)
      })) as any
    });

    this.addRule({
      name: 'representative-jurisdiction-format',
      description: 'Jurisdiction must be valid state code or US',
      severity: 'error',
      validator: ((rep: NormalizedRepresentative) => {
        if (rep.level === 'federal') {
          return rep.jurisdiction === 'US';
        }
        return /^[A-Z]{2}$/.test(rep.jurisdiction);
      }) as any
    });

    this.addRule({
      name: 'representative-contact-format',
      description: 'Contact information must be properly formatted',
      severity: 'warning',
      validator: ((rep: NormalizedRepresentative) => {
        if (rep.contact.phone && !/^\+?[\d\s\-()]+$/.test(rep.contact.phone)) {
          return false;
        }
        if (rep.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rep.contact.email)) {
          return false;
        }
        if (rep.contact.website && !/^https?:\/\/.+/.test(rep.contact.website)) {
          return false;
        }
        return true;
      }) as any,
      fixer: ((rep: NormalizedRepresentative) => Object.assign({}, rep, {
        contact: Object.assign({}, rep.contact, {
          phone: rep.contact.phone?.replace(/[^\d\s\-()]/g, ''),
          email: rep.contact.email?.toLowerCase().trim(),
          website: rep.contact.website?.startsWith('http') ? rep.contact.website : 
                   rep.contact.website ? `https://${rep.contact.website}` : rep.contact.website
        })
      })) as any
    });

    // Bill validation rules
    this.addRule({
      name: 'bill-required-fields',
      description: 'All required bill fields must be present',
      severity: 'error',
      validator: ((bill: NormalizedBill) => !!(
        bill.id && bill.title && bill.billNumber && 
        bill.level && bill.jurisdiction
      )) as any
    });

    this.addRule({
      name: 'bill-number-format',
      description: 'Bill number must follow proper format',
      severity: 'error',
      validator: ((bill: NormalizedBill) => {
        if (!bill.billNumber) return false;
        // Federal bills: H.R. 1234, S. 1234, etc.
        // State bills: HB 1234, SB 1234, etc.
        return /^[A-Z.]+\s*\d+/.test(bill.billNumber);
      }) as any
    });

    this.addRule({
      name: 'bill-date-format',
      description: 'Dates must be valid ISO format',
      severity: 'error',
      validator: ((bill: NormalizedBill) => {
        if (bill.introducedDate && isNaN(Date.parse(bill.introducedDate))) {
          return false;
        }
        if (bill.lastActionDate && isNaN(Date.parse(bill.lastActionDate))) {
          return false;
        }
        return true;
      }) as any
    });
  }

  /**
   * Add a validation rule
   */
  private addRule(rule: ValidationRule): void {
    this.rules.set(rule.name, rule);
  }

  /**
   * Validate a representative record
   */
  validateRepresentative(rep: NormalizedRepresentative): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const fixes: ValidationFix[] = [];

    // Run all validation rules
    for (const [ruleName, rule] of this.rules) {
      if (ruleName.startsWith('representative-')) {
        try {
          const isValid = rule.validator(rep);
          
          if (!isValid) {
            const error: ValidationError = {
              field: this.getFieldFromRule(ruleName),
              message: rule.description,
              value: this.getFieldValue(rep, ruleName),
              rule: ruleName,
              severity: rule.severity
            };

            if (rule.severity === 'error') {
              errors.push(error);
            } else {
              warnings.push({
                field: error.field,
                message: error.message,
                value: error.value,
                suggestion: `Consider fixing this field: ${error.field}`
              });
            }

            // Apply fix if available
            if (rule.fixer) {
              const fixed = rule.fixer(rep);
              fixes.push({
                field: error.field,
                originalValue: error.value,
                fixedValue: this.getFieldValue(fixed as Record<string, unknown>, ruleName),
                rule: ruleName
              });
            }
          }
        } catch (error) {
          devLog('Validation rule failed', { ruleName, error });
        }
      }
    }

    const quality = this.calculateQuality(rep, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fixes,
      quality
    };
  }

  /**
   * Validate a bill record
   */
  validateBill(bill: NormalizedBill): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const fixes: ValidationFix[] = [];

    // Run all validation rules
    for (const [ruleName, rule] of this.rules) {
      if (ruleName.startsWith('bill-')) {
        try {
          const isValid = rule.validator(bill);
          
          if (!isValid) {
            const error: ValidationError = {
              field: this.getFieldFromRule(ruleName),
              message: rule.description,
              value: this.getFieldValue(bill, ruleName),
              rule: ruleName,
              severity: rule.severity
            };

            if (rule.severity === 'error') {
              errors.push(error);
            } else {
              warnings.push({
                field: error.field,
                message: error.message,
                value: error.value,
                suggestion: `Consider fixing this field: ${error.field}`
              });
            }

            // Apply fix if available
            if (rule.fixer) {
              const fixed = rule.fixer(bill);
              fixes.push({
                field: error.field,
                originalValue: error.value,
                fixedValue: this.getFieldValue(fixed as Record<string, unknown>, ruleName),
                rule: ruleName
              });
            }
          }
        } catch (error) {
          devLog('Validation rule failed', { ruleName, error });
        }
      }
    }

    const quality = this.calculateQuality(bill, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fixes,
      quality
    };
  }

  /**
   * Deduplicate representative records
   */
  deduplicateRepresentatives(reps: NormalizedRepresentative[]): DeduplicationResult {
    const seen = new Map<string, NormalizedRepresentative>();
    const duplicates: Array<{
      id: string;
      name: string;
      sources: string[];
      confidence: number;
    }> = [];

    for (const rep of reps) {
      const key = this.generateDeduplicationKey(rep);
      
      if (seen.has(key)) {
        const existing = seen.get(key);
        if (!existing) continue; // Should not happen if seen.has(key) is true, but TypeScript safety
        const confidence = this.calculateDuplicateConfidence(existing, rep);
        
        duplicates.push({
          id: rep.id,
          name: rep.name,
          sources: [...existing.sources, ...rep.sources],
          confidence
        });

        // Merge sources
        existing.sources = [...new Set([...existing.sources, ...rep.sources])];
      } else {
        seen.set(key, rep);
      }
    }

    return {
      originalCount: reps.length,
      uniqueCount: seen.size,
      duplicates
    };
  }

  /**
   * Deduplicate bill records
   */
  deduplicateBills(bills: NormalizedBill[]): DeduplicationResult {
    const seen = new Map<string, NormalizedBill>();
    const duplicates: Array<{
      id: string;
      name: string;
      sources: string[];
      confidence: number;
    }> = [];

    for (const bill of bills) {
      const key = this.generateBillDeduplicationKey(bill);
      
      if (seen.has(key)) {
        const existing = seen.get(key);
        if (!existing) continue; // TypeScript safety check
        const confidence = this.calculateBillDuplicateConfidence(existing, bill);
        
        duplicates.push({
          id: bill.id,
          name: bill.title,
          sources: [...existing.sources, ...bill.sources],
          confidence
        });

        // Merge sources
        existing.sources = [...new Set([...existing.sources, ...bill.sources])];
      } else {
        seen.set(key, bill);
      }
    }

    return {
      originalCount: bills.length,
      uniqueCount: seen.size,
      duplicates
    };
  }

  /**
   * Generate deduplication key for representative
   */
  private generateDeduplicationKey(rep: NormalizedRepresentative): string {
    const name = rep.name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
    const office = rep.office.toLowerCase();
    const jurisdiction = rep.jurisdiction.toLowerCase();
    
    return `${name}-${office}-${jurisdiction}`;
  }

  /**
   * Generate deduplication key for bill
   */
  private generateBillDeduplicationKey(bill: NormalizedBill): string {
    const billNumber = bill.billNumber.toLowerCase().replace(/[^\w]/g, '');
    const jurisdiction = bill.jurisdiction.toLowerCase();
    
    return `${billNumber}-${jurisdiction}`;
  }

  /**
   * Calculate duplicate confidence score
   */
  private calculateDuplicateConfidence(rep1: NormalizedRepresentative, rep2: NormalizedRepresentative): number {
    let score = 0;
    
    // Name similarity
    if (rep1.name.toLowerCase() === rep2.name.toLowerCase()) {
      score += 0.4;
    }
    
    // Office similarity
    if (rep1.office === rep2.office) {
      score += 0.3;
    }
    
    // Jurisdiction similarity
    if (rep1.jurisdiction === rep2.jurisdiction) {
      score += 0.3;
    }
    
    return score;
  }

  /**
   * Calculate bill duplicate confidence score
   */
  private calculateBillDuplicateConfidence(bill1: NormalizedBill, bill2: NormalizedBill): number {
    let score = 0;
    
    // Bill number similarity
    if (bill1.billNumber === bill2.billNumber) {
      score += 0.6;
    }
    
    // Title similarity
    if (bill1.title.toLowerCase() === bill2.title.toLowerCase()) {
      score += 0.4;
    }
    
    return score;
  }

  /**
   * Calculate data quality metrics
   */
  private calculateQuality(data: Record<string, unknown>, errors: ValidationError[], warnings: ValidationWarning[]): {
    completeness: number;
    accuracy: number;
    consistency: number;
    uniqueness: number;
  } {
    const totalFields = Object.keys(data).length;
    const errorFields = new Set(errors.map(e => e.field)).size;
    const warningFields = new Set(warnings.map(w => w.field)).size;
    
    return {
      completeness: Math.max(0, 1 - (errorFields / totalFields)),
      accuracy: Math.max(0, 1 - (warningFields / totalFields)),
      consistency: 0.9, // Would need more complex logic
      uniqueness: 1.0 // Would need to check against existing data
    };
  }

  /**
   * Get field name from rule name
   */
  private getFieldFromRule(ruleName: string): string {
    const fieldMap: Record<string, string> = {
      'representative-required-fields': 'general',
      'representative-name-format': 'name',
      'representative-party-valid': 'party',
      'representative-jurisdiction-format': 'jurisdiction',
      'representative-contact-format': 'contact',
      'bill-required-fields': 'general',
      'bill-number-format': 'billNumber',
      'bill-date-format': 'dates'
    };
    
    return fieldMap[ruleName] ?? 'unknown';
  }

  /**
   * Get field value from data object
   */
  private getFieldValue(data: Record<string, unknown>, ruleName: string): unknown {
    const fieldMap: Record<string, string> = {
      'representative-name-format': 'name',
      'representative-party-valid': 'party',
      'representative-jurisdiction-format': 'jurisdiction',
      'representative-contact-format': 'contact',
      'bill-number-format': 'billNumber',
      'bill-date-format': 'introducedDate'
    };
    
    const field = fieldMap[ruleName];
    return field ? data[field] : undefined;
  }

  /**
   * Normalize party name
   */
  private normalizeParty(party: string): string {
    const partyMap: Record<string, string> = {
      'r': 'Republican',
      'd': 'Democrat',
      'i': 'Independent',
      'g': 'Green',
      'l': 'Libertarian',
      'republican': 'Republican',
      'democrat': 'Democrat',
      'democratic': 'Democrat',
      'independent': 'Independent',
      'green': 'Green',
      'libertarian': 'Libertarian'
    };
    
    return partyMap[party.toLowerCase()] ?? party;
  }
}

/**
 * Create default data validation pipeline
 */
export function createDataValidationPipeline(): DataValidationPipeline {
  return new DataValidationPipeline();
}
