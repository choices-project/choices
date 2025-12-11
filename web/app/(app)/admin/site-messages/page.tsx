'use client'

import React, { useEffect } from 'react'

import SiteMessagesAdmin from '@/components/admin/SiteMessagesAdmin'

import { useAppActions } from '@/lib/stores/appStore'

import { AdminLayout } from '../layout/AdminLayout'

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

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SiteMessagesAdmin />
      </div>
    </AdminLayout>
  )
}