'use client';

import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Download,
  Edit,
  Loader2,
  Mail,
  RefreshCw,
  Settings,
  Shield,
  User,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { EnhancedErrorDisplay } from '@/components/shared/EnhancedErrorDisplay';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useIsAuthenticated, useUserLoading } from '@/lib/stores';
import logger from '@/lib/utils/logger';

import {
  useProfileCompleteness,
  useProfileData,
  useProfileDisplay,
  useProfileExport,
  useProfileLoadingStates,
} from '../hooks/use-profile';

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

export default function ProfilePage({
  user,
  isOwnProfile: _isOwnProfile = false,
  canEdit: _canEdit = false
}: ProfilePageProps) {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isUserLoading = useUserLoading();
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
  const { exportProfile, isExporting, error: exportError } = useProfileExport();

  // Use ref for exportProfile callback to prevent infinite re-renders
  const exportProfileRef = useRef(exportProfile);
  useEffect(() => { exportProfileRef.current = exportProfile; }, [exportProfile]);

  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null);
  const exportFailureMessage = exportErrorMessage ?? exportError ?? null;

  const finalUser = useMemo(() => user ?? profile, [user, profile]);
  const finalLoading = isLoading || isUserLoading;
  const finalError = error;
  const canEditProfile = _canEdit || _isOwnProfile;
  const exportDialogTitleId = useId();
  const exportDialogDescriptionId = useId();
  const exportDialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Use ref for router to prevent infinite re-renders
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);

  const handleNavigate = useCallback(
    (path: string) => {
      try {
        routerRef.current.push(path);
      } catch (err) {
        logger.error('Failed to navigate', err instanceof Error ? err : new Error(String(err)));
      }
    },
    [],
  );

  const handleExportData = useCallback(async () => {
    setExportErrorMessage(null);

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
      link.download = `profile-export-${data.profile?.id ?? 'user'}-${new Date()
        .toISOString()
        .split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setShowExportConfirm(false);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export profile data';
      setExportErrorMessage(message);
      logger.error('Profile export failed', err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  useEffect(() => {
    if (!showExportConfirm) {
      previouslyFocusedElement.current?.focus();
      return undefined;
    }

    previouslyFocusedElement.current = document.activeElement as HTMLElement | null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowExportConfirm(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const focusable = exportDialogRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showExportConfirm]);

  if (!isAuthenticated && _isOwnProfile && !isUserLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert>
          <AlertDescription>
            Please sign in to view your profile.
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={() => router.push('/auth')} variant="default">
            Sign in
          </Button>
          <Button onClick={() => router.push('/')} variant="outline">
            Back to home
          </Button>
        </div>
      </div>
    );
  }

  if (finalLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-live="polite" aria-busy="true">
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
        <EnhancedErrorDisplay
          title="Failed to load profile"
          message={finalError ?? 'Failed to load profile. Please try again.'}
          details="We encountered an issue while loading your profile. This might be a temporary network problem."
          tip="Check your internet connection and try again. If the problem persists, the service may be temporarily unavailable."
          canRetry={true}
          onRetry={() => window.location.reload()}
          primaryAction={{
            label: 'Try Again',
            onClick: () => window.location.reload(),
            icon: <RefreshCw className="h-4 w-4" />,
          }}
          secondaryAction={{
            label: 'Back to Dashboard',
            onClick: () => router.push('/dashboard'),
          }}
        />
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
              {canEditProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigate('/profile/edit')}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
              {canEditProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigate('/account/privacy')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              )}
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
              onClick={() => handleNavigate('/profile/edit')}
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
            {canEditProfile && (
              <Button
                variant="outline"
                onClick={() => handleNavigate('/profile/edit')}
                disabled={loadingStates.isAnyUpdating}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
            {canEditProfile && (
              <Button
                variant="outline"
                onClick={() => handleNavigate('/account/privacy')}
                disabled={loadingStates.isAnyUpdating}
              >
                <Settings className="h-4 w-4 mr-2" />
                Privacy Settings
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowExportConfirm(true)}
              disabled={loadingStates.isAnyUpdating || loadingStates.isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {loadingStates.isExporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </div>
          {exportSuccess && (
            <Alert className="mt-4 bg-green-50 border-green-200">
              <AlertDescription className="text-green-700">
                Your profile export has started downloading.
              </AlertDescription>
            </Alert>
          )}
          {exportFailureMessage && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{exportFailureMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Export Confirmation Modal */}
      {showExportConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            role="presentation"
            aria-hidden="true"
            onClick={() => setShowExportConfirm(false)}
            data-testid="profile-export-overlay"
          />
          <div
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={exportDialogTitleId}
            aria-describedby={exportDialogDescriptionId}
          >
            <div
              ref={exportDialogRef}
              className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4"
            >
              <button
                type="button"
                onClick={() => setShowExportConfirm(false)}
                aria-label="Close export dialog"
                className="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <X className="h-4 w-4" />
              </button>
              <h3 id={exportDialogTitleId} className="text-lg font-semibold mb-4">Export Your Data</h3>
              <p id={exportDialogDescriptionId} className="text-sm text-gray-600 mb-6">
                This will download a JSON file containing all your profile data, preferences, and activity history.
              </p>
              <div className="flex space-x-2">
                <Button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="flex-1"
                >
                  {isExporting ? (
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
                  disabled={isExporting}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </>
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
