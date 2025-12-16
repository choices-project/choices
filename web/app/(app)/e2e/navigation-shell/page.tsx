'use client';

import { useEffect } from 'react';

import { AdminLayout } from '@/app/(app)/admin/layout/AdminLayout';

import { AppShell } from '@/components/shared/AppShell';
import GlobalNavigation from '@/components/shared/GlobalNavigation';
import SiteMessages from '@/components/SiteMessages';

import { useBreadcrumbs, useCurrentRoute, useAppStore } from '@/lib/stores/appStore';

type NavigationShellHarness = {
  setRoute: (route: string, label: string) => void;
  setAdminSection: (section: string) => void;
};

declare global {
  var __navigationShellHarness: NavigationShellHarness | undefined;
}

export default function NavigationShellHarnessPage() {
  const currentRoute = useCurrentRoute();
  const breadcrumbs = useBreadcrumbs();

  useEffect(() => {
    // Initialize harness immediately - access store directly to avoid dependency issues
    const harness: NavigationShellHarness = {
      setRoute: (route, label) => {
        // Access store actions directly to avoid re-initialization delays
        const store = useAppStore.getState();
        store.setCurrentRoute(route);
        store.setBreadcrumbs([
          { label: 'Home', href: '/' },
          { label, href: route },
        ]);
      },
      setAdminSection: (section) => {
        const store = useAppStore.getState();
        store.setSidebarActiveSection(section);
      },
    };
    window.__navigationShellHarness = harness;
    return () => {
      if (window.__navigationShellHarness === harness) {
        delete window.__navigationShellHarness;
      }
    };
  }, []); // Empty deps - access store directly to avoid re-initialization delays

  return (
    <AppShell
      navigation={<GlobalNavigation />}
      siteMessages={<SiteMessages />}
      feedback={null}
    >
      <div className="space-y-8" data-testid="navigation-shell-harness">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">AppShell Harness</h1>
          <p className="text-sm text-slate-600">
            Use <code>window.__navigationShellHarness</code> to set routes and admin sections.
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <span className="font-medium text-slate-800">Current Route:</span>
              <span data-testid="current-route" className="ml-2 text-slate-600">
                {currentRoute}
              </span>
            </div>
            <div>
              <span className="font-medium text-slate-800">Breadcrumbs:</span>
              <ul
                data-testid="breadcrumbs"
                className="mt-2 flex flex-wrap gap-2 text-slate-600"
              >
                {breadcrumbs.map((crumb) => (
                  <li key={crumb.href} className="rounded bg-slate-100 px-2 py-1 text-xs">
                    {crumb.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <AdminLayout>
            <div className="p-6 text-sm text-slate-600">
              Admin layout harness content (sidebar highlight reflects current section).
            </div>
          </AdminLayout>
        </section>
      </div>
    </AppShell>
  );
}


