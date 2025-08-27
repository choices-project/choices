import { useCallback, useEffect, useMemo } from 'react';

/**
 * Safe hooks utilities that make dependency intent explicit
 * Helps prevent missing dependency warnings and makes code more maintainable
 */

export const useSafeCallback = <T extends (...args: unknown[]) => unknown>(
  fn: T, 
  deps: unknown[]
) => useCallback(fn, deps);

export const useSafeMemo = <T>(
  fn: () => T, 
  deps: unknown[]
) => useMemo(fn, deps);

export const useSafeEffect = (
  fn: () => void | (() => void), 
  deps: unknown[]
) => useEffect(fn, deps);
