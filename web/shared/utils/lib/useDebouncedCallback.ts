// lib/react/useDebouncedCallback.ts
import { useEffect, useMemo, useRef } from 'react';

/**
 * useDebouncedCallback
 * - Keeps a stable debounced function instance across renders.
 * - Safely updates the inner callback via a ref (so you avoid massive dep arrays).
 * - Cancels the debounced timer on unmount or delay change.
 *
 * Example:
 *   const onScroll = useDebouncedCallback((evt) => { ... }, 50, [rowHeight, buffer]);
 *   <div onScroll={onScroll} />
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
  deps: ReadonlyArray<unknown> = []
): T {
  const fnRef = useRef(fn);

  // keep the latest function without changing the debounced identity
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fnRef.current = fn; }, [fn, ...deps]);

  // create a single debounced wrapper that only changes when the delay changes
  const debounced = useMemo(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const wrapped = ((...args: any[]) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        fnRef.current(...args);
      }, delay);
    }) as T & { cancel?: () => void };

    wrapped.cancel = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    return wrapped;
  }, [delay]);

  // cancel any pending run on unmount
  useEffect(() => {
    return () => {
      (debounced as any)?.cancel?.();
    };
  }, [debounced]);

  return debounced as T;
}
