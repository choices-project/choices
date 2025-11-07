/**
 * Example Component: Profile Management with React Query
 *
 * This is a complete example showing best practices for:
 * - Using React Query hooks
 * - Type-safe API calls
 * - Error handling
 * - Loading states
 * - Optimistic updates
 *
 * Created: November 6, 2025
 * Status: ✅ EXAMPLE CODE
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ApiError } from '@/lib/api';
import { useProfile, useUpdateProfile, useDeleteProfile } from '@/lib/hooks/useApi';

export default function ProfileExample() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');

  // Get profile with automatic caching
  const {
    data: profile,
    isLoading,
    error,
    refetch
  } = useProfile();

  // Update profile mutation
  const updateProfile = useUpdateProfile({
    onSuccess: () => {
      alert('Profile updated!');
      // Cache is automatically updated by the hook
    },
    onError: (error) => {
      if (error.isAuthError()) {
        router.push('/login');
      } else if (error.isValidationError()) {
        alert(`Validation error: ${JSON.stringify(error.details)}`);
      } else {
        alert(`Error: ${error.message}`);
      }
    }
  });

  // Delete profile mutation
  const deleteProfile = useDeleteProfile({
    onSuccess: () => {
      // Automatically cleared cache and redirected by hook
      alert('Profile deleted');
    },
  });

  // Loading state
  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  // Error state
  if (error) {
    if (error instanceof ApiError && error.isAuthError()) {
      return <div>Please log in</div>;
    }
    return <div>Error: {error.message}</div>;
  }

  // No profile
  if (!profile) {
    return <div>No profile found</div>;
  }

  // Handlers
  const handleUpdate = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: displayName
      });
    } catch {
      // Error already handled by onError callback
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete your profile?')) {
      await deleteProfile.mutateAsync();
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="p-4">
      <h1>Profile Management</h1>

      {/* Display current profile */}
      <div className="mt-4">
        <p><strong>Display Name:</strong> {profile.display_name}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Trust Tier:</strong> {profile.trust_tier}</p>
        <p><strong>Admin:</strong> {profile.is_admin ? 'Yes' : 'No'}</p>
      </div>

      {/* Update form */}
      <div className="mt-4">
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="New display name"
          className="border p-2"
        />
        <button
          onClick={handleUpdate}
          disabled={updateProfile.isPending}
          className="ml-2 bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {updateProfile.isPending ? 'Updating...' : 'Update'}
        </button>
      </div>

      {/* Actions */}
      <div className="mt-4 space-x-2">
        <button
          onClick={handleRefresh}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Refresh
        </button>

        <button
          onClick={handleDelete}
          disabled={deleteProfile.isPending}
          className="bg-red-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {deleteProfile.isPending ? 'Deleting...' : 'Delete Profile'}
        </button>
      </div>
    </div>
  );
}

