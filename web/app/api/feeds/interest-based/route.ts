// Interest-Based Poll Feed API
// Provides personalized poll recommendations based on user interests
// Created: October 2, 2025

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { InterestBasedPollFeed } from '@/lib/feeds/interest-based-feed';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile and interests
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      logger.error('Error fetching user profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    // Extract user interests and location
    const userInterests = profile.interests || [];
    const userLocation = {
      state: profile.state || '',
      district: profile.district || '',
      quantized: profile.location_sharing === 'quantized'
    };
    const userDemographics = {
      age_range: profile.age_range || '',
      education: profile.education || '',
      political_engagement: profile.political_engagement || ''
    };

    // Get query parameters for future use
    const { searchParams: _searchParams } = new URL(request.url);
    // Note: limit and trending parameters available for future use

    // Initialize interest-based feed service
    const feedService = new InterestBasedPollFeed();

    // Get personalized poll recommendations
    const personalizedFeed = await feedService.generatePersonalizedFeed(
      user.id,
      userInterests,
      userLocation.state || '',
      userDemographics
    );

    logger.info('Interest-based feed generated', {
      userId: user.id,
      interestsCount: userInterests.length,
      recommendationsCount: personalizedFeed.polls.length
    });

    return NextResponse.json({
      success: true,
      data: {
        recommendations: personalizedFeed.polls,
        userInterests,
        totalCount: personalizedFeed.polls.length,
        generatedAt: personalizedFeed.generatedAt
      }
    });

  } catch (error) {
    logger.error('Error in interest-based feed API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { interests, location, demographics } = body;

    // Update user interests
    if (interests) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          interests,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        logger.error('Error updating user interests:', updateError);
        return NextResponse.json({ error: 'Failed to update interests' }, { status: 500 });
      }
    }

    // Update user location if provided
    if (location) {
      const { error: locationError } = await supabase
        .from('user_profiles')
        .update({
          state: location.state,
          district: location.district,
          location_sharing: location.quantized ? 'quantized' : 'disabled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (locationError) {
        logger.error('Error updating user location:', locationError);
        return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
      }
    }

    // Update user demographics if provided
    if (demographics) {
      const { error: demographicsError } = await supabase
        .from('user_profiles')
        .update({
          age_range: demographics.age_range,
          education: demographics.education,
          political_engagement: demographics.political_engagement,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (demographicsError) {
        logger.error('Error updating user demographics:', demographicsError);
        return NextResponse.json({ error: 'Failed to update demographics' }, { status: 500 });
      }
    }

    logger.info('User preferences updated', {
      userId: user.id,
      hasInterests: !!interests,
      hasLocation: !!location,
      hasDemographics: !!demographics
    });

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    logger.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
