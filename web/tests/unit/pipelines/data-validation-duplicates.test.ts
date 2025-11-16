/**
 * Data Validation Duplicate Detection Tests
 * 
 * Tests for duplicate record detection using seenRecords
 * 
 * Created: 2025-01-16
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { DataValidationPipeline } from '@/lib/pipelines/data-validation';
import type { NormalizedRepresentative, NormalizedBill } from '@/lib/pipelines/data-transformation';

describe('DataValidationPipeline - Duplicate Detection', () => {
  let pipeline: DataValidationPipeline;

  beforeEach(() => {
    pipeline = new DataValidationPipeline();
  });

  describe('validateRepresentative - Duplicate Detection', () => {
    it('should detect duplicate representative records', () => {
      const rep1: NormalizedRepresentative = {
        id: 'rep-123',
        name: 'John Doe',
        jurisdiction: 'US',
        office: 'Representative',
        level: 'federal'
      };

      const rep2: NormalizedRepresentative = {
        id: 'rep-123',
        name: 'John Doe',
        jurisdiction: 'US',
        office: 'Representative',
        level: 'federal'
      };

      const result1 = pipeline.validateRepresentative(rep1);
      const result2 = pipeline.validateRepresentative(rep2);

      expect(result1.valid).toBe(true);
      expect(result1.warnings).toHaveLength(0);

      expect(result2.valid).toBe(true);
      expect(result2.warnings.length).toBeGreaterThan(0);
      expect(result2.warnings.some(w => w.message.includes('Duplicate'))).toBe(true);
    });

    it('should not flag different representatives as duplicates', () => {
      const rep1: NormalizedRepresentative = {
        id: 'rep-123',
        name: 'John Doe',
        jurisdiction: 'US',
        office: 'Representative',
        level: 'federal'
      };

      const rep2: NormalizedRepresentative = {
        id: 'rep-456',
        name: 'Jane Smith',
        jurisdiction: 'US',
        office: 'Representative',
        level: 'federal'
      };

      const result1 = pipeline.validateRepresentative(rep1);
      const result2 = pipeline.validateRepresentative(rep2);

      expect(result1.valid).toBe(true);
      expect(result1.warnings.some(w => w.message.includes('Duplicate'))).toBe(false);

      expect(result2.valid).toBe(true);
      expect(result2.warnings.some(w => w.message.includes('Duplicate'))).toBe(false);
    });

    it('should track duplicates across different jurisdictions', () => {
      const rep1: NormalizedRepresentative = {
        id: 'rep-123',
        name: 'John Doe',
        jurisdiction: 'US',
        office: 'Representative',
        level: 'federal'
      };

      const rep2: NormalizedRepresentative = {
        id: 'rep-123',
        name: 'John Doe',
        jurisdiction: 'CA',
        office: 'Representative',
        level: 'state'
      };

      const result1 = pipeline.validateRepresentative(rep1);
      const result2 = pipeline.validateRepresentative(rep2);

      // Different jurisdictions should not be flagged as duplicates
      expect(result1.warnings.some(w => w.message.includes('Duplicate'))).toBe(false);
      expect(result2.warnings.some(w => w.message.includes('Duplicate'))).toBe(false);
    });
  });

  describe('validateBill - Duplicate Detection', () => {
    it('should detect duplicate bill records', () => {
      const bill1: NormalizedBill = {
        id: 'bill-123',
        title: 'Test Bill',
        billNumber: 'HR-123',
        billType: 'House Resolution',
        level: 'federal',
        jurisdiction: 'US',
        introducedDate: '2025-01-01',
        sources: ['congress.gov'],
        lastUpdated: '2025-01-01'
      };

      const bill2: NormalizedBill = {
        id: 'bill-123',
        title: 'Test Bill',
        billNumber: 'HR-123',
        billType: 'House Resolution',
        level: 'federal',
        jurisdiction: 'US',
        introducedDate: '2025-01-01',
        sources: ['congress.gov'],
        lastUpdated: '2025-01-01'
      };

      const result1 = pipeline.validateBill(bill1);
      const result2 = pipeline.validateBill(bill2);

      expect(result1.valid).toBe(true);
      expect(result1.warnings).toHaveLength(0);

      expect(result2.valid).toBe(true);
      expect(result2.warnings.length).toBeGreaterThan(0);
      expect(result2.warnings.some(w => w.message.includes('Duplicate'))).toBe(true);
    });
  });

  describe('validate - Batch Processing', () => {
    it('should detect duplicates in batch validation', () => {
      const representatives: NormalizedRepresentative[] = [
        {
          id: 'rep-1',
          name: 'Rep 1',
          jurisdiction: 'US',
          office: 'Representative',
          level: 'federal'
        },
        {
          id: 'rep-1', // Duplicate
          name: 'Rep 1',
          jurisdiction: 'US',
          office: 'Representative',
          level: 'federal'
        },
        {
          id: 'rep-2',
          name: 'Rep 2',
          jurisdiction: 'US',
          office: 'Representative',
          level: 'federal'
        }
      ];

      const results = pipeline.validate(representatives, 'representative');

      expect(results).toHaveLength(3);
      expect(results[0]?.valid).toBe(true);
      expect(results[1]?.valid).toBe(true);
      expect(results[1]?.warnings.some(w => w.message.includes('Duplicate'))).toBe(true);
      expect(results[2]?.valid).toBe(true);
    });
  });
});

