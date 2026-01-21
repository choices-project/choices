'use client'

import { User, Shield, Download, Edit, Settings, CheckCircle, MapPin, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback, useRef } from 'react';

import { AddressLookup } from '@/features/profile/components/AddressLookup';
import { useProfileData, useProfileExport } from '@/features/profile/hooks/use-profile';

import { AuthGuard } from '@/components/business/auth/AuthGuard';
import { EnhancedErrorDisplay } from '@/components/shared/EnhancedErrorDisplay';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useUser, useIsAuthenticated, useUserLoading } from '@/lib/stores';
import { useAppActions } from '@/lib/stores/appStore';
import { logger } from '@/lib/utils/logger';

// Prevent static generation since this requires client-side state
export const dynamic = 'force-dynamic';

function ProfilePageContent() {
  const [isMounted, setIsMounted] = React.useState(false);
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const isUserLoading = useUserLoading();
  const { profile, isLoading: profileLoading, profileError, refetch } = useProfileData();
  const { exportProfile, isExporting } = useProfileExport();
  const [exportStatus, setExportStatus] = useState<'success' | 'error' | null>(null);
  const { setCurrentRoute, setBreadcrumbs, setSidebarActiveSection } = useAppActions();

  // Refs for stable app store actions
  const setCurrentRouteRef = useRef(setCurrentRoute);
  useEffect(() => { setCurrentRouteRef.current = setCurrentRoute; }, [setCurrentRoute]);
  const setBreadcrumbsRef = useRef(setBreadcrumbs);
  useEffect(() => { setBreadcrumbsRef.current = setBreadcrumbs; }, [setBreadcrumbs]);
  const setSidebarActiveSectionRef = useRef(setSidebarActiveSection);
  useEffect(() => { setSidebarActiveSectionRef.current = setSidebarActiveSection; }, [setSidebarActiveSection]);

  // Ref for stable exportProfile callback
  const exportProfileRef = useRef(exportProfile);
  useEffect(() => { exportProfileRef.current = exportProfile; }, [exportProfile]);

  // Ref for stable refetch callback
  const refetchRef = useRef(refetch);
  useEffect(() => { refetchRef.current = refetch; }, [refetch]);

  // Set mounted immediately on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Callbacks must be defined before early returns
  const handleEditProfile = useCallback(() => {
    routerRef.current.push('/profile/edit');
  }, []);

  const handleSettings = useCallback(() => {
    routerRef.current.push('/profile/preferences');
  }, []);

  const handlePrivacySettings = useCallback(() => {
    routerRef.current.push('/profile/preferences');
  }, []);

  const handleEditProfileFromActions = useCallback(() => {
    routerRef.current.push('/profile/edit');
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    setCurrentRouteRef.current('/profile');
    setSidebarActiveSectionRef.current('profile');
    setBreadcrumbsRef.current([
      { label: 'Home', href: '/' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Profile', href: '/profile' },
    ]);

    return () => {
      setSidebarActiveSectionRef.current(null);
      setBreadcrumbsRef.current([]);
    };
  }, [isMounted]);

  useEffect(() => {
    // In E2E harness mode, authentication is mocked - don't redirect
    if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1') {
      return;
    }
    // Only redirect if we're certain user is not authenticated
    // Don't redirect while authentication state is still loading
    if (!isUserLoading && !isAuthenticated) {
      logger.debug('🚨 SECURITY: Unauthenticated user attempting to access profile - redirecting to login');
      routerRef.current.replace('/auth?redirectTo=/profile');
    }
  }, [isAuthenticated, isUserLoading]); // Removed router

  const handleExportData = useCallback(async () => {
    setExportStatus(null);
    try {
      const data = await exportProfileRef.current({
        includeActivity: true,
        includeVotes: true,
        includeComments: true,
        format: 'json',
      });

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `profile-export-${user?.id ?? profile?.id ?? 'user'}-${new Date()
        .toISOString()
        .split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportStatus('success');
      setTimeout(() => setExportStatus(null), 4000);
    } catch (error) {
      logger.error('Failed to export profile data', error instanceof Error ? error : new Error(String(error)));
      setExportStatus('error');
      setTimeout(() => setExportStatus(null), 4000);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Add timeout to prevent infinite loading - must be before early returns
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  useEffect(() => {
    if (!(profileLoading && !profile && !profileError)) {
      setLoadingTimeout(false);
      return;
    }
    const timeout = setTimeout(() => {
      setLoadingTimeout(true);
    }, 15_000); // 15 second timeout
    return () => {
      clearTimeout(timeout);
    };
  }, [profileLoading, profile, profileError]);

  // #region agent log
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Debug logging removed for production
    }
  }, [isMounted, isUserLoading, profileLoading, isAuthenticated, profile, profileError]);
  // #endregion

  // Show loading state until component is mounted or while loading
  if (!isMounted || isUserLoading || profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8" data-testid="profile-loading" aria-label="Loading profile" aria-busy="true">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader className="text-center">
              <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
              <Skeleton className="h-8 w-48 mx-auto mb-2" />
              <Skeleton className="h-5 w-64 mx-auto" />
              <div className="flex justify-center gap-4 mt-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </CardHeader>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sign in to your account</h1>
          <p className="text-gray-600">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  // Check if profile doesn't exist (user needs onboarding)
  // This happens when user is authenticated but hasn't completed onboarding
  if (isAuthenticated && !profileLoading && !profile && !profileError) {
    return (
      <ErrorBoundary>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
                <CardDescription className="mt-2">
                  Please complete onboarding to access your profile page.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-gray-600 dark:text-gray-400">
                  You need to finish setting up your profile before you can view or edit it.
                </p>
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={() => {
                      routerRef.current.push('/onboarding?redirect=/profile&reason=onboarding_required');
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Complete Onboarding
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      routerRef.current.push('/dashboard');
                    }}
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if ((profileLoading && !profile && !profileError) || loadingTimeout) {
    // Show loading state with timeout message if taking too long
    return (
      <ErrorBoundary>
        <div className="flex items-center justify-center min-h-screen" aria-label="Loading profile" aria-busy="true">
          <div className="text-center space-y-4 max-w-md">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" aria-hidden="true" />
            <p className="text-gray-600 dark:text-gray-400">
              {loadingTimeout ? 'Loading is taking longer than expected...' : 'Loading profile...'}
            </p>
            {loadingTimeout && (
              <button
                onClick={() => {
                  void refetchRef.current();
                  setLoadingTimeout(false);
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                aria-label="Retry loading profile"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (profileError) {
    // Check if error indicates profile not found (onboarding required)
    const isOnboardingError = profileError.toLowerCase().includes('not found') ||
                              profileError.toLowerCase().includes('profile') &&
                              profileError.toLowerCase().includes('doesn\'t exist');

    return (
      <ErrorBoundary>
        <div className="container mx-auto px-4 py-8">
          {isOnboardingError ? (
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                    <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-2xl">Profile Setup Required</CardTitle>
                  <CardDescription className="mt-2">
                    Your profile needs to be set up before you can access it.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-center text-gray-600 dark:text-gray-400">
                    Please complete the onboarding process to create your profile.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={() => {
                        routerRef.current.push('/onboarding?redirect=/profile&reason=onboarding_required');
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Start Onboarding
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <EnhancedErrorDisplay
              title="Failed to load profile"
              message={profileError}
              details="We encountered an issue while loading your profile. This might be a temporary network problem."
              tip="Check your internet connection and try again. If the problem persists, the service may be temporarily unavailable."
              canRetry={true}
              onRetry={() => {
                void refetchRef.current();
              }}
              primaryAction={{
                label: 'Try Again',
                onClick: () => {
                  void refetchRef.current();
                },
                icon: <RefreshCw className="h-4 w-4" />,
              }}
              secondaryAction={{
                label: 'Go to Dashboard',
                href: '/dashboard',
              }}
            />
          )}
        </div>
      </ErrorBoundary>
    );
  }

  // Profile data is already available from useProfile hook

  return (
    <AuthGuard redirectTo="/auth">
      <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url ?? ''} alt={profile?.display_name ?? 'User'} />
                <AvatarFallback className="text-2xl">
                  {profile?.display_name?.charAt(0) ?? 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-3xl">{profile?.display_name ?? 'User Profile'}</CardTitle>
            <CardDescription className="text-lg">
              {profile?.email ?? 'No email provided'}
            </CardDescription>
            <div className="flex justify-center gap-4 mt-4">
              <Button
                onClick={handleEditProfile}
                variant="outline"
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Edit your profile"
              >
                <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                Edit Profile
              </Button>
              <Button
                onClick={handleSettings}
                variant="outline"
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Open settings"
              >
                <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
                Settings
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Profile Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Display Name</label>
                  <p className="text-lg">{profile?.display_name ?? 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg">{profile?.email ?? 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Bio</label>
                  <p className="text-lg">{profile?.bio ?? 'No bio provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>Account Verified</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>Profile Complete</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>Active Member</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Location Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Your District
            </CardTitle>
            <CardDescription>
              Find your congressional district to see relevant representatives and civic content.
              We only store your district, never your full address.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddressLookup
              autoSave={true}
              onDistrictSaved={() => {
                void refetchRef.current();
              }}
            />
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>
              Manage your account settings and data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handlePrivacySettings}
                variant="outline"
                className="justify-start focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Open privacy settings"
              >
                <Shield className="h-4 w-4 mr-2" aria-hidden="true" />
                Privacy Settings
              </Button>
              <Button
                onClick={handleEditProfileFromActions}
                variant="outline"
                className="justify-start focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Edit your profile"
              >
                <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                Edit Profile
              </Button>
              <Button
                onClick={handleExportData}
                variant="outline"
                className="justify-start focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={isExporting}
                aria-label={isExporting ? 'Exporting profile data' : 'Export your profile data'}
                aria-disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>
              {exportStatus === 'success' && (
                <p className="text-sm text-green-600">
                  Your profile data export has started downloading.
                </p>
              )}
              {exportStatus === 'error' && (
                <p className="text-sm text-red-600">
                  We could not export your data. Please try again.
                </p>
              )}
              <Button variant="outline" className="justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Advanced Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
      </ErrorBoundary>
    </AuthGuard>
  );
}

export default function ProfilePage() {
  return <ProfilePageContent />;
}
