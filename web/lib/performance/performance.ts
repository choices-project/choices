/**
 * Performance utilities
 * 
 * This module provides performance-related utility functions.
 * It replaces the old @/shared/core/performance/lib/performance imports.
 */

import { logger } from '@/lib/utils/logger';

export const performanceUtils = {
  measureAsync: async <T>(fn: () => Promise<T>, label: string): Promise<T> => {
    const start = performance.now();
    try {
      const result = await fn();
      const end = performance.now();
      logger.performance(label, end - start);
      return result;
    } catch (error) {
      const end = performance.now();
      logger.error(`${label} failed`, error instanceof Error ? error : new Error(String(error)), { duration: end - start });
      throw error;
    }
  },

  measureSync: <T>(fn: () => T, label: string): T => {
    const start = performance.now();
    try {
      const result = fn();
      const end = performance.now();
      logger.performance(label, end - start);
      return result;
    } catch (error) {
      const end = performance.now();
      logger.error(`${label} failed`, error instanceof Error ? error : new Error(String(error)), { duration: end - start });
      throw error;
    }
  },

  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  virtualScroll: {
    calculateVisibleRange: (
      scrollTop: number,
      containerHeight: number,
      itemHeight: number,
      totalItems: number
    ) => {
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(
        startIndex + Math.ceil(containerHeight / itemHeight) + 1,
        totalItems
      );
      return { startIndex, endIndex };
    },

    getVisibleItems: <T>(
      items: T[],
      scrollTop: number,
      containerHeight: number,
      itemHeight: number
    ) => {
      const { startIndex, endIndex } = performanceUtils.virtualScroll.calculateVisibleRange(
        scrollTop,
        containerHeight,
        itemHeight,
        items.length
      );
      return items.slice(startIndex, endIndex);
    },

    getItemOffset: (index: number, itemHeight: number) => {
      return index * itemHeight;
    },

    getTotalHeight: (totalItems: number, itemHeight: number) => {
      return totalItems * itemHeight;
    }
  }
};
