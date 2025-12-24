import { ImageResponse } from '@vercel/og';

import { getSupabaseServerClient } from '@/utils/supabase/server';

import logger from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Generate Open Graph image for representatives
 * Returns a 1200x630 image with representative name, office, and branding
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

    // Fetch representative data
    const supabaseClient = await getSupabaseServerClient();
    if (!supabaseClient) {
      return generateDefaultImage();
    }

    const { data: representative, error } = await (supabaseClient as any)
      .from('representatives_core')
      .select('name, office, party, state, district, primary_photo_url')
      .eq('id', id)
      .maybeSingle();

    if (error || !representative) {
      return generateDefaultImage();
    }

    const name = (representative as any)?.name || 'Representative';
    const office = (representative as any)?.office || '';
    const party = (representative as any)?.party || '';
    const state = (representative as any)?.state || '';
    const district = (representative as any)?.district || '';

    // Truncate text for display
    const displayName = name.length > 50 ? `${name.substring(0, 47)}...` : name;
    const displayOffice = office.length > 60 ? `${office.substring(0, 57)}...` : office;
    const location = district ? `${state} - District ${district}` : state;

    // Generate the image
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            backgroundImage: 'linear-gradient(to bottom right, #f0f9ff 0%, #ffffff 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '60px',
          }}
        >
          {/* Left side - Representative info */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              maxWidth: '700px',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '40px',
              }}
            >
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#3b82f6',
                  letterSpacing: '-0.02em',
                }}
              >
                Choices
              </div>
            </div>

            {/* Representative Name */}
            <h1
              style={{
                fontSize: '64px',
                fontWeight: 'bold',
                color: '#1e293b',
                lineHeight: '1.1',
                marginBottom: '20px',
                marginTop: '0',
              }}
            >
              {displayName}
            </h1>

            {/* Office */}
            {displayOffice && (
              <div
                style={{
                  fontSize: '32px',
                  color: '#64748b',
                  marginBottom: '16px',
                }}
              >
                {displayOffice}
              </div>
            )}

            {/* Location and Party */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                marginTop: '24px',
              }}
            >
              {location && (
                <div
                  style={{
                    fontSize: '24px',
                    color: '#64748b',
                  }}
                >
                  {location}
                </div>
              )}
              {party && (
                <div
                  style={{
                    fontSize: '24px',
                    color: '#3b82f6',
                    fontWeight: '600',
                  }}
                >
                  {party}
                </div>
              )}
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
    logger.error('Failed to generate OG image for representative', { representativeId: params.id, error });
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
          Representative
        </div>
        <div
          style={{
            fontSize: '24px',
            color: '#64748b',
          }}
        >
          View representative information on Choices
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

