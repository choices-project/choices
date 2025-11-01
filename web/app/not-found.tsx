import React from 'react';

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>Sorry, we couldn't find the page you're looking for.</p>
      <a href="/">Go to Homepage</a>
    </div>
  )
}
