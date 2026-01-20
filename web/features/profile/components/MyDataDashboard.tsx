/**
 * My Data Dashboard Component
 *
 * 🔒 PRIVACY PARAMOUNT: Shows ALL collected data, provides complete control
 *
 * Features:
 * - View all collected data by category
 * - Export all data (GDPR/CCPA compliant)
 * - Delete specific data categories
 * - Delete all data and account
 * - Edit privacy settings
 * - Transparency and user control
 *
 * Created: November 5, 2025
 * Status: ✅ ACTIVE
 */

'use client';

import {
  Shield,
  Download,
  Trash2,
  Settings,
  Eye,
  Lock,
  MapPin,
  Vote,
  Hash,
  Activity,
  BarChart3,
  Users,
  Search,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Info
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useProfileDelete, useProfileExport } from '@/features/profile/hooks/use-profile';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

import { useUserActions } from '@/lib/stores';
import { profileSelectors, useProfileStore } from '@/lib/stores/profileStore';
import { logger } from '@/lib/utils/logger';

import type { PrivacySettings } from '@/types/profile';

type DataCategory = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  privacyKey: keyof PrivacySettings;
  count?: number;
  lastUpdated?: string;
  canDelete: boolean;
};

type MyDataDashboardProps = {
  userId: string;
  privacySettings: PrivacySettings | null;
  onPrivacyUpdate?: (settings: Partial<PrivacySettings>) => Promise<void>;
  isSaving?: boolean;
};

