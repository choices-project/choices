import { describe, expect, it } from '@jest/globals';

import { ElectoralRaceSchema, RepresentativeSchema } from '@/lib/electoral/schemas';

describe('Electoral schemas', () => {
  it('accepts valid representative data', () => {
    const result = RepresentativeSchema.safeParse({
      id: 'rep-1',
      name: 'Jamie Rivera',
      party: 'Independent',
      office: 'City Council',
      level: 'local',
      jurisdiction: 'Springfield',
      sources: ['google-civic'],
      lastUpdated: new Date().toISOString(),
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.name).toBe('Jamie Rivera');
  });

  it('rejects invalid representative payloads', () => {
    const result = RepresentativeSchema.safeParse({
      id: 'rep-2',
      party: 'Independent',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path ?? []).toContain('name');
    }
  });

  it('applies defaults for optional race collections', () => {
    const result = ElectoralRaceSchema.safeParse({
      raceId: 'ca-12-2024',
      office: 'U.S. House District 12',
      jurisdiction: 'California',
      electionDate: '2024-11-05',
      pollingData: null,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.challengers).toEqual([]);
      expect(result.data.allCandidates).toEqual([]);
      expect(result.data.keyIssues).toEqual([]);
      expect(result.data.status).toBe('upcoming');
      expect(result.data.importance).toBe('medium');
    }
  });
});

