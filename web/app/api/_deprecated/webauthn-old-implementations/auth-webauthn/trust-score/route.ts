import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { devLog } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic'

// GET - Get user's biometric trust score
export async function GET(_request: NextRequest) {
  try {
    // Get Supabase client
    const supabase = getSupabaseServerClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    const supabaseClient = await supabase

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // TODO: biometric_trust_scores table doesn't exist in database yet
    // This endpoint will be implemented when the table is created
    // For now, return a default trust score
    
    devLog('Trust score requested for user (table not yet implemented)', {
      userId: user.id
    })
    
    // Return default trust score until table is created
    return NextResponse.json({
      success: true,
      trustScore: 0,
      breakdown: {
        baseScore: 0,
        deviceConsistencyScore: 0,
        behaviorScore: 0,
        locationScore: 0
      },
      lastCalculated: null,
      message: 'Biometric trust scoring not yet implemented'
    })

  } catch (error) {
    devLog('Error getting biometric trust score:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Recalculate trust score
export async function POST(_request: NextRequest) {
  try {
    // Get Supabase client
    const supabase = getSupabaseServerClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    const supabaseClient = await supabase

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // TODO: biometric_trust_scores table doesn't exist in database yet
    // This endpoint will be implemented when the table is created
    
    devLog('Trust score recalculation requested (not yet implemented)', {
      userId: user.id
    })
    
    // Return default response until table is created
    return NextResponse.json({
      success: true,
      trustScore: 0,
      breakdown: {
        baseScore: 0,
        deviceConsistencyScore: 0,
        behaviorScore: 0,
        locationScore: 0
      },
      lastCalculated: new Date().toISOString(),
      message: 'Biometric trust scoring not yet implemented'
    })

  } catch (error) {
    devLog('Error recalculating biometric trust score:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
