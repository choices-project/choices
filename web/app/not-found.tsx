'use client'

import { Home, ArrowLeft, Search } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl font-bold text-red-600">404</span>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or you entered the wrong URL.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-150 ease-in-out"
          >
            <Home className="h-5 w-5" />
            Go to Homepage
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition duration-150 ease-in-out"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </button>
        </div>

        {/* Helpful Links */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Popular Pages
          </h2>
          <div className="grid grid-cols-1 gap-3">
            <Link
              href="/polls"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition duration-150 ease-in-out"
            >
              <Search className="h-4 w-4" />
              Browse Polls
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition duration-150 ease-in-out"
            >
              <Home className="h-4 w-4" />
              Sign In
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition duration-150 ease-in-out"
            >
              <Home className="h-4 w-4" />
              Create Account
            </Link>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-8 text-sm text-gray-500">
          <p>
            Still having trouble?{' '}
            <a href="mailto:support@choices-platform.com" className="text-blue-600 hover:text-blue-700">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
