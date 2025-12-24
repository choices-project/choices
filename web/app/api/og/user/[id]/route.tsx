import { ImageResponse } from '@vercel/og';

import { getSupabaseServerClient } from '@/utils/supabase/server';

import logger from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Generate Open Graph image for user profiles
 * Returns a 1200x630 image with user name, trust tier, and branding
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return generateDefaultImage();
    }

    // Fetch user profile data
    const supabaseClient = await getSupabaseServerClient();
    if (!supabaseClient) {
      return generateDefaultImage();
    }

    const { data: profile, error } = await (supabaseClient as any)
      .from('user_profiles')
      .select('username, email, trust_tier, avatar_url')
      .eq('user_id', id)
      .maybeSingle();

    if (error || !profile) {
      return generateDefaultImage();
    }

    const profileData = profile as any;
    const username = profileData?.username || profileData?.email?.split('@')[0] || 'User';
    const trustTier = profileData?.trust_tier || 'T1';

    // Truncate text for display
    const displayName = username.length > 40 ? `${username.substring(0, 37)}...` : username;

    // Generate the image
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            backgroundImage: 'linear-gradient(to bottom right, #f0f9ff 0%, #ffffff 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Header with logo/branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#3b82f6',
                letterSpacing: '-0.02em',
              }}
            >
              Choices
            </div>
          </div>

          {/* User Name */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: '1000px',
              padding: '0 60px',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontSize: '56px',
                fontWeight: 'bold',
                color: '#1e293b',
                lineHeight: '1.2',
                marginBottom: '24px',
                marginTop: '0',
              }}
            >
              {displayName}
            </h1>

            {/* Trust Tier */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginTop: '24px',
              }}
            >
              <div
                style={{
                  fontSize: '28px',
                  color: '#64748b',
                }}
              >
                Trust Tier:
              </div>
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: '#3b82f6',
                }}
              >
                {trustTier}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              fontSize: '20px',
              color: '#94a3b8',
            }}
          >
            choices-app.com
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );

    // Add caching headers for better performance
    imageResponse.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    imageResponse.headers.set('Content-Type', 'image/png');

    return imageResponse;
  } catch (error) {
    logger.error('Failed to generate OG image for user', { userId: params.id, error });
    return generateDefaultImage();
  }
}

/**
 * Generate a default OG image
 */
function generateDefaultImage() {
  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          backgroundImage: 'linear-gradient(to bottom right, #f0f9ff 0%, #ffffff 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#3b82f6',
            marginBottom: '24px',
          }}
        >
          Choices
        </div>
        <div
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: '16px',
          }}
        >
          User Profile
        </div>
        <div
          style={{
            fontSize: '24px',
            color: '#64748b',
          }}
        >
          View user profile on Choices
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );

  // Add caching headers
  imageResponse.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  imageResponse.headers.set('Content-Type', 'image/png');

  return imageResponse;
}

