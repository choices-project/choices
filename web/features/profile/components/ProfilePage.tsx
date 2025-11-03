import { 
  User, 
  Shield, 
  Download, 
  Edit, 
  Settings, 
  CheckCircle,
  AlertTriangle,
  Loader2,
  Mail,
  Calendar,
  Activity
} from 'lucide-react';
import React, { useState } from 'react';


import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

import { useProfileData, useProfileDisplay, useProfileCompleteness, useProfileLoadingStates } from '../hooks/use-profile';
import type { ProfilePageProps } from '../index';

/**
 * Profile Page Component
 * 
 * Main profile display component
 * Consolidates profile display functionality
 * 
 * Created: December 19, 2024
 * Status: ✅ CONSOLIDATED
 */

'use client';

export default function ProfilePage({ 
  user, 
  isOwnProfile = false, 
  canEdit = false 
}: ProfilePageProps) {
  const { user: _authUser, isLoading: authLoading } = useAuth();
  const { 
    profile, 
    isLoading, 
    error
  } = useProfileData();
  
  // Get loading states separately
  const loadingStates = useProfileLoadingStates();
  const { 
    displayName, 
    initials, 
    trustTier, 
    trustTierDisplay, 
    isAdmin 
  } = useProfileDisplay();
  const { isComplete, missingFields, completionPercentage } = useProfileCompleteness();
  
  const [showExportConfirm, setShowExportConfirm] = useState(false);

  // Use available data
  const finalUser = user ?? profile;
  const finalLoading = isLoading;
  const finalError = error;

  // Handle export data
  const handleExportData = () => {
    // Note: Export functionality would be implemented here
    console.log('Export data requested');
    setShowExportConfirm(false);
  };

  if (authLoading || finalLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (finalError || !finalUser) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {finalError ?? 'Failed to load profile. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={finalUser.avatar_url ?? ''} alt={displayName} />
              <AvatarFallback>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl" data-testid="profile-username">
                {displayName}
              </CardTitle>
              <CardDescription className="text-lg" data-testid="profile-email">
                @{finalUser.username ?? 'username'}
              </CardDescription>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <Shield className="h-3 w-3" />
                  <span>{trustTier}</span>
                </Badge>
                {isAdmin && (
                  <Badge variant="destructive">Admin</Badge>
                )}
                {!isComplete && (
                  <Badge variant="outline" className="text-orange-600">
                    Incomplete Profile
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Note: Edit functionality would be implemented here
                  console.log('Edit profile requested');
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Note: Settings functionality would be implemented here
                  console.log('Settings requested');
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Completion Alert */}
      {!isComplete && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your profile is {completionPercentage}% complete. 
            Missing: {missingFields.join(', ')}. 
            <Button 
              variant="link" 
              className="p-0 h-auto ml-1"
              onClick={() => {
                // Note: Edit functionality would be implemented here
                console.log('Complete profile requested');
              }}
            >
              Complete your profile
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Information Grid */}
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
              <p className="text-sm flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                {finalUser.email}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Username</label>
              <p className="text-sm">@{finalUser.username}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Display Name</label>
              <p className="text-sm">{finalUser.display_name ?? 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Bio</label>
              <p className="text-sm">{finalUser.bio ?? 'No bio provided'}</p>
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
                <Badge variant="secondary">{trustTier}</Badge>
                <span className="text-sm text-gray-500">
                  {trustTierDisplay}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Member Since</label>
              <p className="text-sm flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                {finalUser.created_at ? new Date(finalUser.created_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Last Updated</label>
              <p className="text-sm flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                {finalUser.updated_at ? new Date(finalUser.updated_at).toLocaleDateString() : 'Unknown'}
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

      {/* Profile Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Actions</CardTitle>
          <CardDescription>
            Manage your profile data and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                // Note: Edit functionality would be implemented here
                console.log('Edit profile requested');
              }}
              disabled={loadingStates.isAnyUpdating}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                // Note: Settings functionality would be implemented here
                console.log('Privacy settings requested');
              }}
              disabled={loadingStates.isAnyUpdating}
            >
              <Settings className="h-4 w-4 mr-2" />
              Privacy Settings
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowExportConfirm(true)}
              disabled={loadingStates.isAnyUpdating || loadingStates.isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {loadingStates.isExporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Confirmation Modal */}
      {showExportConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Export Your Data</h3>
            <p className="text-sm text-gray-600 mb-6">
              This will download a JSON file containing all your profile data, 
              preferences, and activity history.
            </p>
            <div className="flex space-x-2">
              <Button 
                onClick={handleExportData}
                disabled={loadingStates.isExporting}
                className="flex-1"
              >
                {loadingStates.isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowExportConfirm(false)}
                disabled={loadingStates.isExporting}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loadingStates.isAnyUpdating && (
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
