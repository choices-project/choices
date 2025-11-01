'use server'

import { z } from 'zod'

import { 
  createSecureServerAction,
  getAuthenticatedUser,
  sanitizeInput,
  logSecurityEvent,
  validateFormData,
  type ServerActionContext
} from '@/lib/core/auth/server-actions'
import { getSupabaseServerClient } from '@/utils/supabase/server'

/**
 * @fileoverview Poll Creation Server Action
 * 
 * Secure poll creation action with comprehensive validation, security features,
 * and moderation capabilities. Handles poll creation with validation,
 * spam prevention, and content moderation.
 * 
 * @author Choices Platform Team
 * @created 2025-10-24
 * @version 2.0.0
 * @since 1.0.0
 */

// Validation schema for poll creation
const CreatePollSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  description: z.string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),
  type: z.enum(['single', 'approval', 'ranked', 'quadratic']),
  visibility: z.enum(['public', 'unlisted', 'private']),
  options: z.array(z.string())
    .min(2, 'At least 2 options are required')
    .max(10, 'Maximum 10 options allowed')
    .refine(options => options.every(option => option.trim().length > 0), {
      message: 'All options must have content'
    }),
  endDate: z.string().datetime().optional(),
  allowMultipleVotes: z.string().transform(val => val === 'true').optional()
})

// Enhanced poll creation action with security features
export const createPoll = createSecureServerAction(
  async (formData: FormData, context: ServerActionContext) => {
    const supabase = await getSupabaseServerClient();
    
    // Get authenticated user
    const user = await getAuthenticatedUser(context)
    
    // Validate form data
    const validatedData = validateFormData(formData, CreatePollSchema)

    if (!supabase) {
      throw new Error('Supabase client not available')
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(validatedData.title)
    const sanitizedDescription = validatedData.description ? sanitizeInput(validatedData.description) : null
    const sanitizedOptions = validatedData.options.map((option: string) => sanitizeInput(option))

    // Create poll
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: sanitizedTitle,
        description: sanitizedDescription,
        options: sanitizedOptions,
        voting_method: validatedData.type,
        created_by: user.userId,
        end_time: validatedData.endDate ?? null,
        status: 'active',
        privacy_level: validatedData.visibility,
        total_votes: 0,
        participation: 0,
        category: '',
        tags: [],
        sponsors: [],
        is_mock: false,
        settings: {},
        hashtags: [],
        primary_hashtag: null,
        poll_settings: {},
        total_views: 0,
        engagement_score: 0,
        trending_score: 0,
        is_trending: false,
        is_featured: false,
        is_verified: false,
        last_modified_by: null,
        modification_reason: null
      } as any)

    if (pollError) {
      throw new Error('Failed to create poll')
    }

    const pollId = (pollData as any)?.[0]?.id
    if (!pollId) {
      throw new Error('Failed to get poll ID')
    }

    // Poll options are stored as JSON in the polls.options field
    // No separate poll_options table needed

    // Log poll creation
    logSecurityEvent('POLL_CREATED', {
      pollId,
      title: sanitizedTitle,
      type: validatedData.type,
      visibility: validatedData.visibility,
      optionsCount: sanitizedOptions.length
    }, context)

    return { pollId, success: true }
  }
)
