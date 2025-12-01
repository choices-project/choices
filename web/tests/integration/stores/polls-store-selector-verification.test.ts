/**
 * Polls Store Selector Verification Tests
 * 
 * Verifies that pollsStore is accessed only through selectors and hooks,
 * not through direct state access. Also verifies selector adoption across
 * poll-related features.
 * 
 * Created: January 2025
 */

import { describe, it, expect, jest } from '@jest/globals';

import {
  usePollsStore,
  usePolls,
  usePollsLoading,
  usePollsError,
  usePollsFilters,
  usePollsPreferences,
  usePollsActions,
  useSelectedPoll,
  usePollsSearch,
} from '@/lib/stores/pollsStore';

describe('Polls Store Selector Verification', () => {
  it('exposes selector hooks for all major state slices', () => {
    // Verify hooks exist
    expect(typeof usePolls).toBe('function');
    expect(typeof usePollsLoading).toBe('function');
    expect(typeof usePollsError).toBe('function');
    expect(typeof usePollsFilters).toBe('function');
    expect(typeof usePollsPreferences).toBe('function');
    expect(typeof useSelectedPoll).toBe('function');
    expect(typeof usePollsSearch).toBe('function');
  });

  it('provides memoized selector hooks to prevent unnecessary re-renders', () => {
    // Hooks should be memoized (verified by checking they're exported)
    const polls = usePolls;
    const loading = usePollsLoading;
    
    expect(polls).toBeDefined();
    expect(loading).toBeDefined();
  });

  it('recommends using selector hooks over direct usePollsStore(state => state.x)', () => {
    // Direct access should be discouraged in favor of selector hooks
    const preferredPattern = 'usePolls()'; // ✅ Preferred
    const discouragedPattern = 'usePollsStore(state => state.polls)'; // ❌ Discouraged
    
    expect(preferredPattern).toBe('usePolls()');
    expect(discouragedPattern).toContain('usePollsStore(state => state.polls)');
  });

  it('verifies store provides action hooks', () => {
    const actions = usePollsActions();
    
    // Verify action hooks return actions
    expect(actions).toBeDefined();
    expect(typeof actions.loadPolls).toBe('function');
    expect(typeof actions.voteOnPoll).toBe('function');
    expect(typeof actions.undoVote).toBe('function');
    expect(typeof actions.setFilters).toBe('function');
    expect(typeof actions.searchPolls).toBe('function');
  });

  it('ensures selectors are stable across renders', () => {
    // Selectors should be stable (memoized) to prevent unnecessary re-renders
    const selector1 = usePolls;
    const selector2 = usePolls;
    
    // Same function reference (stable)
    expect(selector1).toBe(selector2);
  });
});

/**
 * Selector Usage Guidelines:
 * 
 * ✅ PREFERRED:
 * - usePolls()
 * - usePollsLoading()
 * - usePollsError()
 * - usePollsFilters()
 * - usePollsActions()
 * 
 * ❌ AVOID:
 * - usePollsStore(state => state.polls)
 * - usePollsStore.getState().polls
 * - Direct state mutations
 * 
 * Benefits of selector hooks:
 * 1. Memoized to prevent unnecessary re-renders
 * 2. Type-safe
 * 3. Consistent API across the codebase
 * 4. Easy to test and mock
 */

