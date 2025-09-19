/**
 * ProPublica Congress API Data Transformers
 * 
 * Transformers for converting ProPublica API responses to our internal data formats
 * with proper validation and error handling.
 */

import { logger } from '../../logger';
import { withOptional } from '../../util/objects';
import type { 
  ProPublicaMember, 
  ProPublicaVote, 
  ProPublicaBill 
} from './client';
// TODO: Re-enable when civics features are enabled
// import type { 
//   Representative,
//   CandidateCardV1 
// } from '../../../features/civics/schemas';

// Temporary stub types until civics schemas are re-enabled
type Representative = any;
type CandidateCardV1 = any;

export type TransformedProPublicaMember = {
  source: 'propublica';
  sourceId: string;
  bio?: string;
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    youtube?: string;
  };
  votingRecord?: {
    totalVotes: number;
    missedVotes: number;
    missedVotesPct: number;
    votesWithPartyPct: number;
    votesAgainstPartyPct: number;
  };
  recentVotes?: Array<{
    bill: string;
    vote: 'yes' | 'no' | 'abstain';
    date: string;
    result: string;
  }>;
} & Representative

export type TransformedProPublicaBill = {
  id: string;
  title: string;
  shortTitle?: string;
  billNumber: string;
  billType: string;
  congress: string;
  introducedDate: string;
  sponsor: {
    name: string;
    party: string;
    state: string;
  };
  summary?: string;
  status: string;
  lastAction: string;
  lastActionDate: string;
  cosponsors: number;
  cosponsorsByParty: {
    republican?: number;
    democrat?: number;
    independent?: number;
  };
  committees: string[];
  subjects: string[];
  source: 'propublica';
  sourceId: string;
  lastUpdated: string;
}

/**
 * Transform ProPublica member to our representative format
 */
