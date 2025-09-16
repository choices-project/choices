'use server'

import { getSupabaseServerClient } from '@/utils/supabase/server'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { 
  createSecureServerAction,
  getAuthenticatedUser,
  logSecurityEvent,
  validateFormData,
  type ServerActionContext
} from '@/lib/core/auth/server-actions'



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
    const supabase = getSupabaseServerClient();
    
    // Get authenticated user
    const user = await getAuthenticatedUser(context)
    
    // Validate form data
    const validatedData = validateFormData(formData, VoteSchema)

    // Get Supabase client
    const supabaseClient = await supabase

    if (!supabaseClient) {
      throw new Error('Supabase client not available')
    }

    // Check if poll exists and is active
    const { data: poll, error: pollError } = await supabaseClient
      .from('polls')
      .select('id, owner_id, type, visibility, end_date, allow_multiple_votes')
      .eq('id', validatedData.pollId)
      .single()

    if (pollError || !poll) {
      throw new Error('Poll not found')
    }

    // Check if poll has ended
    if (poll.end_date && new Date(poll.end_date) < new Date()) {
      throw new Error('Poll has ended')
    }

    // Check if user has already voted (unless multiple votes are allowed)
    if (!poll.allow_multiple_votes) {
      const { data: existingVote } = await supabaseClient
        .from('votes')
        .select('id')
        .eq('poll_id', validatedData.pollId)
        .eq('voter_id', user.userId)
        .single()

      if (existingVote) {
        throw new Error('You have already voted on this poll')
      }
    }

    // Validate that all option IDs belong to this poll
    const { data: pollOptions, error: optionsError } = await supabaseClient
      .from('poll_options')
      .select('id')
      .eq('poll_id', validatedData.pollId)
      .in('id', validatedData.optionIds)

    if (optionsError || pollOptions.length !== validatedData.optionIds.length) {
      throw new Error('Invalid option selection')
    }

    // Create vote records
    const voteData = validatedData.optionIds.map(optionId => ({
      id: uuidv4(),
      poll_id: validatedData.pollId,
      voter_id: validatedData.anonymous ? null : user.userId,
      voter_hash: validatedData.anonymous ? `anon_${user.userId}_${Date.now()}` : null,
      option_id: optionId,
      payload: {
        timestamp: new Date().toISOString(),
        anonymous: validatedData.anonymous || false
      },
      created_at: new Date().toISOString()
    }))

    const { error: voteError } = await supabaseClient
      .from('votes')
      .insert(voteData)

    if (voteError) {
      throw new Error('Failed to record vote')
    }

    // Log voting event
    logSecurityEvent('VOTE_CAST', {
      pollId: validatedData.pollId,
      optionIds: validatedData.optionIds,
      anonymous: validatedData.anonymous || false,
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
