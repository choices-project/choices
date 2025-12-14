'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  useAppStore,
  useTheme,
  useResolvedTheme,
  useSidebarCollapsed,
  useAppFeatureFlags,
  useAppSettings,
  useCurrentRoute,
  useBreadcrumbs,
  useActiveModal,
  useModalStack,
  useAppLanguage,
  useAppTimezone,
} from '@/lib/stores/appStore';
import type { AppStore, AppPreferences } from '@/lib/stores/appStore';

/**
 * Shape of the harness interface exposed via `window.__appStoreHarness`.
 * Allows Playwright and QA tooling to drive key app store transitions.
 */
export type AppStoreHarness = {
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  updateSystemTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setFeatureFlags: (flags: Record<string, boolean>) => void;
  updateSettings: (settings: Partial<AppPreferences>) => void;
  openModal: (id: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  pushModal: (id: string, data?: Record<string, unknown>) => void;
  popModal: () => void;
  setCurrentRoute: (route: string) => void;
  setBreadcrumbs: (breadcrumbs: AppStore['breadcrumbs']) => void;
  resetAppState: () => void;
  getSnapshot: () => AppStore;
};

declare global {
  var __appStoreHarness: AppStoreHarness | undefined;
}

/**
 * Helper to render arrays as comma-separated lists while tolerating empty values.
 */
const formatList = (values: string[]) => (values.length ? values.join(', ') : 'none');

/**
 * E2E harness page for the app store. Exposes critical store actions on
 * `window.__appStoreHarness` and renders current state for visual validation.
 */
export default function AppStoreHarnessPage() {
  const [_ready, setReady] = useState(false);
  const theme = useTheme();
  const resolvedTheme = useResolvedTheme();
  const sidebarCollapsed = useSidebarCollapsed();
  const featureFlags = useAppFeatureFlags();
  const settings = useAppSettings();
  const currentRoute = useCurrentRoute();
  const breadcrumbs = useBreadcrumbs();
  const activeModal = useActiveModal();
  const modalStack = useModalStack();
  const language = useAppLanguage();
  const timezone = useAppTimezone();

  // Actions are accessed directly from store in useEffect, no need to destructure here

  const enabledFeatures = useMemo(
    () => Object.entries(featureFlags).filter(([, enabled]) => enabled).map(([flag]) => flag),
    [featureFlags]
  );

  // Set up harness with useEffect - runs after mount
  // Access actions from store state directly to avoid dependency issues
  useEffect(() => {
    const harness: AppStoreHarness = {
      toggleTheme: () => {
        const state = useAppStore.getState();
        const currentTheme = state.theme;
        const nextTheme = currentTheme === 'light' ? 'dark' : currentTheme === 'dark' ? 'system' : 'light';
        useAppStore.setState((draft) => {
          draft.theme = nextTheme;
        });
      },
      setTheme: (theme: 'light' | 'dark' | 'system') => {
        useAppStore.setState((draft) => {
          draft.theme = theme;
          // Update resolvedTheme: if theme is 'system', use systemTheme; otherwise use theme
          draft.resolvedTheme = theme === 'system' ? draft.systemTheme : theme;
        });
      },
      updateSystemTheme: (theme: 'light' | 'dark') => {
        useAppStore.setState((draft) => {
          draft.systemTheme = theme;
          // Update resolvedTheme if current theme is 'system'
          if (draft.theme === 'system') {
            draft.resolvedTheme = theme;
          }
        });
      },
      toggleSidebar: () => {
        const state = useAppStore.getState();
        const next = !state.sidebarCollapsed;
        useAppStore.setState((draft) => {
          draft.sidebarCollapsed = next;
        });
      },
      setSidebarCollapsed: (collapsed: boolean) => {
        useAppStore.setState((draft) => {
          draft.sidebarCollapsed = collapsed;
        });
      },
      setFeatureFlags: (flags: Record<string, boolean>) => {
        useAppStore.setState((draft) => {
          draft.features = { ...draft.features, ...flags };
        });
      },
      updateSettings: (settings: Partial<AppPreferences>) => {
        useAppStore.setState((draft) => {
          draft.settings = { ...draft.settings, ...settings };
        });
      },
      openModal: (id: string, data?: Record<string, unknown>) => {
        useAppStore.setState((draft) => {
          draft.activeModal = id;
          draft.modalStack = [{ id, data: data ?? {} }];
        });
      },
      closeModal: () => {
        useAppStore.setState((draft) => {
          draft.activeModal = null;
          draft.modalStack = [];
        });
      },
      pushModal: (id: string, data?: Record<string, unknown>) => {
        useAppStore.setState((draft) => {
          draft.activeModal = id;
          draft.modalStack.push({ id, data: data ?? {} });
        });
      },
      popModal: () => {
        useAppStore.setState((draft) => {
          draft.modalStack.pop();
          draft.activeModal = draft.modalStack.length > 0 ? draft.modalStack[draft.modalStack.length - 1].id : null;
        });
      },
      setCurrentRoute: (route: string) => {
        useAppStore.setState((draft) => {
          draft.currentRoute = route;
        });
      },
      setBreadcrumbs: (breadcrumbs: AppStore['breadcrumbs']) => {
        useAppStore.setState((draft) => {
          draft.breadcrumbs = breadcrumbs;
        });
      },
      resetAppState: () => {
        useAppStore.setState((draft) => {
          draft.theme = 'system';
          draft.sidebarCollapsed = false;
          draft.activeModal = null;
          draft.modalStack = [];
          draft.currentRoute = '/';
          draft.breadcrumbs = [];
        });
      },
      getSnapshot: () => useAppStore.getState(),
    };

    window.__appStoreHarness = harness;
    return () => {
      if (window.__appStoreHarness === harness) {
        delete (window as any).__appStoreHarness;
      }
    };
  }, []); // Empty deps - set up once, access store directly

  // Set dataset attribute in separate useEffect (handles hydration like poll-wizard)
  useEffect(() => {
    let ready = false;
    const markReady = () => {
      if (ready) return;
      ready = true;
      if (typeof document !== 'undefined') {
        document.documentElement.dataset.appStoreHarness = 'ready';
      }
      setReady(true);
    };

    const persist = (useAppStore as typeof useAppStore & {
      persist?: {
        hasHydrated?: () => boolean;
        onFinishHydration?: (callback: () => void) => (() => void) | void;
      };
    }).persist;

    let unsubscribeHydration: (() => void) | void;

    if (persist?.hasHydrated?.()) {
      markReady();
    } else if (persist?.onFinishHydration) {
      unsubscribeHydration = persist.onFinishHydration(() => {
        markReady();
      });
    } else {
      markReady();
    }

    return () => {
      if (typeof unsubscribeHydration === 'function') {
        unsubscribeHydration();
      }
      if (ready && typeof document !== 'undefined') {
        delete document.documentElement.dataset.appStoreHarness;
      }
    };
  }, []);

  return (
    <main data-testid="app-store-harness" className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">App Store Harness</h1>
        <p className="text-sm text-slate-600">
          Interact with the app store via <code>window.__appStoreHarness</code>.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <div>
          <h2 className="text-lg font-medium">Theme & Layout</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Theme preference</dt>
              <dd data-testid="app-theme">{theme}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Resolved theme</dt>
              <dd data-testid="app-resolved-theme">{resolvedTheme}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Sidebar collapsed</dt>
              <dd data-testid="app-sidebar-collapsed">{String(sidebarCollapsed)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Active modal</dt>
              <dd data-testid="app-active-modal">{activeModal ?? 'none'}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="text-lg font-medium">Routing & Localization</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Current route</dt>
              <dd data-testid="app-current-route">{currentRoute}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Language</dt>
              <dd data-testid="app-language">{language}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Timezone</dt>
              <dd data-testid="app-timezone">{timezone}</dd>
            </div>
          </dl>
          <ul className="mt-2 space-y-1 text-xs" data-testid="app-breadcrumbs">
            {breadcrumbs.length === 0 ? (
              <li className="text-slate-500">No breadcrumbs.</li>
            ) : (
              breadcrumbs.map((breadcrumb) => (
                <li key={breadcrumb.href} className="rounded border border-slate-200 p-2">
                  {breadcrumb.label} — {breadcrumb.href}
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">Feature Flags</h2>
        <p className="text-sm text-slate-600" data-testid="app-feature-flags">
          {enabledFeatures.length > 0 ? formatList(enabledFeatures) : 'No feature flags enabled.'}
        </p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">Preferences</h2>
        <dl className="mt-2 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          <div className="flex justify-between gap-2">
            <dt>Animations</dt>
            <dd data-testid="app-setting-animations">{String(settings.animations)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Haptics</dt>
            <dd data-testid="app-setting-haptics">{String(settings.haptics)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Sound</dt>
            <dd data-testid="app-setting-sound">{String(settings.sound)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Compact mode</dt>
            <dd data-testid="app-setting-compact">{String(settings.compactMode)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">Modal Stack</h2>
        <ul className="mt-2 space-y-1 text-xs" data-testid="app-modal-stack">
          {modalStack.length === 0 ? (
            <li className="text-slate-500">No modals on stack.</li>
          ) : (
            modalStack.map((entry) => (
              <li key={entry.id} className="rounded border border-slate-200 p-2">
                {entry.id}
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}


