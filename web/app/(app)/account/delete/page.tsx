'use client'

import { ArrowLeft, Trash2, Download, AlertTriangle, Shield, User, Vote, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useCallback, useEffect } from 'react';

import { useProfileDelete, useProfileExport } from '@/features/profile/hooks/use-profile';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useAppActions } from '@/lib/stores/appStore';
import { useUser, useUserLoading, useUserActions } from '@/lib/stores/userStore';
import { devLog } from '@/lib/utils/logger';

type UserData = {
  profile: {
    displayname: string
    email: string
    createdat: string
    pollscreated: number
    votescast: number
    commentsmade: number
  }
  polls: Array<{
    id: string
    title: string
    createdat: string
    totalvotes: number
  }>
  votes: Array<{
    pollid: string
    polltitle: string
    votedat: string
    optionselected: string
  }>
  comments: Array<{
    pollid: string
    polltitle: string
    comment: string
    createdat: string
  }>
}

type DeletionStep = {
  id: string
  title: string
  description: string
  completed: boolean
  required: boolean
}

export default function AccountDeletionPage() {
  const router = useRouter()
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions()
  const user = useUser()
  const isUserLoading = useUserLoading()
  const { signOut } = useUserActions()
  const { exportProfile, isExporting: profileExporting, error: exportError } = useProfileExport()
  const { deleteProfile, isDeleting: profileDeleting, error: deleteError } = useProfileDelete()

  // All hooks must be called at the top level
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [deletionSteps, setDeletionSteps] = useState<DeletionStep[]>([
    {
      id: 'data-export',
      title: 'Export Your Data',
      description: 'Download a copy of all your data before deletion',
      completed: false,
      required: false
    },
    {
      id: 'confirm-deletion',
      title: 'Confirm Deletion',
      description: 'Acknowledge that this action is irreversible',
      completed: false,
      required: true
    },
    {
      id: 'enter-email',
      title: 'Enter Email Address',
      description: 'Type your email address to confirm deletion',
      completed: false,
      required: true
    },
    {
      id: 'final-confirmation',
      title: 'Final Confirmation',
      description: 'Click the delete button to permanently remove your account',
      completed: false,
      required: true
    }
    ])

  const loadUserData = useCallback(async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/user/data')
      if (!response.ok) {
        throw new Error('Failed to load user data')
      }

      const data = await response.json()
      setUserData(data)
    } catch (error) {
      devLog('Error loading user data:', { error })
      setError('Failed to load user data')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    setCurrentRoute('/account/delete');
    setSidebarActiveSection('account');
    setBreadcrumbs([
      { label: 'Home', href: '/' },
      { label: 'Account', href: '/account' },
      { label: 'Delete Account', href: '/account/delete' },
    ]);

    return () => {
      setSidebarActiveSection(null);
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setCurrentRoute, setSidebarActiveSection]);

  // Load user data on component mount
  useEffect(() => {
    loadUserData()
  }, [loadUserData])

  const exportUserData = useCallback(async () => {
    if (!user) return

    try {
      setError(null)

      const data = await exportProfile({
        includeActivity: true,
        includeVotes: true,
        includeComments: true,
        format: 'json',
      })

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })

      const { safeWindow, safeDocument } = await import('@/lib/utils/ssr-safe');
      const url = safeWindow((w) => w.URL?.createObjectURL?.(blob));

      if (url) {
        const link = safeDocument((d) => d.createElement?.('a')) as HTMLAnchorElement | null;
        if (link) {
          link.href = url;
          link.download = `user-data-${user.email}-${new Date()
            .toISOString()
            .split('T')[0]}.json`;
          safeDocument((d) => d.body?.appendChild?.(link));
          link.click();
          safeWindow((w) => w.URL?.revokeObjectURL?.(url));
          safeDocument((d) => d.body?.removeChild?.(link));
        }
      }

      setDeletionSteps((prev) =>
        prev.map((step) =>
          step.id === 'data-export' ? { ...step, completed: true } : step,
        ),
      )
    } catch (error) {
      devLog('Error exporting user data:', { error })
      setError(error instanceof Error ? error.message : 'Failed to export user data')
    }
  }, [exportProfile, user])

  const confirmDeletion = useCallback(() => {
    setDeletionSteps(prev =>
      prev.map(step =>
        step.id === 'confirm-deletion' ? { ...step, completed: true } : step
      )
    )
    setShowConfirmation(true)
  }, [])

  const handleEmailConfirmation = useCallback((email: string) => {
    if (email === user?.email) {
      setDeletionSteps(prev =>
        prev.map(step =>
          step.id === 'enter-email' ? { ...step, completed: true } : step
        )
      )
    }
  }, [user?.email])

  const deleteAccount = useCallback(async () => {
    if (!user) return

    try {
      setError(null)

      const result = await deleteProfile()
      if (!result.success) {
        throw new Error(result.error ?? 'Failed to delete account')
      }

      setDeletionSteps((prev) =>
        prev.map((step) =>
          step.id === 'final-confirmation' ? { ...step, completed: true } : step,
        ),
      )

      setIsRedirecting(true)
      if (signOut) {
        await signOut()
      }
      router.push('/')
    } catch (error) {
      devLog('Error deleting account:', { error })
      setError(error instanceof Error ? error.message : 'Failed to delete account')
    } finally {
      setIsRedirecting(false)
    }
  }, [deleteProfile, router, signOut, user])

  const canDelete = deletionSteps.every(step => step.completed || !step.required)

  if (isUserLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" role="status" aria-live="polite" aria-busy="true">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your account data...</p>
        </div>
      </div>
    )
  }

  // Handle case where auth context is not available during pre-rendering
  if (!user || !signOut) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Account Deletion</h1>
          <p className="text-gray-600 mb-6">Please log in to access this page.</p>
          <a
            href="/auth?redirectTo=/account/delete"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Log in
          </a>
        </div>
      </div>
    );
  }

  const blockingError = error ?? deleteError ?? exportError;

  if (blockingError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{blockingError}</AlertDescription>
          </Alert>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => window.location.reload()}>
              Reload
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Back to dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main id="main-content" role="main" className="min-h-screen bg-gray-50" aria-label="Delete account">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/account/privacy')}
                className="flex items-center text-gray-600 hover:text-gray-900"
                aria-label="Navigate back to Privacy & Data settings"
              >
                <ArrowLeft className="h-5 w-5 mr-2" aria-hidden="true" />
                Back to Privacy & Data
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Delete Account</h1>
                <p className="text-gray-600">Permanently remove your account and all data</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Warning Alert */}
            <Alert className="border-red-200 bg-red-50" role="alert" data-testid="account-delete-warning">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Warning:</strong> This action is irreversible. Once you delete your account,
                all your data including polls, votes, and comments will be permanently removed.
              </AlertDescription>
            </Alert>

            {/* Account Summary */}
            {userData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Your Account Summary
                  </CardTitle>
                  <CardDescription>
                    This is what will be permanently deleted
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{userData.profile.pollscreated}</div>
                      <div className="text-sm text-gray-600">Polls Created</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{userData.profile.votescast}</div>
                      <div className="text-sm text-gray-600">Votes Cast</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{userData.profile.commentsmade}</div>
                      <div className="text-sm text-gray-600">Comments Made</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <strong>Account created:</strong> {new Date(userData.profile.createdat).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Email:</strong> {userData.profile.email}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Deletion Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Account Deletion Process
                </CardTitle>
                <CardDescription>
                  Follow these steps to securely delete your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deletionSteps.map((step, index) => (
                    <div key={step.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        {step.completed ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <div className="h-6 w-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-500">{index + 1}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{step.title}</h4>
                          {step.required && (
                            <Badge variant="secondary" className="text-xs">Required</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{step.description}</p>

                        {/* Step-specific actions */}
                        {step.id === 'data-export' && !step.completed && (
                          <Button
                            onClick={exportUserData}
                            disabled={profileExporting}
                            variant="outline"
                            size="sm"
                            className="mt-3"
                          >
                            {profileExporting ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
                            ) : (
                              <Download className="h-4 w-4 mr-2" />
                            )}
                            {profileExporting ? 'Exporting...' : 'Export Data'}
                          </Button>
                        )}

                        {step.id === 'confirm-deletion' && !step.completed && (
                          <Button
                            onClick={confirmDeletion}
                            variant="outline"
                            size="sm"
                            className="mt-3"
                          >
                            I Understand
                          </Button>
                        )}

                        {step.id === 'enter-email' && !step.completed && showConfirmation && (
                          <div className="mt-3">
                            <label htmlFor="email-confirmation" className="sr-only">
                              Enter your email address to confirm account deletion
                            </label>
                            <input
                              id="email-confirmation"
                              type="email"
                              placeholder="Enter your email address"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                              onChange={(e) => handleEmailConfirmation(e.target.value)}
                              aria-describedby="email-confirmation-help"
                            />
                            <p id="email-confirmation-help" className="text-xs text-gray-500 mt-1">
                              Type your email address to confirm: {user?.email}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Final Delete Button */}
            {canDelete && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-800">
                    <Trash2 className="h-5 w-5 mr-2" />
                    Final Confirmation
                  </CardTitle>
                  <CardDescription className="text-red-700">
                    Click the button below to permanently delete your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={deleteAccount}
                    disabled={profileDeleting || isRedirecting}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    aria-label={profileDeleting || isRedirecting
                      ? 'Deleting account, please wait'
                      : 'Permanently delete account and all associated data'}
                  >
                    {profileDeleting || isRedirecting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                    )}
                    {profileDeleting || isRedirecting
                      ? 'Deleting Account...'
                      : 'Permanently Delete Account'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* What Happens Next */}
            <Card>
              <CardHeader>
                <CardTitle>What Happens Next</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Clock className="h-4 w-4 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Immediate Deletion</p>
                    <p className="text-xs text-gray-600">Your account and data are removed immediately</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Vote className="h-4 w-4 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Polls & Votes</p>
                    <p className="text-xs text-gray-600">All your polls and votes will be deleted</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <FileText className="h-4 w-4 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Comments</p>
                    <p className="text-xs text-gray-600">All your comments will be removed</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <XCircle className="h-4 w-4 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">No Recovery</p>
                    <p className="text-xs text-gray-600">This action cannot be undone</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alternative Options */}
            <Card>
              <CardHeader>
                <CardTitle>Alternative Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => router.push('/account/privacy')}
                  variant="outline"
                  className="w-full"
                >
                  Update Privacy & Data
                </Button>
                <Button
                  onClick={() => router.push('/profile/edit')}
                  variant="outline"
                  className="w-full"
                >
                  Edit Profile
                </Button>
                <Button
                  onClick={() => router.push('/device-optimization')}
                  variant="outline"
                  className="w-full"
                >
                  Device Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
