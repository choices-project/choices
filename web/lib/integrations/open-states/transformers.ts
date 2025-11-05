/**
 * Open States Data Transformers
 * 
 * Transforms Open States API responses into unified data structures
 */

import { dev } from '../../dev.logger';

// Open States API types
export type OpenStatesLegislator = {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  party: string;
  chamber: string;
  district: string;
  state: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  url?: string;
  created_at: string;
  updated_at: string;
  active: boolean;
  roles: Array<{
    type: string;
    district: string;
    jurisdiction: {
      id: string;
      name: string;
    };
    start_date: string;
    end_date?: string;
  }>;
  offices: Array<{
    type: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    fax?: string;
  }>;
  sources: Array<{
    url: string;
    note?: string;
  }>;
}

export type OpenStatesBill = {
  id: string;
  identifier: string;
  title: string;
  classification: string[];
  subject: string[];
  abstract?: string;
  legislative_session: {
    identifier: string;
    name: string;
    start_date: string;
    end_date: string;
  };
  from_organization: {
    id: string;
    name: string;
    classification: string;
  };
  sponsors: Array<{
    id: string;
    name: string;
    classification: string;
    primary: boolean;
  }>;
  actions: Array<{
    date: string;
    description: string;
    classification: string[];
    organization: {
      id: string;
      name: string;
      classification: string;
    };
  }>;
  versions: Array<{
    date: string;
    note: string;
    links: Array<{
      media_type: string;
      url: string;
    }>;
  }>;
  documents: Array<{
    date: string;
    note: string;
    links: Array<{
      media_type: string;
      url: string;
    }>;
  }>;
  votes: Array<{
    id: string;
    identifier: string;
    motion_text: string;
    motion_classification: string[];
    start_date: string;
    end_date: string;
    result: string;
    organization: {
      id: string;
      name: string;
      classification: string;
    };
    votes: Array<{
      option: string;
      voter_name: string;
      voter_id: string;
    }>;
    sources: Array<{
      url: string;
      note?: string;
    }>;
  }>;
  sources: Array<{
    url: string;
    note?: string;
  }>;
  created_at: string;
  updated_at: string;
}

export type OpenStatesVote = {
  id: string;
  identifier: string;
  motion_text: string;
  motion_classification: string[];
  start_date: string;
  end_date: string;
  result: string;
  organization: {
    id: string;
    name: string;
    classification: string;
  };
  votes: Array<{
    option: string;
    voter_name: string;
    voter_id: string;
  }>;
  sources: Array<{
    url: string;
    note?: string;
  }>;
  created_at?: string;
  updated_at?: string;
}

