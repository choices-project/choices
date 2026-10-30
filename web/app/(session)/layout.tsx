import { cookies } from 'next/headers';
import type { ReactNode } from 'react';

import { hasAuthTokenCookies } from '@/lib/auth/has-auth-cookies';

import SessionProviders from './session-providers';

export default async function SessionLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const hasServerSession = hasAuthTokenCookies(cookieStore.getAll());

  return (
    <SessionProviders hasServerSession={hasServerSession}>
      {children}
    </SessionProviders>
  );
}
