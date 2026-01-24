'use client'

import { User, Shield, Download, Edit, Settings, CheckCircle, MapPin, RefreshCw, Fingerprint, ArrowRight } from 'lucide-react';
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
import { useOnboardingStore } from '@/lib/stores/onboardingStore';
import { useProfileDisplay, useProfileStats } from '@/lib/stores/profileStore';
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

  // Profile display and stats
  const { displayName, isAdmin } = useProfileDisplay();
  const { isProfileComplete } = useProfileStats();
  const onboardingIsCompleted = useOnboardingStore((state) => state.isCompleted);

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

  const handleBiometricSetup = useCallback(() => {
    routerRef.current.push('/profile/biometric-setup');
  }, []);

  const handleCompleteOnboarding = useCallback(() => {
    routerRef.current.push('/onboarding?redirect=/profile&reason=complete_profile');
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
  }, [isAuthenticated, isUserLoading]);

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

  // Show loading state until component is mounted or while loading
  if (!isMounted || isUserLoading || profileLoading) {
    return (
      <main id="main-content" role="main" className="container mx-auto px-4 py-8" data-testid="profile-loading" aria-label="Loading profile" aria-busy="true">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="bg-card dark:bg-card border-border">
            <CardHeader className="text-center">
              <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4 bg-muted" />
              <Skeleton className="h-8 w-48 mx-auto mb-2 bg-muted" />
              <Skeleton className="h-5 w-64 mx-auto bg-muted" />
              <div className="flex justify-center gap-4 mt-4">
                <Skeleton className="h-10 w-32 bg-muted" />
                <Skeleton className="h-10 w-32 bg-muted" />
              </div>
            </CardHeader>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card dark:bg-card border-border">
              <CardHeader>
                <Skeleton className="h-6 w-48 bg-muted" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-4 bg-muted" />
                <Skeleton className="h-4 w-3/4 mb-4 bg-muted" />
                <Skeleton className="h-4 w-5/6 bg-muted" />
              </CardContent>
            </Card>
            <Card className="bg-card dark:bg-card border-border">
              <CardHeader>
                <Skeleton className="h-6 w-40 bg-muted" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-4 bg-muted" />
                <Skeleton className="h-4 w-3/4 mb-4 bg-muted" />
                <Skeleton className="h-4 w-5/6 bg-muted" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main id="main-content" role="main" className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-foreground">Sign in to your account</h1>
          <p className="text-muted-foreground">Please sign in to view your profile.</p>
        </div>
      </main>
    );
  }

  // Check if profile doesn't exist (user needs onboarding) OR if onboarding not completed
  // Allow admin users to complete onboarding even if profile exists
  const needsOnboarding = (isAuthenticated && !profileLoading && !profile && !profileError) ||
                          (!onboardingIsCompleted && profile); // Profile exists but onboarding not completed

  if (needsOnboarding) {
    return (
      <ErrorBoundary>
        <main id="main-content" role="main" className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-card dark:bg-card border-border">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-2xl text-foreground">Complete Your Profile</CardTitle>
                <CardDescription className="mt-2 text-muted-foreground">
                  {!profile
                    ? 'Please complete onboarding to access your profile page.'
                    : 'Complete onboarding to unlock all features and personalize your experience.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-muted-foreground">
                  {!profile
                    ? 'You need to finish setting up your profile before you can view or edit it.'
                    : 'Finish the onboarding process to access all profile features.'}
                </p>
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={handleCompleteOnboarding}
                    className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
                  >
                    {!profile ? 'Complete Onboarding' : 'Finish Onboarding'}
                  </Button>
                  {profile && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        routerRef.current.push('/dashboard');
                      }}
                      className="border-border text-foreground hover:bg-muted"
                    >
                      Go to Dashboard
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </ErrorBoundary>
    );
  }

  if ((profileLoading && !profile && !profileError) || loadingTimeout) {
    // Show loading state with timeout message if taking too long
    return (
      <ErrorBoundary>
        <main id="main-content" role="main" className="flex items-center justify-center min-h-screen" aria-label="Loading profile" aria-busy="true">
          <div className="text-center space-y-4 max-w-md">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" aria-hidden="true" />
            <p className="text-muted-foreground">
              {loadingTimeout ? 'Loading is taking longer than expected...' : 'Loading profile...'}
            </p>
            {loadingTimeout && (
              <Button
                onClick={() => {
                  void refetchRef.current();
                  setLoadingTimeout(false);
                }}
                className="mt-4"
                aria-label="Retry loading profile"
              >
                Retry
              </Button>
            )}
          </div>
        </main>
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
        <main id="main-content" role="main" className="container mx-auto px-4 py-8">
          {isOnboardingError ? (
            <div className="max-w-2xl mx-auto">
              <Card className="bg-card dark:bg-card border-border">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-2xl text-foreground">Profile Setup Required</CardTitle>
                  <CardDescription className="mt-2 text-muted-foreground">
                    Your profile needs to be set up before you can access it.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-center text-muted-foreground">
                    Please complete the onboarding process to create your profile.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={handleCompleteOnboarding}
                      className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
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
        </main>
      </ErrorBoundary>
    );
  }

  // Profile data is available
  return (
    <AuthGuard redirectTo="/auth">
      <ErrorBoundary>
        <main id="main-content" role="main" className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Header */}
            <Card className="bg-card dark:bg-card border-border">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24 border-2 border-border">
                    <AvatarImage src={profile?.avatar_url ?? ''} alt={displayName ?? 'User'} />
                    <AvatarFallback className="text-2xl bg-muted text-foreground">
                      {displayName?.charAt(0) ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-3xl text-foreground">{displayName ?? profile?.display_name ?? 'User Profile'}</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                  {profile?.email ?? user?.email ?? 'No email provided'}
                </CardDescription>
                <div className="flex justify-center gap-3 mt-4 flex-wrap">
                  <Button
                    onClick={handleEditProfile}
                    variant="outline"
                    className="border-border text-foreground hover:bg-muted"
                    aria-label="Edit your profile"
                  >
                    <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                    Edit Profile
                  </Button>
                  <Button
                    onClick={handleSettings}
                    variant="outline"
                    className="border-border text-foreground hover:bg-muted"
                    aria-label="Open settings"
                  >
                    <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
                    Settings
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Onboarding Reminder (if not completed) */}
            {!onboardingIsCompleted && (
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Complete Your Setup</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Finish onboarding to unlock all features and personalize your experience.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleCompleteOnboarding}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                      Complete Setup
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Essential Information - Streamlined */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card dark:bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-foreground">
                    <User className="h-5 w-5 mr-2 text-muted-foreground" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Display Name</label>
                    <p className="text-base font-medium text-foreground mt-1">{profile?.display_name ?? displayName ?? 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-base text-foreground mt-1">{profile?.email ?? user?.email ?? 'Not set'}</p>
                  </div>
                  {profile?.bio && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Bio</label>
                      <p className="text-base text-foreground mt-1">{profile.bio}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card dark:bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-foreground">
                    <Shield className="h-5 w-5 mr-2 text-muted-foreground" />
                    Account & Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                      <span className="text-foreground">Account Verified</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className={`h-5 w-5 mr-2 ${isProfileComplete ? 'text-green-500 dark:text-green-400' : 'text-amber-500 dark:text-amber-400'}`} />
                      <span className="text-foreground">Profile {isProfileComplete ? 'Complete' : 'Incomplete'}</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />
                        <span className="text-foreground">Admin Access</span>
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={handleBiometricSetup}
                    variant="outline"
                    className="w-full justify-start border-border text-foreground hover:bg-muted mt-4"
                    aria-label="Set up biometric authentication"
                  >
                    <Fingerprint className="h-4 w-4 mr-2" aria-hidden="true" />
                    Set Up Biometric Login
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Location Settings */}
            <Card className="bg-card dark:bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-foreground">
                  <MapPin className="h-5 w-5 mr-2 text-muted-foreground" />
                  Your District
                </CardTitle>
                <CardDescription className="text-muted-foreground">
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

            {/* Quick Actions - Streamlined */}
            <Card className="bg-card dark:bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Quick Actions</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Manage your account settings and data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    onClick={handlePrivacySettings}
                    variant="outline"
                    className="justify-start border-border text-foreground hover:bg-muted"
                    aria-label="Open privacy settings"
                  >
                    <Shield className="h-4 w-4 mr-2" aria-hidden="true" />
                    Privacy Settings
                  </Button>
                  <Button
                    onClick={handleExportData}
                    variant="outline"
                    className="justify-start border-border text-foreground hover:bg-muted"
                    disabled={isExporting}
                    aria-label={isExporting ? 'Exporting profile data' : 'Export your profile data'}
                    aria-disabled={isExporting}
                  >
                    <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                    {isExporting ? 'Exporting...' : 'Export Data'}
                  </Button>
                </div>
                {exportStatus === 'success' && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-3">
                    Your profile data export has started downloading.
                  </p>
                )}
                {exportStatus === 'error' && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-3">
                    We could not export your data. Please try again.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </ErrorBoundary>
    </AuthGuard>
  );
}

export default function ProfilePage() {
  return <ProfilePageContent />;
}
