'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Vote, 
  Shield, 
  Users, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2,
  Globe,
  Zap,
  Lock
} from 'lucide-react';

interface HeroSectionProps {
  isAuthenticated?: boolean;
  userStats?: {
    totalVotes: number;
    activePolls: number;
    participationRate: number;
  };
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  isAuthenticated = false,
  userStats
}) => {
  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Privacy-First',
      description: 'Your vote is private and secure with zero-knowledge proofs'
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Verifiable',
      description: 'Every vote can be verified without revealing your choice'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Democratic',
      description: 'Participate in decisions that shape our future'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Transparent',
      description: 'Real-time results and open-source verification'
    }
  ];

  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              <Vote className="w-4 h-4" />
              <span>Next-Generation Voting Platform</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Vote with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Confidence
                </span>
              </h1>
              <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed">
                Participate in democratic decision-making with privacy, security, and transparency. 
                Your voice matters, and we ensure it's heard.
              </p>
            </div>

            {/* Stats */}
            {userStats && (
              <div className="grid grid-cols-3 gap-6 py-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {userStats.totalVotes.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Votes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {userStats.activePolls}
                  </div>
                  <div className="text-sm text-gray-600">Active Polls</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {userStats.participationRate}%
                  </div>
                  <div className="text-sm text-gray-600">Participation</div>
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/polls"
                    className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Vote className="w-5 h-5 mr-2" />
                    Browse Polls
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors duration-200"
                  >
                    View Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Vote className="w-5 h-5 mr-2" />
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Open Source</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>End-to-End Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Auditable</span>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            {/* Main Card */}
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Vote className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Climate Action 2024</h3>
                    <p className="text-sm text-gray-500">Active • 2,847 votes</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Live
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {[
                  { text: 'Renewable Energy Investment', votes: 45, color: 'bg-green-500' },
                  { text: 'Carbon Tax Implementation', votes: 23, color: 'bg-blue-500' },
                  { text: 'Electric Vehicle Infrastructure', votes: 18, color: 'bg-purple-500' },
                  { text: 'Green Building Standards', votes: 9, color: 'bg-yellow-500' },
                  { text: 'Public Transportation', votes: 5, color: 'bg-red-500' }
                ].map((option, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700">{option.text}</span>
                      <span className="text-gray-500">{option.votes}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-1000 ${option.color}`}
                        style={{ width: `${option.votes}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200">
                Vote Now
              </button>

              {/* Live Indicator */}
              <div className="absolute -top-2 -right-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded-full text-xs font-medium animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  LIVE
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -left-4 bg-purple-100 rounded-lg p-3 shadow-lg">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">Verified</span>
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 bg-green-100 rounded-lg p-3 shadow-lg">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">2.8k votes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We combine cutting-edge cryptography with user-friendly design to create 
              the most secure and accessible voting experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4 text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Global Stats */}
        <div className="mt-20 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Global Impact
            </h3>
            <p className="text-gray-600">
              Join thousands of users making a difference worldwide
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">50K+</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">1.2M</div>
              <div className="text-sm text-gray-600">Votes Cast</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">500+</div>
              <div className="text-sm text-gray-600">Polls Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">99.9%</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for grid pattern */}
      <style jsx>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
