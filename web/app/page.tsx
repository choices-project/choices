'use client';

import Link from 'next/link';
import { BarChart3, Vote, Shield, Users, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Welcome to Choices
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A neutral, privacy-preserving real-time polling network that puts your voice first while protecting your privacy.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
            <Link href="/dashboard">
              <div className="bg-white rounded-lg shadow-sm p-8 hover:shadow-md transition-all duration-200 cursor-pointer group border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Dashboard</h2>
                <p className="text-gray-600">
                  View real-time analytics, metrics, and insights from our polling system.
                </p>
              </div>
            </Link>
            
            <Link href="/polls">
              <div className="bg-white rounded-lg shadow-sm p-8 hover:shadow-md transition-all duration-200 cursor-pointer group border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Vote className="h-8 w-8 text-green-600" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">All Polls</h2>
                <p className="text-gray-600">
                  Browse and participate in active polls. See poll details and voting options.
                </p>
              </div>
            </Link>
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            <div className="bg-white rounded-lg p-6 text-center border border-gray-100 shadow-sm">
              <div className="bg-purple-100 p-3 rounded-lg w-fit mx-auto mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy First</h3>
              <p className="text-gray-600 text-sm">
                Your votes are completely anonymous and protected by advanced cryptography.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 text-center border border-gray-100 shadow-sm">
              <div className="bg-orange-100 p-3 rounded-lg w-fit mx-auto mb-4">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-Time Results</h3>
              <p className="text-gray-600 text-sm">
                See live results and participate in ongoing polls instantly.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 text-center border border-gray-100 shadow-sm">
              <div className="bg-teal-100 p-3 rounded-lg w-fit mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Verified Results</h3>
              <p className="text-gray-600 text-sm">
                All votes are publicly verifiable while maintaining individual privacy.
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2 animate-pulse"></div>
                <p className="text-sm text-gray-600">PO Service</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2 animate-pulse"></div>
                <p className="text-sm text-gray-600">IA Service</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2 animate-pulse"></div>
                <p className="text-sm text-gray-600">Web Interface</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
