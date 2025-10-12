/**
 * Store Middleware
 * 
 * Collection of middleware functions for Zustand stores
 * Provides logging, performance monitoring, error handling, and persistence
 * 
 * Created: October 11, 2025
 * Status: ✅ ACTIVE
 */

import { logger } from '../utils/logger';

import type { StoreMiddleware, StoreConfig, PersistOptions } from './types';

/**
 * Logging middleware for store actions
 * Logs all store actions with context and timing information
 */
export const loggingMiddleware: StoreMiddleware = (config: any) => (set: any, get: any, api: any) =>
  config(
    (...args: any[]) => {
      const [_partial, _replace, action] = args;
      const state = get();
      
      // Log action with context
      logger.info('Store action executed', {
        store: api.getState?.()?.name || 'unknown',
        action: action || 'unknown',
        timestamp: new Date().toISOString(),
        stateSnapshot: {
          keys: Object.keys(state),
          size: JSON.stringify(state).length
        }
      });
      
      set(...args);
    },
    get,
    api
  );

/**
 * Performance monitoring middleware
 * Tracks store performance metrics and action timing
 */
export const performanceMiddleware: StoreMiddleware = (config: any) => (set: any, get: any, api: any) =>
  config(
    (...args: any[]) => {
      const startTime = performance.now();
      const [_partial, _replace, action] = args;
      
      set(...args);
      
      const duration = performance.now() - startTime;
      
      // Log slow actions
      if (duration > 10) {
        logger.warn('Slow store action detected', {
          action: action || 'unknown',
          duration: `${duration.toFixed(2)}ms`,
          threshold: '10ms'
        });
      }
    },
    get,
    api
  );

/**
 * Error handling middleware
 * Catches and logs store errors with context
 */
export const errorHandlingMiddleware: StoreMiddleware = (config) => (set, get, api) =>
  config(
    (...args: any[]) => {
      try {
        set(...args);
      } catch (error) {
        logger.error('Store action failed', error instanceof Error ? error : new Error('Unknown error'), {
          action: args[2] || 'unknown',
          state: get()
        });
        throw error;
      }
    },
    get,
    api
  );

/**
 * Persistence middleware with error handling
 * Automatically persists store state to localStorage
 */
export const persistenceMiddleware = (options: PersistOptions): StoreMiddleware => (config) => (set, get, api) =>
  config(
    (...args: any[]) => {
      set(...args);
      
      // Persist to localStorage with error handling
      try {
        const state = get();
        localStorage.setItem(options.name, JSON.stringify(state));
      } catch (error) {
        logger.error('Failed to persist store state', error instanceof Error ? error : new Error('Unknown error'), {
          storeName: options.name
        });
      }
    },
    get,
    api
  );

/**
 * Analytics middleware
 * Tracks store actions for analytics and user behavior
 */
export const analyticsMiddleware: StoreMiddleware = (config) => (set, get, api) =>
  config(
    (...args: any[]) => {
      const [_partial, _replace, action] = args;
      
      // Track store actions for analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'store_action', {
          event_category: 'store',
          event_label: action || 'unknown',
          value: 1
        });
      }
      
      set(...args);
    },
    get,
    api
  );

/**
 * Validation middleware
 * Validates store state against provided validators
 */
export const validationMiddleware = (validators: Array<(state: any) => boolean>): StoreMiddleware => (config) => (set, get, api) =>
  config(
    (...args: any[]) => {
      set(...args);
      
      const state = get();
      
      // Run validators
      for (const validator of validators) {
        if (!validator(state)) {
          logger.warn('Store state validation failed', {
            state,
            validators: validators.length
          });
        }
      }
    },
    get,
    api
  );

/**
 * Batch update middleware
 * Batches multiple updates into a single state change
 */
export const batchUpdateMiddleware: StoreMiddleware = (config) => (set, get, api) => {
  let batchQueue: any[] = [];
  let batchTimeout: NodeJS.Timeout | null = null;
  
  const flushBatch = () => {
    if (batchQueue.length > 0) {
      set(...batchQueue);
      batchQueue = [];
    }
    if (batchTimeout) {
      clearTimeout(batchTimeout);
      batchTimeout = null;
    }
  };
  
  return config(
    (...args: any[]) => {
      batchQueue = args;
      
      if (batchTimeout) {
        clearTimeout(batchTimeout);
      }
      
      batchTimeout = setTimeout(flushBatch, 0);
    },
    get,
    api
  );
};

/**
 * Create middleware chain
 * Combines multiple middleware functions into a single chain
 */
export const createMiddlewareChain = (middlewares: StoreMiddleware[]): StoreMiddleware => (config) => {
  let result = config;
  
  for (const middleware of middlewares.reverse()) {
    result = middleware(result);
  }
  
  return result;
};

/**
 * Create store middleware based on configuration
 * Automatically applies appropriate middleware based on store config
 */
export const createStoreMiddleware = (config: StoreConfig) => {
  const middlewares: StoreMiddleware[] = [];
  
  // Add logging if enabled
  if (config.logging !== false) {
    middlewares.push(loggingMiddleware);
  }
  
  // Add performance monitoring
  middlewares.push(performanceMiddleware);
  
  // Add error handling
  middlewares.push(errorHandlingMiddleware);
  
  // Add analytics
  middlewares.push(analyticsMiddleware);
  
  // Add persistence if enabled
  if (config.persist) {
    middlewares.push(persistenceMiddleware({
      name: config.name,
      version: 1,
      migrate: (state: any) => state
    }));
  }
  
  return createMiddlewareChain(middlewares);
};

/**
 * Development middleware
 * Adds development-only features like state inspection
 */
export const developmentMiddleware: StoreMiddleware = (config) => (set, get, api) => {
  if (process.env.NODE_ENV === 'development') {
    // Add state inspection to window object
    if (typeof window !== 'undefined') {
      (window as any).__STORE_DEBUG__ = {
        getState: get,
        setState: set,
        getActions: () => api
      };
    }
  }
  
  return config(set, get, api);
};

/**
 * Production middleware
 * Optimized for production with minimal overhead
 */
export const productionMiddleware: StoreMiddleware = (config) => (set, get, api) => {
  // Minimal production middleware
  return config(set, get, api);
};

/**
 * Store debug utilities
 */
export const storeDebug = {
  logState: (storeName: string, state: any) => {
    logger.info(`Store state for ${storeName}:`, state);
  },
  
  logActions: (storeName: string, actions: any) => {
    logger.info(`Store actions for ${storeName}:`, actions);
  },
  
  validateState: (state: any, validators: Array<(state: any) => boolean>) => {
    const results = validators.map(validator => validator(state));
    return results.every(result => result);
  }
};

/**
 * Store test utilities
 */
export const storeTest = {
  createMockStore: (initialState: any) => ({
    getState: () => initialState,
    setState: (newState: any) => ({ ...initialState, ...newState }),
    subscribe: () => () => {}
  }),
  
  createTestMiddleware: (_name: string): StoreMiddleware => (config) => (set, get, api) => config(set, get, api)
};

/**
 * Store documentation utilities
 */
export const storeDocumentation = {
  generateStoreDocs: (storeName: string, state: any, actions: any) => {
    return {
      name: storeName,
      state: Object.keys(state),
      actions: Object.keys(actions),
      generatedAt: new Date().toISOString()
    };
  }
};