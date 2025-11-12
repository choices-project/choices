import type {
  CanonicalRepresentative,
  CanonicalSocialProfile,
} from '../ingest/openstates/people.js';
import {
  fetchRepresentativeInfoByDivision,
  type GoogleCivicRepresentativeInfoResponse,
  type GoogleCivicOfficial,
  type GoogleCivicOffice,
  type GoogleCivicAddress,
  type GoogleCivicChannel,
} from '../clients/googleCivic.js';

interface GoogleCivicMatch {
  official: GoogleCivicOfficial;
  office: GoogleCivicOffice | null;
}

export interface GoogleCivicEnrichmentResult {
  emails: string[];
  phones: string[];
  addresses: string[];
  social: CanonicalSocialProfile[];
  photoUrl: string | null;
  urls: string[];
  divisionId: string | null;
  matchName: string | null;
}

const divisionCache = new Map<string, GoogleCivicRepresentativeInfoResponse | null>();

function cleanName(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function buildCandidateNameSet(rep: CanonicalRepresentative): Set<string> {
  const names = new Set<string>();
  const push = (name: string | null | undefined) => {
    const cleaned = cleanName(name);
    if (cleaned) names.add(cleaned);
  };

  push(rep.name);
  push(`${rep.givenName ?? ''}${rep.familyName ?? ''}`.trim());
  push(`${rep.givenName ?? ''}${rep.middleName ?? ''}${rep.familyName ?? ''}`.trim());
  push(`${rep.givenName ?? ''}${rep.nickname ?? ''}${rep.familyName ?? ''}`.trim());
  push(`${rep.familyName ?? ''}${rep.givenName ?? ''}`.trim());
  push(`${rep.nickname ?? ''}${rep.familyName ?? ''}`.trim());
  for (const alias of rep.aliases ?? []) {
    push(alias.name);
  }
  return names;
}

function normalizePhone(value: string): string {
  return value.replace(/\D+/g, '');
}

function stringifyAddress(address: GoogleCivicAddress): string | null {
  const parts = [
    address.locationName,
    address.line1,
    address.line2,
    address.line3,
    address.city,
    address.state,
    address.zip,
  ]
    .map((part) => part?.trim())
    .filter(Boolean);

  if (parts.length === 0) return null;
  return parts.join(', ');
}

function mapChannelToSocial(profile: GoogleCivicChannel): CanonicalSocialProfile | null {
  const type = profile.type?.toLowerCase();
  const id = profile.id ?? null;
  if (!type || !id) return null;

  switch (type) {
    case 'twitter':
      return { platform: 'twitter', handle: id, url: `https://twitter.com/${id}`, isOfficial: true };
    case 'facebook':
      return {
        platform: 'facebook',
        handle: id,
        url: `https://www.facebook.com/${id}`,
        isOfficial: true,
      };
    case 'youtube':
      return {
        platform: 'youtube',
        handle: id,
        url: id.startsWith('UC') ? `https://www.youtube.com/channel/${id}` : `https://www.youtube.com/${id}`,
        isOfficial: true,
      };
    case 'instagram':
      return {
        platform: 'instagram',
        handle: id,
        url: `https://www.instagram.com/${id}`,
        isOfficial: true,
      };
    case 'tiktok':
      return {
        platform: 'tiktok',
        handle: id,
        url: `https://www.tiktok.com/@${id}`,
        isOfficial: true,
      };
    case 'linkedin':
      return {
        platform: 'linkedin',
        handle: id,
        url: `https://www.linkedin.com/in/${id}`,
        isOfficial: true,
      };
    default:
      return null;
  }
}

async function getDivisionPayload(
  divisionId: string,
): Promise<GoogleCivicRepresentativeInfoResponse | null> {
  if (!divisionId) return null;
  const cached = divisionCache.get(divisionId);
  if (cached !== undefined) return cached;

  try {
    const payload = await fetchRepresentativeInfoByDivision(divisionId);
    divisionCache.set(divisionId, payload);
    return payload;
  } catch (error) {
    console.warn(`[googleCivic] Failed to fetch division ${divisionId}: ${(error as Error).message}`);
    divisionCache.set(divisionId, null);
    return null;
  }
}

function findMatch(
  payload: GoogleCivicRepresentativeInfoResponse,
  rep: CanonicalRepresentative,
  candidateNames: Set<string>,
): GoogleCivicMatch | null {
  if (!payload.officials || payload.officials.length === 0) {
    return null;
  }

  const offices = payload.offices ?? [];
  const officials = payload.officials ?? [];

  // Try to match using offices whose division corresponds to the representative roles
  const roleDivisionIds = new Set(
    rep.currentRoles
      .map((role) => role.divisionId)
      .filter((value): value is string => Boolean(value)),
  );

  const matchByOffice = () => {
    for (const office of offices) {
      if (roleDivisionIds.size > 0 && !roleDivisionIds.has(office.divisionId)) {
        continue;
      }
      for (const index of office.officialIndices ?? []) {
        const official = officials[index];
        if (!official) continue;
        const cleaned = cleanName(official.name);
        if (cleaned && candidateNames.has(cleaned)) {
          return { official, office };
        }
      }
    }
    return null;
  };

  const officeMatch = matchByOffice();
  if (officeMatch) return officeMatch;

  // Fall back to name-only matching if office-based matching fails
  for (const official of officials) {
    const cleaned = cleanName(official.name);
    if (cleaned && candidateNames.has(cleaned)) {
      return { official, office: null };
    }
  }

  return null;
}

export async function collectGoogleCivicEnrichment(
  rep: CanonicalRepresentative,
): Promise<GoogleCivicEnrichmentResult | null> {
  const divisionIds = Array.from(
    new Set(
      rep.currentRoles
        .map((role) => role.divisionId)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const candidateNames = buildCandidateNameSet(rep);
  const existingEmails = new Set(rep.emails.map((email) => email.trim().toLowerCase()));
  const existingPhones = new Set(rep.phones.map((phone) => normalizePhone(phone)));
  const existingAddresses = new Set(
    rep.offices
      .map((office) => office.address?.trim().toLowerCase())
      .filter((value): value is string => Boolean(value)),
  );
  const existingSocialKeys = new Set(
    (rep.social ?? []).map(
      (profile) => `${profile.platform}:${profile.handle ?? profile.url ?? ''}`.toLowerCase(),
    ),
  );
  const existingLinks = new Set(rep.links.map((link) => link.trim()));

  const scopeIds = divisionIds.length > 0 ? divisionIds : ['ocd-division/country:us'];

  for (const divisionId of scopeIds) {
    const payload = await getDivisionPayload(divisionId);
    if (!payload) continue;

    const match = findMatch(payload, rep, candidateNames);
    if (!match) continue;

    const { official } = match;
    const emails: string[] = [];
    for (const email of official.emails ?? []) {
      const normalized = email.trim().toLowerCase();
      if (normalized && !existingEmails.has(normalized)) {
        emails.push(email.trim());
        existingEmails.add(normalized);
      }
    }

    const phones: string[] = [];
    for (const phone of official.phones ?? []) {
      const normalized = normalizePhone(phone);
      if (normalized && !existingPhones.has(normalized)) {
        phones.push(phone.trim());
        existingPhones.add(normalized);
      }
    }

    const addresses: string[] = [];
    for (const address of official.address ?? []) {
      const asString = stringifyAddress(address);
      if (!asString) continue;
      const normalized = asString.toLowerCase();
      if (!existingAddresses.has(normalized)) {
        addresses.push(asString);
        existingAddresses.add(normalized);
      }
    }

    const urls: string[] = [];
    for (const url of official.urls ?? []) {
      const trimmed = url.trim();
      if (trimmed && !existingLinks.has(trimmed)) {
        urls.push(trimmed);
        existingLinks.add(trimmed);
      }
    }

    const social: CanonicalSocialProfile[] = [];
    for (const channel of official.channels ?? []) {
      const profile = mapChannelToSocial(channel);
      if (!profile) continue;
      const key = `${profile.platform}:${profile.handle ?? profile.url ?? ''}`.toLowerCase();
      if (!existingSocialKeys.has(key)) {
        social.push(profile);
        existingSocialKeys.add(key);
      }
    }

    const photoUrl = rep.image ? null : official.photoUrl ?? null;

    if (
      emails.length === 0 &&
      phones.length === 0 &&
      addresses.length === 0 &&
      social.length === 0 &&
      !photoUrl &&
      urls.length === 0
    ) {
      // No new data from this payload; keep iterating in case another division provides more.
      continue;
    }

    return {
      emails,
      phones,
      addresses,
      social,
      photoUrl,
      urls,
      divisionId,
      matchName: official.name ?? null,
    };
  }

  return null;
}


