'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

import { ProfileEdit, useProfileLoadingStates } from '@/features/profile';
import { useProfile } from '@/features/profile/hooks/use-profile';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import { useUser } from '@/lib/stores';
import { useAppActions } from '@/lib/stores/appStore';

export default function EditProfilePage() {
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);
  const user = useUser();
  const { profile, isLoading, error, refetch } = useProfile();
  const { isUpdating } = useProfileLoadingStates();
  const { setCurrentRoute, setBreadcrumbs, setSidebarActiveSection } = useAppActions();

  // Refs for stable app store actions
  const setCurrentRouteRef = useRef(setCurrentRoute);
  useEffect(() => { setCurrentRouteRef.current = setCurrentRoute; }, [setCurrentRoute]);
  const setBreadcrumbsRef = useRef(setBreadcrumbs);
  useEffect(() => { setBreadcrumbsRef.current = setBreadcrumbs; }, [setBreadcrumbs]);
  const setSidebarActiveSectionRef = useRef(setSidebarActiveSection);
  useEffect(() => { setSidebarActiveSectionRef.current = setSidebarActiveSection; }, [setSidebarActiveSection]);

  // Use ref for refetch callback - must be before early returns
  const refetchRef = useRef(refetch);
  useEffect(() => { refetchRef.current = refetch; }, [refetch]);

  // Callbacks must be defined before early returns
  const handleSave = useCallback(async () => {
    await refetchRef.current();
  }, []);  

  const handleCancel = useCallback(() => {
    routerRef.current.push('/profile');
  }, []);

  useEffect(() => {
    setCurrentRouteRef.current('/profile/edit');
    setSidebarActiveSectionRef.current('profile');
    setBreadcrumbsRef.current([
      { label: 'Home', href: '/' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Profile', href: '/profile' },
      { label: 'Edit Profile', href: '/profile/edit' },
    ]);

    return () => {
      setSidebarActiveSectionRef.current(null);
      setBreadcrumbsRef.current([]);
    };
  }, []);  

  useEffect(() => {
    // In E2E harness mode, authentication is mocked - don't redirect
    if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1') {
      return;
    }
    // Only redirect if we're certain user is not authenticated
    // Don't redirect while authentication state is still loading
    if (!isLoading && !user) {
      routerRef.current.replace('/auth?redirectTo=/profile/edit');
    }
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        data-testid="profile-edit-loading"
      >
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              {error ?? 'We couldn’t load your profile. Please try again later.'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => routerRef.current.push('/profile')} className="w-full">
            Return to profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" data-testid="profile-edit-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProfileEdit
          profile={profile}
          onSave={handleSave}
          onCancel={handleCancel}
          isLoading={isUpdating}
          error={error}
        />
      </div>
    </div>
  );
}

