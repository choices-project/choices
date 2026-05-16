import { useUserStore } from '@/lib/stores/userStore';

import type { Session } from '@supabase/supabase-js';

/**
 * Mirror a Supabase session into the user store immediately after browser hydration.
 * OAuth and passkey flows rely on this before full-page navigation; without it,
 * `useIsAuthenticated` stays false while middleware already allowed the route.
 */
export function syncClientAuthSession(session: Session): void {
  const { initializeAuth, setSessionAndDerived, setLoading } = useUserStore.getState();
  initializeAuth(session.user, session, true);
  setSessionAndDerived(session);
  setLoading(false);
}
