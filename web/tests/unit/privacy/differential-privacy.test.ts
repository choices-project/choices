import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { DifferentialPrivacyManager } from '@/lib/privacy/dp';

describe('DifferentialPrivacyManager', () => {
  let manager: DifferentialPrivacyManager;
  let randomSpy: jest.SpiedFunction<typeof Math.random> | undefined;

  const setDeterministicRandom = (value: number) => {
    randomSpy?.mockRestore();
    randomSpy = jest.spyOn(Math, 'random').mockReturnValue(value);
  };

  beforeEach(() => {
    manager = new DifferentialPrivacyManager();
  });

  afterEach(() => {
    randomSpy?.mockRestore();
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid epsilon values (%p)', (epsilon) => {
    expect(() => manager.laplaceNoise(epsilon)).toThrow(/Invalid epsilon/);
  });

  it('produces deterministic noise when Math.random is stubbed', () => {
    setDeterministicRandom(0.75);

    const result = manager.dpCount(100, 0.8);

    expect(result.originalCount).toBe(100);
    expect(result.noisyCount).toBe(101);
    expect(result.epsilon).toBeCloseTo(0.8);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('returns an empty array when no counts are provided', () => {
    expect(manager.dpCounts([])).toEqual([]);
  });

  it('allocates epsilon budget per poll and tracks usage', () => {
    const allocation = manager.allocateEpsilon('poll-123', 0.3, 'privacy-aware-breakdown', 'public');

    expect(allocation).toBe(true);

    const status = manager.getBudgetStatus('poll-123');
    expect(status.used).toBeCloseTo(0.3, 5);
    expect(status.remaining).toBeCloseTo(0.7, 5);
    expect(status.operations).toHaveLength(1);
    expect(status.canAllocate(0.8)).toBe(false);
  });
});

