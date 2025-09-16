import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { devLog } from '@/lib/logger';

export const dynamic = 'force-dynamic'

// GET - List available biometric credentials for this domain
export async function GET(request: NextRequest) {
  try {
    // Get Supabase client
    const supabase = getSupabaseServerClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    const supabaseClient = await supabase

    // Get all available credentials for this domain
    const { data: credentials, error: credentialsError } = await supabaseClient
      .from('webauthn_credentials')
      .select('id, credential_id, user_id, public_key, counter, transports, created_at')
      .eq('rp_id', request.headers.get('host') || 'localhost')

    if (credentialsError) {
      devLog('Error getting WebAuthn credentials:', credentialsError)
      return NextResponse.json(
        { error: 'Failed to get biometric credentials' },
        { status: 500 }
      )
    }

    devLog('Retrieved WebAuthn credentials for domain', {
      host: request.headers.get('host'),
      count: credentials?.length || 0
    })

    return NextResponse.json({
      success: true,
      credentials: credentials || []
    })

  } catch (error) {
    devLog('Error getting WebAuthn credentials:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
