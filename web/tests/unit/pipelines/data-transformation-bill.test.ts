/**
 * Data Transformation Bill Processing Tests
 * 
 * Tests for bill transformation with determineBillLevel and validateBill
 * 
 * Created: 2025-01-16
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { DataTransformationPipeline } from '@/lib/pipelines/data-transformation';
import type { NormalizedBill } from '@/lib/pipelines/data-transformation';

describe('DataTransformationPipeline - Bill Processing', () => {
  let pipeline: DataTransformationPipeline;

  beforeEach(() => {
    pipeline = new DataTransformationPipeline();
  });

  describe('transformBill - determineBillLevel', () => {
    it('should classify federal bills correctly', () => {
      const federalBill = {
        id: 'bill-1',
        title: 'House Resolution 123',
        billType: 'HR-123',
        billNumber: 'HR-123'
      };

      const result = pipeline.transformBill(federalBill);

      expect(result).not.toBeNull();
      expect(result?.level).toBe('federal');
    });

    it('should classify state bills correctly', () => {
      const stateBill = {
        id: 'bill-2',
        title: 'State Assembly Bill 456',
        billType: 'AB-456',
        billNumber: 'AB-456'
      };

      const result = pipeline.transformBill(stateBill);

      expect(result).not.toBeNull();
      expect(result?.level).toBe('state');
    });

    it('should default to local for unrecognized bill types', () => {
      const localBill = {
        id: 'bill-3',
        title: 'City Ordinance 789',
        billType: 'ORD-789',
        billNumber: 'ORD-789'
      };

      const result = pipeline.transformBill(localBill);

      expect(result).not.toBeNull();
      expect(result?.level).toBe('local');
    });

    it('should handle Senate bills as federal', () => {
      const senateBill = {
        id: 'bill-4',
        title: 'Senate Bill 100',
        billType: 'S-100',
        billNumber: 'S-100'
      };

      const result = pipeline.transformBill(senateBill);

      expect(result).not.toBeNull();
      expect(result?.level).toBe('federal');
    });
  });

  describe('transformBill - validateBill', () => {
    it('should return null for invalid bills', () => {
      const invalidBill = {
        id: '',
        title: '',
        billType: 'HR-123'
      };

      const result = pipeline.transformBill(invalidBill);

      expect(result).toBeNull();
    });

    it('should return null for bills missing required fields', () => {
      const incompleteBill = {
        id: 'bill-5',
        // Missing title
        billType: 'HR-123'
      };

      const result = pipeline.transformBill(incompleteBill);

      expect(result).toBeNull();
    });

    it('should validate and return normalized bill for valid bills', () => {
      const validBill = {
        id: 'bill-6',
        title: 'Test Bill',
        billType: 'HR-123',
        billNumber: 'HR-123',
        jurisdiction: 'US',
        introducedDate: '2025-01-01'
      };

      const result = pipeline.transformBill(validBill);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('bill-6');
      expect(result?.title).toBe('Test Bill');
      expect(result?.level).toBe('federal');
      expect(result?.jurisdiction).toBe('US');
    });

    it('should include optional fields when present', () => {
      const billWithExtras = {
        id: 'bill-7',
        title: 'Test Bill',
        billType: 'HR-123',
        billNumber: 'HR-123',
        shortTitle: 'Short Title',
        congress: 118,
        session: 1
      };

      const result = pipeline.transformBill(billWithExtras);

      expect(result).not.toBeNull();
      expect(result?.shortTitle).toBe('Short Title');
      expect(result?.congress).toBe(118);
      expect(result?.session).toBe(1);
    });
  });

  describe('transformBill - Integration', () => {
    it('should transform and validate bill in single operation', () => {
      const rawBill = {
        id: 'bill-8',
        title: 'Comprehensive Test Bill',
        billType: 'S-200',
        billNumber: 'S-200',
        jurisdiction: 'US',
        introducedDate: '2025-01-15',
        source: 'congress.gov'
      };

      const result = pipeline.transformBill(rawBill);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('bill-8');
      expect(result?.level).toBe('federal');
      expect(result?.sources).toContain('congress.gov');
      expect(result?.lastUpdated).toBeDefined();
    });

    it('should handle bills with type field instead of billType', () => {
      const billWithType = {
        id: 'bill-9',
        title: 'Test Bill',
        type: 'HR-123', // Using 'type' instead of 'billType'
        number: 'HR-123'
      };

      const result = pipeline.transformBill(billWithType);

      expect(result).not.toBeNull();
      expect(result?.billType).toBe('HR-123');
    });
  });
});

