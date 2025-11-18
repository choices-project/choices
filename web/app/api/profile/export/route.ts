/**
 * Profile Data Export API
 * 
 * GDPR/CCPA Compliant Data Export
 * Exports ALL user data in comprehensive JSON format
 * 
 * 🔒 PRIVACY: Only exports data user has opted in to collect
 * 
 * Created: November 5, 2025
 * Updated: November 6, 2025 - Modernized with standardized responses
 * Status: ✅ ACTIVE - PRODUCTION READY
 */

import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, authError, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';
import type { PrivacySettings } from '@/types/profile';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/profile/export
 * 
 * Exports comprehensive user data
 * Respects privacy settings - only includes data user opted to collect
 * 
 * Returns GDPR/CCPA compliant JSON with:
 * - Profile data (always included)
 * - Privacy settings (always included)
 * - Optional data based on privacy opt-ins
 */
export const POST = withErrorHandling(async (_request: NextRequest) => {
  // Get authenticated user
  const supabase = await getSupabaseServerClient();
  
  if (!supabase) {
    return errorResponse('Supabase not configured', 500);
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.user) {
    return authError('User not authenticated');
  }
    
    const user = session.user;
    const userId = user.id;

    logger.info('Data export requested', { userId });

    // Get user profile and privacy settings
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

  if (profileError) {
    logger.error('Failed to fetch profile for export', profileError);
    return errorResponse('Failed to fetch profile data', 500);
  }

    const privacySettings = profile?.privacy_settings as PrivacySettings | null;

    // Build export data object
    const exportData: any = {
      exportDate: new Date().toISOString(),
      userId: userId,
      
      // ALWAYS include: Basic profile information
      profile: {
        id: profile.id,
        email: user.email,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        trust_tier: profile.trust_tier,
        participation_style: profile.participation_style,
        primary_concerns: profile.primary_concerns,
        community_focus: profile.community_focus,
        is_admin: profile.is_admin,
        is_active: profile.is_active,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        last_sign_in: user.last_sign_in_at,
      },
      
      // ALWAYS include: Privacy settings (so user knows what they opted into)
      privacySettings: privacySettings,
    };

    // 🔒 PRIVACY: Only include data if user opted in to collection

    // Location data (if opted in) - stored in demographics field
    if (privacySettings?.collectLocationData && profile.demographics) {
      exportData.locationData = profile.demographics;
      logger.debug('Location data included in export (user consented)');
    }

    // Voting history (if opted in)
    if (privacySettings?.collectVotingHistory || privacySettings?.retainVotingHistory) {
      const { data: votes } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      exportData.votingHistory = votes ?? [];
      logger.debug('Voting history included in export (user consented)', {
        count: votes?.length ?? 0
      });
    }

    // Hashtag interests (if opted in)
    if (privacySettings?.trackInterests) {
      const { data: hashtags } = await supabase
        .from('user_hashtags')
        .select(`
          id,
          user_id,
          hashtag_id,
          is_following,
          engagement_count,
          last_interaction,
          created_at,
          updated_at
        `)
        .eq('user_id', userId);
      
      exportData.hashtagInterests = hashtags ?? [];
      logger.debug('Hashtag interests included in export (user consented)', {
        count: hashtags?.length ?? 0
      });
    }

    // Feed interactions (if opted in)
    if (privacySettings?.trackFeedActivity) {
      const { data: feedInteractions } = await supabase
        .from('feed_interactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      exportData.feedInteractions = feedInteractions ?? [];
      logger.debug('Feed interactions included in export (user consented)', {
        count: feedInteractions?.length ?? 0
      });
    }

    // Analytics events (if opted in)
    if (privacySettings?.collectAnalytics) {
      const { data: analytics } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5000); // Limit to prevent huge exports
      
      exportData.analyticsEvents = analytics ?? [];
      logger.debug('Analytics events included in export (user consented)', {
        count: analytics?.length ?? 0
      });
    }

    // Representative interactions (if opted in) - stored in analytics_events
    if (privacySettings?.trackRepresentativeInteractions) {
      const { data: repInteractions } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', userId)
        .eq('event_category', 'representative')
        .order('created_at', { ascending: false });
      
      exportData.representativeInteractions = repInteractions ?? [];
      logger.debug('Representative interactions included in export (user consented)', {
        count: repInteractions?.length ?? 0
      });
    }

    // Polls created by user (always include - they created them)
    const { data: createdPolls } = await supabase
      .from('polls')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });
    
    exportData.createdPolls = createdPolls ?? [];

    // WebAuthn credentials (metadata only, not actual credentials)
    const { data: credentials } = await supabase
      .from('webauthn_credentials')
      .select('id, credential_id, public_key, counter, created_at, last_used_at, friendly_name')
      .eq('user_id', userId);
    
    exportData.webauthnCredentials = credentials ?? [];

    // User sessions (login history)
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('id, user_id, session_token, ip_address, user_agent, created_at, expires_at, last_activity_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100); // Last 100 sessions
    
    exportData.sessionHistory = sessions ?? [];

    // Contact messages
    const { data: messages } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    exportData.contactMessages = messages ?? [];

    // Calculate total data points
    const totalDataPoints = 
      (exportData.votingHistory?.length ?? 0) +
      (exportData.hashtagInterests?.length ?? 0) +
      (exportData.feedInteractions?.length ?? 0) +
      (exportData.analyticsEvents?.length ?? 0) +
      (exportData.representativeInteractions?.length ?? 0) +
      (exportData.createdPolls?.length ?? 0) +
      (exportData.webauthnCredentials?.length ?? 0) +
      (exportData.sessionHistory?.length ?? 0) +
      (exportData.contactMessages?.length ?? 0);

    // Add summary statistics
    exportData.summary = {
      exportDate: new Date().toISOString(),
      totalDataCategories: Object.keys(exportData).filter(k => k !== 'summary').length,
      profileComplete: !!profile.username,
      privacyOptIns: privacySettings ? Object.values(privacySettings).filter(v => v === true).length : 0,
      totalDataPoints: totalDataPoints,
      dataCollectionEnabled: {
        location: privacySettings?.collectLocationData ?? false,
        voting: privacySettings?.collectVotingHistory ?? false,
        interests: privacySettings?.trackInterests ?? false,
        feedActivity: privacySettings?.trackFeedActivity ?? false,
        analytics: privacySettings?.collectAnalytics ?? false,
        representatives: privacySettings?.trackRepresentativeInteractions ?? false,
      }
    };

    const categoriesIncluded = Object.keys(exportData).filter((key) => key !== 'summary').length;
    const categoriesWithData = Object.entries(exportData).reduce((count, [key, value]) => {
      if (key === 'summary') {
        return count;
      }

      if (Array.isArray(value)) {
        return value.length > 0 ? count + 1 : count;
      }

      if (value && typeof value === 'object') {
        return Object.keys(value).length > 0 ? count + 1 : count;
      }

      return value !== undefined && value !== null ? count + 1 : count;
    }, 0);

    exportData.summary = {
      ...exportData.summary,
      categoriesIncluded,
      categoriesWithData
    };

    const exportedAt = new Date().toISOString();
    const filename = `choices-profile-export-${userId}-${exportedAt.split('T')[0]}.json`;

    logger.info('Data export completed successfully', {
      userId,
      categoriesIncluded,
      categoriesWithData,
      totalDataPoints: totalDataPoints,
      privacyOptIns: exportData.summary.privacyOptIns,
      filename
    });

    const response = successResponse(exportData, {
      exportedAt,
      categoriesIncluded,
      categoriesWithData,
      totalDataPoints,
      filename,
      contentType: 'application/json'
    });

    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    response.headers.set('Cache-Control', 'no-store');

    return response;
});
