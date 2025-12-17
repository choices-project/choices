'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Debug page to clear all auth cookies and reset session
 * Useful when auth state gets corrupted
 */
export default function ClearSessionPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Clearing session...');

  useEffect(() => {
    // Clear all auth-related cookies
    const cookies = document.cookie.split(';');
    
    cookies.forEach(cookie => {
      const [name] = cookie.split('=');
      const cleanName = name?.trim();
      
      if (cleanName) {
        // Clear with multiple path/domain combinations to ensure deletion
        document.cookie = `${cleanName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${cleanName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
        document.cookie = `${cleanName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
      }
    });

    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();

    setStatus('Session cleared! Redirecting to home...');
    
    // Redirect after a short delay
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900 mb-4">Session Reset</h1>
        <p className="text-slate-600">{status}</p>
      </div>
    </div>
  );
}

