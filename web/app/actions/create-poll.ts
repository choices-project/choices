'use server'

import { v4 as uuidv4 } from 'uuid'
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
    const sanitizedOptions = validatedData.options.map(option => sanitizeInput(option))

    // Create poll
    const pollId = uuidv4()
    const { error: pollError } = await supabase
      .from('polls')
      .insert({
        id: pollId,
        owner_id: user.userId,
        title: sanitizedTitle,
        description: sanitizedDescription,
        type: validatedData.type,
        visibility: validatedData.visibility,
        end_date: validatedData.endDate,
        allow_multiple_votes: validatedData.allowMultipleVotes || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (pollError) {
      throw new Error('Failed to create poll')
    }

    // Create poll options
    const optionsData = sanitizedOptions.map((option, index) => ({
      id: uuidv4(),
      poll_id: pollId,
      label: option,
      weight: 1,
      order: index + 1,
      created_at: new Date().toISOString()
    }))

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsData)

    if (optionsError) {
      // Clean up poll if options creation fails
      await supabase.from('polls').delete().eq('id', pollId)
      throw new Error('Failed to create poll options')
    }

    // Log poll creation
    logSecurityEvent('POLL_CREATED', {
      pollId,
      title: sanitizedTitle,
      type: validatedData.type,
      visibility: validatedData.visibility,
      optionsCount: sanitizedOptions.length
    }, context)

    return { pollId, success: true }
  },
  {
    requireAuth: true,
    validation: CreatePollSchema,
    rateLimit: { endpoint: '/create-poll', maxRequests: 20 }
  }
)
