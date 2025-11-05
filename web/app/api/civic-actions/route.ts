/**
 * @fileoverview Civic Actions API
 * 
 * Civic actions API providing civic engagement management,
 * representative integration, and community impact tracking.
 * 
 * @author Choices Platform Team
 * @created 2025-10-24
 * @version 2.0.0
 * @since 1.0.0
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { logger } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'



export const dynamic = 'force-dynamic';

/**
 * Validation schema for civic actions
 * 
 * @const {z.ZodObject} CivicActionSchema
 */
const CivicActionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  action_type: z.enum(['petition', 'campaign', 'survey', 'event']),
  target_representatives: z.array(z.number()).optional(),
  category: z.string().optional(),
  urgency_level: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  end_date: z.string().datetime().optional(),
  is_public: z.boolean().optional()
});

/**
 * Get civic actions
 * 
 * @param {NextRequest} request - Request object
 * @param {string} [request.searchParams.limit] - Number of actions to return (default: 20)
 * @param {string} [request.searchParams.category] - Category filter (default: 'all')
 * @param {string} [request.searchParams.type] - Action type filter (default: 'all')
 * @param {string} [request.searchParams.urgency] - Urgency level filter (default: 'all')
 * @returns {Promise<NextResponse>} Civic actions data
 * 
 * @example
 * GET /api/civic-actions?category=environment&type=petition&urgency=high
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const category = searchParams.get('category') ?? 'all';
    const actionType = searchParams.get('type') ?? 'all';
    const urgency = searchParams.get('urgency') ?? 'all';

    logger.info('Fetching civic actions', { limit, category, actionType, urgency });

    let query = supabase
      .from('civic_actions')
      .select(`
        id,
        title,
        description,
        action_type,
        category,
        urgency_level,
        target_representatives,
        signature_count,
        target_signatures,
        status,
        is_public,
        created_by,
        created_at,
        updated_at,
        end_date,
        representatives_core(id, name, title, party, state, district)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (category !== 'all') {
      query = query.eq('category', category);
    }
    if (actionType !== 'all') {
      query = query.eq('action_type', actionType);
    }
    if (urgency !== 'all') {
      query = query.eq('urgency_level', urgency);
    }

    const { data: actions, error } = await query;

    if (error) {
      logger.error('Error fetching civic actions:', error);
      return NextResponse.json({ error: 'Failed to fetch civic actions' }, { status: 500 });
    }

    return NextResponse.json({
      actions: actions ?? [],
      total: actions?.length ?? 0,
      filters: { category, actionType, urgency }
    });

  } catch (error) {
    logger.error('Civic actions GET error:', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Create civic action
 * 
 * @param {NextRequest} request - Request object
 * @param {string} request.body.title - Action title
 * @param {string} request.body.description - Action description
 * @param {string} request.body.action_type - Type of civic action
 * @param {number[]} [request.body.target_representatives] - Array of target representative IDs
 * @param {string} [request.body.category] - Action category
 * @param {string} [request.body.urgency_level] - Urgency level
 * @param {string} [request.body.end_date] - Optional end date for the action
 * @param {boolean} [request.body.is_public] - Whether the action is publicly visible
 * @returns {Promise<NextResponse>} Created civic action data
 * 
 * @example
 * POST /api/civic-actions
 * {
 *   "title": "Climate Action Petition",
 *   "description": "Urgent petition for climate action",
 *   "action_type": "petition",
 *   "category": "environment"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const body = await request.json();
    
    // Validate input
    const validatedData = CivicActionSchema.parse(body);
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create civic action (using actual schema fields)
    const { data: action, error: createError } = await supabase
      .from('civic_actions')
      .insert({
        id: crypto.randomUUID(),
        title: validatedData.title,
        description: validatedData.description,
        action_type: validatedData.action_type,
        category: validatedData.category ?? 'general',
        target_representative_id: validatedData.target_representatives?.[0] ?? null,
        target_state: (validatedData as any).target_state ?? null,
        target_district: (validatedData as any).target_district ?? null,
        target_office: (validatedData as any).target_office ?? null,
        current_signatures: 0,
        required_signatures: 100, // Default target
        status: 'active',
        created_by: user.id,
        end_date: validatedData.end_date ?? undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      logger.error('Error creating civic action:', createError);
      return NextResponse.json({ error: 'Failed to create civic action' }, { status: 500 });
    }

    // Track civic action creation analytics
    const sessionId = crypto.randomUUID();
    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'civic_action_created',
        user_id: user.id,
        session_id: sessionId,
        event_data: {
          action_id: (action as any).id,
          action_type: (action as any).action_type,
          category: (action as any).category
        },
        ip_address: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
        user_agent: request.headers.get('user-agent') ?? undefined,
        created_at: new Date().toISOString()
      });

    logger.info('Civic action created successfully', { 
      actionId: (action as any).id, 
      title: (action as any).title,
      userId: user.id 
    });

    return NextResponse.json({
      action: {
        id: (action as any).id,
        title: (action as any).title,
        description: (action as any).description,
        actionType: (action as any).action_type,
        category: (action as any).category,
        currentSignatures: (action as any).current_signatures,
        requiredSignatures: (action as any).required_signatures,
        status: (action as any).status,
        createdAt: (action as any).created_at,
        endDate: action.end_date
      }
    }, { status: 201 });

  } catch (error) {
    logger.error('Civic actions POST error:', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
