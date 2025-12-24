import { ImageResponse } from '@vercel/og';

import { getSupabaseServerClient } from '@/utils/supabase/server';

import logger from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Generate Open Graph image for polls
 * Returns a 1200x630 image with poll title, description, and branding
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      // Return default image for better social sharing UX
      return generateDefaultImage();
    }

    // Fetch poll data
    const supabaseClient = await getSupabaseServerClient();
    if (!supabaseClient) {
      return new Response('Database unavailable', { status: 500 });
    }

    const { data: poll, error } = await supabaseClient
      .from('polls')
      .select('id, title, description, total_votes, status')
      .eq('id', id)
      .maybeSingle();

    if (error || !poll) {
      // Return a default OG image if poll not found
      return generateDefaultImage();
    }

    const title = poll.title || 'Poll';
    const description = poll.description || 'View and participate in this poll on Choices';
    const totalVotes = poll.total_votes || 0;
    const status = poll.status || 'draft';

    // Truncate text for display
    const displayTitle = title.length > 60 ? `${title.substring(0, 57)}...` : title;
    const displayDescription = description.length > 120 ? `${description.substring(0, 117)}...` : description;

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

          {/* Poll Title */}
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
              {displayTitle}
            </h1>

            {/* Description */}
            {displayDescription && (
              <p
                style={{
                  fontSize: '28px',
                  color: '#64748b',
                  lineHeight: '1.4',
                  marginTop: '0',
                  marginBottom: '32px',
                }}
              >
                {displayDescription}
              </p>
            )}

            {/* Stats */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '32px',
                marginTop: '24px',
              }}
            >
              {totalVotes > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '36px',
                      fontWeight: 'bold',
                      color: '#3b82f6',
                    }}
                  >
                    {totalVotes.toLocaleString()}
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      color: '#64748b',
                    }}
                  >
                    votes
                  </div>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '24px',
                    color: status === 'active' ? '#10b981' : '#64748b',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                  }}
                >
                  {status}
                </div>
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
    // Cache for 1 hour, revalidate in background
    imageResponse.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    imageResponse.headers.set('Content-Type', 'image/png');

    return imageResponse;
  } catch (error) {
    logger.error('Failed to generate OG image for poll', { pollId: params.id, error });
    return generateDefaultImage();
  }
}

/**
 * Generate a default OG image when poll is not found
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
          Poll
        </div>
        <div
          style={{
            fontSize: '24px',
            color: '#64748b',
          }}
        >
          View and participate in polls on Choices
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

