'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AppHomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main feed as the primary interface
    router.push('/feed');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your feed...</p>
      </div>
    </div>
  );
}
