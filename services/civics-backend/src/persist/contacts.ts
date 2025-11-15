import { getSupabaseClient } from '../clients/supabase.js';
import type { CanonicalRepresentative } from '../ingest/openstates/people.js';

const CONTACT_SOURCE = 'openstates_yaml';

interface ContactInsertRow {
  representative_id: number;
  contact_type: string;
  value: string;
  is_primary: boolean;
  is_verified: boolean;
  source: string;
  updated_at: string;
}

function dedupe(values: (string | null | undefined)[]): string[] {
  const normalized = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    normalized.add(trimmed);
  }
  return Array.from(normalized);
}

function buildEmailRows(representativeId: number, emails: string[]): ContactInsertRow[] {
  return emails.map((value, index) => ({
    representative_id: representativeId,
    contact_type: 'email',
    value,
    is_primary: index === 0,
    is_verified: false,
    source: CONTACT_SOURCE,
    updated_at: new Date().toISOString(),
  }));
}

function buildPhoneRows(representativeId: number, phones: string[]): ContactInsertRow[] {
  return phones.map((value, index) => ({
    representative_id: representativeId,
    contact_type: 'phone',
    value,
    is_primary: index === 0,
    is_verified: false,
    source: CONTACT_SOURCE,
    updated_at: new Date().toISOString(),
  }));
}

function buildFaxRows(representativeId: number, faxes: string[]): ContactInsertRow[] {
  return faxes.map((value, index) => ({
    representative_id: representativeId,
    contact_type: 'fax',
    value,
    is_primary: index === 0,
    is_verified: false,
    source: CONTACT_SOURCE,
    updated_at: new Date().toISOString(),
  }));
}

function buildAddressRows(
  representativeId: number,
  addresses: Array<{ value: string; isPrimary: boolean }>,
): ContactInsertRow[] {
  return addresses.map((entry) => ({
    representative_id: representativeId,
    contact_type: 'address',
    value: entry.value,
    is_primary: entry.isPrimary,
    is_verified: false,
    source: CONTACT_SOURCE,
    updated_at: new Date().toISOString(),
  }));
}

function extractAddresses(rep: CanonicalRepresentative): Array<{ value: string; isPrimary: boolean }> {
  const addresses: Array<{ value: string; isPrimary: boolean }> = [];
  for (const office of rep.offices) {
    if (!office.address) continue;
    const value = office.address.trim();
    if (!value) continue;
    const classification = office.classification?.toLowerCase() ?? '';
    const isPrimary = classification.includes('capitol') || classification.includes('main');
    addresses.push({ value, isPrimary });
  }
  // mark the first address as primary if none flagged
  if (!addresses.some((entry) => entry.isPrimary) && addresses.length > 0) {
    const first = addresses[0];
    if (first) {
      first.isPrimary = true;
    }
  }
  return addresses;
}

function extractFaxes(rep: CanonicalRepresentative): string[] {
  const faxes: string[] = [];
  for (const office of rep.offices) {
    if (office.fax) {
      faxes.push(office.fax);
    }
  }
  return dedupe(faxes);
}

function buildContactPayload(representativeId: number, rep: CanonicalRepresentative): ContactInsertRow[] {
  const emails = dedupe(rep.emails ?? []);
  const phones = dedupe(rep.phones ?? []);
  const faxes = extractFaxes(rep);
  const addresses = extractAddresses(rep);

  const rows: ContactInsertRow[] = [
    ...buildEmailRows(representativeId, emails),
    ...buildPhoneRows(representativeId, phones),
    ...buildFaxRows(representativeId, faxes),
    ...buildAddressRows(representativeId, addresses),
  ];

  const seen = new Set<string>();
  const uniqueRows: ContactInsertRow[] = [];

  for (const row of rows) {
    const key = `${row.contact_type}:${row.value.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    uniqueRows.push(row);
  }

  return uniqueRows;
}

export async function syncRepresentativeContacts(rep: CanonicalRepresentative): Promise<void> {
  const representativeId = rep.supabaseRepresentativeId;
  if (!representativeId) {
    return;
  }

  const rows = buildContactPayload(representativeId, rep).filter((row) => Boolean(row.value));
  const client = getSupabaseClient();

  const { data: existingContacts, error: existingError } = await client
    .from('representative_contacts')
    .select('contact_type, value, source, is_primary')
    .eq('representative_id', representativeId);

  if (existingError) {
    throw new Error(`Failed to load existing contacts for representative ${representativeId}: ${existingError.message}`);
  }

  const existingKeys = new Set<string>();
  for (const existing of existingContacts ?? []) {
    if (!existing?.contact_type || !existing?.value) continue;
    if (existing.source === CONTACT_SOURCE) continue;
    const normalizedValue = existing.value.trim().toLowerCase();
    if (!normalizedValue) continue;
    existingKeys.add(`${existing.contact_type}:${normalizedValue}`);
  }

  const filteredRows = rows.filter((row) => {
    const normalizedValue = row.value.trim().toLowerCase();
    if (!normalizedValue) return false;
    const key = `${row.contact_type}:${normalizedValue}`;
    return !existingKeys.has(key);
  });

  const primaryPhoneRow =
    filteredRows.find((row) => row.contact_type === 'phone' && row.is_primary) ??
    filteredRows.find((row) => row.contact_type === 'phone');

  let primaryPhoneValue = primaryPhoneRow?.value ?? null;

  if (!primaryPhoneValue) {
    const existingPrimary = (existingContacts ?? []).find(
      (contact) =>
        contact?.contact_type === 'phone' &&
        contact?.value &&
        (contact?.source !== CONTACT_SOURCE ? contact?.is_primary === true : false),
    );
    if (existingPrimary?.value) {
      primaryPhoneValue = existingPrimary.value;
    } else {
      const existingAnyPhone = (existingContacts ?? []).find(
        (contact) => contact?.contact_type === 'phone' && contact?.value && contact?.source !== CONTACT_SOURCE,
      );
      if (existingAnyPhone?.value) {
        primaryPhoneValue = existingAnyPhone.value;
      }
    }
  }

  // Clear previously ingested rows from this source to avoid duplication.
  const { error: deleteError } = await client
    .from('representative_contacts')
    .delete()
    .eq('representative_id', representativeId)
    .eq('source', CONTACT_SOURCE);

  if (deleteError) {
    throw new Error(`Failed to prune prior contacts for representative ${representativeId}: ${deleteError.message}`);
  }

  if (filteredRows.length > 0) {
    for (const row of filteredRows) {
      const { error: insertError } = await client.from('representative_contacts').insert(row);
      if (insertError) {
        const message = insertError.message ?? '';
        const code = (insertError as { code?: string }).code ?? '';
        const isDuplicate = code === '23505' || message.includes('duplicate key value');
        if (isDuplicate) {
          continue;
        }
        throw new Error(`Failed to upsert contacts for representative ${representativeId}: ${message || 'unknown error'}`);
      }
    }
  }

  const { error: updateError } = await client
    .from('representatives_core')
    .update({ primary_phone: primaryPhoneValue, updated_at: new Date().toISOString() })
    .eq('id', representativeId);

  if (updateError) {
    throw new Error(`Failed to update primary phone for representative ${representativeId}: ${updateError.message}`);
  }
}

