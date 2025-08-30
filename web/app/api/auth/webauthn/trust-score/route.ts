import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { devLog } from '@/lib/logger';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'

// GET - Get user's biometric trust score
export async function GET(_request: NextRequest) {
  try {
    // Get Supabase client
    const cookieStore = await cookies()
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

    // Get user's biometric trust score
    const { data: trustScore, error: trustScoreError } = await supabaseClient
      .from('biometric_trust_scores')
      .select(`
        overall_score,
        base_score,
        device_consistency_score,
        behavior_score,
        location_score,
        last_calculated_at
      `)
      .eq('user_id', String(user.id) as any)
      .single()

    if (trustScoreError && trustScoreError.code !== 'PGRST116') {
      // PGRST116 is "not found" - that's okay, we'll calculate it
      devLog('Error getting trust score:', trustScoreError)
      return NextResponse.json(
        { error: 'Failed to get trust score' },
        { status: 500 }
      )
    }

    // If no trust score exists, calculate it
    if (!trustScore) {
      const { data: _calculatedScore, error: calculateError } = await supabaseClient
        .rpc('calculate_biometric_trust_score', { p_user_id: user.id })

      if (calculateError) {
        devLog('Error calculating trust score:', calculateError)
        return NextResponse.json(
          { error: 'Failed to calculate trust score' },
          { status: 500 }
        )
      }

      // Get the calculated score
      const { data: newTrustScore } = await supabaseClient
        .from('biometric_trust_scores')
        .select(`
          overall_score,
          base_score,
          device_consistency_score,
          behavior_score,
          location_score,
          last_calculated_at
        `)
        .eq('user_id', String(user.id) as any)
        .single()

      if (newTrustScore && 'overall_score' in newTrustScore) {
        devLog('Calculated new trust score for user:', user.id, 'Score:', newTrustScore.overall_score)
        
        return NextResponse.json({
          success: true,
          trustScore: newTrustScore.overall_score,
          breakdown: {
            baseScore: newTrustScore.base_score,
            deviceConsistencyScore: newTrustScore.device_consistency_score,
            behaviorScore: newTrustScore.behavior_score,
            locationScore: newTrustScore.location_score
          },
          lastCalculated: newTrustScore.last_calculated_at
        })
      }
    } else if (trustScore && 'overall_score' in trustScore) {
      devLog('Retrieved trust score for user:', user.id, 'Score:', trustScore.overall_score)
      
      return NextResponse.json({
        success: true,
        trustScore: trustScore.overall_score,
        breakdown: {
          baseScore: trustScore.base_score,
          deviceConsistencyScore: trustScore.device_consistency_score,
          behaviorScore: trustScore.behavior_score,
          locationScore: trustScore.location_score
        },
        lastCalculated: trustScore.last_calculated_at
      })
    }

    // Fallback: no biometric credentials
    return NextResponse.json({
      success: true,
      trustScore: 0,
      breakdown: {
        baseScore: 0,
        deviceConsistencyScore: 0,
        behaviorScore: 0,
        locationScore: 0
      },
      lastCalculated: null
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
    const cookieStore = await cookies()
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

    // Recalculate trust score
    const { data: calculatedScore, error: calculateError } = await supabaseClient
      .rpc('calculate_biometric_trust_score', { p_user_id: user.id })

    if (calculateError) {
      devLog('Error recalculating trust score:', calculateError)
      return NextResponse.json(
        { error: 'Failed to recalculate trust score' },
        { status: 500 }
      )
    }

    // Get the updated trust score
    const { data: trustScore } = await supabaseClient
      .from('biometric_trust_scores')
      .select(`
        overall_score,
        base_score,
        device_consistency_score,
        behavior_score,
        location_score,
        last_calculated_at
      `)
      .eq('user_id', String(user.id) as any)
      .single()

    devLog('Recalculated trust score for user:', user.id, 'New score:', calculatedScore)

    return NextResponse.json({
      success: true,
      trustScore: calculatedScore,
      breakdown: trustScore && 'base_score' in trustScore ? {
        baseScore: trustScore.base_score,
        deviceConsistencyScore: trustScore.device_consistency_score,
        behaviorScore: trustScore.behavior_score,
        locationScore: trustScore.location_score
      } : null,
      lastCalculated: trustScore && 'last_calculated_at' in trustScore ? trustScore.last_calculated_at : new Date().toISOString()
    })

  } catch (error) {
    devLog('Error recalculating biometric trust score:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
