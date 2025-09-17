/**
 * Civics Data Schemas
 * 
 * Type definitions and validation schemas for civics-related data structures
 * Enhanced with ingest pipeline schemas for next development phase
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
    website?: string;
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

// ===== INGEST PIPELINE SCHEMAS =====
// Enhanced schemas for the next development phase

/**
 * Address Lookup Result Schema
 * Used by the ingest pipeline for address-to-district mapping
 */
export const AddressLookupResultSchema = z.object({
  district: z.string().min(1, "District is required"),
  state: z.string().min(2, "State must be at least 2 characters").max(2, "State must be 2 characters"),
  representatives: z.array(z.any()).default([]),
  normalizedAddress: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type AddressLookupResult = z.infer<typeof AddressLookupResultSchema>;

/**
 * Data Source Configuration Schema
 * Configuration for different civic data sources
 */
export const DataSourceConfigSchema = z.object({
  name: z.string().min(1, "Source name is required"),
  type: z.enum(['civicinfo', 'propublica', 'fec', 'custom']),
  enabled: z.boolean().default(true),
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional(),
  rateLimit: z.object({
    requestsPerMinute: z.number().positive().default(60),
    requestsPerHour: z.number().positive().default(1000),
  }).optional(),
  cache: z.object({
    ttl: z.number().positive().default(300000), // 5 minutes
    maxSize: z.number().positive().default(1000),
  }).optional(),
});

export type DataSourceConfig = z.infer<typeof DataSourceConfigSchema>;

/**
 * Ingest Pipeline Status Schema
 * Tracks the status of data ingestion processes
 */
export const IngestStatusSchema = z.object({
  id: z.string().min(1, "Ingest ID is required"),
  source: z.string().min(1, "Source is required"),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  recordsProcessed: z.number().nonnegative().default(0),
  recordsTotal: z.number().nonnegative().optional(),
  error: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type IngestStatus = z.infer<typeof IngestStatusSchema>;

/**
 * Data Quality Metrics Schema
 * Tracks data quality metrics for ingested data
 */
export const DataQualityMetricsSchema = z.object({
  source: z.string().min(1, "Source is required"),
  timestamp: z.string().datetime(),
  totalRecords: z.number().nonnegative(),
  validRecords: z.number().nonnegative(),
  invalidRecords: z.number().nonnegative(),
  duplicateRecords: z.number().nonnegative(),
  completeness: z.number().min(0).max(1), // 0-1 score
  accuracy: z.number().min(0).max(1).optional(), // 0-1 score
  freshness: z.number().nonnegative(), // hours since last update
  issues: z.array(z.object({
    type: z.enum(['missing_field', 'invalid_format', 'duplicate', 'outdated']),
    count: z.number().nonnegative(),
    description: z.string(),
  })).default([]),
});

export type DataQualityMetrics = z.infer<typeof DataQualityMetricsSchema>;