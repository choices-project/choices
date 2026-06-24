'use client'

import React, { useEffect } from 'react'

import SiteMessagesAdmin from '@/components/admin/SiteMessagesAdmin'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'


import { useAppActions } from '@/lib/stores/appStore'

// CRITICAL FIX: AdminLayout is provided by parent layout.tsx - don't import or use it here

export default function AdminSiteMessagesPage() {
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions()

  useEffect(() => {
    setCurrentRoute('/admin/site-messages')
    setSidebarActiveSection('admin-site-messages')
    setBreadcrumbs([
      { label: 'Admin', href: '/admin' },
      { label: 'Site Messages', href: '/admin/site-messages' },
    ])

    return () => {
      setSidebarActiveSection(null)
      setBreadcrumbs([])
    }
  }, [setBreadcrumbs, setCurrentRoute, setSidebarActiveSection])

  // CRITICAL FIX: Remove AdminLayout wrapper - parent layout.tsx already provides it
  return (
    <ErrorBoundary
      fallback={
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 m-8">
          <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Site Messages Error</h3>
          <p className="text-red-600 dark:text-red-400 mt-2">
            An error occurred while loading the site messages page. Please try refreshing the page.
          </p>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SiteMessagesAdmin />
      </div>
    </ErrorBoundary>
  )
}
