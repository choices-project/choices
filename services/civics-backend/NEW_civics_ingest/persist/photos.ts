import { getSupabaseClient } from '../clients/supabase.js';
import type { CanonicalRepresentative } from '../ingest/openstates/people.js';

interface PhotoInsertRow {
  representative_id: number;
  url: string;
  source: string;
  is_primary: boolean;
  alt_text: string | null;
  attribution: string | null;
  updated_at: string;
}

function buildPhotoRows(rep: CanonicalRepresentative): PhotoInsertRow[] {
  const representativeId = rep.supabaseRepresentativeId;
  if (!representativeId) return [];

  const rows: PhotoInsertRow[] = [];

  if (rep.image) {
    rows.push({
      representative_id: representativeId,
      url: rep.image,
      source: 'openstates_yaml',
      is_primary: true,
      alt_text: rep.name ? `${rep.name} portrait` : null,
      attribution: null,
      updated_at: new Date().toISOString(),
    });
  }

  return rows;
}

export async function syncRepresentativePhotos(rep: CanonicalRepresentative): Promise<void> {
  const representativeId = rep.supabaseRepresentativeId;
  if (!representativeId) {
    return;
  }

  const rows = buildPhotoRows(rep);
  const client = getSupabaseClient();

  const { error: deleteError } = await client
    .from('representative_photos')
    .delete()
    .eq('representative_id', representativeId)
    .eq('source', 'openstates_yaml');

  if (deleteError) {
    throw new Error(
      `Failed to prune prior photos for representative ${representativeId}: ${deleteError.message}`,
    );
  }

  if (rows.length === 0) {
    return;
  }

  const { error: insertError } = await client.from('representative_photos').insert(rows);
  if (insertError) {
    throw new Error(
      `Failed to upsert photos for representative ${representativeId}: ${insertError.message}`,
    );
  }
}

