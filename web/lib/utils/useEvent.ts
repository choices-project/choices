// lib/react/useEvent.ts
import { useRef, useEffect, useCallback } from 'react';

 
export function useEvent<T extends (...args: any[]) => any>(fn: T) {
  const ref = useRef(fn);
  useEffect(() => { ref.current = fn; }, [fn]);
  return useCallback((...args: Parameters<T>) => ref.current(...args), []);
}
