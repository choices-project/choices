'use client';

import React, { useEffect, useRef } from 'react';

import ContactSystemAdmin from '@/features/admin/components/ContactSystemAdmin';

import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

import { useAppActions } from '@/lib/stores/appStore';

// Prevent static generation since this requires client-side state
export const dynamic = 'force-dynamic';

export default function AdminContactPage() {
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();
  
  // Refs for stable app store actions
  const setCurrentRouteRef = useRef(setCurrentRoute);
  useEffect(() => { setCurrentRouteRef.current = setCurrentRoute; }, [setCurrentRoute]);
  const setBreadcrumbsRef = useRef(setBreadcrumbs);
  useEffect(() => { setBreadcrumbsRef.current = setBreadcrumbs; }, [setBreadcrumbs]);
  const setSidebarActiveSectionRef = useRef(setSidebarActiveSection);
  useEffect(() => { setSidebarActiveSectionRef.current = setSidebarActiveSection; }, [setSidebarActiveSection]);

  useEffect(() => {
    setCurrentRouteRef.current('/admin/contact');
    setSidebarActiveSectionRef.current('admin-contact');
    setBreadcrumbsRef.current([
      { label: 'Admin', href: '/admin' },
      { label: 'Contact System', href: '/admin/contact' },
    ]);

    return () => {
      setSidebarActiveSectionRef.current(null);
      setBreadcrumbsRef.current([]);
    };
  }, [setBreadcrumbs, setCurrentRoute, setSidebarActiveSection]);

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-6">
        <ContactSystemAdmin />
      </div>
    </ErrorBoundary>
  );
}
