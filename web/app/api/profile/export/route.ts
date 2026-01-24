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

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, authError, errorResponse } from '@/lib/api';
import { PROFILE_SELECT_COLUMNS } from '@/lib/api/response-builders';
import { logger } from '@/lib/utils/logger';

import type { PrivacySettings } from '@/types/profile';
import type { NextRequest } from 'next/server';


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

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(PROFILE_SELECT_COLUMNS)
      .eq('user_id', userId)
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

    // Build conditional fetch promises (privacy‑opted‑in only)
    type ExportPart = Record<string, unknown>;
    const conditionalPromises: Promise<ExportPart>[] = [];

    if (privacySettings?.collectVotingHistory || privacySettings?.retainVotingHistory) {
      const votesCols = 'id, poll_id, option_id, poll_option_id, user_id, created_at, linked_at, voter_session, trust_tier, updated_at, poll_question, vote_status';
      conditionalPromises.push(
        Promise.resolve(
          supabase
            .from('votes')
            .select(votesCols)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .then(({ data }) => ({ votingHistory: data ?? [] } as ExportPart))
        )
      );
    }
    if (privacySettings?.trackInterests) {
      conditionalPromises.push(
        Promise.resolve(
          (supabase as any)
            .from('user_hashtags')
            .select('id, user_id, hashtag_id, is_following, engagement_count, last_interaction, created_at, updated_at')
            .eq('user_id', userId)
            .then(({ data }: { data: unknown }) => ({ hashtagInterests: data ?? [] } as ExportPart))
        )
      );
    }
    if (privacySettings?.trackFeedActivity) {
      conditionalPromises.push(
        Promise.resolve(
          supabase
            .from('feed_interactions')
            .select('id, user_id, feed_id, item_id, interaction_type, timestamp, metadata, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .then(({ data }) => ({ feedInteractions: data ?? [] } as ExportPart))
        )
      );
    }
    if (privacySettings?.collectAnalytics) {
      conditionalPromises.push(
        Promise.resolve(
          supabase
            .from('analytics_events')
            .select('id, user_id, event_type, event_data, session_id, ip_address, user_agent, referrer, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5000)
            .then(({ data }) => ({ analyticsEvents: data ?? [] } as ExportPart))
        )
      );
    }
    if (privacySettings?.collectIntegritySignals) {
      conditionalPromises.push(
        Promise.all([
          (supabase as any)
            .from('integrity_signals')
            .select('id, user_id, poll_id, vote_id, signal_type, consent_scope, signals, created_at, expires_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
          (supabase as any)
            .from('vote_integrity_scores')
            .select('id, vote_id, vote_type, poll_id, user_id, score, reason_codes, metadata, created_at, expires_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
        ]).then(([sig, sc]) => ({
          integritySignals: sig.data ?? [],
          integrityScores: sc.data ?? [],
        } as ExportPart))
      );
    }
    if (privacySettings?.trackRepresentativeInteractions) {
      conditionalPromises.push(
        Promise.resolve(
          (supabase as any)
            .from('analytics_events')
            .select('id, user_id, event_type, event_data, session_id, ip_address, user_agent, referrer, created_at')
            .eq('user_id', userId)
            .eq('event_category', 'representative')
            .order('created_at', { ascending: false })
            .then(({ data }: { data: unknown }) => ({ representativeInteractions: data ?? [] } as ExportPart))
        )
      );
    }

    // Unconditional fetches (always included): run in parallel
    const pollsCols = 'id, title, description, question, poll_question, category, status, total_votes, created_by, created_at, updated_at, end_date, start_date, privacy_level, voting_method, tags, hashtags, primary_hashtag, is_public, is_shareable';
    const [conditionalResults, createdPollsRes, credentialsRes, sessionsRes, messagesRes] = await Promise.all([
      Promise.all(conditionalPromises),
      supabase.from('polls').select(pollsCols).eq('created_by', userId).order('created_at', { ascending: false }),
      supabase.from('webauthn_credentials').select('id, credential_id, public_key, counter, created_at, last_used_at, friendly_name').eq('user_id', userId),
      supabase.from('user_sessions').select('id, user_id, session_token, ip_address, user_agent, created_at, expires_at, last_activity_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
      supabase.from('contact_messages').select('id, user_id, representative_id, subject, message, status, priority, created_at, updated_at, thread_id, offline_synced').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);

    for (const part of conditionalResults) {
      Object.assign(exportData, part);
    }
    exportData.createdPolls = createdPollsRes.data ?? [];
    exportData.webauthnCredentials = credentialsRes.data ?? [];
    exportData.sessionHistory = sessionsRes.data ?? [];
    exportData.contactMessages = messagesRes.data ?? [];

    if ('votingHistory' in exportData) logger.debug('Voting history included in export (user consented)', { count: exportData.votingHistory?.length ?? 0 });
    if ('hashtagInterests' in exportData) logger.debug('Hashtag interests included in export (user consented)', { count: exportData.hashtagInterests?.length ?? 0 });
    if ('feedInteractions' in exportData) logger.debug('Feed interactions included in export (user consented)', { count: exportData.feedInteractions?.length ?? 0 });
    if ('analyticsEvents' in exportData) logger.debug('Analytics events included in export (user consented)', { count: exportData.analyticsEvents?.length ?? 0 });
    if ('integritySignals' in exportData || 'integrityScores' in exportData) logger.debug('Integrity data included in export (user consented)', { signals: exportData.integritySignals?.length ?? 0, scores: exportData.integrityScores?.length ?? 0 });
    if ('representativeInteractions' in exportData) logger.debug('Representative interactions included in export (user consented)', { count: exportData.representativeInteractions?.length ?? 0 });

    // Calculate total data points
    const totalDataPoints =
      (exportData.votingHistory?.length ?? 0) +
      (exportData.hashtagInterests?.length ?? 0) +
      (exportData.feedInteractions?.length ?? 0) +
      (exportData.analyticsEvents?.length ?? 0) +
      (exportData.integritySignals?.length ?? 0) +
      (exportData.integrityScores?.length ?? 0) +
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
