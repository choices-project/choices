'use client';

export default function PollRouteError({ error }: { error: Error & { digest?: string } }) {
  // Log error to console for debugging
  console.error('Poll route error:', error);
  
  // Optional: log to server via /api/logs
  // TODO: Implement server-side error logging
  
  return (
    <div data-testid="poll-error" role="alert">
      <h2 className="text-lg font-semibold text-red-600 mb-2">Error Loading Poll</h2>
      <p className="text-gray-600 mb-4">Something went wrong loading this poll.</p>
      {process.env.NODE_ENV === 'development' && (
        <details className="text-sm text-gray-500">
          <summary className="cursor-pointer">Error Details</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
            {error.message}
            {error.digest && `\nDigest: ${error.digest}`}
          </pre>
        </details>
      )}
    </div>
  );
}
