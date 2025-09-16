import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { requireAdminOr401 } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  // Single admin gate - returns 401 if not admin
  const authGate = await requireAdminOr401()
  if (authGate) return authGate
  
  try {
    logger.info('Admin site messages GET request', { 
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const messages = await getSiteMessages(includeInactive)
    return NextResponse.json(messages)
  } catch (error) {
    logger.error('Error fetching site messages', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Failed to fetch site messages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Single admin gate - returns 401 if not admin
  const authGate = await requireAdminOr401()
  if (authGate) return authGate
  
  try {
    logger.info('Admin site messages POST request', { 
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    const body = await request.json()
    const { title, message, type, priority, isActive, expiresAt } = body

    // Validate required fields
    if (!title || !message || !type) {
      return NextResponse.json(
        { error: 'Title, message, and type are required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()
    const newMessage = await createSiteMessage(supabase, {
      title,
      message,
      type,
      priority: priority || 'medium',
      isActive: isActive !== undefined ? isActive : true,
      expiresAt
    })

    return NextResponse.json(newMessage)
  } catch (error) {
    logger.error('Error creating site message', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Failed to create site message' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  // Single admin gate - returns 401 if not admin
  const authGate = await requireAdminOr401()
  if (authGate) return authGate
  
  try {
    logger.info('Admin site messages PUT request', { 
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    const body = await request.json()
    const { id, title, message, type, priority, isActive, expiresAt } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()
    const updatedMessage = await updateSiteMessage(supabase, id, {
      title,
      message,
      type,
      priority,
      isActive,
      expiresAt
    })

    return NextResponse.json(updatedMessage)
  } catch (error) {
    logger.error('Error updating site message', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Failed to update site message' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  // Single admin gate - returns 401 if not admin
  const authGate = await requireAdminOr401()
  if (authGate) return authGate
  
  try {
    logger.info('Admin site messages DELETE request', { 
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()
    await deleteSiteMessage(supabase, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error deleting site message', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Failed to delete site message' },
      { status: 500 }
    )
  }
}

async function getSiteMessages(includeInactive: boolean = false) {
  try {
    // Use REST API directly to bypass PostgREST cache issues
    let url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/site_messages?select=*&order=created_at.desc`
    
    if (!includeInactive) {
      url += `&is_active=eq.true`
    }

    const response = await fetch(url, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const messages = await response.json();

    return {
      messages: messages || [],
      count: messages?.length || 0,
      activeCount: messages?.filter((m: any) => m.is_active).length || 0
    }
  } catch (error) {
    logger.error('Error in getSiteMessages', error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

async function createSiteMessage(supabase: any, messageData: {
  title: string
  message: string
  type: string
  priority?: string
  isActive?: boolean
  expiresAt?: string
}) {
  try {
    const { data, error } = await supabase
      .from('site_messages')
      .insert({
        title: messageData.title,
        message: messageData.message,
        type: messageData.type,
        priority: messageData.priority || 'medium',
        is_active: messageData.isActive !== undefined ? messageData.isActive : true,
        expires_at: messageData.expiresAt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating site message in database', new Error(error.message))
      throw error
    }

    logger.info('Site message created successfully', { 
      id: data.id, 
      title: data.title,
      type: data.type 
    })

    return data
  } catch (error) {
    logger.error('Error in createSiteMessage', error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

async function updateSiteMessage(supabase: any, id: string, updateData: {
  title?: string
  message?: string
  type?: string
  priority?: string
  isActive?: boolean
  expiresAt?: string
}) {
  try {
    const updatePayload: any = {
      updated_at: new Date().toISOString()
    }

    if (updateData.title !== undefined) updatePayload.title = updateData.title
    if (updateData.message !== undefined) updatePayload.message = updateData.message
    if (updateData.type !== undefined) updatePayload.type = updateData.type
    if (updateData.priority !== undefined) updatePayload.priority = updateData.priority
    if (updateData.isActive !== undefined) updatePayload.is_active = updateData.isActive
    if (updateData.expiresAt !== undefined) updatePayload.expires_at = updateData.expiresAt

    const { data, error } = await supabase
      .from('site_messages')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Error updating site message in database', new Error(error.message))
      throw error
    }

    logger.info('Site message updated successfully', { 
      id: data.id, 
      title: data.title,
      type: data.type 
    })

    return data
  } catch (error) {
    logger.error('Error in updateSiteMessage', error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

async function deleteSiteMessage(supabase: any, id: string) {
  try {
    const { error } = await supabase
      .from('site_messages')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Error deleting site message from database', new Error(error.message))
      throw error
    }

    logger.info('Site message deleted successfully', { id })
  } catch (error) {
    logger.error('Error in deleteSiteMessage', error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}