export function transformMember(
  member: ProPublicaMember,
  recentVotes?: ProPublicaVote[]
): TransformedProPublicaMember {
  try {
    logger.debug('Transforming ProPublica member', {
      memberId: member.id,
      name: `${member.first_name} ${member.last_name}`,
      party: member.party
    });

    const socialMedia = extractSocialMedia(member);
    const votingRecord = extractVotingRecord(member);
    const transformedRecentVotes = recentVotes ? transformRecentVotes(recentVotes) : undefined;

    return withOptional(
      {
        id: `propublica-${member.id}`,
        name: `${member.first_name} ${member.last_name}${member.suffix ? ` ${member.suffix}` : ''}`,
        party: member.party,
        office: member.title,
        district: member.district || 'At-Large',
        state: member.state,
        contact: withOptional(
          {},
          {
            phone: member.phone,
            website: member.url
          }
        ),
        source: 'propublica' as const,
        sourceId: member.id
      },
      {
        bio: undefined, // ProPublica doesn't provide bio
        socialMedia,
        votingRecord,
        recentVotes: transformedRecentVotes
      }
    );
  } catch (error) {
    logger.error('Failed to transform ProPublica member', { error, member });
    throw new Error(`Failed to transform member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Transform ProPublica member to candidate card format
 */
export function transformToCandidateCard(
  member: ProPublicaMember,
  recentVotes?: ProPublicaVote[]
): CandidateCardV1 {
  const transformedMember = transformMember(member, recentVotes);
  const socialMedia = transformedMember.socialMedia;
  const recentVotesData = transformedMember.recentVotes;

  return {
    id: transformedMember.id,
    name: transformedMember.name,
    party: transformedMember.party,
    office: transformedMember.office,
    district: transformedMember.district,
    state: transformedMember.state,
    imageUrl: '', // ProPublica doesn't provide images
    bio: transformedMember.bio,
    website: transformedMember.contact.website || '',
    socialMedia: socialMedia ? {
      twitter: socialMedia.twitter,
      facebook: socialMedia.facebook,
      instagram: socialMedia.youtube // Map YouTube to Instagram field for now
    } : undefined,
    positions: undefined, // Would need additional data source
    recentVotes: recentVotesData
  };
}

/**
 * Transform ProPublica bill to our format
 */
export function transformBill(bill: ProPublicaBill): TransformedProPublicaBill {
  try {
    logger.debug('Transforming ProPublica bill', {
      billId: bill.bill_id,
      title: bill.title,
      billNumber: bill.number
    });

    return withOptional(
      {
        id: `propublica-bill-${bill.bill_id}`,
        title: bill.title,
        billNumber: bill.number,
        billType: bill.bill_type,
        congress: bill.congress,
        introducedDate: bill.introduced_date,
        sponsor: {
          name: bill.sponsor_name || 'Unknown',
          party: bill.sponsor_party || 'Unknown',
          state: bill.sponsor_state || 'Unknown'
        },
        status: bill.active ? 'active' : 'inactive',
        lastAction: bill.latest_major_action || bill.latest_action || 'Unknown',
        lastActionDate: bill.latest_major_action_date || bill.latest_action_date || bill.introduced_date,
        cosponsors: bill.cosponsors,
        cosponsorsByParty: withOptional(
          {},
          {
            republican: bill.cosponsors_by_party.R,
            democrat: bill.cosponsors_by_party.D,
            independent: bill.cosponsors_by_party.I
          }
        ),
        committees: bill.committees ? [bill.committees] : [],
        subjects: bill.primary_subject ? [bill.primary_subject] : [],
        source: 'propublica' as const,
        sourceId: bill.bill_id,
        lastUpdated: new Date().toISOString()
      },
      {
        shortTitle: bill.short_title,
        summary: bill.summary || bill.summary_short
      }
    );
  } catch (error) {
    logger.error('Failed to transform ProPublica bill', { error, bill });
    throw new Error(`Failed to transform bill: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Transform recent votes to our format
 */
export function transformRecentVotes(votes: ProPublicaVote[]): Array<{
  bill: string;
  vote: 'yes' | 'no' | 'abstain';
  date: string;
  result: string;
}> {
  return votes.map(vote => ({
    bill: vote.bill.number || vote.bill.bill_id,
    vote: mapVotePosition(vote.position),
    date: vote.date,
    result: vote.result
  }));
}

/**
 * Extract social media information from member
 */
function extractSocialMedia(member: ProPublicaMember): {
  twitter?: string;
  facebook?: string;
  youtube?: string;
} | undefined {
  const socialMedia: { twitter?: string; facebook?: string; youtube?: string } = {};

  if (member.twitter_account) {
    socialMedia.twitter = `https://twitter.com/${member.twitter_account}`;
  }

  if (member.facebook_account) {
    socialMedia.facebook = `https://facebook.com/${member.facebook_account}`;
  }

  if (member.youtube_account) {
    socialMedia.youtube = `https://youtube.com/${member.youtube_account}`;
  }

  return Object.keys(socialMedia).length > 0 ? socialMedia : undefined;
}

/**
 * Extract voting record information from member
 */
function extractVotingRecord(member: ProPublicaMember): {
  totalVotes: number;
  missedVotes: number;
  missedVotesPct: number;
  votesWithPartyPct: number;
  votesAgainstPartyPct: number;
} | undefined {
  if (member.total_votes === undefined || member.missed_votes === undefined) {
    return undefined;
  }

  return {
    totalVotes: member.total_votes,
    missedVotes: member.missed_votes,
    missedVotesPct: member.missed_votes_pct || 0,
    votesWithPartyPct: member.votes_with_party_pct || 0,
    votesAgainstPartyPct: member.votes_against_party_pct || 0
  };
}

/**
 * Map ProPublica vote position to our format
 */
function mapVotePosition(position: string): 'yes' | 'no' | 'abstain' {
  const normalizedPosition = position.toLowerCase();
  
  if (normalizedPosition === 'yes' || normalizedPosition === 'yea') {
    return 'yes';
  }
  
  if (normalizedPosition === 'no' || normalizedPosition === 'nay') {
    return 'no';
  }
  
  return 'abstain';
}

/**
 * Validate transformed member data
 */
export function validateTransformedMember(member: TransformedProPublicaMember): boolean {
  try {
    // Check required fields
    if (!member.name || !member.party || !member.office || !member.state) {
      logger.warn('Transformed member missing required fields', { member });
      return false;
    }

    // Validate voting record if present
    if (member.votingRecord) {
      const { totalVotes, missedVotes, missedVotesPct, votesWithPartyPct, votesAgainstPartyPct } = member.votingRecord;
      
      if (totalVotes < 0 || missedVotes < 0 || missedVotes > totalVotes) {
        logger.warn('Invalid voting record data', { votingRecord: member.votingRecord });
        return false;
      }

      if (missedVotesPct < 0 || missedVotesPct > 100 || 
          votesWithPartyPct < 0 || votesWithPartyPct > 100 ||
          votesAgainstPartyPct < 0 || votesAgainstPartyPct > 100) {
        logger.warn('Invalid voting percentage data', { votingRecord: member.votingRecord });
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error('Error validating transformed member', { error, member });
    return false;
  }
}

/**
 * Validate transformed bill data
 */
export function validateTransformedBill(bill: TransformedProPublicaBill): boolean {
  try {
    // Check required fields
    if (!bill.id || !bill.title || !bill.billNumber || !bill.congress) {
      logger.warn('Transformed bill missing required fields', { bill });
      return false;
    }

    // Validate dates
    if (bill.introducedDate && isNaN(Date.parse(bill.introducedDate))) {
      logger.warn('Invalid introduced date', { introducedDate: bill.introducedDate });
      return false;
    }

    if (bill.lastActionDate && isNaN(Date.parse(bill.lastActionDate))) {
      logger.warn('Invalid last action date', { lastActionDate: bill.lastActionDate });
      return false;
    }

    // Validate cosponsor counts
    if (bill.cosponsors < 0) {
      logger.warn('Invalid cosponsor count', { cosponsors: bill.cosponsors });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error validating transformed bill', { error, bill });
    return false;
  }
}

/**
 * Clean and normalize member data
 */
export function cleanMemberData(member: TransformedProPublicaMember): TransformedProPublicaMember {
  return {
    ...member,
    name: member.name.trim(),
    party: member.party.trim(),
    office: member.office.trim(),
    district: member.district.trim(),
    state: member.state.trim().toUpperCase(),
    contact: withOptional(
      {},
      {
        phone: member.contact.phone?.trim(),
        email: member.contact.email,
        address: member.contact.address,
        website: member.contact.website?.trim()
      }
    )
  };
}

/**
 * Clean and normalize bill data
 */
export function cleanBillData(bill: TransformedProPublicaBill): TransformedProPublicaBill {
  return withOptional(
    {
      ...bill,
      title: bill.title.trim(),
      billNumber: bill.billNumber.trim(),
      lastAction: bill.lastAction.trim(),
      sponsor: {
        ...bill.sponsor,
        name: bill.sponsor.name.trim(),
        party: bill.sponsor.party.trim(),
        state: bill.sponsor.state.trim().toUpperCase()
      }
    },
    {
      shortTitle: bill.shortTitle?.trim(),
      summary: bill.summary?.trim()
    }
  );
}
