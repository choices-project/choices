'use client';

import React, { useEffect } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useAppActions } from '@/lib/stores/appStore';

import { AdminLayout } from '../layout/AdminLayout';

export default function AdminFeedbackPage() {
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();

  useEffect(() => {
    setCurrentRoute('/admin/feedback');
    setSidebarActiveSection('admin-feedback');
    setBreadcrumbs([
      { label: 'Admin', href: '/admin' },
      { label: 'Feedback', href: '/admin/feedback' },
    ]);

    return () => {
      setSidebarActiveSection(null);
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setCurrentRoute, setSidebarActiveSection]);

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Feedback & Insights</CardTitle>
            <CardDescription>
              Central hub for triaging product feedback, sentiment, and follow-up actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              The enhanced feedback dashboard is being modernized to align with the new store patterns and
              analytics pipelines. In the interim, continue using the admin notifications and analytics views
              to monitor live feedback while the dedicated interface is finished.
            </p>
            <p>
              Once migration completes, this page will surface real-time sentiment analysis, follow-up status,
              and assignment workflows alongside the updated notification tooling.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

