import React, { lazy, Suspense } from 'react';

"use client"

// Lazy load heavy admin components
// Updated to use the production AdminDashboard from features/admin
const AdminDashboard = lazy(() => import('@/features/admin/components/AdminDashboard').then(mod => ({ default: mod.default })))
const AnalyticsPanel = lazy(() => import('@/components/lazy/AnalyticsPanel'))
const AuditLogs = lazy(() => import('@/components/lazy/AuditLogs'))
const SystemSettings = lazy(() => import('@/components/lazy/SystemSettings'))
const UserManagement = lazy(() => import('@/components/lazy/UserManagement'))

// Admin wrapper with loading fallback
const AdminWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <Suspense fallback={
    <div className={`w-full h-96 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center ${className}`}>
      <div className="text-gray-500">Loading admin panel...</div>
    </div>
  }>
    {children}
  </Suspense>
)

// Export lazy admin components with wrappers
export const LazyAdminDashboard = (props: any) => (
  <AdminWrapper>
    <AdminDashboard {...props} />
  </AdminWrapper>
)

export const LazyAnalyticsPanel = (props: any) => (
  <AdminWrapper>
    <AnalyticsPanel {...props} />
  </AdminWrapper>
)

export const LazyAuditLogs = (props: any) => (
  <AdminWrapper>
    <AuditLogs {...props} />
  </AdminWrapper>
)

export const LazySystemSettings = (props: any) => (
  <AdminWrapper>
    <SystemSettings {...props} />
  </AdminWrapper>
)

export const LazyUserManagement = (props: any) => (
  <AdminWrapper>
    <UserManagement {...props} />
  </AdminWrapper>
)

