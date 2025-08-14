'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart3, Vote, Shield, Users, ArrowRight, TrendingUp, Globe, Zap, 
  CheckCircle, Clock, Activity, Target, Award, Star, Heart, Sparkles,
  ArrowUpRight, Calendar, MapPin, Eye
} from 'lucide-react';

interface Poll {
  id: string;
  title: string;
  description: string;
  status: string;
  total_votes?: number;
  participation?: number;
  options: string[];
  sponsors: string[];
  created_at?: string;
  end_time?: string;
}

// Mock poll data for the home page
const mockPolls: Poll[] = [
  {
    id: 'climate-action',
    title: 'Climate Action Priorities 2024',
    description: 'Help us determine the most important climate action initiatives for the coming year. Your vote will influence policy decisions and funding allocations.',
    status: 'active',
    total_votes: 2847,
    participation: 78,
    options: [
      'Renewable Energy Investment',
      'Carbon Tax Implementation', 
      'Electric Vehicle Infrastructure',
      'Green Building Standards',
      'Public Transportation Expansion'
    ],
    sponsors: ['Environmental Coalition', 'Green Future Initiative'],
    created_at: '2024-12-01T00:00:00Z',
    end_time: '2024-12-31T23:59:59Z'
  },
  {
    id: 'tech-priorities',
    title: 'Technology Development Priorities',
    description: 'Which technology areas should receive the most research and development funding? Your input will guide innovation strategy.',
    status: 'active',
    total_votes: 1563,
    participation: 65,
    options: [
      'Artificial Intelligence & Machine Learning',
      'Quantum Computing',
      'Renewable Energy Technology',
      'Biotechnology & Healthcare',
      'Space Exploration Technology'
    ],
    sponsors: ['Tech Innovation Council', 'Digital Society Foundation'],
    created_at: '2024-12-05T00:00:00Z',
    end_time: '2024-12-25T23:59:59Z'
  },
  {
    id: 'education-reform',
    title: 'Education System Reform Priorities',
    description: 'What should be the top priorities for reforming our education system? Your voice matters in shaping the future of learning.',
    status: 'active',
    total_votes: 3421,
    participation: 82,
    options: [
      'Digital Learning Infrastructure',
      'Teacher Training & Support',
      'Mental Health Services',
      'Career & Technical Education',
      'Parental Involvement Programs'
    ],
    sponsors: ['Education Foundation', 'Future of Learning Institute'],
    created_at: '2024-12-03T00:00:00Z',
    end_time: '2024-12-28T23:59:59Z'
  }
];

export default function HomePage() {
  const [polls, setPolls] = useState<Poll[]>(mockPolls);
  const [loading, setLoading] = useState(false);
  const [liveVotes, setLiveVotes] = useState(2847);
  const [activeTab, setActiveTab] = useState('featured');

  useEffect(() => {
    // Simulate live vote counter
    const interval = setInterval(() => {
      setLiveVotes(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const featuredPolls = polls.filter(poll => poll.status === 'active').slice(0, 3);
  const recentPolls = polls.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              <span>Join 2.5M+ users in democratic decision-making</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Your Voice
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Matters
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Participate in secure, privacy-preserving polls that shape the future. 
              <span className="block text-blue-600 font-semibold">Every vote counts. Every voice is heard.</span>
            </p>

            {/* Live Stats */}
            <div className="flex flex-wrap justify-center items-center gap-6 mb-12">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{liveVotes.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Live Votes</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">2.5M+</div>
                    <div className="text-sm text-gray-500">Active Users</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Vote className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">15K+</div>
                    <div className="text-sm text-gray-500">Active Polls</div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/polls">
                <button className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 hover:-translate-y-1">
                  <Vote className="h-5 w-5" />
                  Start Voting Now
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
              
              <Link href="/dashboard">
                <button className="group bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 border border-gray-200 hover:-translate-y-1">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  View Analytics
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Polls Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Featured Polls
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join the conversation on today's most important topics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredPolls.map((poll, index) => (
              <div 
                key={poll.id}
                className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                    LIVE
                  </span>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">{Math.floor((poll.id.charCodeAt(0) + poll.id.length) * 10) + 100}</span>
                  </div>
                </div>
                
                {/* Poll Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {poll.title}
                </h3>
                
                {/* Poll Description */}
                <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                  {poll.description}
                </p>
                
                {/* Poll Options Preview */}
                <div className="space-y-3 mb-6">
                  {poll.options.slice(0, 2).map((option, optIndex) => (
                    <div key={optIndex} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 text-sm font-medium line-clamp-1">{option}</span>
                        <span className="text-gray-500 text-xs">
                          {Math.floor((option.length + optIndex * 10) % 40) + 10}%
                        </span>
                      </div>
                      <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.floor((option.length + optIndex * 10) % 40) + 10}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {poll.options.length > 2 && (
                    <div className="text-center">
                      <span className="text-sm text-gray-500">
                        +{poll.options.length - 2} more options
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Poll Stats */}
                <div className="flex items-center justify-between text-gray-500 text-sm mb-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{poll.total_votes?.toLocaleString()} votes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>{poll.participation}%</span>
                  </div>
                </div>
                
                {/* Sponsors */}
                {poll.sponsors && poll.sponsors.length > 0 && (
                  <div className="mb-6">
                    <div className="text-xs text-gray-500 mb-2">Sponsored by:</div>
                    <div className="flex flex-wrap gap-2">
                      {poll.sponsors.slice(0, 2).map((sponsor, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                          {sponsor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Action Button */}
                <Link href={`/polls/${poll.id}`}>
                  <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                    Vote Now
                  </button>
                </Link>
              </div>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-12">
            <Link href="/polls">
              <button className="group bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 border border-gray-200 hover:-translate-y-1 mx-auto">
                <Vote className="h-5 w-5 text-blue-600" />
                View All Polls
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Choices?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for the future of democracy with cutting-edge technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Privacy First</h3>
              <p className="text-gray-600 mb-4">
                Your votes are completely anonymous and protected by advanced cryptography. 
                We can't see your choices, and neither can anyone else.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Zero-knowledge proofs
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  End-to-end encryption
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Anonymous voting
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Real-Time Results</h3>
              <p className="text-gray-600 mb-4">
                See live results and participate in ongoing polls instantly. 
                Watch democracy in action as votes come in real-time.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Live vote counting
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Instant updates
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Interactive charts
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Verified Results</h3>
              <p className="text-gray-600 mb-4">
                Every vote is cryptographically verified and tamper-proof. 
                Trust in the integrity of democratic decision-making.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Cryptographic verification
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Tamper-proof records
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Transparent audit trail
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Millions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join a global community of engaged citizens making their voices heard
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">2.5M+</div>
              <div className="text-gray-600">Active Users</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Vote className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">15K+</div>
              <div className="text-gray-600">Active Polls</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">150+</div>
              <div className="text-gray-600">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Make Your Voice Heard?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join millions of users participating in secure, privacy-preserving polls that shape the future of democracy.
          </p>
          <Link href="/polls">
            <button className="group bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 hover:-translate-y-1 mx-auto">
              <Vote className="h-5 w-5" />
              Start Voting Now
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
