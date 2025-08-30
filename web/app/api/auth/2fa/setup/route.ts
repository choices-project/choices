import { NextRequest, NextResponse } from 'next/server';
import { devLog } from '@/lib/logger';
import speakeasy from 'speakeasy'
import qrcode from 'qrcode'
import { getSupabaseServerClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    const { action, code } = await request.json()

    // Get Supabase client
    const supabaseClient = await supabase;

    // Check authentication
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (action === 'generate') {
      // Generate new 2FA secret
      const secret = speakeasy.generateSecret({
        name: `Choices (${user.email})`,
        issuer: 'Choices Platform'
      })

      // Generate QR code
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!)

      return NextResponse.json({
        secret: secret.base32,
        qrCode: qrCodeUrl,
        otpauthUrl: secret.otpauth_url
      })
    }

    if (action === 'enable') {
      if (!code) {
        return NextResponse.json(
          { error: 'Verification code required' },
          { status: 400 }
        );
      }

      // Get the temporary secret from the user's session or storage
      // For now, we'll use a simple approach - in production, you'd store this securely
      const { data: tempSecret } = await supabaseClient
        .from('ia_users')
        .select('two_factor_temp_secret')
        .eq('id', String(user.id) as any)
        .single()

      if (!tempSecret || !('two_factor_temp_secret' in tempSecret) || !tempSecret.two_factor_temp_secret) {
        return NextResponse.json(
          { error: 'No pending 2FA setup found' },
          { status: 400 }
        );
      }

      // Verify the code
      const verified = speakeasy.totp.verify({
        secret: tempSecret.two_factor_temp_secret,
        encoding: 'base32',
        token: code,
        window: 2
      })

      if (!verified) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 400 }
        );
      }

      // Enable 2FA for the user
      await supabaseClient
        .from('ia_users')
        .update({
          two_factor_enabled: true,
          two_factor_secret: tempSecret.two_factor_temp_secret,
          two_factor_temp_secret: null
        } as any)
        .eq('id', String(user.id) as any)

      return NextResponse.json({
        success: true,
        message: 'Two-factor authentication enabled successfully'
      })
    }

    if (action === 'disable') {
      if (!code) {
        return NextResponse.json(
          { error: 'Verification code required' },
          { status: 400 }
        );
      }

      // Get user's current 2FA secret
      const { data: userData } = await supabaseClient
        .from('ia_users')
        .select('two_factor_secret')
        .eq('id', String(user.id) as any)
        .single()

      if (!userData || !('two_factor_secret' in userData) || !userData.two_factor_secret) {
        return NextResponse.json(
          { error: 'Two-factor authentication not enabled' },
          { status: 400 }
        );
      }

      // Verify the code
      const verified = speakeasy.totp.verify({
        secret: userData.two_factor_secret,
        encoding: 'base32',
        token: code,
        window: 2
      })

      if (!verified) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 400 }
        );
      }

      // Disable 2FA
      await supabaseClient
        .from('ia_users')
        .update({
          two_factor_enabled: false,
          two_factor_secret: null,
          two_factor_temp_secret: null
        } as any)
        .eq('id', String(user.id) as any)

      return NextResponse.json({
        success: true,
        message: 'Two-factor authentication disabled successfully'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    devLog('2FA setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
