'use client';

import React, { createContext, useContext, type ReactNode } from 'react';

// Store context for providing store access to components
const StoreContext = createContext<Record<string, never>>({});

type StoreProviderProps = {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  return (
    <StoreContext.Provider value={{}}>
      {children}
    </StoreContext.Provider>
  );
}

// Hook to use store context
export function useStoreContext() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStoreContext must be used within a StoreProvider');
  }
  return context;
}
