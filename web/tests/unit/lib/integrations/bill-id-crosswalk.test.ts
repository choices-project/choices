/**
 * Bill ID crosswalk unit tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  parseGovInfoPackageId,
  normalizeBillIdForMatch,
  buildNormalizedKey,
  billIdsMatch,
  sessionToCongress,
  identifierToGovInfoPackageId
} from '@/lib/integrations/bill-id-crosswalk';

describe('bill-id-crosswalk', () => {
  describe('parseGovInfoPackageId', () => {
    it('parses BILLS-119hr1234-ih', () => {
      const r = parseGovInfoPackageId('BILLS-119hr1234-ih');
      expect(r).toEqual({ congress: 119, billType: 'hr', number: '1234', version: 'ih' });
    });

    it('parses BILLS-116s1-is', () => {
      const r = parseGovInfoPackageId('BILLS-116s1-is');
      expect(r?.congress).toBe(116);
      expect(r?.billType).toBe('s');
      expect(r?.number).toBe('1');
    });

    it('returns null for invalid', () => {
      expect(parseGovInfoPackageId('hr1234')).toBeNull();
      expect(parseGovInfoPackageId('')).toBeNull();
    });
  });

  describe('normalizeBillIdForMatch', () => {
    it('normalizes GovInfo package ID', () => {
      expect(normalizeBillIdForMatch('BILLS-119hr1234-ih')).toBe('119hr1234');
    });

    it('normalizes congress+type+number style', () => {
      expect(normalizeBillIdForMatch('119hr1234')).toBe('119hr1234');
    });

    it('returns null for empty', () => {
      expect(normalizeBillIdForMatch('')).toBeNull();
      expect(normalizeBillIdForMatch(null)).toBeNull();
    });
  });

  describe('buildNormalizedKey', () => {
    it('uses congress when documentNumber is hr1234', () => {
      expect(buildNormalizedKey(119, 'hr1234')).toBe('119hr1234');
    });

    it('parses GovInfo without congress', () => {
      expect(buildNormalizedKey(null, 'BILLS-119hr1234-ih')).toBe('119hr1234');
    });
  });

  describe('sessionToCongress', () => {
    it('maps year to congress', () => {
      expect(sessionToCongress('2024')).toBe(118);
      expect(sessionToCongress('2025')).toBe(119);
    });
    it('passes through congress number', () => {
      expect(sessionToCongress('119')).toBe(119);
    });
    it('returns null for invalid', () => {
      expect(sessionToCongress('')).toBeNull();
      expect(sessionToCongress(null)).toBeNull();
    });
  });

  describe('identifierToGovInfoPackageId', () => {
    it('derives GovInfo ID from HR identifier', () => {
      expect(identifierToGovInfoPackageId('HR 1234', 119)).toBe('BILLS-119hr1234-ih');
    });
    it('derives GovInfo ID from S identifier', () => {
      expect(identifierToGovInfoPackageId('S 567', 118)).toBe('BILLS-118s567-is');
    });
    it('returns null for state-style identifier', () => {
      expect(identifierToGovInfoPackageId('HB 1234', 119)).toBeNull();
    });
  });

  describe('billIdsMatch', () => {
    it('matches GovInfo to GovInfo', () => {
      expect(billIdsMatch('BILLS-119hr1234-ih', 'BILLS-119hr1234-is')).toBe(true);
    });

    it('matches GovInfo to congress+doc', () => {
      expect(billIdsMatch('hr1234', 'BILLS-119hr1234-ih', 119)).toBe(true);
    });

    it('fails without congress for doc-only', () => {
      expect(billIdsMatch('hr1234', 'BILLS-119hr1234-ih')).toBe(false);
    });

    it('fails different bills', () => {
      expect(billIdsMatch('BILLS-119hr1234-ih', 'BILLS-119hr5678-ih')).toBe(false);
    });
  });
});
