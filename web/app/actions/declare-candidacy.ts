'use server'

import { z } from 'zod'

import { 
  createSecureServerAction,
  getAuthenticatedUser,
  sanitizeInput,
  logSecurityEvent,
  type ServerActionContext
} from '@/lib/core/auth/server-actions'
import { sendCandidateJourneyEmail } from '@/lib/services/email/candidate-journey-emails'
import { stripUndefinedDeep } from '@/lib/util/clean'
import logger from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

/**
 * @fileoverview Candidate Declaration Server Action
 * 
 * Secure candidacy declaration action with comprehensive validation and security.
 * Enables users to declare candidacy for office and build their platform.
 * 
 * @author Choices Platform Team
 * @created 2025-01-30
 * @version 1.0.0
 */

// Platform position schema
const PlatformPositionSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100),
  position: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  category: z.string().max(50),
  priority: z.enum(['high', 'medium', 'low'])
})

// Validation schema for candidacy declaration
const DeclareCandidacySchema = z.object({
  office: z.string().min(1, 'Office is required').max(200),
  level: z.enum(['federal', 'state', 'local']),
  state: z.string().length(2, 'State must be 2 characters'),
  district: z.string().optional(),
  jurisdiction: z.string().min(1).max(200),
  candidateName: z.string().min(1, 'Candidate name is required').max(100),
  party: z.string().max(100).optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
  experience: z.string().max(2000).optional(),
  platformPositions: z.array(PlatformPositionSchema).default([]),
  endorsements: z.array(z.string()).default([]),
  campaignWebsite: z.string().url().optional().or(z.literal('')),
  campaignEmail: z.string().email().optional().or(z.literal('')),
  campaignPhone: z.string().max(20).optional(),
  visibility: z.enum(['high', 'medium', 'low']).default('medium'),
  // Official filing fields (optional)
  officialFilingId: z.string().max(200).optional(),
  officialFilingDate: z.string().optional(),
  filingJurisdiction: z.string().max(200).optional(),
  filingDocumentUrl: z.string().url().optional().or(z.literal('')),
  electionDate: z.string().optional(),
  filingDeadline: z.string().optional()
})

