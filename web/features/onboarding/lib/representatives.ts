import type { OnboardingJurisdiction } from '../types';
import type { Representative } from '@/types/representative';


type RepresentativeRecord = Record<string, unknown>;

export const isRecord = (value: unknown): value is RepresentativeRecord =>
  typeof value === 'object' && value !== null;

export const normalizeJurisdiction = (value: unknown): OnboardingJurisdiction | null => {
  if (!isRecord(value)) {
    return null;
  }

  const jurisdiction: OnboardingJurisdiction = {
    state: typeof value.state === 'string' ? value.state : null,
    district: typeof value.district === 'string' ? value.district : null,
    county: typeof value.county === 'string' ? value.county : null,
    fallback: typeof value.fallback === 'boolean' ? value.fallback : null,
  };

  return jurisdiction.state || jurisdiction.district || jurisdiction.county || jurisdiction.fallback !== null
    ? jurisdiction
    : null;
};

const toOptionalString = (record: RepresentativeRecord, key: string) =>
  typeof record[key] === 'string' && (record[key] as string).trim().length > 0
    ? (record[key] as string)
    : undefined;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

export const normalizeRepresentative = (value: unknown): Representative | null => {
  if (!isRecord(value)) {
    return null;
  }

  const rawId = value.id;
  const id =
    typeof rawId === 'number'
      ? rawId
      : typeof rawId === 'string'
        ? Number.parseInt(rawId, 10)
        : NaN;
  if (!Number.isFinite(id)) {
    return null;
  }

  const name = typeof value.name === 'string' ? value.name.trim() : '';
  if (!name) {
    return null;
  }

  const state = typeof value.state === 'string' ? value.state : 'UNKNOWN';
  const nowIso = new Date().toISOString();
  const office =
    typeof value.office === 'string'
      ? value.office
      : typeof value.title === 'string'
        ? value.title
        : 'Representative';
  const level =
    value.level === 'state' || value.level === 'local' ? value.level : 'federal';
  const party =
    typeof value.party === 'string' && value.party.trim().length > 0
      ? value.party
      : 'Independent';

  const representative: Representative = {
    id,
    name,
    party,
    office,
    level,
    state,
    data_quality_score:
      typeof value.data_quality_score === 'number'
        ? value.data_quality_score
        : 0,
    verification_status:
      value.verification_status === 'verified' ||
      value.verification_status === 'pending' ||
      value.verification_status === 'failed'
        ? value.verification_status
        : 'pending',
    data_sources: toStringArray(value.data_sources),
    created_at: typeof value.created_at === 'string' ? value.created_at : nowIso,
    updated_at: typeof value.updated_at === 'string' ? value.updated_at : nowIso,
    last_verified: typeof value.last_verified === 'string' ? value.last_verified : nowIso,
  };

  const district = toOptionalString(value, 'district');
  if (district) {
    representative.district = district;
  }
  const primaryEmail = toOptionalString(value, 'primary_email');
  if (primaryEmail) {
    representative.primary_email = primaryEmail;
  }
  const primaryPhone = toOptionalString(value, 'primary_phone');
  if (primaryPhone) {
    representative.primary_phone = primaryPhone;
  }
  const primaryWebsite = toOptionalString(value, 'primary_website');
  if (primaryWebsite) {
    representative.primary_website = primaryWebsite;
  }
  const twitterHandle = toOptionalString(value, 'twitter_handle');
  if (twitterHandle) {
    representative.twitter_handle = twitterHandle;
  }
  const facebookUrl = toOptionalString(value, 'facebook_url');
  if (facebookUrl) {
    representative.facebook_url = facebookUrl;
  }
  const instagramHandle = toOptionalString(value, 'instagram_handle');
  if (instagramHandle) {
    representative.instagram_handle = instagramHandle;
  }
  const linkedinUrl = toOptionalString(value, 'linkedin_url');
  if (linkedinUrl) {
    representative.linkedin_url = linkedinUrl;
  }
  const youtubeChannel = toOptionalString(value, 'youtube_channel');
  if (youtubeChannel) {
    representative.youtube_channel = youtubeChannel;
  }
  const bioguideId = toOptionalString(value, 'bioguide_id');
  if (bioguideId) {
    representative.bioguide_id = bioguideId;
  }
  const openstatesId = toOptionalString(value, 'openstates_id');
  if (openstatesId) {
    representative.openstates_id = openstatesId;
  }
  const fecId = toOptionalString(value, 'fec_id');
  if (fecId) {
    representative.fec_id = fecId;
  }
  const googleCivicId = toOptionalString(value, 'google_civic_id');
  if (googleCivicId) {
    representative.google_civic_id = googleCivicId;
  }
  const congressGovId = toOptionalString(value, 'congress_gov_id');
  if (congressGovId) {
    representative.congress_gov_id = congressGovId;
  }
  const primaryPhoto =
    toOptionalString(value, 'primary_photo_url') ?? toOptionalString(value, 'photo');
  if (primaryPhoto) {
    representative.primary_photo_url = primaryPhoto;
  }
  const termStart = toOptionalString(value, 'term_start_date');
  if (termStart) {
    representative.term_start_date = termStart;
  }
  const termEnd = toOptionalString(value, 'term_end_date');
  if (termEnd) {
    representative.term_end_date = termEnd;
  }
  const nextElection = toOptionalString(value, 'next_election_date');
  if (nextElection) {
    representative.next_election_date = nextElection;
  }

  return representative;
};

export const extractRepresentatives = (value: unknown): Representative[] => {
  if (!isRecord(value)) {
    return [];
  }
  if (Array.isArray(value.representatives)) {
    return value.representatives
      .map(normalizeRepresentative)
      .filter((rep): rep is Representative => rep !== null);
  }
  if (isRecord(value.data) && Array.isArray(value.data.representatives)) {
    return value.data.representatives
      .map(normalizeRepresentative)
      .filter((rep): rep is Representative => rep !== null);
  }
  return [];
};

export const parseStoredRepresentatives = (raw: string | null): Representative[] => {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map(normalizeRepresentative)
      .filter((rep): rep is Representative => rep !== null);
  } catch {
    return [];
  }
};

