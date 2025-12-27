'use client';

/**
 * Minimal PersonalDashboard for debugging hydration issues
 * No hooks, no state, just a static div
 */

type PersonalDashboardProps = {
  userId?: string;
  className?: string;
};

export default function PersonalDashboardMinimal({ className = '' }: PersonalDashboardProps) {
  // Absolutely minimal - no hooks, no state, no store access
  return (
    <div className={`space-y-6 ${className}`} data-testid='personal-dashboard'>
      <div className='p-4 bg-gray-50 rounded'>
        <p className='text-gray-600'>Minimal PersonalDashboard - no hooks, no state</p>
        <p className='text-sm text-gray-500 mt-2'>Testing if hooks are causing hydration mismatch</p>
      </div>
    </div>
  );
}