// Enhanced candidacy declaration action with security features
export const declareCandidacy = createSecureServerAction(
  async (formData: FormData, context: ServerActionContext) => {
    const supabase = await getSupabaseServerClient();
    
    // Get authenticated user
    const user = await getAuthenticatedUser(context)
    
    // Extract form data
    const data: Record<string, unknown> = {
      office: formData.get('office'),
      level: formData.get('level'),
      state: formData.get('state'),
      district: formData.get('district') ?? undefined,
      jurisdiction: formData.get('jurisdiction'),
      candidateName: formData.get('candidateName'),
      party: formData.get('party') ?? undefined,
      photoUrl: formData.get('photoUrl') ?? undefined,
      experience: formData.get('experience') ?? undefined,
      campaignWebsite: formData.get('campaignWebsite') ?? undefined,
      campaignEmail: formData.get('campaignEmail') ?? undefined,
      campaignPhone: formData.get('campaignPhone') ?? undefined,
      visibility: formData.get('visibility') ?? 'medium'
    }

    // Parse platform positions from JSON string
    const platformPositionsJson = formData.get('platformPositions')
    if (platformPositionsJson && typeof platformPositionsJson === 'string') {
      try {
        data.platformPositions = JSON.parse(platformPositionsJson)
      } catch {
        data.platformPositions = []
      }
    } else {
      data.platformPositions = []
    }

    // Parse endorsements from JSON string
    const endorsementsJson = formData.get('endorsements')
    if (endorsementsJson && typeof endorsementsJson === 'string') {
      try {
        data.endorsements = JSON.parse(endorsementsJson)
      } catch {
        data.endorsements = []
      }
    } else {
      data.endorsements = []
    }

    // Handle filing document upload (if provided)
    const filingDocument = formData.get('filingDocument') as File | null
    let filingDocumentUrl: string | null = null
    
    if (filingDocument && filingDocument.size > 0) {
      try {
        // Upload filing document directly to Supabase Storage
        const fileExt = filingDocument.name.split('.').pop()
        const fileName = `filing-${user.userId}-${Date.now()}.${fileExt}`
        const filePath = `candidate-filings/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('candidate-filings')
          .upload(filePath, filingDocument, {
            cacheControl: '3600',
            upsert: false
          })

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('candidate-filings')
            .getPublicUrl(filePath)
          filingDocumentUrl = urlData.publicUrl
        } else {
          logger.error('Failed to upload filing document:', uploadError)
          // Continue without document - it can be added later
        }
      } catch (error) {
        logger.error('Failed to upload filing document:', error)
        // Continue without document - it can be added later
      }
    }

    // Add official filing fields
    const officialFilingId = formData.get('officialFilingId')
    const officialFilingDate = formData.get('officialFilingDate')
    const filingJurisdiction = formData.get('filingJurisdiction')
    const electionDate = formData.get('electionDate')
    const filingDeadline = formData.get('filingDeadline')

    if (officialFilingId) data.officialFilingId = officialFilingId
    if (officialFilingDate) data.officialFilingDate = officialFilingDate
    if (filingJurisdiction) data.filingJurisdiction = filingJurisdiction
    if (filingDocumentUrl) data.filingDocumentUrl = filingDocumentUrl
    if (electionDate) data.electionDate = electionDate
    if (filingDeadline) data.filingDeadline = filingDeadline

    // Validate form data
    const validatedData = DeclareCandidacySchema.parse(data)

    if (!supabase) {
      throw new Error('Supabase client not available')
    }

    // Check if user already declared candidacy for this office
    const { data: existingPlatform } = await supabase
      .from('candidate_platforms')
      .select('id')
      .eq('user_id', user.userId)
      .eq('office', validatedData.office)
      .eq('district', validatedData.district ?? '')
      .single()

    if (existingPlatform) {
      throw new Error('You have already declared candidacy for this office')
    }

    // Sanitize inputs
    const sanitizedCandidateName = sanitizeInput(validatedData.candidateName)
    const sanitizedExperience = validatedData.experience ? sanitizeInput(validatedData.experience) : null
    const sanitizedPlatformPositions = validatedData.platformPositions.map(pos => {
      const base = {
        ...pos,
        title: sanitizeInput(pos.title),
        position: sanitizeInput(pos.position)
      }
      // Only include description if it exists
      if (pos.description) {
        return { ...base, description: sanitizeInput(pos.description) }
      }
      return base
    })

    // Determine filing status
    let filingStatus: 'not_filed' | 'filed' | 'pending_verification' = 'not_filed'
    if (validatedData.officialFilingId || filingDocumentUrl) {
      filingStatus = 'pending_verification' // Needs admin verification
    }

    // Create candidate platform
    // Use stripUndefinedDeep to handle exactOptionalPropertyTypes
    const platformInsert = stripUndefinedDeep({
      user_id: user.userId,
      office: validatedData.office,
      level: validatedData.level,
      state: validatedData.state,
      district: validatedData.district ?? null,
      jurisdiction: validatedData.jurisdiction,
      candidate_name: sanitizedCandidateName,
      party: validatedData.party ?? null,
      photo_url: validatedData.photoUrl ?? null,
      experience: sanitizedExperience,
      platform_positions: sanitizedPlatformPositions,
      endorsements: validatedData.endorsements,
      campaign_website: validatedData.campaignWebsite ?? null,
      campaign_email: validatedData.campaignEmail ?? null,
      campaign_phone: validatedData.campaignPhone ?? null,
      visibility: validatedData.visibility,
      status: 'draft',  // Starts as draft until verified
      verified: false,
      campaign_funding: { total: 0, sources: ['Self-funded'] },
      // Official filing fields
      official_filing_id: validatedData.officialFilingId ?? null,
      official_filing_date: validatedData.officialFilingDate ?? null,
      filing_jurisdiction: validatedData.filingJurisdiction ?? null,
      filing_document_url: filingDocumentUrl ?? null,
      filing_status: filingStatus,
      election_date: validatedData.electionDate ?? null,
      filing_deadline: validatedData.filingDeadline ?? null,
      ballot_access_confirmed: false
    })
    
    const { data: platformData, error: platformError } = await supabase
      .from('candidate_platforms')
      .insert(platformInsert as any) // Type assertion needed for complex Json fields
      .select()
      .single()

    if (platformError) {
      throw new Error(`Failed to declare candidacy: ${platformError.message}`)
    }

    // Log candidacy declaration
    logSecurityEvent('CANDIDACY_DECLARED', {
      platformId: platformData.id,
      office: validatedData.office,
      level: validatedData.level,
      state: validatedData.state
    }, context)

    // Trigger post-declaration flow (non-blocking)
    // This sends welcome email immediately and sets up journey tracking
    // Fire-and-forget pattern: don't await to avoid blocking the response
    // If this fails, cron job will send welcome email within 24h
    const sendWelcomeEmail = async () => {
      try {
        // Get user email from platform data
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('email')
          .eq('user_id', user.userId)
          .single()

        if (userProfile?.email) {
          const emailData: {
            to: string
            platformId: string
            candidateName: string
            office: string
            level: 'federal' | 'state' | 'local'
            state: string
            filingDeadline?: Date
            dashboardUrl: string
          } = {
            to: userProfile.email,
            platformId: platformData.id,
            candidateName: sanitizedCandidateName,
            office: validatedData.office,
            level: validatedData.level,
            state: validatedData.state,
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/candidate/dashboard`
          }
          // Only include filingDeadline if it exists
          if (validatedData.filingDeadline) {
            emailData.filingDeadline = new Date(validatedData.filingDeadline)
          }
          await sendCandidateJourneyEmail('welcome', emailData)
        }
      } catch (error) {
        // Non-blocking - cron job will handle it if this fails
        logger.error('Welcome email trigger failed (will retry via cron):', error)
      }
    }
    
    // Fire-and-forget: don't await
    sendWelcomeEmail().catch(() => {
      // Silently fail - cron job is fallback
    })

    return { platformId: platformData.id, success: true }
  }
)

