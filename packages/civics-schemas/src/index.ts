/**
 * Civics Data Schemas
 * 
 * Type definitions and validation schemas for civics-related data structures
 */

import { z } from 'zod';

// Zod schema for CandidateCardV1
export const CandidateCardV1Schema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  party: z.string().min(1, "Party is required"),
  office: z.string().min(1, "Office is required"),
  district: z.string().optional(),
  state: z.string().min(2, "State must be at least 2 characters").max(2, "State must be 2 characters"),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
  bio: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  socialMedia: z.object({
    twitter: z.string().optional(),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
  }).optional(),
  positions: z.array(z.object({
    issue: z.string().min(1, "Issue is required"),
    stance: z.string().min(1, "Stance is required"),
    source: z.string().optional(),
  })).optional(),
  recentVotes: z.array(z.object({
    bill: z.string().min(1, "Bill is required"),
    vote: z.enum(['yes', 'no', 'abstain']),
    date: z.string().datetime("Invalid date format"),
  })).optional(),
});

// TypeScript type derived from Zod schema
export type CandidateCardV1 = z.infer<typeof CandidateCardV1Schema>;

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