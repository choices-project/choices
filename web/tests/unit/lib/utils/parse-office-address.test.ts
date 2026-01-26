/**
 * Unit tests for parseOfficeCityZip
 */

import { describe, it, expect } from '@jest/globals';
import { parseOfficeCityZip } from '@/lib/utils/parse-office-address';

describe('parseOfficeCityZip', () => {
  it('parses "City, ST 12345" suffix', () => {
    const r = parseOfficeCityZip('Room 151, 6 Bladen St., Annapolis, MD 21401');
    expect(r).toEqual({ city: 'Annapolis', zip: '21401' });
  });

  it('parses "City, ST 12345-6789" suffix', () => {
    const r = parseOfficeCityZip('123 Main St, Springfield, IL 62701-1234');
    expect(r).toEqual({ city: 'Springfield', zip: '62701' });
  });

  it('parses city with spaces', () => {
    const r = parseOfficeCityZip('1 Capitol Mall, Sacramento, CA 95814');
    expect(r).toEqual({ city: 'Sacramento', zip: '95814' });
  });

  it('returns null for empty or too short', () => {
    expect(parseOfficeCityZip('')).toBeNull();
    expect(parseOfficeCityZip('   ')).toBeNull();
    expect(parseOfficeCityZip('abc')).toBeNull();
    expect(parseOfficeCityZip(null as any)).toBeNull();
    expect(parseOfficeCityZip(undefined as any)).toBeNull();
  });

  it('returns null when no trailing City, ST ZIP pattern', () => {
    expect(parseOfficeCityZip('123 Main Street')).toBeNull();
    expect(parseOfficeCityZip('No comma 12345')).toBeNull();
    expect(parseOfficeCityZip('City, ST')).toBeNull();
    expect(parseOfficeCityZip('City, ST 123')).toBeNull();
    expect(parseOfficeCityZip('City, ST 1234')).toBeNull();
  });

  it('trims city', () => {
    const r = parseOfficeCityZip('  x ,  San Francisco  , CA 94102  ');
    expect(r?.city).toBe('San Francisco');
    expect(r?.zip).toBe('94102');
  });

  it('uses zip5 only for ZIP+4', () => {
    const r = parseOfficeCityZip('X, Y, DC 20001-1234');
    expect(r?.zip).toBe('20001');
  });
});
