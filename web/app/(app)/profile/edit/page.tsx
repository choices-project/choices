'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

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

  useEffect(() => {
    setCurrentRoute('/profile/edit');
    setSidebarActiveSection('profile');
    setBreadcrumbs([
      { label: 'Home', href: '/' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Profile', href: '/profile' },
      { label: 'Edit Profile', href: '/profile/edit' },
    ]);

    return () => {
      setSidebarActiveSection(null);
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setCurrentRoute, setSidebarActiveSection]);

  useEffect(() => {
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
          <Button onClick={() => router.push('/profile')} className="w-full">
            Return to profile
          </Button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    await refetch();
  };

  const handleCancel = () => {
    router.push('/profile');
  };

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

