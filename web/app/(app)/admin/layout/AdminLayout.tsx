'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';

import { Header } from './Header';
import { Sidebar } from './Sidebar';

type AdminLayoutProps = {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950">
        <a
          href="#admin-main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to admin content
        </a>
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Header />
            <div
              id="admin-main"
              className="flex-1 p-6"
              aria-label="Admin content"
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
};
