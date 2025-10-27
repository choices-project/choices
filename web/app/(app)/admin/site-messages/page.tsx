'use client'

import React from 'react'
import SiteMessagesAdmin from '@/components/admin/SiteMessagesAdmin'

export default function AdminSiteMessagesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SiteMessagesAdmin />
      </div>
    </div>
  )
}