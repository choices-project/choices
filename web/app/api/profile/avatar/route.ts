import type { NextRequest } from 'next/server'

import { withErrorHandling, successResponse, authError, errorResponse, validationError } from '@/lib/api';
import { getCurrentUser } from '@/lib/core/auth/utils'
import { devLog } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Get Supabase client
  const supabase = await getSupabaseServerClient()
  
  if (!supabase) {
    return errorResponse('Supabase not configured', 500);
  }

  // Get current user from JWT token
  const user = getCurrentUser(request)
  
  if (!user) {
    return authError('User not authenticated');
  }

  // Parse form data
  const formData = await request.formData()
  const avatarFile = formData.get('avatar') as File

  if (!avatarFile) {
    return validationError({ avatar: 'No avatar file provided' });
  }

  // Validate file type
  if (!avatarFile.type.startsWith('image/')) {
    return validationError({ avatar: 'File must be an image' });
  }

  // Validate file size (5MB limit)
  if (avatarFile.size > 5 * 1024 * 1024) {
    return validationError({ avatar: 'File size must be less than 5MB' });
  }

    // Upload to Supabase Storage
    const fileExt = avatarFile.name.split('.').pop()
    const fileName = `${user.userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile)

  if (uploadError) {
    devLog('Avatar upload error:', uploadError)
    return errorResponse('Failed to upload avatar', 500);
  }

    // Log successful upload for audit trail
    devLog('Avatar uploaded successfully', { path: uploadData?.path, userId: user.userId })

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Update user profile with avatar URL
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('user_id', user.userId)

  if (updateError) {
    devLog('Profile update error:', updateError)
    return errorResponse('Failed to update profile', 500);
  }

  return successResponse({
    avatarUrl: urlData.publicUrl
  });
});