import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, authError, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async () => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return authError('Authentication required');
  }

    // Fetch user's WebAuthn credentials for trust score calculation
    const { data: credentials, error: credentialsError } = await supabase
      .from('webauthn_credentials')
      .select(`
        id,
        device_label,
        last_used_at,
        created_at,
        metadata,
        counter
      `)
      .eq('user_id', user.id);

  if (credentialsError) {
    logger.error('Failed to fetch WebAuthn credentials for trust score:', credentialsError);
    return errorResponse('Failed to fetch credentials', 500);
  }

    const trustScore = calculateTrustScore(
      (credentials ?? []).map((credential) => {
        const metadata =
          credential.metadata && typeof credential.metadata === 'object' && !Array.isArray(credential.metadata)
            ? (credential.metadata as Record<string, unknown>)
            : null;
        const backedUp = metadata?.backedUp === true;
        return {
          ...credential,
          device_info: metadata ?? null,
          backup_eligible: backedUp,
          transports: Array.isArray(metadata?.transports)
            ? metadata?.transports?.filter((entry): entry is string => typeof entry === 'string')
            : [],
        };
      })
    );

  logger.info('WebAuthn trust score calculated', {
    userId: user.id,
    trustScore: trustScore.overall,
    credentialCount: credentials?.length || 0
  });

  return successResponse({
    trust_score: trustScore
  });
});

function calculateTrustScore(credentials: any[]): {
  overall: number;
  factors: {
    credential_count: number;
    device_diversity: number;
    recent_usage: number;
    backup_status: number;
    security_features: number;
  };
  recommendations: string[];
} {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Factor 1: Credential Count (more credentials = higher trust)
  const credentialCount = credentials.length;
  const credentialCountScore = Math.min(credentialCount * 20, 100); // Max 100 for 5+ credentials

  // Factor 2: Device Diversity (different device types = higher trust)
  const deviceTypes = new Set(credentials.map(c => c.device_info?.device_type || 'unknown'));
  const deviceDiversityScore = Math.min(deviceTypes.size * 25, 100); // Max 100 for 4+ device types

  // Factor 3: Recent Usage (recent activity = higher trust)
  const recentCredentials = credentials.filter(c =>
    c.last_used_at && new Date(c.last_used_at) > thirtyDaysAgo
  );
  const recentUsageScore = credentials.length > 0
    ? (recentCredentials.length / credentials.length) * 100
    : 0;

  // Factor 4: Backup Status (backup eligible credentials = higher trust)
  const backupEligibleCount = credentials.filter(c => c.backup_eligible).length;
  const backupStatusScore = credentials.length > 0
    ? (backupEligibleCount / credentials.length) * 100
    : 0;

  // Factor 5: Security Features (platform authenticators = higher trust)
  const platformCredentials = credentials.filter(c =>
    c.transports?.includes('internal') || c.device_info?.authenticator_type === 'platform'
  );
  const securityFeaturesScore = credentials.length > 0
    ? (platformCredentials.length / credentials.length) * 100
    : 0;

  // Calculate overall score (weighted average)
  const overall = Math.round(
    (credentialCountScore * 0.3) +
    (deviceDiversityScore * 0.2) +
    (recentUsageScore * 0.2) +
    (backupStatusScore * 0.15) +
    (securityFeaturesScore * 0.15)
  );

  // Generate recommendations
  const recommendations: string[] = [];

  if (credentialCount === 0) {
    recommendations.push('Add your first passkey to improve security');
  } else if (credentialCount === 1) {
    recommendations.push('Add a backup passkey for better security');
  }

  if (deviceDiversityScore < 50) {
    recommendations.push('Add passkeys from different devices for better security');
  }

  if (recentUsageScore < 50) {
    recommendations.push('Use your passkeys more frequently to maintain security');
  }

  if (backupStatusScore < 50) {
    recommendations.push('Enable backup for your passkeys to prevent lockout');
  }

  return {
    overall: Math.max(0, Math.min(100, overall)),
    factors: {
      credential_count: Math.round(credentialCountScore),
      device_diversity: Math.round(deviceDiversityScore),
      recent_usage: Math.round(recentUsageScore),
      backup_status: Math.round(backupStatusScore),
      security_features: Math.round(securityFeaturesScore)
    },
    recommendations
  };
}
