import { getSupabaseServerClient } from '@/utils/supabase/server'

import { withErrorHandling, successResponse, authError, errorResponse, validationError, forbiddenError } from '@/lib/api';
import { CANDIDATE_PLATFORM_SELECT_COLUMNS } from '@/lib/api/response-builders';

import type { NextRequest } from 'next/server'


export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient()
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !authUser) {
    return authError('Authentication required');
  }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') ?? authUser.id

  if (!userId) {
    return validationError({ userId: 'User ID required' });
  }

    // If requesting own platform or admin, get all (including drafts)
    // Otherwise only get active verified platforms
    const { data: platforms, error } = await supabase
      .from('candidate_platforms')
      .select(CANDIDATE_PLATFORM_SELECT_COLUMNS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

  if (error) {
    return errorResponse('Failed to fetch platform', 500);
  }

  return successResponse({
    platforms: platforms ?? []
  });
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient()
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !authUser) {
    return authError('Authentication required');
  }

    const body = await request.json()
    const { id, ...updates } = body

  if (!id) {
    return validationError({ id: 'Platform ID required' });
  }

  const { data: existingPlatform } = await supabase
    .from('candidate_platforms')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!existingPlatform || existingPlatform.user_id !== authUser.id) {
    return forbiddenError('Not authorized to update this platform');
  }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (updates.candidateName !== undefined) updateData.candidate_name = updates.candidateName
    if (updates.party !== undefined) updateData.party = updates.party
    if (updates.photoUrl !== undefined) updateData.photo_url = updates.photoUrl
    if (updates.experience !== undefined) updateData.experience = updates.experience
    if (updates.platformPositions !== undefined) updateData.platform_positions = updates.platformPositions
    if (updates.endorsements !== undefined) updateData.endorsements = updates.endorsements
    if (updates.campaignWebsite !== undefined) updateData.campaign_website = updates.campaignWebsite
    if (updates.campaignEmail !== undefined) updateData.campaign_email = updates.campaignEmail
    if (updates.campaignPhone !== undefined) updateData.campaign_phone = updates.campaignPhone
    if (updates.visibility !== undefined) updateData.visibility = updates.visibility
    if (updates.status !== undefined) updateData.status = updates.status

    const { data: updatedPlatform, error } = await supabase
      .from('candidate_platforms')
      .update(updateData)
      .eq('id', id)
      .select(CANDIDATE_PLATFORM_SELECT_COLUMNS)
      .single()

  if (error) {
    return errorResponse('Failed to update platform', 500);
  }

  return successResponse({
    platform: updatedPlatform
  });
});

