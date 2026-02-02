import React from 'react';

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="text-6xl font-bold text-gray-300 dark:text-gray-600">404</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Page Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400">Sorry, we couldn&apos;t find the page you&apos;re looking for.</p>
        <a 
          href="/" 
          className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition"
        >
          Go to Homepage
        </a>
      </div>
    </div>
  )
}
