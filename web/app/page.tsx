'use client';

import Link from 'next/link';
import { Vote, Shield, Users, BarChart3 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Welcome to Choices
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A neutral, privacy-preserving real-time polling network
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Link href="/dashboard">
              <div className="bg-white rounded-lg shadow-sm p-8 hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-3xl mb-4">📊</div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Dashboard</h2>
                <p className="text-gray-600">
                  View real-time analytics, metrics, and insights from our polling system.
                </p>
              </div>
            </Link>
            
            <Link href="/polls">
              <div className="bg-white rounded-lg shadow-sm p-8 hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-3xl mb-4">🗳️</div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">All Polls</h2>
                <p className="text-gray-600">
                  Browse and participate in active polls. See poll details and voting options.
                </p>
              </div>
            </Link>
          </div>
          
          <div className="mt-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">PO Service</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">IA Service</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Web Interface</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
