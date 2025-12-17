import dynamic from 'next/dynamic';
import type { Metadata } from 'next';

/**
 * Landing Page / Hero (Server Component Wrapper)
 * 
 * Public-facing homepage for the Choices platform.
 * Uses dynamic import to load client component for better standalone build compatibility.
 * 
 * Created: December 17, 2025
 * Status: ✅ PRODUCTION READY
 */

// Dynamically import the client component to avoid standalone build issues
const LandingPageClient = dynamic(() => import('@/components/landing/LandingPageClient'), {
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="animate-pulse text-slate-400">Loading...</div>
    </div>
  ),
  ssr: true, // Enable SSR for better SEO and initial load
});

export const metadata: Metadata = {
  title: 'Choices - Democracy That Works For Everyone',
  description: 'A privacy-first platform that levels the playing field for all candidates, exposes financial influence, and empowers citizens to engage directly with democracy.',
};

export default function LandingPage() {
  return <LandingPageClient />;
}
