/**
 * Shared Civics Contracts
 *
 * Canonical type definitions used across civics integrations, data pipelines,
 * and UI components. Centralising these prevents accidental `any` usage and
 * ensures data flowing from third-party APIs is validated consistently.
 */

export type CivicsRepresentativeSocialMedia = {
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
};

export type CivicsRepresentativeChannel = {
  type: string;
  id: string;
};

export type CivicsRepresentativeContact = {
  phone?: string;
  email?: string;
  website?: string;
};

export type CivicsRepresentative = {
  id: string;
  name: string;
  party: string;
  office: string;
  state: string;
  district: string;
  source: string;
  sourceId: string;
  contact: CivicsRepresentativeContact;
  photoUrl?: string;
  socialMedia?: CivicsRepresentativeSocialMedia;
  channels?: CivicsRepresentativeChannel[];
};

export type AddressLookupResult = {
  district: string;
  state: string;
  representatives: CivicsRepresentative[];
  normalizedAddress: string;
  confidence: number;
  coordinates?: {
    lat: number;
    lng: number;
  } | null;
};

export type CandidatePosition = {
  issue: string;
  stance: string;
  source?: string;
};

export type CandidateRecentVote = {
  bill: string;
  vote: 'yes' | 'no' | 'abstain';
  date: string;
};

export type CandidateCardV1 = {
  id: string;
  name: string;
  party: string;
  office: string;
  state: string;
  district?: string;
  imageUrl: string;
  website?: string;
  bio?: string;
  socialMedia?: CivicsRepresentativeSocialMedia;
  positions?: CandidatePosition[];
  recentVotes?: CandidateRecentVote[];
  endorsements?: string[];
  fundraisingTotal?: number;
  source: string;
  sourceId: string;
  lastUpdated: string;
};


