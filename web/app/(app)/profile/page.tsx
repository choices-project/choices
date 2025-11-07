'use client'

import { User, Shield, Download, Edit, Settings, CheckCircle, AlertTriangle, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AddressLookup } from '@/features/profile/components/AddressLookup';
import { useProfile, useProfileExport } from '@/features/profile/hooks/use-profile';
import { logger } from '@/lib/utils/logger';

export default function ProfilePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Direct server-side authentication check (same as dashboard)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/profile', {
          credentials: 'include',
        });
        
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        logger.error('Profile auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // SECURITY: Redirect unauthenticated users to login
  useEffect(() => {
    if (!isLoading && isAuthenticated === false) {
      logger.debug('🚨 SECURITY: Unauthenticated user attempting to access profile - redirecting to login');
      router.push('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  // All hooks must be called at the top level before any early returns
  const { profile, isLoading: profileLoading, error: profileError } = useProfile();
  const exportMutation = useProfileExport();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Show login prompt if not authenticated

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

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load profile data. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Profile data is already available from useProfile hook

  return (
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
                // Refresh profile after district is saved
                window.location.reload();
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
                onClick={() => exportMutation.exportProfile({
                  includeActivity: true,
                  includeVotes: true,
                  includeComments: true,
                  format: 'json'
                })} 
                variant="outline" 
                className="justify-start"
                disabled={exportMutation.isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {exportMutation.isExporting ? 'Exporting...' : 'Export Data'}
              </Button>
              <Button variant="outline" className="justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Advanced Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
