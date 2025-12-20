'use client'

import { User, Shield, Download, Edit, Settings, CheckCircle, AlertTriangle, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback, useRef } from 'react';

import { AddressLookup } from '@/features/profile/components/AddressLookup';
import { useProfileData, useProfileExport } from '@/features/profile/hooks/use-profile';

import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

import { useUser, useIsAuthenticated, useUserLoading } from '@/lib/stores';
import { useAppActions } from '@/lib/stores/appStore';
import { logger } from '@/lib/utils/logger';

export default function ProfilePage() {
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

  useEffect(() => {
    setCurrentRoute('/profile');
    setSidebarActiveSection('profile');
    setBreadcrumbs([
      { label: 'Home', href: '/' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Profile', href: '/profile' },
    ]);

    return () => {
      setSidebarActiveSection(null);
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setCurrentRoute, setSidebarActiveSection]);

  useEffect(() => {
    if (!isUserLoading && !isAuthenticated) {
      logger.debug('🚨 SECURITY: Unauthenticated user attempting to access profile - redirecting to login');
      routerRef.current.replace('/auth?redirectTo=/profile');
    }
  }, [isAuthenticated, isUserLoading]); // Removed router

  const handleExportData = useCallback(async () => {
    setExportStatus(null);
    try {
      const data = await exportProfile({
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
  }, [exportProfile, profile?.id, user?.id]);

  // Add timeout to prevent infinite loading - must be before early returns
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  useEffect(() => {
    if (profileLoading && !profile && !profileError) {
      const timeout = setTimeout(() => {
        setLoadingTimeout(true);
      }, 15_000); // 15 second timeout
      return () => clearTimeout(timeout);
    }
    setLoadingTimeout(false);
  }, [profileLoading, profile, profileError]);

  if (isUserLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
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

  if ((profileLoading && !profile && !profileError) || loadingTimeout) {
    // Show loading state with timeout message if taking too long
    return (
      <ErrorBoundary>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4 max-w-md">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
            <p className="text-gray-600 dark:text-gray-400">
              {loadingTimeout ? 'Loading is taking longer than expected...' : 'Loading profile...'}
            </p>
            {loadingTimeout && (
              <button
                onClick={() => {
                  void refetch();
                  setLoadingTimeout(false);
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleSettings = () => {
    router.push('/profile/preferences');
  };

  const handlePrivacySettings = () => {
    router.push('/profile/preferences');
  };

  const handleEditProfileFromActions = () => {
    router.push('/profile/edit');
  };

  if (profileError) {
    return (
      <ErrorBoundary>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load profile data. Please try again.
            </AlertDescription>
          </Alert>
        </div>
      </ErrorBoundary>
    );
  }

  // Profile data is already available from useProfile hook

  return (
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
              <Button onClick={handleEditProfile} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button onClick={handleSettings} variant="outline">
                <Settings className="h-4 w-4 mr-2" />
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
                void refetch();
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
              <Button onClick={handlePrivacySettings} variant="outline" className="justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Privacy Settings
              </Button>
              <Button onClick={handleEditProfileFromActions} variant="outline" className="justify-start">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button 
                onClick={handleExportData} 
                variant="outline" 
                className="justify-start"
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
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
  );
}
