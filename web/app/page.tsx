'use client';

import Link from 'next/link';
import { BarChart3, Vote, Shield, Users, ArrowRight, TrendingUp, Globe, Zap, CheckCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* Main Headline */}
            <div className="mb-8">
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Your Voice
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Matters
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
                Join millions in the world's most secure, privacy-preserving polling network. 
                <span className="block text-blue-600 font-semibold">Your vote counts. Your privacy is protected.</span>
              </p>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap justify-center items-center gap-8 mb-12 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">2.5M+</span> Active Users
              </div>
              <div className="flex items-center gap-2">
                <Vote className="h-5 w-5 text-green-600" />
                <span className="font-semibold">15K+</span> Polls Created
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="font-semibold">50M+</span> Votes Cast
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/polls">
                <button className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center gap-3">
                  <Vote className="h-5 w-5" />
                  Start Voting Now
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="group bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center gap-3 border border-gray-200">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  View Analytics
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Choose Choices?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built with cutting-edge technology to ensure your voice is heard while protecting your privacy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Privacy First */}
          <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Privacy First</h3>
            <p className="text-gray-600 leading-relaxed">
              Your votes are completely anonymous and protected by advanced cryptography. 
              We can't see your choices, and neither can anyone else.
            </p>
            <div className="mt-6 flex items-center gap-2 text-blue-600 font-semibold">
              <CheckCircle className="h-4 w-4" />
              Zero-knowledge proofs
            </div>
          </div>

          {/* Real-Time Results */}
          <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
            <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform">
              <Zap className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Real-Time Results</h3>
            <p className="text-gray-600 leading-relaxed">
              See live results and participate in ongoing polls instantly. 
              Watch democracy in action as votes come in real-time.
            </p>
            <div className="mt-6 flex items-center gap-2 text-green-600 font-semibold">
              <CheckCircle className="h-4 w-4" />
              Live updates
            </div>
          </div>

          {/* Verified Results */}
          <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform">
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Verified Results</h3>
            <p className="text-gray-600 leading-relaxed">
              All votes are publicly verifiable while maintaining individual privacy. 
              Trust in the integrity of every poll result.
            </p>
            <div className="mt-6 flex items-center gap-2 text-purple-600 font-semibold">
              <CheckCircle className="h-4 w-4" />
              Blockchain verified
            </div>
          </div>

          {/* Global Reach */}
          <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
            <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-4 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform">
              <Globe className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Global Reach</h3>
            <p className="text-gray-600 leading-relaxed">
              Join a worldwide community of voters. Participate in polls from anywhere, 
              anytime, on any device.
            </p>
            <div className="mt-6 flex items-center gap-2 text-orange-600 font-semibold">
              <CheckCircle className="h-4 w-4" />
              150+ countries
            </div>
          </div>

          {/* Easy to Use */}
          <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
            <div className="bg-gradient-to-br from-teal-100 to-teal-200 p-4 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform">
              <Users className="h-8 w-8 text-teal-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Easy to Use</h3>
            <p className="text-gray-600 leading-relaxed">
              Intuitive design makes voting simple and accessible. 
              No technical knowledge required - just click and vote.
            </p>
            <div className="mt-6 flex items-center gap-2 text-teal-600 font-semibold">
              <CheckCircle className="h-4 w-4" />
              One-click voting
            </div>
          </div>

          {/* Secure & Reliable */}
          <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
            <div className="bg-gradient-to-br from-red-100 to-red-200 p-4 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Secure & Reliable</h3>
            <p className="text-gray-600 leading-relaxed">
              Built with enterprise-grade security. Your data is protected 
              with military-grade encryption and redundancy.
            </p>
            <div className="mt-6 flex items-center gap-2 text-red-600 font-semibold">
              <CheckCircle className="h-4 w-4" />
              99.9% uptime
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">System Status</h3>
            <div className="flex flex-wrap justify-center gap-12">
              <div className="text-center group">
                <div className="relative">
                  <div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-3 animate-pulse group-hover:scale-125 transition-transform"></div>
                  <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-20"></div>
                </div>
                <p className="text-sm font-semibold text-gray-900">PO Service</p>
                <p className="text-xs text-green-600">Operational</p>
              </div>
              <div className="text-center group">
                <div className="relative">
                  <div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-3 animate-pulse group-hover:scale-125 transition-transform"></div>
                  <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-20"></div>
                </div>
                <p className="text-sm font-semibold text-gray-900">IA Service</p>
                <p className="text-xs text-green-600">Operational</p>
              </div>
              <div className="text-center group">
                <div className="relative">
                  <div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-3 animate-pulse group-hover:scale-125 transition-transform"></div>
                  <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-20"></div>
                </div>
                <p className="text-sm font-semibold text-gray-900">Web Interface</p>
                <p className="text-xs text-green-600">Operational</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
