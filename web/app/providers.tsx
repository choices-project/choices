'use client';

import type { ReactNode } from 'react';
import { StoreProvider } from '@/lib/providers/StoreProvider';

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <StoreProvider>
      {children}
    </StoreProvider>
  );
}
