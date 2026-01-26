'use client';

import React, { useEffect, useRef } from 'react';

import ContactSystemAdmin from '@/features/admin/components/ContactSystemAdmin';
import { useFeatureFlag } from '@/features/pwa/hooks/useFeatureFlags';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

import { useAppActions } from '@/lib/stores/appStore';

// Prevent static generation since this requires client-side state
export const dynamic = 'force-dynamic';

export default function AdminContactPage() {
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();
  const { enabled: contactSystemEnabled } = useFeatureFlag('CONTACT_INFORMATION_SYSTEM');

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
        {contactSystemEnabled ? (
          <ContactSystemAdmin />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Contact System</CardTitle>
              <CardDescription>
                The Contact Information System is currently disabled.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  This feature is currently unavailable. Please contact an administrator if you believe this is an error.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </ErrorBoundary>
  );
}