export default function MyDataDashboard({
  userId,
  privacySettings,
  onPrivacyUpdate,
  isSaving = false
}: MyDataDashboardProps) {
  // Client-side mount guard to prevent SSR hydration mismatches
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { exportProfile, isExporting } = useProfileExport();
  const { deleteProfile } = useProfileDelete();
  const { signOut: resetUserStore } = useUserActions();

  // CRITICAL FIX: Use useShallow for store subscriptions to prevent infinite render loops
  // This ensures stable object references from Zustand stores
  const storePrivacySettings = useProfileStore(
    useShallow((state) => profileSelectors.privacySettings(state))
  );

  // Store actions in refs to prevent dependency issues in useCallback/useEffect
  const updatePrivacySettingsAction = useProfileStore((state) => state.updatePrivacySettings);
  const resetProfileState = useProfileStore((state) => state.resetProfile);

  const updatePrivacySettingsActionRef = useRef(updatePrivacySettingsAction);
  const resetProfileStateRef = useRef(resetProfileState);

  useEffect(() => {
    updatePrivacySettingsActionRef.current = updatePrivacySettingsAction;
  }, [updatePrivacySettingsAction]);

  useEffect(() => {
    resetProfileStateRef.current = resetProfileState;
  }, [resetProfileState]);

  const effectivePrivacySettings = privacySettings ?? storePrivacySettings;

  // Data categories that can be collected
  const dataCategories: DataCategory[] = [
    {
      id: 'location',
      name: 'Location Data',
      description: 'Your saved addresses and location history',
      icon: <MapPin className="w-5 h-5" />,
      privacyKey: 'collectLocationData',
      canDelete: true
    },
    {
      id: 'voting',
      name: 'Voting History',
      description: 'Your poll votes and voting patterns',
      icon: <Vote className="w-5 h-5" />,
      privacyKey: 'collectVotingHistory',
      canDelete: true
    },
    {
      id: 'interests',
      name: 'Hashtag Interests',
      description: 'Hashtags you follow and interact with',
      icon: <Hash className="w-5 h-5" />,
      privacyKey: 'trackInterests',
      canDelete: true
    },
    {
      id: 'feed-interactions',
      name: 'Feed Activity',
      description: 'Content you liked, read, or bookmarked',
      icon: <Activity className="w-5 h-5" />,
      privacyKey: 'trackFeedActivity',
      canDelete: true
    },
    {
      id: 'analytics',
      name: 'Analytics Data',
      description: 'Usage patterns and interaction data',
      icon: <BarChart3 className="w-5 h-5" />,
      privacyKey: 'collectAnalytics',
      canDelete: true
    },
    {
      id: 'integrity-signals',
      name: 'Integrity Signals',
      description: 'Behavioral signals used to detect automated voting',
      icon: <Shield className="w-5 h-5" />,
      privacyKey: 'collectIntegritySignals',
      canDelete: true
    },
    {
      id: 'integrity-advanced',
      name: 'Advanced Integrity Signals',
      description: 'Device and network signals (opt-in only)',
      icon: <Shield className="w-5 h-5" />,
      privacyKey: 'collectIntegrityAdvancedSignals',
      canDelete: true
    },
    {
      id: 'representatives',
      name: 'Representative Interactions',
      description: 'Representatives you follow and contact',
      icon: <Users className="w-5 h-5" />,
      privacyKey: 'trackRepresentativeInteractions',
      canDelete: true
    },
    {
      id: 'search',
      name: 'Search History',
      description: 'Your search queries and results',
      icon: <Search className="w-5 h-5" />,
      privacyKey: 'retainSearchHistory',
      canDelete: true
    }
  ];

  // Handle export all data
  const handleExportData = useCallback(async () => {
    setError(null);
    setExportSuccess(false);

    try {
      const data = await exportProfile({
        includeActivity: true,
        includeVotes: true,
        includeComments: true,
        format: 'json',
      });

      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-data-${userId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      logger.info('Data exported successfully', { userId });

      setTimeout(() => setExportSuccess(false), 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export data';
      setError(errorMessage);
      logger.error('Data export failed', err instanceof Error ? err : new Error(errorMessage));
    }
  }, [exportProfile, userId]);

  // Handle delete specific data category
  const handleDeleteSpecificData = async (dataType: string) => {
    setIsDeleting(true);
    setError(null);
    setDeleteSuccess(null);

    try {
      const response = await fetch(`/api/profile/data?type=${dataType}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete data');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Deletion failed');
      }

      setDeleteSuccess(`${result.message} (${result.deletedCount} records)`);
      logger.info('Specific data deleted', { userId, dataType, count: result.deletedCount });

      // Clear success message after 5 seconds
      setTimeout(() => setDeleteSuccess(null), 5000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete data';
      setError(errorMessage);
      logger.error('Data deletion failed', err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
      setShowDeleteConfirm(false);
    }
  };

  // Handle delete ALL data and account
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteProfile();

      if (!result.success) {
        throw new Error(result.error || 'Deletion failed');
      }

      logger.info('Account deleted successfully', { userId });
      resetUserStore();
      if (resetProfileStateRef.current) {
        resetProfileStateRef.current();
      }
      window.location.href = '/';
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete account';
      setError(errorMessage);
      logger.error('Account deletion failed', err instanceof Error ? err : new Error(errorMessage));
      setIsDeleting(false);
    }
  };

  // Confirmation dialog for specific data deletion
  const confirmDeleteData = (dataType: string) => {
    setDeleteTarget(dataType);
    setShowDeleteConfirm(true);
  };

  // Don't render until mounted to prevent SSR hydration mismatches
  if (!isMounted) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded" />
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-600" />
          My Data & Privacy
        </h1>
        <p className="text-gray-600">
          View, export, and manage all your data. You have complete control.
        </p>
      </div>

      {/* Alerts */}
      {exportSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your data has been exported successfully!
          </AlertDescription>
        </Alert>
      )}

      {deleteSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {deleteSuccess}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Privacy Commitment */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Our Privacy Commitment
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2">
          <p>✅ <strong>Your data is yours.</strong> We never sell, rent, or share your personal information.</p>
          <p>✅ <strong>Complete transparency.</strong> See exactly what we have collected.</p>
          <p>✅ <strong>Complete control.</strong> Export or delete your data anytime.</p>
          <p>✅ <strong>Privacy first.</strong> All data collection requires your explicit consent.</p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Manage your data with one click
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full justify-start"
            variant="outline"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export All My Data (JSON)
          </Button>
          <p className="text-sm text-gray-500 ml-1">
            Download a complete copy of all your data in machine-readable format
          </p>
        </CardContent>
      </Card>

      {/* Data Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Your Data by Category
          </CardTitle>
          <CardDescription>
            Only categories you&apos;ve opted in to collect are shown
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {dataCategories.map((category) => {
            const isEnabled = effectivePrivacySettings?.[category.privacyKey] === true;

            return (
              <div
                key={category.id}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${isEnabled
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 bg-gray-50 opacity-60'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`${isEnabled ? 'text-blue-600' : 'text-gray-400'} mt-0.5`}>
                      {category.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {category.description}
                      </p>

                      {!isEnabled && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Lock className="w-4 h-4" />
                          <span>Not collected (privacy setting disabled)</span>
                        </div>
                      )}

                      {isEnabled && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>Currently collecting (you opted in)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isEnabled && category.canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => confirmDeleteData(category.id)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {isDeleting && deleteTarget === category.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Show message if no data collection enabled */}
          {!dataCategories.some(cat => effectivePrivacySettings?.[cat.privacyKey] === true) && (
            <div className="text-center py-8">
              <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium mb-2">
                Maximum Privacy Enabled
              </p>
              <p className="text-sm text-gray-500">
                You haven&apos;t opted in to collect any data categories. Your privacy is fully protected!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy Settings Quick Edit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Privacy Settings
          </CardTitle>
          <CardDescription>
            Control what data is collected about you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dataCategories.map((category) => {
              const isEnabled = effectivePrivacySettings?.[category.privacyKey] === true;

              return (
                <div key={category.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-gray-600">
                      {category.icon}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{category.name}</p>
                      <p className="text-sm text-gray-500">{category.description}</p>
                    </div>
                  </div>

                          <Switch
                            checked={isEnabled}
                            disabled={isSaving}
                            onCheckedChange={async (checked) => {
                              try {
                                if (onPrivacyUpdate) {
                                  await onPrivacyUpdate({ [category.privacyKey]: checked });
                                } else if (updatePrivacySettingsActionRef.current) {
                                  await updatePrivacySettingsActionRef.current({ [category.privacyKey]: checked });
                                }
                                setError(null);
                              } catch (err) {
                                const message = err instanceof Error ? err.message : 'Failed to update privacy setting';
                                setError(message);
                                logger.error('Privacy toggle failed', err instanceof Error ? err : new Error(message));
                              }
                            }}
                          />
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">What happens when you enable data collection?</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>We start collecting that specific type of data</li>
                  <li>You can turn it off anytime</li>
                  <li>You can delete collected data anytime</li>
                  <li>Your choice is always respected</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Delete {dataCategories.find(c => c.id === deleteTarget)?.name}?
              </CardTitle>
              <CardDescription>
                This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Are you sure you want to permanently delete all{' '}
                <strong>{dataCategories.find(c => c.id === deleteTarget)?.name.toLowerCase()}</strong>?
              </p>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTarget(null);
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteSpecificData(deleteTarget)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Permanently
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Danger Zone - Delete Account */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-red-800 text-sm mb-3">
              <strong>Warning:</strong> Deleting your account will permanently remove:
            </p>
            <ul className="text-red-700 text-sm space-y-1 ml-4 list-disc">
              <li>Your profile and all personal information</li>
              <li>All voting records and poll data</li>
              <li>All hashtag interests and interactions</li>
              <li>All feed activity and preferences</li>
              <li>All analytics and usage data</li>
              <li>Your authentication credentials</li>
            </ul>
            <p className="text-red-800 text-sm mt-3 font-semibold">
              This action is IRREVERSIBLE and cannot be undone.
            </p>
          </div>

          <Button
            variant="destructive"
            onClick={() => {
              if (confirm('Are you ABSOLUTELY SURE you want to delete your account? This cannot be undone.')) {
                if (confirm('Final confirmation: Delete all my data and close my account permanently?')) {
                  handleDeleteAccount();
                }
              }
            }}
            disabled={isDeleting}
            className="w-full"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting Account...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete My Account and All Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Privacy Philosophy */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div className="text-sm text-gray-700 space-y-2">
              <p className="font-semibold text-gray-900">Why we built this dashboard:</p>
              <p>
                We believe your data is <strong>yours</strong>, not ours. This platform is open source
                and built on ethical principles. We only collect data you explicitly agree to share,
                and you can see, export, or delete everything at any time.
              </p>
              <p>
                Unlike big tech platforms, we&apos;re not here to farm your data. We&apos;re here to
                empower civic engagement with complete respect for your privacy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

