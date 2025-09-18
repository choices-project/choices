'use client';

export default function PollRouteError({ error }: { error: Error & { digest?: string } }) {
  // Optional: log to server via /api/logs
  return (
    <div data-testid="poll-error" role="alert">
      Something went wrong loading this poll.
    </div>
  );
}
