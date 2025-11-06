import type { NextRequest } from 'next/server'

import { withErrorHandling, successResponse, authError, errorResponse, validationError, forbiddenError } from '@/lib/api';
import { logger } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient()
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !authUser) {
    return authError('Authentication required');
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  const platformId = formData.get('platformId') as string

  if (!file) {
    return validationError({ file: 'No file provided' });
  }

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  if (!allowedTypes.includes(file.type)) {
    return validationError({ file: 'Invalid file type. Only PDF, JPG, and PNG files are allowed.' });
  }

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return validationError({ file: 'File size must be less than 10MB' });
  }

    // Verify user owns the platform (if platformId provided)
    if (platformId) {
      const { data: platform } = await supabase
        .from('candidate_platforms')
        .select('user_id')
        .eq('id', platformId)
        .single()

    if (!platform || platform.user_id !== authUser.id) {
      return forbiddenError('Not authorized to upload document for this platform');
    }
  }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `filing-${authUser.id}-${Date.now()}.${fileExt}`
    const filePath = `candidate-filings/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('candidate-filings')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

  if (uploadError) {
    logger.error('Filing document upload error:', uploadError instanceof Error ? uploadError : new Error(String(uploadError)))
    return errorResponse('Failed to upload document', 500);
  }

  if (!uploadData?.path) {
    logger.error('Upload failed: no upload data returned', { filePath, fileName })
    return errorResponse('Failed to upload document', 500);
  }

  const { data: urlData } = supabase.storage
    .from('candidate-filings')
    .getPublicUrl(filePath)

  return successResponse({
    url: urlData.publicUrl,
    path: filePath
  }, undefined, 201);
});

