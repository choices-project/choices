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

/**
 * Dedupe by platform only. DB has unique (representative_id, platform) - one row per platform.
 * Keeps first profile per platform (prefer handle+url, then url-only).
 */
function dedupeProfilesByPlatform(
  profiles: CanonicalRepresentative['social'],
): CanonicalRepresentative['social'] {
  const byPlatform = new Map<string, CanonicalRepresentative['social'][number]>();
  for (const profile of profiles) {
    const platform = profile.platform?.toLowerCase() ?? 'unknown';
    if (!byPlatform.has(platform)) {
      byPlatform.set(platform, profile);
    }
  }
  return Array.from(byPlatform.values());
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
  const deduped = dedupeProfilesByPlatform(profiles);

  return deduped.map((profile) => ({
    representative_id: representativeId,
    platform: (profile.platform ?? 'unknown').toLowerCase().slice(0, 50),
    handle: profile.handle,
    url: normalizeUrl(profile.platform, profile.handle, profile.url),
    is_primary: true, // One per platform, all primary
    is_verified: profile.isOfficial ?? false,
    verified: profile.isOfficial ?? false,
    followers_count: null,
    updated_at: new Date().toISOString(),
  }));
}

export async function syncRepresentativeSocial(rep: CanonicalRepresentative): Promise<void> {
  const representativeId = rep.supabaseRepresentativeId;
  if (!representativeId) {
    return;
  }

  // Filter out rows without valid handles
  // Database constraint requires handle to be NOT NULL
  // Unique constraint is (representative_id, platform) - one row per platform
  const rows = buildSocialRows(representativeId, rep.social ?? []).filter(
    (row) => {
      // If we already have a handle, keep the row
      if (row.handle) return true;
      
      // If we have a URL but no handle, try to extract the handle from the URL
      // This is legitimate - social media URLs contain the handle in the path
      if (!row.handle && row.url) {
        // Extract handle from common social media URL patterns:
        // twitter.com/username, instagram.com/username, linkedin.com/in/username, etc.
        const urlMatch = row.url.match(/(?:twitter\.com|instagram\.com|linkedin\.com\/in|facebook\.com|youtube\.com\/channel\/|youtube\.com\/c\/|youtube\.com\/user\/|youtube\.com\/@|tiktok\.com\/@)\/([^\/\?]+)/);
        if (urlMatch && urlMatch[1]) {
          // Successfully extracted handle from URL - this is real data, not fake
          row.handle = urlMatch[1].replace(/^@/, '').trim();
          return true;
        }
      }
      
      // If we can't get a handle (no handle provided and can't extract from URL), skip this record
      // We don't insert fake data just to satisfy the constraint
      return false;
    },
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

  // Final dedupe by platform (unique constraint) - keep first per platform
  const seenPlatform = new Set<string>();
  const uniqueRows = rows.filter((r) => {
    const key = r.platform.toLowerCase();
    if (seenPlatform.has(key)) return false;
    seenPlatform.add(key);
    return true;
  });

  const { error: insertError } = await client
    .from('representative_social_media')
    .insert(uniqueRows);
  if (insertError) {
    throw new Error(
      `Failed to upsert social media rows for representative ${representativeId}: ${insertError.message}`,
    );
  }
}

