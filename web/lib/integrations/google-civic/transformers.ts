/**
 * Google Civic Information API Data Transformers
 *
 * Transformers for converting Google Civic API responses to our internal data formats
 * with proper validation and error handling.
 */

import { logger } from '@/lib/utils/logger';

import { withOptional } from '../../util/objects';

import type {
  AddressLookupResult,
  CandidateCardV1,
  CandidatePosition,
  CandidateRecentVote,
  CivicsRepresentative,
  CivicsRepresentativeSocialMedia,
} from '@/features/civics/lib/types/contracts';
import type {
  GoogleCivicResponse,
  GoogleCivicRepresentative,
  GoogleCivicOffice,
  GoogleCivicDivision
} from './client';

export type TransformedRepresentative = CivicsRepresentative & {
  source: 'google-civic';
};

export type TransformedCandidateCard = CandidateCardV1 & {
  source: 'google-civic';
};

/**
 * Transform Google Civic API response to AddressLookupResult
 */
export function transformAddressLookup(
  response: GoogleCivicResponse,
  originalAddress: string
): AddressLookupResult {
  try {
    logger.debug('Transforming Google Civic address lookup response', {
      divisionsCount: Object.keys(response.divisions).length,
      officesCount: response.offices.length,
      officialsCount: response.officials.length
    });

    // Extract district information
    const { district, state } = extractDistrictInfo(response.divisions, response.normalizedInput.state);

    // Transform representatives
    const representatives = transformRepresentatives(response.officials, response.offices, district, state);

    // Create normalized address, fallback to original if normalized input is not available
    const normalizedAddress = response.normalizedInput ?
      createNormalizedAddress(response.normalizedInput) :
      originalAddress;

    return {
      district,
      state,
      representatives,
      normalizedAddress,
      confidence: calculateConfidence(response),
      coordinates: null // Google Civic API doesn't provide coordinates
    };
  } catch (error) {
    logger.error('Failed to transform address lookup response', { error, response });
    throw new Error(`Failed to transform address lookup: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Transform Google Civic representatives to our format
 */
export function transformRepresentatives(
  officials: GoogleCivicRepresentative[],
  offices: GoogleCivicOffice[],
  district: string,
  state: string
): TransformedRepresentative[] {
  return officials.map((official, index) => {
    const office = findOfficeForOfficial(offices, index);
    const socialMedia = extractSocialMedia(official.channels);
    const contact: TransformedRepresentative['contact'] = {};
    const primaryPhone = official.phones?.[0];
    const primaryEmail = official.emails?.[0];
    const primaryUrl = official.urls?.[0];

    if (primaryPhone) contact.phone = primaryPhone;
    if (primaryEmail) contact.email = primaryEmail;
    if (primaryUrl) contact.website = primaryUrl;

    const representative: TransformedRepresentative = {
      id: `google-civic-${index}-${Date.now()}`,
      name: official.name,
      party: official.party ?? 'Unknown',
      office: office?.name ?? 'Unknown Office',
      district,
      state,
      contact,
      source: 'google-civic',
      sourceId: `official-${index}`
    };

    if (official.photoUrl) {
      representative.photoUrl = official.photoUrl;
    }
    if (socialMedia) {
      representative.socialMedia = socialMedia;
    }
    if (official.channels && official.channels.length > 0) {
      representative.channels = official.channels;
    }

    return representative;
  });
}

/**
 * Transform representative to candidate card format
 */
export function transformToCandidateCard(
  representative: TransformedRepresentative,
  additionalData?: {
    bio?: string;
    positions?: CandidatePosition[];
    recentVotes?: CandidateRecentVote[];
  }
): TransformedCandidateCard {
  const card: TransformedCandidateCard = {
    id: representative.id,
    name: representative.name,
    party: representative.party,
    office: representative.office,
    district: representative.district,
    state: representative.state,
    imageUrl: representative.photoUrl ?? '',
    source: 'google-civic',
    sourceId: representative.sourceId,
    lastUpdated: new Date().toISOString()
  };

  if (additionalData?.bio) {
    card.bio = additionalData.bio;
  }
  if (representative.contact.website) {
    card.website = representative.contact.website;
  }
  if (representative.socialMedia) {
    card.socialMedia = representative.socialMedia;
  }
  if (additionalData?.positions?.length) {
    card.positions = additionalData.positions;
  }
  if (additionalData?.recentVotes?.length) {
    card.recentVotes = additionalData.recentVotes;
  }

  return card;
}

/**
 * Extract district information from divisions
 */
function extractDistrictInfo(
  divisions: Record<string, GoogleCivicDivision>,
  state: string
): { district: string; state: string } {
  const divisionValues = Object.values(divisions);

  // Look for congressional district
  const congressionalDivision = divisionValues.find(div =>
    div.name.includes('Congressional District') ||
    div.name.includes('U.S. House') ||
    div.name.includes('House of Representatives')
  );

  if (congressionalDivision) {
    return {
      district: congressionalDivision.name,
      state
    };
  }

  // Look for state-level district
  const stateDivision = divisionValues.find(div =>
    div.name.includes('State') &&
    (div.name.includes('District') || div.name.includes('Senate') || div.name.includes('House'))
  );

  if (stateDivision) {
    return {
      district: stateDivision.name,
      state
    };
  }

  // Fallback to first division or state
  const firstDivision = divisionValues[0];
  return {
    district: firstDivision?.name ?? `${state} General`,
    state
  };
}

/**
 * Find office for a specific official
 */
function findOfficeForOfficial(
  offices: GoogleCivicOffice[],
  officialIndex: number
): GoogleCivicOffice | undefined {
  return offices.find(office =>
    office.officialIndices?.includes(officialIndex)
  );
}

/**
 * Extract social media information from channels
 */
function extractSocialMedia(
  channels?: Array<{ type: string; id: string }>
): CivicsRepresentativeSocialMedia | undefined {
  if (!channels || channels.length === 0) {
    return undefined;
  }

  const socialMedia: CivicsRepresentativeSocialMedia = {};

  channels.forEach(channel => {
    switch (channel.type.toLowerCase()) {
      case 'twitter':
        socialMedia.twitter = `https://twitter.com/${channel.id}`;
        break;
      case 'facebook':
        socialMedia.facebook = `https://facebook.com/${channel.id}`;
        break;
      case 'instagram':
        socialMedia.instagram = `https://instagram.com/${channel.id}`;
        break;
      case 'youtube':
        socialMedia.youtube = `https://youtube.com/${channel.id}`;
        break;
      case 'tiktok':
        socialMedia.tiktok = `https://www.tiktok.com/@${channel.id}`;
        break;
    }
  });

  return Object.keys(socialMedia).length > 0 ? socialMedia : undefined;
}

