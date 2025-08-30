'use client'

import { useState, useEffect, useCallback } from 'react'
import { devLog } from '@/lib/logger';
import { getSupabaseBrowserClient } from '@/utils/supabase/client'
import { ensureUserSynced, getUserFromIaUsers, hasUserProfile } from '@/lib/user-sync'

export default function TestUserSync() {
  const [loading, setLoading] = useState(true)
  const [authUser, setAuthUser] = useState<any>(null)
  const [iaUser, setIaUser] = useState<any>(null)
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const [syncResult, setSyncResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = getSupabaseBrowserClient()

  const checkUserStatus = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (!supabase) {
        setError('Supabase client not available')
        setLoading(false)
        return
      }

      // Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        setError(`Auth error: ${userError.message}`)
        setLoading(false)
        return
      }

      if (!user) {
        setError('No authenticated user found')
        setLoading(false)
        return
      }

      setAuthUser(user)

      // Check if user exists in iausers table
      const { data: iaUserData, error: iaError } = await getUserFromIaUsers(user.id)
      
      if (iaError) {
        devLog('Error getting iauser:', iaError)
      } else {
        setIaUser(iaUserData)
      }

      // Check if user has profile
      const { hasProfile: profileExists, error: profileError } = await hasUserProfile(user.id)
      
      if (profileError) {
        devLog('Error checking profile:', profileError)
        setError(`Profile check failed: ${profileError}`)
      } else {
        setHasProfile(profileExists)
      }

      // Try to sync user
      const syncResult = await ensureUserSynced()
      setSyncResult(syncResult)

    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    checkUserStatus()
  }, [checkUserStatus])

  const handleSyncUser = async () => {
    setLoading(true)
    const result = await ensureUserSynced()
    setSyncResult(result)
    await checkUserStatus() // Refresh the status
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking user status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">User Synchronization Test</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Supabase Auth User */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Supabase Auth User</h2>
            {authUser ? (
              <div className="space-y-2">
                <p><strong>ID:</strong> {authUser.id}</p>
                <p><strong>Email:</strong> {authUser.email}</p>
                <p><strong>Email Confirmed:</strong> {authUser.emailconfirmedat ? 'Yes' : 'No'}</p>
                <p><strong>Created:</strong> {new Date(authUser.createdat).toLocaleString()}</p>
                <p><strong>Last Sign In:</strong> {authUser.lastsigninat ? new Date(authUser.lastsigninat).toLocaleString() : 'Never'}</p>
              </div>
            ) : (
              <p className="text-gray-500">No authenticated user</p>
            )}
          </div>

          {/* IA Users Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">IA Users Table</h2>
            {iaUser ? (
              <div className="space-y-2">
                <p><strong>ID:</strong> {iaUser.id}</p>
                <p><strong>Stable ID:</strong> {iaUser.stableid}</p>
                <p><strong>Email:</strong> {iaUser.email}</p>
                <p><strong>Verification Tier:</strong> {iaUser.verificationtier}</p>
                <p><strong>Active:</strong> {iaUser.isactive ? 'Yes' : 'No'}</p>
                <p><strong>Created:</strong> {new Date(iaUser.createdat).toLocaleString()}</p>
              </div>
            ) : (
              <p className="text-gray-500">User not found in iausers table</p>
            )}
          </div>
        </div>

        {/* User Profile Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Profile Status</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full ${hasProfile ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">
              {hasProfile ? 'Profile exists' : 'No profile found'}
            </span>
          </div>
          <p className="text-gray-600 mt-2">
            {hasProfile 
              ? 'User has completed onboarding and has a profile in userprofiles table'
              : 'User needs to complete onboarding to create a profile'
            }
          </p>
        </div>

        {/* Sync Result */}
        {syncResult && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sync Result</h2>
            <div className="space-y-2">
              <p><strong>Success:</strong> {syncResult.success ? 'Yes' : 'No'}</p>
              <p><strong>User Exists:</strong> {syncResult.userExists ? 'Yes' : 'No'}</p>
              <p><strong>Synced:</strong> {syncResult.synced ? 'Yes' : 'No'}</p>
              {syncResult.error && (
                <p><strong>Error:</strong> <span className="text-red-600">{syncResult.error}</span></p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
          <div className="space-x-4">
            <button
              onClick={handleSyncUser}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Syncing...' : 'Sync User'}
            </button>
            <button
              onClick={checkUserStatus}
              disabled={loading}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh Status'}
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-800 font-semibold mb-2">Summary</h3>
          <ul className="text-blue-700 space-y-1">
            <li>• Supabase Auth: {authUser ? '✅ User authenticated' : '❌ No user'}</li>
            <li>• IA Users Table: {iaUser ? '✅ User exists' : '❌ User missing'}</li>
            <li>• User Profile: {hasProfile ? '✅ Profile exists' : '❌ No profile'}</li>
            <li>• Sync Status: {syncResult?.synced ? '✅ Synced' : '❌ Not synced'}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

