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

export default function HomePage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveVotes, setLiveVotes] = useState(0);
  const [activeTab, setActiveTab] = useState('featured');

  useEffect(() => {
    // Fetch real polls
    const fetchPolls = async () => {
      try {
        const response = await fetch('/api/polls');
        if (response.ok) {
          const data = await response.json();
          setPolls(Array.isArray(data) ? data.slice(0, 6) : data.polls?.slice(0, 6) || []);
        }
      } catch (error) {
        console.error('Error fetching polls:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPolls();

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

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-8 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
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
                      <span className="text-sm">{Math.floor(Math.random() * 1000) + 100}</span>
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
                          <span className="text-gray-700 text-sm font-medium">{option}</span>
                          <span className="text-gray-500 text-xs">
                            {Math.floor(Math.random() * 40) + 10}%
                          </span>
                        </div>
                        <div className="mt-2 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.floor(Math.random() * 40) + 10}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Poll Stats */}
                  <div className="flex items-center justify-between text-gray-500 text-sm mb-6">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{poll.total_votes || Math.floor(Math.random() * 1000) + 100} votes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span>{poll.participation || Math.floor(Math.random() * 30) + 20}%</span>
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
          )}
          
          {/* View All Button */}
          <div className="text-center mt-12">
            <Link href="/polls">
              <button className="group bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 border border-gray-200 hover:-translate-y-1 mx-auto">
                <Vote className="h-5 w-5 text-blue-600" />
                View All Polls
                <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
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
            {[
              {
                icon: Shield,
                title: "Privacy First",
                description: "Your votes are completely anonymous and protected by advanced cryptography. We can't see your choices, and neither can anyone else.",
                color: "blue",
                features: ["Zero-knowledge proofs", "End-to-end encryption", "Anonymous voting"]
              },
              {
                icon: Zap,
                title: "Real-Time Results",
                description: "See live results and participate in ongoing polls instantly. Watch democracy in action as votes come in real-time.",
                color: "green",
                features: ["Live updates", "Instant feedback", "Real-time analytics"]
              },
              {
                icon: Award,
                title: "Verified Results",
                description: "All votes are publicly verifiable while maintaining individual privacy. Trust in the integrity of every poll result.",
                color: "purple",
                features: ["Blockchain verified", "Public audit trail", "Tamper-proof"]
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div 
                  className={`p-4 rounded-xl w-fit mb-6 transition-transform group-hover:scale-110 ${
                    feature.color === 'blue' ? 'bg-blue-100' : 
                    feature.color === 'green' ? 'bg-green-100' : 'bg-purple-100'
                  }`}
                >
                  <feature.icon className={`h-8 w-8 ${
                    feature.color === 'blue' ? 'text-blue-600' : 
                    feature.color === 'green' ? 'text-green-600' : 'text-purple-600'
                  }`} />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {feature.description}
                </p>
                
                <ul className="space-y-2">
                  {feature.features.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className={`h-4 w-4 ${
                        feature.color === 'blue' ? 'text-blue-600' : 
                        feature.color === 'green' ? 'text-green-600' : 'text-purple-600'
                      }`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { number: "2.5M+", label: "Active Users", icon: Users },
              { number: "15K+", label: "Polls Created", icon: Vote },
              { number: "50M+", label: "Votes Cast", icon: CheckCircle },
              { number: "150+", label: "Countries", icon: Globe }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <stat.icon className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              </div>
            ))}
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
            Join millions of users in secure, privacy-preserving polls that shape the future
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/polls">
              <button className="group bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 hover:-translate-y-1">
                <Vote className="h-5 w-5" />
                Start Voting Now
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
            
            <Link href="/dashboard">
              <button className="group bg-transparent text-white px-8 py-4 rounded-xl font-semibold text-lg border-2 border-white hover:bg-white hover:text-blue-600 transition-all duration-200 flex items-center gap-3 hover:-translate-y-1">
                <BarChart3 className="h-5 w-5" />
                Explore Analytics
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
