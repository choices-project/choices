'use client';

/**
 * Civics Page Wrapper
 * 
 * Dynamically imports the page content with ssr: false to prevent
 * Next.js from trying to load the module during SSR, which causes
 * MODULE_NOT_FOUND errors in CI environments.
 */

import nextDynamic from 'next/dynamic';
import React, { Suspense } from 'react';

// Disable SSR to work around Next.js 14.2.32 MODULE_NOT_FOUND bug
// This prevents Next.js from trying to load the server-side module at runtime
export const dynamic = 'force-dynamic';

// Dynamically import the page content with SSR disabled
const CivicsPageContent = nextDynamic(() => import('./CivicsPageContent'), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
    </div>
  ),
  ssr: false // Disable SSR to prevent MODULE_NOT_FOUND errors
});

export default function CivicsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    }>
      <CivicsPageContent />
    </Suspense>
  );
}
