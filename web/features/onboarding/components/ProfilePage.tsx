import {
  User,
  Shield,
  Download,
  Edit,
  Settings,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

/**
 * Enhanced Profile Page Component
 *
 * Superior implementation using React Query and Server Actions
 * Provides proper state management and real-time updates
 *
 * Created: January 27, 2025
 * Status: ✅ SUPERIOR IMPLEMENTATION
 */



import { useProfile, useProfileLoadingStates, useProfileErrorStates, useProfileExport } from '@/features/profile/hooks/use-profile';

import { EnhancedErrorDisplay } from '@/components/shared/EnhancedErrorDisplay';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import type { UserProfile } from '@/types/profile';

'use client';

export default function ProfilePage() {
  const { profile, isLoading, error } = useProfile();
  const { isAnyUpdating } = useProfileLoadingStates();
  const { profileError } = useProfileErrorStates();
  const exportMutation = useProfileExport();

  const [showExportConfirm, setShowExportConfirm] = useState(false);

  const profilePreferences = useMemo(() => {
    const p = profile as unknown as UserProfile | undefined;
    const prefs = p && typeof p === 'object' ? (p as Record<string, unknown>).preferences : undefined;
    if (prefs && typeof prefs === 'object') {
      return prefs as Record<string, unknown>;
    }
    return {};
  }, [profile]);
  const profilePrivacySettings = useMemo(() => {
    const p = profile as unknown as UserProfile | undefined;
    const settings = p && typeof p === 'object' ? (p as Record<string, unknown>).privacy_settings : undefined;
    if (settings && typeof settings === 'object') {
      return settings as Record<string, unknown>;
    }
    return {};
  }, [profile]);

  // Handle export data
  const handleExportData = () => {
    void exportMutation.exportProfile({ includeActivity: true, includeVotes: true, includeComments: true, format: 'json' });
    setShowExportConfirm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <EnhancedErrorDisplay
          title="Failed to load profile"
          message={profileError ?? 'Failed to load profile. Please try again.'}
          details="We encountered an issue while loading your profile. This might be a temporary network problem."
          tip="Check your internet connection and try again. If the problem persists, the service may be temporarily unavailable."
          canRetry={true}
          onRetry={() => {
            // Profile will be refetched automatically by the hook
            window.location.reload();
          }}
          primaryAction={{
            label: 'Try Again',
            onClick: () => window.location.reload(),
            icon: <RefreshCw className="h-4 w-4" />,
          }}
        />
      </div>
    );
  }

  const profileData = profile as UserProfile;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profileData.avatar_url ?? ''} alt={profileData.display_name ?? 'User'} />
              <AvatarFallback>
                {profileData.display_name?.charAt(0) || profileData.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{profileData.display_name ?? 'User'}</CardTitle>
              <CardDescription className="text-lg">@{profileData.username ?? 'username'}</CardDescription>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <Shield className="h-3 w-3" />
                  <span>{profileData.trust_tier}</span>
                </Badge>
                {profileData.is_admin && (
                  <Badge variant="destructive">Admin</Badge>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-sm">{profileData.email ?? ''}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Username</label>
              <p className="text-sm">@{profileData.username ?? ''}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Display Name</label>
              <p className="text-sm">{profileData.display_name ?? ''}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Bio</label>
              <p className="text-sm">{profileData.bio ?? 'No bio provided'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Account Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Trust Tier</label>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{profileData.trust_tier}</Badge>
                <span className="text-sm text-gray-500">
                  {profileData.trust_tier === 'T0' && 'New User'}
                  {profileData.trust_tier === 'T1' && 'Verified User'}
                  {profileData.trust_tier === 'T2' && 'Trusted User'}
                  {profileData.trust_tier === 'T3' && 'VIP User'}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Member Since</label>
              <p className="text-sm">
                {new Date(profileData.created_at ?? Date.now()).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Last Updated</label>
              <p className="text-sm">
                {new Date(profileData.updated_at ?? Date.now()).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preferences */}
      {Object.keys(profilePreferences).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Your personal preferences and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(profilePreferences).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-sm font-medium capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm text-gray-500">
                    {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy Settings */}
      {Object.keys(profilePrivacySettings).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
            <CardDescription>
              Your privacy and data sharing preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(profilePrivacySettings).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-sm font-medium capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm text-gray-500">
                    {typeof value === 'boolean' ? (value ? 'Enabled' : 'Disabled') : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>
            Manage your account and data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button
              variant="outline"
              onClick={() => setShowExportConfirm(true)}
              disabled={exportMutation.isExporting}
            >
              {exportMutation.isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export Data
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Privacy Settings
            </Button>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Confirmation Modal */}
      {showExportConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <CardHeader>
              <CardTitle>Export Your Data</CardTitle>
              <CardDescription>
                This will download a JSON file containing all your profile data, votes, and polls.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  The exported data will include your personal information. Keep it secure.
                </AlertDescription>
              </Alert>
              <div className="flex space-x-2">
                <Button
                  onClick={handleExportData}
                  disabled={exportMutation.isExporting}
                  className="flex-1"
                >
                  {exportMutation.isExporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export Data
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowExportConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading Overlay */}
      {isAnyUpdating && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Updating profile...</span>
          </div>
        </div>
      )}
    </div>
  );
}
