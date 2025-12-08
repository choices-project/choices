import { getSupabaseClient } from '../clients/supabase.js';
import type { CanonicalRepresentative } from '../ingest/openstates/people.js';

const CONTACT_SOURCE = 'openstates_yaml';

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Basic email validation
 */
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length === 0) return false;
  // Basic email regex - matches most valid email formats
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

/**
 * Basic phone validation
 * Accepts various formats: (123) 456-7890, 123-456-7890, 123.456.7890, +1 123 456 7890, etc.
 */
function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const trimmed = phone.trim();
  if (trimmed.length === 0) return false;
  // Remove common phone formatting characters
  const digitsOnly = trimmed.replace(/[\s\-\(\)\.\+]/g, '');
  // Must have 10-15 digits (allowing international formats)
  return /^\d{10,15}$/.test(digitsOnly);
}

/**
 * Basic address validation
 * Ensures address is not empty and has reasonable length
 */
function isValidAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  const trimmed = address.trim();
  if (trimmed.length < 5) return false; // Minimum reasonable address length
  if (trimmed.length > 500) return false; // Maximum reasonable address length
  return true;
}

/**
 * Validate and normalize contact value based on type
 */
function validateAndNormalizeContact(
  contactType: string,
  value: string
): { isValid: boolean; normalized?: string; error?: string } {
  if (!value || typeof value !== 'string') {
    return { isValid: false, error: 'Contact value is required' };
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Contact value cannot be empty' };
  }

  switch (contactType) {
    case 'email':
      if (!isValidEmail(trimmed)) {
        return { isValid: false, error: 'Invalid email format' };
      }
      return { isValid: true, normalized: trimmed.toLowerCase() };
    
    case 'phone':
    case 'fax':
      if (!isValidPhone(trimmed)) {
        return { isValid: false, error: 'Invalid phone/fax format' };
      }
      // Normalize phone: remove formatting, keep digits and +
      const normalized = trimmed.replace(/[\s\-\(\)\.]/g, '').replace(/^\+?1/, '');
      return { isValid: true, normalized };
    
    case 'address':
      if (!isValidAddress(trimmed)) {
        return { isValid: false, error: 'Invalid address format' };
      }
      return { isValid: true, normalized: trimmed };
    
    default:
      return { isValid: true, normalized: trimmed };
  }
}

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
  const validRows: ContactInsertRow[] = [];
  for (let index = 0; index < emails.length; index++) {
    const value = emails[index];
    if (!value) continue;
    
    const validation = validateAndNormalizeContact('email', value);
    if (!validation.isValid || !validation.normalized) {
      console.warn(`Skipping invalid email for representative ${representativeId}: ${value} (${validation.error})`);
      continue;
    }
    
    validRows.push({
      representative_id: representativeId,
      contact_type: 'email',
      value: validation.normalized,
      is_primary: index === 0 && validRows.length === 0,
      is_verified: false,
      source: CONTACT_SOURCE,
      updated_at: new Date().toISOString(),
    });
  }
  return validRows;
}

function buildPhoneRows(representativeId: number, phones: string[]): ContactInsertRow[] {
  const validRows: ContactInsertRow[] = [];
  for (let index = 0; index < phones.length; index++) {
    const value = phones[index];
    if (!value) continue;
    
    const validation = validateAndNormalizeContact('phone', value);
    if (!validation.isValid || !validation.normalized) {
      console.warn(`Skipping invalid phone for representative ${representativeId}: ${value} (${validation.error})`);
      continue;
    }
    
    validRows.push({
      representative_id: representativeId,
      contact_type: 'phone',
      value: validation.normalized,
      is_primary: index === 0 && validRows.length === 0,
      is_verified: false,
      source: CONTACT_SOURCE,
      updated_at: new Date().toISOString(),
    });
  }
  return validRows;
}

function buildFaxRows(representativeId: number, faxes: string[]): ContactInsertRow[] {
  const validRows: ContactInsertRow[] = [];
  for (let index = 0; index < faxes.length; index++) {
    const value = faxes[index];
    if (!value) continue;
    
    const validation = validateAndNormalizeContact('fax', value);
    if (!validation.isValid || !validation.normalized) {
      console.warn(`Skipping invalid fax for representative ${representativeId}: ${value} (${validation.error})`);
      continue;
    }
    
    validRows.push({
      representative_id: representativeId,
      contact_type: 'fax',
      value: validation.normalized,
      is_primary: index === 0 && validRows.length === 0,
      is_verified: false,
      source: CONTACT_SOURCE,
      updated_at: new Date().toISOString(),
    });
  }
  return validRows;
}

function buildAddressRows(
  representativeId: number,
  addresses: Array<{ value: string; isPrimary: boolean }>,
): ContactInsertRow[] {
  const validRows: ContactInsertRow[] = [];
  for (const entry of addresses) {
    if (!entry.value) continue;
    
    const validation = validateAndNormalizeContact('address', entry.value);
    if (!validation.isValid || !validation.normalized) {
      console.warn(`Skipping invalid address for representative ${representativeId}: ${entry.value} (${validation.error})`);
      continue;
    }
    
    validRows.push({
      representative_id: representativeId,
      contact_type: 'address',
      value: validation.normalized,
      is_primary: entry.isPrimary,
      is_verified: false,
      source: CONTACT_SOURCE,
      updated_at: new Date().toISOString(),
    });
  }
  return validRows;
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

export interface SyncContactResult {
  success: boolean;
  representativeId: number;
  contactsAdded: number;
  contactsSkipped: number;
  errors: string[];
  warnings: string[];
}

export async function syncRepresentativeContacts(rep: CanonicalRepresentative): Promise<SyncContactResult> {
  const representativeId = rep.supabaseRepresentativeId;
  const result: SyncContactResult = {
    success: false,
    representativeId: representativeId ?? 0,
    contactsAdded: 0,
    contactsSkipped: 0,
    errors: [],
    warnings: [],
  };

  if (!representativeId) {
    result.errors.push('Representative ID is required');
    return result;
  }

  result.representativeId = representativeId;

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

    const { data: existingContacts, error: existingError } = await client
      .from('representative_contacts')
      .select('contact_type, value, source, is_primary')
      .eq('representative_id', representativeId);

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

