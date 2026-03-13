'use client';

import { useEffect } from 'react';

export function ScrollRestoration() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.scrollRestoration = 'auto';
    }
  }, []);

  return null;
}
