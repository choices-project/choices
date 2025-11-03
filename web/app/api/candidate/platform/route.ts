import { type NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

/**
 * GET /api/candidate/platform
 * Get candidate platform(s) for current user or specific user
 */
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') ?? authUser.id

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // If requesting own platform or admin, get all (including drafts)
    // Otherwise only get active verified platforms
    const { data: platforms, error } = await supabase
      .from('candidate_platforms')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch platform' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      platforms: platforms ?? []
    })
  } catch (error) {
    logger.error('Failed to fetch platforms:', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/candidate/platform/:id
 * Update candidate platform
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Platform ID required' },
        { status: 400 }
      )
    }

    // Verify user owns this platform
    const { data: existingPlatform } = await supabase
      .from('candidate_platforms')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existingPlatform || existingPlatform.user_id !== authUser.id) {
      return NextResponse.json(
        { error: 'Not authorized to update this platform' },
        { status: 403 }
      )
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
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update platform' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      platform: updatedPlatform
    })
  } catch (error) {
    logger.error('Failed to update platform:', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

