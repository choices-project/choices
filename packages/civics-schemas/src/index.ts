/**
 * Civics Data Schemas
 * 
 * Type definitions for civics-related data structures
 */

export interface CandidateCardV1 {
  id: string;
  name: string;
  party: string;
  office: string;
  district?: string;
  state: string;
  imageUrl?: string;
  bio?: string;
  website?: string;
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  positions?: {
    issue: string;
    stance: string;
    source?: string;
  }[];
  recentVotes?: {
    bill: string;
    vote: 'yes' | 'no' | 'abstain';
    date: string;
  }[];
}

export interface District {
  id: string;
  name: string;
  state: string;
  type: 'congressional' | 'state_senate' | 'state_house' | 'county' | 'city';
  boundaries?: {
    coordinates: number[][];
  };
}

export interface Representative {
  id: string;
  name: string;
  party: string;
  office: string;
  district: string;
  state: string;
  contact: {
    phone?: string;
    email?: string;
    address?: string;
  };
}

export interface Vote {
  id: string;
  bill: string;
  title: string;
  date: string;
  result: 'passed' | 'failed' | 'pending';
  votes: {
    yes: number;
    no: number;
    abstain: number;
  };
  memberVotes: {
    memberId: string;
    vote: 'yes' | 'no' | 'abstain';
  }[];
}