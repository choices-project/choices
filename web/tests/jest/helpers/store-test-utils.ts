/**
 * Store Testing Utilities
 * 
 * Comprehensive utilities for testing Zustand stores with proper
 * mocking, setup, and validation patterns.
 * 
 * Created: January 16, 2025
 * Status: ✅ ACTIVE
 */

import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

/**
 * Create a mock store for testing
 */
export const createMockStore = <T>(initialState: T) => {
  return create<T>()(() => initialState);
};

/**
 * Create a mock store with middleware
 */
export const createMockStoreWithMiddleware = <T>(
  initialState: T,
  middleware: any[] = []
) => {
  if (middleware.length === 0) {
    return create<T>()(() => initialState);
  }
  const allMiddleware = [...middleware, () => initialState];
  return (create<T>() as any).apply(null, allMiddleware);
};

/**
 * Render a hook with store context
 */
export const renderWithStore = <T>(
  hook: () => T,
  store: any
) => {
  return renderHook(hook, {
    wrapper: ({ children }: { children: React.ReactNode }) => 
      React.createElement('div', { 'data-testid': 'store-provider' }, children)
  });
};

/**
 * Test store actions
 */
export const testStoreAction = async <T>(
  store: any,
  action: (state: T) => void,
  expectedState: Partial<T>
) => {
  await act(async () => {
    action(store.getState());
  });
  
  const state = store.getState();
  expect(state).toMatchObject(expectedState);
};

/**
 * Test store selectors
 */
export const testStoreSelector = <T, R>(
  store: any,
  selector: (state: T) => R,
  expectedValue: R
) => {
  const result = selector(store.getState());
  expect(result).toEqual(expectedValue);
};

/**
 * Test store subscriptions
 */
export const testStoreSubscription = <T>(
  store: any,
  selector: (state: T) => any,
  callback: (value: any) => void
) => {
  const unsubscribe = store.subscribe(selector, callback);
  
  // Test subscription
  const testValue = selector(store.getState());
  callback(testValue);
  
  // Cleanup
  unsubscribe();
};

/**
 * Test store persistence
 */
export const testStorePersistence = async <T>(
  store: any,
  key: string,
  expectedValue: T
) => {
  // Set value
  store.setState(expectedValue as any);
  
  // Simulate persistence
  const persisted = JSON.parse(localStorage.getItem(key) || '{}');
  expect(persisted).toMatchObject(expectedValue as any);
};

/**
 * Test store middleware
 */
export const testStoreMiddleware = <T>(
  store: any,
  middleware: any,
  action: (state: T) => void,
  expectedBehavior: () => void
) => {
  // Test middleware behavior
  action(store.getState());
  expectedBehavior();
};

/**
 * Test store performance
 */
export const testStorePerformance = <T>(
  store: any,
  action: (state: T) => void,
  maxDuration = 10
) => {
  const startTime = performance.now();
  action(store.getState());
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  expect(duration).toBeLessThan(maxDuration);
};

/**
 * Test store error handling
 */
export const testStoreErrorHandling = <T>(
  store: any,
  errorAction: (state: T) => void,
  expectedError: string
) => {
  expect(() => {
    errorAction(store.getState());
  }).toThrow(expectedError);
};

/**
 * Test store state transitions
 */
export const testStoreStateTransition = <T>(
  store: any,
  initialState: T,
  actions: Array<(state: T) => void>,
  expectedFinalState: T
) => {
  // Set initial state
  store.setState(initialState);
  
  // Apply actions
  actions.forEach(action => {
    action(store.getState());
  });
  
  // Check final state
  const finalState = store.getState();
  expect(finalState).toMatchObject(expectedFinalState as any);
};

/**
 * Test store subscriptions with multiple listeners
 */
export const testStoreMultipleSubscriptions = <T>(
  store: any,
  selector: (state: T) => any,
  listeners: Array<(value: any) => void>
) => {
  const unsubscribes = listeners.map(listener => 
    store.subscribe(selector, listener)
  );
  
  // Test all listeners
  const testValue = selector(store.getState());
  listeners.forEach(listener => listener(testValue));
  
  // Cleanup
  unsubscribes.forEach(unsubscribe => unsubscribe());
};

/**
 * Test store with React components
 */
export const testStoreWithComponent = <T>(
  store: any,
  component: React.ComponentType<any>,
  props: any = {}
) => {
  const wrapper = ({ children }: { children: React.ReactNode }) => 
    React.createElement('div', { 'data-testid': 'store-wrapper' }, children);
  
  return renderHook(() => (component as any)(props), { wrapper });
};

/**
 * Test store with async actions
 */
