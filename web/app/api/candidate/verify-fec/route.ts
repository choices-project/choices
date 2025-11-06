import type { NextRequest } from 'next/server'

import { withErrorHandling, successResponse, authError, errorResponse, validationError, forbiddenError } from '@/lib/api';
import { createFECClient } from '@/lib/integrations/fec'
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

  const body = await request.json()
  const { platformId, fecId } = body

  if (!platformId || !fecId) {
    return validationError({ 
      platformId: !platformId ? 'Platform ID is required' : '',
      fecId: !fecId ? 'FEC ID is required' : ''
    });
  }

    // Verify user owns the platform
    const { data: platform } = await supabase
      .from('candidate_platforms')
      .select('user_id, office, level')
      .eq('id', platformId)
      .single()

  if (!platform || platform.user_id !== authUser.id) {
    return forbiddenError('Not authorized');
  }

  if (platform.level !== 'federal') {
    return validationError({ level: 'FEC verification only available for federal offices' });
  }

    const fecClient = createFECClient()
    const fecCandidate = await fecClient.verifyCandidate(fecId)

    if (!fecCandidate) {
      return NextResponse.json({
        success: false,
        verified: false,
        message: 'Candidate not found in FEC database'
      })
    }

    // Check if candidate is active
    const isActive = await fecClient.isCandidateActive(fecId)

    // Update platform with verified FEC information
    // CRITICAL: Auto-verify on FEC confirmation - FEC is official government verification
    // If FEC confirms they're a candidate, they should appear publicly immediately
    const updateData: any = {
      official_filing_id: fecId,
      filing_status: isActive ? 'verified' : 'filed',
      verification_method: 'api_verification',
      verified_at: new Date().toISOString(),
      verified: true  // Auto-verify: FEC confirmation is sufficient for public display
    }

    // Note: FEC API doesn't provide filing dates, so we don't set official_filing_date here
    // Users can manually add filing date if needed

    const { error: updateError } = await supabase
      .from('candidate_platforms')
      .update(updateData)
      .eq('id', platformId)

  if (updateError) {
    return errorResponse('Failed to update platform', 500);
  }

  return successResponse({
    verified: true,
    candidate: {
      name: fecCandidate.name,
      party: fecCandidate.party_full,
      office: fecCandidate.office_full,
      state: fecCandidate.state,
      district: fecCandidate.district,
      status: fecCandidate.candidate_status,
      active: isActive,
      electionYears: fecCandidate.election_years
    },
    message: isActive 
      ? 'Candidate verified and active in FEC database'
      : 'Candidate found in FEC database but not active for current cycle'
  }, undefined, 201);
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const fecId = searchParams.get('fecId')

  if (!fecId) {
    return validationError({ fecId: 'FEC ID required' });
  }

  const fecClient = createFECClient()
  const candidate = await fecClient.verifyCandidate(fecId)

  if (!candidate) {
    return successResponse({
      found: false,
      message: 'Candidate not found in FEC database'
    });
  }

  const isActive = await fecClient.isCandidateActive(fecId)

  return successResponse({
    found: true,
    candidate: {
      id: candidate.candidate_id,
      name: candidate.name,
      party: candidate.party_full,
      office: candidate.office_full,
      state: candidate.state,
      district: candidate.district,
      status: candidate.candidate_status,
      active: isActive,
      electionYears: candidate.election_years
    }
  });
});

