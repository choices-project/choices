'use client';

import Link from 'next/link';
import { Vote, Shield, Users, BarChart3 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Choices</h1>
              <p className="text-gray-600 mt-1">
                Privacy-preserving real-time polling network
              </p>
            </div>
            <nav className="flex space-x-8">
              <Link href="/" className="text-gray-900 hover:text-blue-600 transition-colors">
                Home
              </Link>
              <Link href="/polls" className="text-gray-600 hover:text-blue-600 transition-colors">
                Polls
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-blue-600 transition-colors">
                About
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Secure, Private, and Auditable Voting
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Participate in polls with complete privacy while maintaining full transparency and auditability. 
            Your voice matters, and your privacy is protected.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="bg-blue-100 p-3 rounded-lg w-fit mx-auto mb-4">
              <Vote className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy-First Voting</h3>
            <p className="text-gray-600">
              Vote with complete anonymity using advanced cryptographic techniques
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="bg-green-100 p-3 rounded-lg w-fit mx-auto mb-4">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Verifiable Results</h3>
            <p className="text-gray-600">
              All votes are publicly verifiable while maintaining individual privacy
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="bg-purple-100 p-3 rounded-lg w-fit mx-auto mb-4">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-Time Results</h3>
            <p className="text-gray-600">
              See live results and participate in ongoing polls instantly
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="bg-orange-100 p-3 rounded-lg w-fit mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics & Insights</h3>
            <p className="text-gray-600">
              Comprehensive analytics with demographic breakdowns and trends
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Start Voting?
          </h3>
          <p className="text-gray-600 mb-6">
            Join thousands of users who trust Choices for secure and private polling
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/polls"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              View Active Polls
            </Link>
            <Link
              href="/dashboard"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Live Dashboard
            </Link>
            <Link
              href="/about"
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Learn More
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