// Transform Open States legislator to unified representative
export function transformOpenStatesLegislator(legislator: OpenStatesLegislator): Record<string, unknown> {
  try {
    dev.logger.debug('Transforming Open States legislator', { 
      id: legislator.id, 
      name: legislator.name 
    });

    const transformed = {
      id: legislator.id,
      openStatesId: legislator.id,
      name: legislator.name,
      firstName: legislator.first_name,
      lastName: legislator.last_name,
      party: legislator.party,
      state: legislator.state,
      district: legislator.district,
      chamber: legislator.chamber === 'upper' ? 'senate' : 'house',
      level: 'state',
      email: legislator.email,
      phone: legislator.phone,
      website: legislator.url,
      photoUrl: legislator.photo_url,
      socialMedia: {},
      active: legislator.active,
      roles: legislator.roles.map(role => ({
        type: role.type,
        district: role.district,
        jurisdiction: role.jurisdiction.name,
        startDate: role.start_date,
        endDate: role.end_date
      })),
      offices: legislator.offices.map(office => ({
        type: office.type,
        name: office.name,
        address: office.address,
        phone: office.phone,
        email: office.email,
        fax: office.fax
      })),
      sources: legislator.sources.map(source => ({
        url: source.url,
        note: source.note
      })),
      dataQuality: 'high' as const,
      lastUpdated: legislator.updated_at
    };

    dev.logger.debug('Open States legislator transformed successfully', { 
      id: transformed.id 
    });

    return transformed;

  } catch (error) {
    dev.logger.error('Failed to transform Open States legislator', { 
      id: legislator.id, 
      error 
    });
    throw new Error(`Failed to transform Open States legislator: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Transform Open States bill to unified bill
export function transformOpenStatesBill(bill: OpenStatesBill): Record<string, unknown> {
  try {
    dev.logger.debug('Transforming Open States bill', { 
      id: bill.id, 
      identifier: bill.identifier 
    });

    const transformed = {
      id: bill.id,
      openStatesId: bill.id,
      identifier: bill.identifier,
      title: bill.title,
      description: bill.abstract ?? '',
      classification: bill.classification,
      subjects: bill.subject,
      session: bill.legislative_session.identifier,
      sessionName: bill.legislative_session.name,
      sessionStartDate: bill.legislative_session.start_date,
      sessionEndDate: bill.legislative_session.end_date,
      chamber: bill.from_organization.classification,
      sponsors: bill.sponsors.map(sponsor => ({
        id: sponsor.id,
        name: sponsor.name,
        classification: sponsor.classification,
        primary: sponsor.primary
      })),
      actions: bill.actions.map(action => ({
        date: action.date,
        description: action.description,
        classification: action.classification,
        organization: action.organization.name
      })),
      versions: bill.versions.map(version => ({
        date: version.date,
        note: version.note,
        links: version.links.map(link => ({
          mediaType: link.media_type,
          url: link.url
        }))
      })),
      documents: bill.documents.map(doc => ({
        date: doc.date,
        note: doc.note,
        links: doc.links.map(link => ({
          mediaType: link.media_type,
          url: link.url
        }))
      })),
      votes: bill.votes.map(vote => transformOpenStatesVote(vote)),
      sources: bill.sources.map(source => ({
        url: source.url,
        note: source.note
      })),
      dataQuality: 'high' as const,
      lastUpdated: bill.updated_at
    };

    dev.logger.debug('Open States bill transformed successfully', { 
      id: transformed.id 
    });

    return transformed;

  } catch (error) {
    dev.logger.error('Failed to transform Open States bill', { 
      id: bill.id, 
      error 
    });
    throw new Error(`Failed to transform Open States bill: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Transform Open States vote to unified vote
export function transformOpenStatesVote(vote: OpenStatesVote): Record<string, unknown> {
  try {
    dev.logger.debug('Transforming Open States vote', { 
      id: vote.id, 
      identifier: vote.identifier 
    });

    const transformed = {
      id: vote.id,
      openStatesId: vote.id,
      identifier: vote.identifier,
      question: vote.motion_text,
      description: vote.motion_text,
      classification: vote.motion_classification,
      date: vote.start_date,
      result: vote.result.toLowerCase() as 'passed' | 'failed' | 'tabled',
      chamber: vote.organization.classification,
      organization: vote.organization.name,
      votes: vote.votes.map(v => ({
        voterId: v.voter_id,
        voterName: v.voter_name,
        vote: v.option.toLowerCase() as 'yes' | 'no' | 'abstain' | 'not_voting'
      })),
      sources: vote.sources.map(source => ({
        url: source.url,
        note: source.note
      })),
      dataQuality: 'high' as const,
      lastUpdated: vote.updated_at
    };

    dev.logger.debug('Open States vote transformed successfully', { 
      id: transformed.id 
    });

    return transformed;

  } catch (error) {
    dev.logger.error('Failed to transform Open States vote', { 
      id: vote.id, 
      error 
    });
    throw new Error(`Failed to transform Open States vote: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Transform to candidate card format
export function transformToCandidateCard(legislator: OpenStatesLegislator): Record<string, unknown> {
  try {
    dev.logger.debug('Transforming Open States legislator to candidate card', { 
      id: legislator.id 
    });

    const transformed = {
      id: legislator.id,
      name: legislator.name,
      party: legislator.party,
      office: `${legislator.chamber} ${legislator.district}`,
      state: legislator.state,
      district: legislator.district,
      contact: {
        email: legislator.email,
        phone: legislator.phone,
        website: legislator.url
      },
      photoUrl: legislator.photo_url,
      active: legislator.active,
      source: 'open-states',
      sourceId: legislator.id,
      lastUpdated: legislator.updated_at
    };

    dev.logger.debug('Open States candidate card transformed successfully', { 
      id: transformed.id 
    });

    return transformed;

  } catch (error) {
    dev.logger.error('Failed to transform Open States legislator to candidate card', { 
      id: legislator.id, 
      error 
    });
    throw new Error(`Failed to transform Open States legislator to candidate card: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
