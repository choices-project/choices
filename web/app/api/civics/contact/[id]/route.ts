import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const representativeId = params.id;
    
    if (!representativeId || isNaN(Number(representativeId))) {
      return NextResponse.json(
        { ok: false, error: 'Invalid representative ID' },
        { status: 400 }
      );
    }

    console.log(`📞 Fetching contact information for representative ID: ${representativeId}`);

    // Get representative basic information
    const { data: representative, error: repError } = await supabase
      .from('civics_representatives')
      .select('id, name, office, level, jurisdiction, party')
      .eq('id', representativeId)
      .single();

    if (repError || !representative) {
      return NextResponse.json(
        { ok: false, error: 'Representative not found' },
        { status: 404 }
      );
    }

    // Get contact information
    const { data: contactInfo } = await supabase
      .from('civics_contact_info')
      .select('*')
      .eq('representative_id', representativeId)
      .single();

    // Get social media engagement
    const { data: socialMedia } = await supabase
      .from('civics_social_engagement')
      .select('*')
      .eq('representative_id', representativeId)
      .order('followers_count', { ascending: false });

    // Transform contact data for easy access
    const contactData = {
      representative: {
        id: representative.id,
        name: representative.name,
        office: representative.office,
        level: representative.level,
        jurisdiction: representative.jurisdiction,
        party: representative.party
      },
      
      contact_methods: {
        email: contactInfo?.official_email ? {
          value: contactInfo.official_email,
          verified: (contactInfo.data_quality_score || 0) >= 90,
          quality_score: contactInfo.data_quality_score || 0
        } : null,
        
        phone: contactInfo?.official_phone ? {
          value: contactInfo.official_phone,
          verified: (contactInfo.data_quality_score || 0) >= 90,
          quality_score: contactInfo.data_quality_score || 0
        } : null,
        
        website: contactInfo?.official_website ? {
          value: contactInfo.official_website,
          verified: (contactInfo.data_quality_score || 0) >= 90,
          quality_score: contactInfo.data_quality_score || 0
        } : null
      },
      
      office_addresses: contactInfo?.office_addresses || [],
      
      social_media: socialMedia?.map(sm => ({
        platform: sm.platform,
        handle: sm.handle,
        url: sm.url,
        followers_count: sm.followers_count,
        engagement_rate: sm.engagement_rate,
        verified: sm.verified,
        official_account: sm.official_account
      })) || [],
      
      communication_preferences: {
        preferred_method: contactInfo?.preferred_contact_method || 'email',
        response_time_expectation: contactInfo?.response_time_expectation || 'within_week'
      },
      
      data_quality: {
        overall_score: contactInfo?.data_quality_score || 0,
        last_verified: contactInfo?.last_verified || null,
        data_source: contactInfo?.data_source || 'unknown',
        verification_notes: contactInfo?.verification_notes || null
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
          icon: platformIcons[sm.platform] || '📱',
          followers_count: sm.followers_count
        });
      }
    });

    console.log(`✅ Successfully fetched contact information for ${representative.name}`);

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
    console.error('❌ Error fetching contact information:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
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
    
    if (!representativeId || isNaN(Number(representativeId))) {
      return NextResponse.json(
        { ok: false, error: 'Invalid representative ID' },
        { status: 400 }
      );
    }

    const { communication_type, subject, message_preview, user_id } = body;

    if (!communication_type) {
      return NextResponse.json(
        { ok: false, error: 'Communication type is required' },
        { status: 400 }
      );
    }

    // Log the communication attempt
    const { data: logEntry, error: logError } = await supabase
      .from('civics_communication_log')
      .insert({
        representative_id: Number(representativeId),
        user_id: user_id || null,
        communication_type,
        subject: subject || null,
        message_preview: message_preview || null,
        status: 'sent'
      })
      .select()
      .single();

    if (logError) {
      console.error('❌ Error logging communication:', logError);
      return NextResponse.json(
        { ok: false, error: 'Failed to log communication' },
        { status: 500 }
      );
    }

    console.log(`📝 Logged communication attempt for representative ID: ${representativeId}`);

    return NextResponse.json({
      ok: true,
      data: logEntry,
      message: 'Communication logged successfully'
    });

  } catch (error) {
    console.error('❌ Error logging communication:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
