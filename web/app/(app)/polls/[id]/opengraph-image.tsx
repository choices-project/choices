import { ImageResponse } from 'next/og';

// Use Node.js runtime to avoid sharing Edge bundle with middleware.
// Middleware + OG Edge would pull resvg/yoga WASM into middleware, causing Vercel deploy failure.
export const runtime = 'nodejs';
export const alt = 'Poll on Choices';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OGImage({ params }: Props) {
  const { id: pollId } = await params;

  // Try to fetch poll data; use fallback if unavailable (skip fetch when pollId invalid to prevent PostgREST URL injection)
  let title = 'Vote on this poll';
  let options: { text: string; percentage: number }[] = [];
  let totalVotes = 0;

  if (pollId && UUID_REGEX.test(pollId)) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      // Fetch poll with poll_options embedded (PostgREST nested select)
      const res = await fetch(
        `${supabaseUrl}/rest/v1/polls?id=eq.${pollId}&select=title,total_votes,poll_options(text,option_text,vote_count,order_index)`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data?.[0]) {
          const poll = data[0];
          title = poll.title || title;
          totalVotes = poll.total_votes ?? 0;

          // poll_options is the embedded table; fallback to legacy options JSON
          const rawOptions = poll.poll_options;
          if (Array.isArray(rawOptions) && rawOptions.length > 0) {
            const sorted = [...rawOptions].sort(
              (a: { order_index?: number }, b: { order_index?: number }) =>
                (a.order_index ?? 0) - (b.order_index ?? 0)
            );
            options = sorted.map((opt: { text?: string; option_text?: string; vote_count?: number }) => ({
              text: opt.text ?? opt.option_text ?? 'Option',
              percentage:
                totalVotes > 0 ? Math.round(((opt.vote_count ?? 0) / totalVotes) * 100) : 0,
            }));
          } else if (Array.isArray(poll.options)) {
            // Legacy options JSON: { text, votes } or { label, vote_count }
            options = poll.options.map((opt: { text?: string; label?: string; votes?: number; vote_count?: number }) => ({
              text: opt.text ?? opt.label ?? 'Option',
              percentage:
                totalVotes > 0
                  ? Math.round(((opt.votes ?? opt.vote_count ?? 0) / totalVotes) * 100)
                  : 0,
            }));
          }
        }
    }
  }
    } catch {
      // Use fallback values
    }
  }

  // Limit to 4 options for visual space
  const displayOptions = options.slice(0, 4);

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #7c3aed 100%)',
          padding: '60px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.2)',
              marginRight: '14px',
              fontSize: '24px',
            }}
          >
            ✓
          </div>
          <span
            style={{
              color: 'white',
              fontSize: '24px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            Choices
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            color: 'white',
            fontSize: title.length > 80 ? '36px' : '44px',
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: '36px',
            maxWidth: '900px',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </div>

        {/* Options */}
        {displayOptions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {displayOptions.map((opt, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${opt.percentage}%`,
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                  }}
                />
                <span
                  style={{
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: 600,
                    zIndex: 1,
                    flex: 1,
                  }}
                >
                  {opt.text}
                </span>
                <span
                  style={{
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: '20px',
                    fontWeight: 700,
                    zIndex: 1,
                  }}
                >
                  {opt.percentage}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '24px',
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '18px' }}>
            {totalVotes > 0 ? `${totalVotes.toLocaleString()} votes` : 'Be the first to vote'}
          </span>
          <span
            style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            Vote now at choices.app
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
