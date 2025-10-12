/**
 * Enhanced Profile Server Actions
 * 
 * Superior implementation using Server Actions instead of API routes
 * Provides type-safe operations with proper error handling
 * 
 * Created: January 27, 2025
 * Status: ✅ SUPERIOR IMPLEMENTATION
 */

'use server';

import { revalidatePath } from 'next/cache';

import { 
  requireProfileUser, 
  validateProfileData 
} from '@/lib/core/auth/profile-auth';

// Types for superior implementation - matches documented superior implementation
export interface ProfileUser {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  trust_tier: 'T0' | 'T1' | 'T2' | 'T3';
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateData {
  // Core profile fields
  bio?: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  email?: string;
  
  // Trust and admin fields
  trust_tier?: 'T0' | 'T1' | 'T2' | 'T3';
  is_admin?: boolean;
  is_active?: boolean;
  
  // Location and privacy fields
  geo_lat?: number;
  geo_lon?: number;
  geo_coarse_hash?: string;
  geo_precision?: string;
  geo_trust_gate?: string;
  geo_consent_version?: number;
  geo_source?: string;
}

export interface ProfileActionResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Get current user profile
 * Superior implementation with proper error handling
 */
export async function getCurrentProfile(): Promise<ProfileActionResult> {
  try {
    const authResult = await requireProfileUser();
    
    if ('error' in authResult) {
      console.log('[getCurrentProfile] Auth error:', authResult.error);
      return {
        success: false,
        error: authResult.error,
      };
    }

    console.log('[getCurrentProfile] Success, user:', JSON.stringify(authResult.user, null, 2));
    return {
      success: true,
      data: authResult.user,
    };

  } catch (error) {
    console.error('[getCurrentProfile] Exception:', error);
    return {
      success: false,
      error: 'Failed to get profile',
    };
  }
}

/**
 * Update current user profile
 * Superior implementation with validation and revalidation
 */
export async function updateCurrentProfile(updates: ProfileUpdateData): Promise<ProfileActionResult> {
  try {
    const authResult = await requireProfileUser();
    
    if ('error' in authResult) {
      return {
        success: false,
        error: authResult.error,
      };
    }

    // Validate updates
    const validation = validateProfileData(updates);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', '),
      };
    }

    // Update profile in database
    const { error } = await authResult.supabase
      .from('user_profiles')
      .update({
        ...(updates || {}),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', authResult.user.id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: 'Failed to update profile',
      };
    }

    // Revalidate profile page
    revalidatePath('/profile');
    revalidatePath('/profile/edit');

    return {
      success: true,
      data: { ...(authResult.user || {}), ...(updates || {}) },
    };

  } catch (error) {
    console.error('Error updating profile:', error);
    return {
      success: false,
      error: 'Failed to update profile',
    };
  }
}

/**
 * Update profile avatar
 * Superior implementation with file handling
 */
export async function updateProfileAvatar(formData: FormData): Promise<ProfileActionResult> {
  try {
    const authResult = await requireProfileUser();
    
    if ('error' in authResult) {
      return {
        success: false,
        error: authResult.error,
      };
    }

    const file = formData.get('avatar') as File;
    
    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      };
    }

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'File must be an image',
      };
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return {
        success: false,
        error: 'File size must be less than 5MB',
      };
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await authResult.supabase.storage
      .from('avatars')
      .upload(`${authResult.user.id}/${Date.now()}-${file.name}`, file);

    if (uploadError) {
      return {
        success: false,
        error: 'Failed to upload avatar',
      };
    }

    // Get public URL
    const { data: urlData } = authResult.supabase.storage
      .from('avatars')
      .getPublicUrl(uploadData.path);

    // Update profile with new avatar URL
    const { error } = await authResult.supabase
      .from('user_profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('user_id', authResult.user.id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: 'Failed to update avatar',
      };
    }

    // Revalidate profile page
    revalidatePath('/profile');
    revalidatePath('/profile/edit');

    return {
      success: true,
      data: { avatar_url: urlData.publicUrl },
    };

  } catch (error) {
    console.error('Error updating avatar:', error);
    return {
      success: false,
      error: 'Failed to update avatar',
    };
  }
}

/**
 * Export user data
 * Superior implementation with proper data export
 */
export async function exportUserData(): Promise<ProfileActionResult> {
  try {
    const authResult = await requireProfileUser();
    
    if ('error' in authResult) {
      return {
        success: false,
        error: authResult.error,
      };
    }

    // Get comprehensive user data
    const { data: profile, error: profileError } = await authResult.supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', authResult.user.id)
      .single();

    if (profileError) {
      return {
        success: false,
        error: 'Failed to fetch profile data',
      };
    }

    // Get user votes
    const { data: votes, error: votesError } = await authResult.supabase
      .from('votes')
      .select('*')
      .eq('user_id', authResult.user.id);

    if (votesError) {
      console.warn('Failed to fetch votes:', votesError);
    }

    // Get user polls
    const { data: polls, error: pollsError } = await authResult.supabase
      .from('polls')
      .select('*')
      .eq('created_by', authResult.user.id);

    if (pollsError) {
      console.warn('Failed to fetch polls:', pollsError);
    }

    const exportData = {
      profile,
      votes: votes || [],
      polls: polls || [],
      exported_at: new Date().toISOString(),
    };

    return {
      success: true,
      data: exportData,
    };

  } catch (error) {
    console.error('Error exporting user data:', error);
    return {
      success: false,
      error: 'Failed to export user data',
    };
  }
}