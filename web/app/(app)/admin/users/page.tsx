'use client';

import dynamic from 'next/dynamic';
import React, { Suspense, useEffect, useRef } from 'react';

import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

import { useAppActions } from '@/lib/stores/appStore';

const UserManagement = dynamic(
  () => import('@/features/admin/components/UserManagement'),
  {
    loading: () => (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    ),
    ssr: false,
  },
);

export default function AdminUsersPage() {
  // #region agent log
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:22',message:'AdminUsersPage render',data:{renderCount:renderCountRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();

  // #region agent log
  useEffect(() => {
    const funcIdA = setCurrentRoute.toString().slice(0, 50);
    const funcIdB = setSidebarActiveSection.toString().slice(0, 50);
    const funcIdC = setBreadcrumbs.toString().slice(0, 50);
    fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:29',message:'useAppActions returned values',data:{funcIdA,funcIdB,funcIdC},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  }, [setCurrentRoute, setSidebarActiveSection, setBreadcrumbs]);
  // #endregion

  // Refs for stable app store actions - use separate useEffect for each to prevent infinite loops
  const setCurrentRouteRef = useRef(setCurrentRoute);
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:38',message:'useEffect setCurrentRoute ref update',data:{renderCount:renderCountRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    setCurrentRouteRef.current = setCurrentRoute;
  }, [setCurrentRoute]);

  const setBreadcrumbsRef = useRef(setBreadcrumbs);
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:44',message:'useEffect setBreadcrumbs ref update',data:{renderCount:renderCountRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    setBreadcrumbsRef.current = setBreadcrumbs;
  }, [setBreadcrumbs]);

  const setSidebarActiveSectionRef = useRef(setSidebarActiveSection);
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:50',message:'useEffect setSidebarActiveSection ref update',data:{renderCount:renderCountRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    setSidebarActiveSectionRef.current = setSidebarActiveSection;
  }, [setSidebarActiveSection]);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:58',message:'useEffect init running - setting route/breadcrumbs',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    setCurrentRouteRef.current('/admin/users');
    setSidebarActiveSectionRef.current('admin-users');
    setBreadcrumbsRef.current([
      { label: 'Admin', href: '/admin' },
      { label: 'Users', href: '/admin/users' },
    ]);

    return () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:69',message:'useEffect cleanup running',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      setSidebarActiveSectionRef.current(null);
      setBreadcrumbsRef.current([]);
    };
  }, []);

  // CRITICAL FIX: Remove AdminLayout wrapper - parent layout.tsx already provides it
  // Double wrapping causes duplicate sidebar and header rendering
  return (
    <ErrorBoundary>
      <Suspense
        fallback={(
          <div className="flex items-center justify-center py-24" data-testid="user-management-suspense-fallback">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="user-management-container">
          <UserManagement />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}