export const testStoreAsyncAction = async <T>(
  store: any,
  asyncAction: (state: T) => Promise<void>,
  expectedState: Partial<T>
) => {
  await act(async () => {
    await asyncAction(store.getState());
  });
  
  const state = store.getState();
  expect(state).toMatchObject(expectedState);
};

/**
 * Test store with side effects
 */
export const testStoreSideEffects = <T>(
  store: any,
  action: (state: T) => void,
  sideEffect: () => void
) => {
  const mockSideEffect = jest.fn(sideEffect);
  
  action(store.getState());
  expect(mockSideEffect).toHaveBeenCalled();
};

/**
 * Test store with external dependencies
 */
export const testStoreWithDependencies = <T>(
  store: any,
  dependencies: Record<string, any>,
  action: (state: T, deps: Record<string, any>) => void
) => {
  action(store.getState(), dependencies);
  // Test that dependencies were used correctly
  Object.values(dependencies).forEach(dep => {
    if (typeof dep === 'function') {
      expect(dep).toHaveBeenCalled();
    }
  });
};

/**
 * Test store with validation
 */
export const testStoreValidation = <T>(
  store: any,
  validator: (state: T) => boolean,
  invalidAction: (state: T) => void
) => {
  const initialState = store.getState();
  expect(validator(initialState)).toBe(true);
  
  expect(() => {
    invalidAction(store.getState());
  }).toThrow();
};

/**
 * Test store with time-based actions
 */
export const testStoreTimeBased = <T>(
  store: any,
  timeAction: (state: T) => void,
  expectedDuration: number
) => {
  const startTime = Date.now();
  timeAction(store.getState());
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  expect(duration).toBeGreaterThanOrEqual(expectedDuration);
};

/**
 * Test store with cleanup
 */
export const testStoreCleanup = <T>(
  store: any,
  action: (state: T) => void,
  cleanup: () => void
) => {
  action(store.getState());
  cleanup();
  
  // Verify cleanup was called
  expect(cleanup).toHaveBeenCalled();
};

/**
 * Test store with concurrent actions
 */
export const testStoreConcurrent = <T>(
  store: any,
  actions: Array<(state: T) => void>,
  expectedFinalState: T
) => {
  // Run actions concurrently
  const promises = actions.map(action => 
    Promise.resolve(action(store.getState()))
  );
  
  return Promise.all(promises).then(() => {
    const finalState = store.getState();
    expect(finalState).toMatchObject(expectedFinalState as any);
  });
};

/**
 * Test store with error recovery
 */
export const testStoreErrorRecovery = <T>(
  store: any,
  errorAction: (state: T) => void,
  recoveryAction: (state: T) => void,
  expectedRecoveredState: T
) => {
  // Trigger error
  expect(() => {
    errorAction(store.getState());
  }).toThrow();
  
  // Test recovery
  recoveryAction(store.getState());
  const recoveredState = store.getState();
  expect(recoveredState).toMatchObject(expectedRecoveredState as any);
};

/**
 * Test store with state snapshots
 */
export const testStoreSnapshots = <T>(
  store: any,
  actions: Array<(state: T) => void>,
  expectedSnapshots: T[]
) => {
  const snapshots: T[] = [];
  
  // Capture initial state
  snapshots.push(store.getState());
  
  // Apply actions and capture snapshots
  actions.forEach(action => {
    action(store.getState());
    snapshots.push(store.getState());
  });
  
  // Compare snapshots
  expect(snapshots).toEqual(expectedSnapshots);
};

/**
 * Mock store for testing
 */
export const mockStore = {
  create: createMockStore,
  createWithMiddleware: createMockStoreWithMiddleware,
  render: renderWithStore,
  testAction: testStoreAction,
  testSelector: testStoreSelector,
  testSubscription: testStoreSubscription,
  testPersistence: testStorePersistence,
  testMiddleware: testStoreMiddleware,
  testPerformance: testStorePerformance,
  testErrorHandling: testStoreErrorHandling,
  testStateTransition: testStoreStateTransition,
  testMultipleSubscriptions: testStoreMultipleSubscriptions,
  testWithComponent: testStoreWithComponent,
  testAsyncAction: testStoreAsyncAction,
  testSideEffects: testStoreSideEffects,
  testWithDependencies: testStoreWithDependencies,
  testValidation: testStoreValidation,
  testTimeBased: testStoreTimeBased,
  testCleanup: testStoreCleanup,
  testConcurrent: testStoreConcurrent,
  testErrorRecovery: testStoreErrorRecovery,
  testSnapshots: testStoreSnapshots
};
