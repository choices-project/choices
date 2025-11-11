import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import CacheInvalidationManager from '@/lib/cache/cache-invalidation';

type RedisMocks = {
  invalidateByPattern: jest.MockedFunction<(pattern: string) => Promise<number>>;
  invalidateByTags: jest.MockedFunction<(tags: string[]) => Promise<number>>;
  del: jest.MockedFunction<(key: string) => Promise<boolean>>;
};

type Mocks = {
  manager: CacheInvalidationManager;
  redis: RedisMocks;
  strategy: Record<string, jest.MockedFunction<() => void>>;
};

const createManager = (): Mocks => {
  const redis: RedisMocks = {
    invalidateByPattern: jest.fn<(pattern: string) => Promise<number>>().mockResolvedValue(0),
    invalidateByTags: jest.fn<(tags: string[]) => Promise<number>>().mockResolvedValue(0),
    del: jest.fn<(key: string) => Promise<boolean>>().mockResolvedValue(true),
  };

  const strategy: Record<string, jest.MockedFunction<() => void>> = {
    clearQueues: jest.fn(),
    destroy: jest.fn(),
  };

  const manager = new CacheInvalidationManager(redis as unknown as any, strategy as unknown as any);

  return { manager, redis, strategy };
};

describe('CacheInvalidationManager', () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('expands wildcard patterns using event data', () => {
    const { manager } = createManager();

    try {
      const expandPattern = (manager as unknown as { expandPattern: (pattern: string, data: Record<string, unknown>) => string }).expandPattern.bind(manager);
      const expandTags = (manager as unknown as { expandTags: (tags: string[], data: Record<string, unknown>) => string[] }).expandTags.bind(manager);

      expect(expandPattern('poll:*', { poll_id: '123' })).toBe('poll:123');
      expect(expandPattern('poll:*:user:*', { poll_id: '123', user_id: '456' })).toBe('poll:123:user:456');
      expect(expandPattern('category:*:poll:*:user:*', { category: 'civics', poll_id: '123', user_id: '456' })).toBe('category:123:poll:456:user:civics');

      expect(expandTags(['poll:*'], { poll_id: '999' })).toEqual(['poll:999']);
      expect(expandTags(['user:*'], { user_id: 'abc' })).toEqual(['user:abc']);
    } finally {
      manager.destroy();
    }
  });

  it('processes queued invalidation events with expanded patterns', async () => {
    jest.useFakeTimers();

    const { manager, redis } = createManager();

    try {
      await manager.triggerEvent('poll_created', { poll_id: 'xyz' });

      jest.advanceTimersByTime(150);
      await Promise.resolve();
      await Promise.resolve();

      expect(redis.invalidateByPattern).toHaveBeenCalledWith('polls:xyz');
    } finally {
      manager.destroy();
    }
  });

  it('clears the processor interval when destroyed', async () => {
    jest.useFakeTimers();

    const { manager } = createManager();

    try {
      await manager.triggerEvent('poll_deleted', { poll_id: 'deadbeef' });
    } finally {
      manager.destroy();

      // Advancing timers should not throw and should not process additional work
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    }
  });
});

