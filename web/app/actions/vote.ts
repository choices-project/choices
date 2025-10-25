'use server'

import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

import { 
  createSecureServerAction,
  getAuthenticatedUser,
  logSecurityEvent,
  validateFormData,
  type ServerActionContext
} from '@/lib/core/auth/server-actions'
import { getSupabaseServerClient } from '@/utils/supabase/server'



// Validation schema for voting
const VoteSchema = z.object({
  pollId: z.string().uuid('Invalid poll ID'),
  optionIds: z.array(z.string().uuid('Invalid option ID'))
    .min(1, 'At least one option must be selected')
    .max(10, 'Maximum 10 options can be selected'),
  anonymous: z.string().transform(val => val === 'true').optional()
})

// Enhanced voting action with security features
export const vote = createSecureServerAction(
  async (formData: FormData, context: ServerActionContext) => {
    const supabase = await getSupabaseServerClient();
    
    // Get authenticated user
    const user = await getAuthenticatedUser(context)
    
    // Validate form data
    const validatedData = validateFormData(formData, VoteSchema)

    if (!supabase) {
      throw new Error('Supabase client not available')
    }

    // Check if poll exists and is active
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, created_by, voting_method, privacy_level, end_time, options')
      .eq('id', validatedData.pollId as any)
      .single()

    if (pollError || !poll) {
      throw new Error('Poll not found')
    }

    // Check if poll has ended
    if ((poll as any).end_time && new Date((poll as any).end_time as string) < new Date()) {
      throw new Error('Poll has ended')
    }

    // Check if user has already voted (multiple votes not supported in current schema)
    // Note: allow_multiple_votes field doesn't exist in current schema
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', validatedData.pollId as any)
      .eq('user_id', user.userId as any)
      .single()

    if (existingVote) {
      throw new Error('You have already voted on this poll')
    }

    // Validate that the selected options exist in the poll's options
    // Note: Options are stored as JSON array in polls.options field
    if (!(poll as any).options || !Array.isArray((poll as any).options)) {
      throw new Error('Invalid poll options')
    }
    
    // For now, we'll validate that the option IDs are valid
    // This assumes optionIds are the actual option values from the array
    const validOptions = validatedData.optionIds.every(optionId => 
      ((poll as any).options as string[]).includes(optionId)
    )
    
    if (!validOptions) {
      throw new Error('Invalid option selection')
    }

    // Create vote records using the actual database schema
    const voteData = validatedData.optionIds.map(optionId => ({
      id: uuidv4(),
      poll_id: validatedData.pollId,
      user_id: validatedData.anonymous ? 'anonymous' : user.userId as any,
      option_id: optionId,
      vote_weight: 1
    }))

    const { error: voteError } = await supabase
      .from('votes')
      .insert(voteData)

    if (voteError) {
      throw new Error('Failed to record vote')
    }

    // Log voting event
    logSecurityEvent('VOTE_CAST', {
      pollId: validatedData.pollId,
      optionIds: validatedData.optionIds,
      anonymous: validatedData.anonymous ?? false,
      voteCount: voteData.length
    }, context)

    return { success: true, voteCount: voteData.length }
  },
  {
    requireAuth: true,
    validation: VoteSchema,
    rateLimit: { endpoint: '/vote', maxRequests: 50 }
  }
)
