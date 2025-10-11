'use client'

import { useUser, useUserLoading, useUserActions } from '@/lib/stores'

export function useAuth() {
  const user = useUser();
  const isLoading = useUserLoading();
  const { signOut } = useUserActions();

  return {
    user,
    isLoading,
    logout: signOut
  }
}
