import { type NextRequest, NextResponse } from 'next/server';

import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { sanitizeText, validateRepresentativeId } from '@/lib/security/input-sanitization';
import { createApiLogger } from '@/lib/utils/api-logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const logger = createApiLogger('/api/civics/contact/[id]', 'GET/POST');

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const representativeId = params.id;
    
    // Validate representative ID
    const repIdValidation = validateRepresentativeId(representativeId);
    if (!repIdValidation.isValid) {
      return NextResponse.json(
        { ok: false, error: repIdValidation.error ?? 'Invalid representative ID' },
        { status: 400 }
      );
    }
    
    const validatedRepId = repIdValidation.parsedId!;

    // Rate limiting - 50 requests per 15 minutes
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1';
    const userAgent = request.headers.get('user-agent') ?? undefined;
    
    const rateLimitResult = await apiRateLimiter.checkLimit(ip, '/api/civics/contact/[id]', {
      maxRequests: 50,
      windowMs: 15 * 60 * 1000, // 15 minutes
      userAgent
    });

    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for contact info lookup', { ip, representativeId });
      return NextResponse.json(
        {
          ok: false,
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() ?? '900',
            'X-RateLimit-Limit': '50',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
          }
        }
      );
    }

    logger.info('Fetching contact information', { representativeId });

    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Get representative basic information from representatives_core
    const { data: representative, error: repError } = await supabase
      .from('representatives_core')
      .select('id, name, office, level, state, district, party, primary_email, primary_phone, primary_website, data_quality_score, last_verified')
      .eq('id', validatedRepId)
      .single();

    if (repError || !representative) {
      return NextResponse.json(
        { ok: false, error: 'Representative not found' },
        { status: 404 }
      );
    }

    // Get contact information from normalized table
    const { data: contacts } = await supabase
      .from('representative_contacts')
      .select('contact_type, value, is_verified, source')
      .eq('representative_id', validatedRepId);

    // Get social media from normalized table
    const { data: socialMedia } = await supabase
      .from('representative_social_media')
      .select('platform, handle, url, is_verified, is_primary')
      .eq('representative_id', validatedRepId);

    // Transform contact data for easy access
    const contactData = {
      representative: {
        id: representative.id,
        name: representative.name,
        office: representative.office,
        level: representative.level,
        state: representative.state,
        district: representative.district,
        party: representative.party
      },
      
      contact_methods: {
        email: representative.primary_email ? {
          value: representative.primary_email,
          verified: (representative.data_quality_score ?? 0) >= 90,
          quality_score: representative.data_quality_score ?? 0
        } : (contacts?.find(c => c.contact_type === 'email') ? {
          value: contacts.find(c => c.contact_type === 'email')!.value,
          verified: contacts.find(c => c.contact_type === 'email')!.is_verified ?? false,
          quality_score: representative.data_quality_score ?? 0
        } : null),
        
        phone: representative.primary_phone ? {
          value: representative.primary_phone,
          verified: (representative.data_quality_score ?? 0) >= 90,
          quality_score: representative.data_quality_score ?? 0
        } : (contacts?.find(c => c.contact_type === 'phone') ? {
          value: contacts.find(c => c.contact_type === 'phone')!.value,
          verified: contacts.find(c => c.contact_type === 'phone')!.is_verified ?? false,
          quality_score: representative.data_quality_score ?? 0
        } : null),
        
        website: representative.primary_website ? {
          value: representative.primary_website,
          verified: (representative.data_quality_score ?? 0) >= 90,
          quality_score: representative.data_quality_score ?? 0
        } : (contacts?.find(c => c.contact_type === 'website') ? {
          value: contacts.find(c => c.contact_type === 'website')!.value,
          verified: contacts.find(c => c.contact_type === 'website')!.is_verified ?? false,
          quality_score: representative.data_quality_score ?? 0
        } : null)
      },
      
      office_addresses: contacts?.filter(c => c.contact_type === 'office_address').map(c => ({
        type: c.contact_type,
        value: c.value,
        is_verified: c.is_verified,
        source: c.source
      })) ?? [],
      
      social_media: socialMedia?.map(sm => ({
        platform: sm.platform,
        handle: sm.handle,
        url: sm.url,
        followers_count: 0, // Not available in current schema
        engagement_rate: 0, // Not available in current schema
        verified: sm.is_verified,
        official_account: true,
        is_primary: sm.is_primary
      })) ?? [],
      
      communication_preferences: {
        preferred_method: 'email',
        response_time_expectation: 'within_week'
      },
      
      data_quality: {
        overall_score: representative.data_quality_score ?? 0,
        last_verified: representative.last_verified ?? null,
        data_source: 'openstates',
        verification_notes: null
      }
    };

    // Generate quick contact actions
    const quick_actions = [];
    
    if (contactData.contact_methods.email) {
      quick_actions.push({
        type: 'email',
        label: 'Send Email',
        action: `mailto:${contactData.contact_methods.email.value}`,
        icon: '📧'
      });
    }
    
    if (contactData.contact_methods.phone) {
      quick_actions.push({
        type: 'phone',
        label: 'Call Office',
        action: `tel:${contactData.contact_methods.phone.value}`,
        icon: '📞'
      });
    }
    
    if (contactData.contact_methods.website) {
      quick_actions.push({
        type: 'website',
        label: 'Visit Website',
        action: contactData.contact_methods.website.value,
        icon: '🌐'
      });
    }
    
    // Add social media actions
    contactData.social_media.forEach(sm => {
      if (sm.url) {
        const platformIcons: Record<string, string> = {
          twitter: '🐦',
          facebook: '📘',
          instagram: '📷',
          youtube: '📺',
          linkedin: '💼',
          tiktok: '🎵'
        };
        
        quick_actions.push({
          type: 'social',
          platform: sm.platform,
          label: `Follow on ${sm.platform.charAt(0).toUpperCase() + sm.platform.slice(1)}`,
          action: sm.url,
          icon: platformIcons[sm.platform] ?? '📱',
          followers_count: sm.followers_count
        });
      }
    });

    logger.info('Successfully fetched contact information', { representativeId, name: representative.name });

    return NextResponse.json({
      ok: true,
      data: contactData,
      quick_actions,
      summary: {
        total_contact_methods: Object.values(contactData.contact_methods).filter(Boolean).length,
        total_social_platforms: contactData.social_media.length,
        total_quick_actions: quick_actions.length,
        data_quality_score: contactData.data_quality.overall_score
      }
    });

  } catch (error) {
    logger.error('Error fetching contact information', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// POST endpoint for logging communication attempts
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const representativeId = params.id;
    const body = await request.json();
    
    // Validate representative ID
    const repIdValidation = validateRepresentativeId(representativeId);
    if (!repIdValidation.isValid) {
      return NextResponse.json(
        { ok: false, error: repIdValidation.error ?? 'Invalid representative ID' },
        { status: 400 }
      );
    }
    
    const validatedRepId = repIdValidation.parsedId!;

    // Rate limiting - 10 requests per 15 minutes for authenticated write operations
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1';
    const userAgent = request.headers.get('user-agent') ?? undefined;
    
    const rateLimitResult = await apiRateLimiter.checkLimit(ip, '/api/civics/contact/[id]:POST', {
      maxRequests: 10,
      windowMs: 15 * 60 * 1000, // 15 minutes
      userAgent
    });

    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for communication logging', { ip, representativeId });
      return NextResponse.json(
        {
          ok: false,
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() ?? '900',
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
          }
        }
      );
    }

    // Authentication required for logging communications
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: 'Database connection not available' },
        { status: 500 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.warn('Unauthenticated communication logging attempt', { representativeId });
      return NextResponse.json(
        { ok: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { communication_type, subject, message_preview } = body;

    if (!communication_type) {
      return NextResponse.json(
        { ok: false, error: 'Communication type is required' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedSubject = subject ? sanitizeText(subject) : null;
    const sanitizedMessagePreview = message_preview ? sanitizeText(message_preview) : null;

    logger.info('Logging communication attempt', { representativeId, userId: user.id, communication_type });

    // Log the communication attempt - use authenticated user ID and sanitized inputs
    // Use contact_messages table for logging communications
    // Note: We need a thread_id, so we'll create or find a thread first
    let threadId: string | undefined;
    
    // Try to find existing thread or create new one
    const { data: existingThread } = await supabase
      .from('contact_threads')
      .select('id')
      .eq('user_id', user.id)
      .eq('representative_id', validatedRepId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (existingThread) {
      threadId = existingThread.id;
    } else {
      // Create new thread
      const { data: newThread } = await supabase
        .from('contact_threads')
        .insert({
          user_id: user.id,
          representative_id: validatedRepId,
          subject: sanitizedSubject ?? 'Communication',
          status: 'active'
        })
        .select()
        .single();
      
      if (newThread) {
        threadId = newThread.id;
      }
    }
    
    const { data: logEntry, error: logError } = await supabase
      .from('contact_messages')
      .insert({
        user_id: user.id, // Use authenticated user ID, not from request body
        thread_id: threadId ?? crypto.randomUUID(), // Use thread ID if available
        content: sanitizedMessagePreview ?? sanitizedSubject ?? '',
        subject: sanitizedSubject,
        status: 'sent',
        priority: 'normal',
        message_type: communication_type === 'email' ? 'email' : 'text'
      })
      .select()
      .single();

    if (logError) {
      logger.error('Error logging communication', logError as Error);
      return NextResponse.json(
        { ok: false, error: 'Failed to log communication' },
        { status: 500 }
      );
    }

    logger.info('Communication logged successfully', { representativeId, userId: user.id, logId: logEntry?.id });

    return NextResponse.json({
      ok: true,
      data: logEntry,
      message: 'Communication logged successfully'
    });

  } catch (error) {
    logger.error('Error logging communication', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
