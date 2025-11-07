/**
 * Runtime Type Validation Schemas for Electoral Data
 *
 * Uses Zod for safe runtime validation of external API data
 * Replaces unsafe type casts with proper validation
 *
 * Created: November 6, 2025
 */

import { z } from 'zod'

import logger from '@/lib/utils/logger'

// ============================================================================
// REPRESENTATIVE SCHEMAS
// ============================================================================
export const ContactSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  address: z.string().optional()
}).optional()

export const SocialMediaSchema = z.object({
  twitter: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  youtube: z.string().optional()
}).optional()

export const RepresentativeSchema = z.object({
  id: z.string(),
  name: z.string(),
  party: z.string(),
  office: z.string(),
  level: z.enum(['federal', 'state', 'local']),
  jurisdiction: z.string(),
  district: z.string().optional(),
  contact: ContactSchema,
  socialMedia: SocialMediaSchema,
  photoUrl: z.string().url().optional(),
  term: z.object({
    start: z.string(),
    end: z.string()
  }).optional(),
  sources: z.array(z.string()),
  lastUpdated: z.string()
})

export type Representative = z.infer<typeof RepresentativeSchema>

// ============================================================================
// CANDIDATE SCHEMAS
// ============================================================================

export const CandidateSchema = z.object({
  id: z.string(),
  name: z.string(),
  party: z.string(),
  status: z.enum(['incumbent', 'challenger', 'third-party']),
  fundraising: z.object({
    raised: z.number(),
    spent: z.number(),
    cash: z.number()
  }).optional(),
  endorsements: z.array(z.string()).optional(),
  website: z.string().url().optional(),
  photoUrl: z.string().url().optional()
})

export type Candidate = z.infer<typeof CandidateSchema>

// ============================================================================
// CAMPAIGN FINANCE SCHEMAS
// ============================================================================

export const CampaignFinanceSchema = z.object({
  candidate: z.string(),
  raised: z.number(),
  spent: z.number(),
  cash: z.number(),
  individualContributions: z.number().optional(),
  pacContributions: z.number().optional(),
  selfFunding: z.number().optional(),
  lastUpdated: z.string()
})

export type CampaignFinance = z.infer<typeof CampaignFinanceSchema>

// ============================================================================
// POLLING DATA SCHEMAS
// ============================================================================

export const PollDataSchema = z.object({
  pollster: z.string(),
  date: z.string(),
  sampleSize: z.number(),
  marginOfError: z.number(),
  results: z.record(z.string(), z.number()),
  methodology: z.string().optional()
}).nullable()

export type PollData = z.infer<typeof PollDataSchema>

// ============================================================================
// ELECTORAL RACE SCHEMAS
// ============================================================================

export const ElectoralRaceSchema = z.object({
  raceId: z.string(),
  office: z.string(),
  jurisdiction: z.string(),
  electionDate: z.string(),
  incumbent: RepresentativeSchema.optional(),
  challengers: z.array(RepresentativeSchema).default([]),
  allCandidates: z.array(CandidateSchema).default([]),
  keyIssues: z.array(z.string()).default([]),
  campaignFinance: CampaignFinanceSchema.optional(),
  pollingData: PollDataSchema,
  voterRegistrationDeadline: z.string().optional(),
  earlyVotingStart: z.string().optional(),
  absenteeBallotDeadline: z.string().optional(),
  recentActivity: z.array(z.object({
    date: z.string(),
    description: z.string(),
    source: z.string().optional()
  })).default([]),
  constituentQuestions: z.number().default(0),
  candidateResponses: z.number().default(0),
  status: z.enum(['upcoming', 'active', 'completed']).default('upcoming'),
  importance: z.enum(['low', 'medium', 'high']).default('medium')
})

export type ElectoralRace = z.infer<typeof ElectoralRaceSchema>

// ============================================================================
// GOOGLE CIVIC API SCHEMAS
// ============================================================================

export const GoogleCivicRepresentativeSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  party: z.string().optional(),
  office: z.string(),
  district: z.string().optional(),
  contact: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    website: z.string().url().optional(),
    address: z.string().optional()
  }).optional(),
  socialMedia: z.object({
    twitter: z.string().optional(),
    facebook: z.string().optional()
  }).optional(),
  photoUrl: z.string().url().optional(),
  urls: z.array(z.string()).optional(),
  channels: z.array(z.object({
    type: z.string(),
    id: z.string()
  })).optional()
})

export const GoogleCivicResponseSchema = z.object({
  kind: z.string().optional(),
  normalizedInput: z.object({
    line1: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional()
  }).optional(),
  divisions: z.record(z.string(), z.object({
    name: z.string(),
    officeIndices: z.array(z.number()).optional()
  })).optional(),
  offices: z.array(z.object({
    name: z.string(),
    divisionId: z.string().optional(),
    levels: z.array(z.string()).optional(),
    roles: z.array(z.string()).optional(),
    officialIndices: z.array(z.number()).optional()
  })).optional(),
  officials: z.array(GoogleCivicRepresentativeSchema).optional()
})

export type GoogleCivicResponse = z.infer<typeof GoogleCivicResponseSchema>

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Safe parse with detailed error logging
 */
export function safeParseWithLog<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)

  if (!result.success) {
    const errorMessage = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')

    logger.error(`[${context}] Validation failed:`, errorMessage)

    return {
      success: false,
      error: errorMessage
    }
  }

  return {
    success: true,
    data: result.data
  }
}

/**
 * Parse or return default
 */
export function parseOrDefault<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  defaultValue: T,
  context: string
): T {
  const result = safeParseWithLog(schema, data, context)

  if (!result.success) {
    return defaultValue
  }

  return result.data
}

/**
 * Parse array with filtering of invalid items
 */
export function parseArrayFiltered<T>(
  itemSchema: z.ZodSchema<T>,
  data: unknown[],
  context: string
): T[] {
  return data
    .map((item, index) => {
      const result = itemSchema.safeParse(item)
      if (!result.success) {
        logger.warn(`[${context}] Invalid item at index ${index}:`, result.error.issues)
        return null
      }
      return result.data
    })
    .filter((item): item is T => item !== null)
}

// ============================================================================
// PARTIAL SCHEMAS (for updates)
// ============================================================================

export const PartialRepresentativeSchema = RepresentativeSchema.partial()
export const PartialCandidateSchema = CandidateSchema.partial()
export const PartialElectoralRaceSchema = ElectoralRaceSchema.partial()