/**
 * Create normalized address string
 */
function createNormalizedAddress(normalizedInput: {
  line1: string;
  city: string;
  state: string;
  zip: string;
}): string {
  return `${normalizedInput.line1}, ${normalizedInput.city}, ${normalizedInput.state} ${normalizedInput.zip}`.trim();
}

/**
 * Calculate confidence score based on response quality
 */
function calculateConfidence(response: GoogleCivicResponse): number {
  let confidence = 0.5; // Base confidence

  // Increase confidence based on data completeness
  if (response.normalizedInput.line1) confidence += 0.1;
  if (response.normalizedInput.city) confidence += 0.1;
  if (response.normalizedInput.state) confidence += 0.1;
  if (response.normalizedInput.zip) confidence += 0.1;

  // Increase confidence based on number of officials found
  if (response.officials.length > 0) confidence += 0.1;
  if (response.officials.length > 2) confidence += 0.05;

  // Increase confidence if we have offices
  if (response.offices.length > 0) confidence += 0.05;

  return Math.min(confidence, 1.0);
}

/**
 * Validate transformed data
 */
export function validateTransformedData(data: AddressLookupResult): boolean {
  try {
    // Check required fields
    if (!data.district || !data.state) {
      logger.warn('Transformed data missing required fields', { data });
      return false;
    }

    // Validate representatives
    if (data.representatives) {
      for (const rep of data.representatives) {
        if (!rep.name || !rep.office) {
          logger.warn('Representative missing required fields', { representative: rep });
          return false;
        }
        if (!rep.source || !rep.sourceId) {
          logger.warn('Representative missing source metadata', { representative: rep });
          return false;
        }
      }
    }

    // Validate confidence score
    if (data.confidence !== undefined && (data.confidence < 0 || data.confidence > 1)) {
      logger.warn('Invalid confidence score', { confidence: data.confidence });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error validating transformed data', { error, data });
    return false;
  }
}

/**
 * Clean and normalize representative data
 */
export function cleanRepresentativeData(representative: TransformedRepresentative): TransformedRepresentative {
  const contact: TransformedRepresentative['contact'] = {};
  if (representative.contact.phone) {
    contact.phone = representative.contact.phone.trim();
  }
  if (representative.contact.email) {
    contact.email = representative.contact.email.trim().toLowerCase();
  }
  if (representative.contact.website) {
    contact.website = representative.contact.website.trim();
  }

  const cleaned: TransformedRepresentative = {
    ...representative,
    name: representative.name.trim(),
    party: representative.party.trim() ?? 'Unknown',
    office: representative.office.trim(),
    district: representative.district.trim(),
    state: representative.state.trim().toUpperCase(),
    contact,
  };

  if (representative.photoUrl) {
    cleaned.photoUrl = representative.photoUrl.trim();
  }
  if (representative.socialMedia) {
    cleaned.socialMedia = representative.socialMedia;
  }
  if (representative.channels) {
    cleaned.channels = representative.channels;
  }

  return cleaned;
}
