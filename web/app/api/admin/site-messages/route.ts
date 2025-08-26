import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    logger.info('Admin site messages GET request', { 
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    // Check if user is authenticated and has admin access
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
  try {
    logger.info('Admin site messages POST request', { 
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    // Check if user is authenticated and has admin access
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, message, type, priority, isActive, expiresAt } = body

    // Validate required fields
    if (!title || !message || !type) {
      return NextResponse.json(
        { error: 'Title, message, and type are required' },
        { status: 400 }
      )
    }

    const newMessage = await createSiteMessage({
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
  try {
    logger.info('Admin site messages PUT request', { 
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    // Check if user is authenticated and has admin access
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, message, type, priority, isActive, expiresAt } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      )
    }

    const updatedMessage = await updateSiteMessage(id, {
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
  try {
    logger.info('Admin site messages DELETE request', { 
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    // Check if user is authenticated and has admin access
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      )
    }

    await deleteSiteMessage(id)
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
    let query = supabase
      .from('site_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching site messages from database', new Error(error.message))
      throw error
    }

    return {
      messages: data || [],
      count: data?.length || 0,
      activeCount: data?.filter(m => m.is_active).length || 0
    }
  } catch (error) {
    logger.error('Error in getSiteMessages', error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

async function createSiteMessage(messageData: {
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
    logger.error('Error in createSiteMessage', { error: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

async function updateSiteMessage(id: string, updateData: {
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
      logger.error('Error updating site message in database', { error: error.message })
      throw error
    }

    logger.info('Site message updated successfully', { 
      id: data.id, 
      title: data.title,
      type: data.type 
    })

    return data
  } catch (error) {
    logger.error('Error in updateSiteMessage', { error: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

async function deleteSiteMessage(id: string) {
  try {
    const { error } = await supabase
      .from('site_messages')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Error deleting site message from database', { error: error.message })
      throw error
    }

    logger.info('Site message deleted successfully', { id })
  } catch (error) {
    logger.error('Error in deleteSiteMessage', { error: error instanceof Error ? error.message : String(error) })
    throw error
  }
}
