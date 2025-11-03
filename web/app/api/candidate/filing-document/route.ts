import { type NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

/**
 * POST /api/candidate/filing-document
 * Upload a filing document for candidate platform verification
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    // Get current user from Supabase session
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const platformId = formData.get('platformId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, JPG, and PNG files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Verify user owns the platform (if platformId provided)
    if (platformId) {
      const { data: platform } = await supabase
        .from('candidate_platforms')
        .select('user_id')
        .eq('id', platformId)
        .single()

      if (!platform || platform.user_id !== authUser.id) {
        return NextResponse.json(
          { error: 'Not authorized to upload document for this platform' },
          { status: 403 }
        )
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
      return NextResponse.json(
        { error: 'Failed to upload document' },
        { status: 500 }
      )
    }

    // Verify upload success
    if (!uploadData?.path) {
      logger.error('Upload failed: no upload data returned', { filePath, fileName })
      return NextResponse.json(
        { error: 'Failed to upload document' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('candidate-filings')
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath
    })
  } catch (error) {
    logger.error('Filing document upload error:', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

