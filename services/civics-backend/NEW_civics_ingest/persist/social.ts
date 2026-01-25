import { getSupabaseClient } from '../clients/supabase.js';
import type { CanonicalRepresentative } from '../ingest/openstates/people.js';

interface SocialInsertRow {
  representative_id: number;
  platform: string;
  handle: string | null;
  url: string | null;
  is_primary: boolean | null;
  is_verified: boolean | null;
  verified: boolean | null;
  followers_count: number | null;
  updated_at: string;
}

function dedupeProfiles(profiles: CanonicalRepresentative['social']): CanonicalRepresentative['social'] {
  const map = new Map<string, CanonicalRepresentative['social'][number]>();
  for (const profile of profiles) {
    const key = `${profile.platform}:${profile.handle ?? profile.url ?? ''}`;
    if (!map.has(key)) {
      map.set(key, profile);
    }
  }
  return Array.from(map.values());
}

function normalizeUrl(platform: string, handle: string | null, url: string | null): string | null {
  if (url) {
    return url;
  }
  if (!handle) return null;
  switch (platform) {
    case 'twitter':
      return `https://twitter.com/${handle}`;
    case 'instagram':
      return `https://www.instagram.com/${handle}`;
    case 'linkedin':
      return `https://www.linkedin.com/in/${handle}`;
    case 'facebook':
      return `https://www.facebook.com/${handle}`;
    case 'youtube':
      return `https://www.youtube.com/${handle}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${handle}`;
    default:
      return null;
  }
}

function buildSocialRows(
  representativeId: number,
  profiles: CanonicalRepresentative['social'],
): SocialInsertRow[] {
  const deduped = dedupeProfiles(profiles);
  const primaryByPlatform = new Set<string>();

  return deduped.map((profile) => {
    const isPrimary = !primaryByPlatform.has(profile.platform);
    if (isPrimary) {
      primaryByPlatform.add(profile.platform);
    }
    return {
      representative_id: representativeId,
      platform: profile.platform,
      handle: profile.handle,
      url: normalizeUrl(profile.platform, profile.handle, profile.url),
      is_primary: isPrimary,
      is_verified: profile.isOfficial ?? false,
      verified: profile.isOfficial ?? false,
      followers_count: null,
      updated_at: new Date().toISOString(),
    };
  });
}

export async function syncRepresentativeSocial(rep: CanonicalRepresentative): Promise<void> {
  const representativeId = rep.supabaseRepresentativeId;
  if (!representativeId) {
    return;
  }

  const rows = buildSocialRows(representativeId, rep.social ?? []).filter(
    (row) => row.handle || row.url,
  );

  const client = getSupabaseClient();

  const { error: deleteError } = await client
    .from('representative_social_media')
    .delete()
    .eq('representative_id', representativeId);

  if (deleteError) {
    throw new Error(
      `Failed to prune prior social media rows for representative ${representativeId}: ${deleteError.message}`,
    );
  }

  if (rows.length === 0) {
    return;
  }

  const { error: insertError } = await client.from('representative_social_media').insert(rows);
  if (insertError) {
    throw new Error(
      `Failed to upsert social media rows for representative ${representativeId}: ${insertError.message}`,
    );
  }
}

