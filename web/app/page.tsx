'use client';

import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/lib/logger';
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Fingerprint, 
  Vote, 
  CheckCircle, 
  TrendingUp,
  Clock,
  Lock,
  Users,
  BarChart3,
  ArrowRight
} from 'lucide-react'

interface TrendingPoll {
  id: string
  title: string
  description: string
  options: Array<{
    id: string
    text: string
    votes: number
    percentage: number
  }>
  totalVotes: number
  timeRemaining: string
  category: string
  isActive: boolean
}

export default function HomePage() {
  const { user } = useAuth()
  const [trendingPolls, setTrendingPolls] = useState<TrendingPoll[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPolls: 0,
    totalVotes: 0,
    activeUsers: 0
  })

  const loadTrendingPolls = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/polls/trending?limit=3')
      if (response.ok) {
        const data = await response.json()
        setTrendingPolls(data.polls || [])
      } else {
        // Fallback to mock data if API fails
        setTrendingPolls([getMockTrendingPoll()])
      }
    } catch (error) {
      // narrow 'unknown' → Error
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error loading trending polls:', err)
      setTrendingPolls([getMockTrendingPoll()])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const response = await fetch('/api/stats/public')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      // narrow 'unknown' → Error
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error loading stats:', err)
    }
  }, [])

  useEffect(() => {
    loadTrendingPolls()
    loadStats()
  }, [loadTrendingPolls, loadStats])

  const getMockTrendingPoll = (): TrendingPoll => ({
    id: 'trending-1',
    title: 'What\'s your preferred way to stay informed about current events?',
    description: 'Help us understand how people prefer to consume news and stay updated in today\'s digital age.',
    options: [
      { id: '1', text: 'Social Media', votes: 1247, percentage: 42 },
      { id: '2', text: 'Traditional News Sites', votes: 892, percentage: 30 },
      { id: '3', text: 'News Apps', votes: 456, percentage: 15 },
      { id: '4', text: 'Podcasts', votes: 234, percentage: 8 },
      { id: '5', text: 'Word of Mouth', votes: 156, percentage: 5 }
    ],
    totalVotes: 2985,
    timeRemaining: '2 days left',
    category: 'Technology & Media',
    isActive: true
  })

  // If user is authenticated, redirect to dashboard
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-5xl font-bold text-gray-900">
                Choices Platform
              </h1>
            </div>
            <p className="text-xl text-gray-600 mb-8">
              Secure voting with modern authentication and privacy protection
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild size="lg" className="text-lg px-8 py-3">
                <Link href="/register">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
            
            {/* Simple Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Shield className="h-4 w-4 mr-2" />
                Secure & Private
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Fingerprint className="h-4 w-4 mr-2" />
                Modern Auth
              </Badge>
            </div>

            {/* Platform Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Vote className="h-6 w-6 text-blue-600" />
                  <span className="text-2xl font-bold text-gray-900">{stats.totalPolls.toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-600">Active Polls</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                  <span className="text-2xl font-bold text-gray-900">{stats.totalVotes.toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-600">Total Votes</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-6 w-6 text-purple-600" />
                  <span className="text-2xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-600">Active Users</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Polls Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <TrendingUp className="h-6 w-6 text-orange-500" />
              <h2 className="text-3xl font-bold text-gray-900">Trending Now</h2>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See what people are voting on right now. Join the conversation and make your voice heard.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-0 shadow-xl">
                    <CardHeader>
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[1, 2, 3].map((j) => (
                          <div key={j} className="animate-pulse">
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {trendingPolls.map((poll) => (
                  <Card key={poll.id} className="border-0 shadow-xl hover:shadow-2xl transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge variant="outline" className="text-orange-600 border-orange-200">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Trending
                            </Badge>
                            <Badge variant="secondary" className="text-sm">
                              {poll.category}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg mb-2 line-clamp-2">{poll.title}</CardTitle>
                          <CardDescription className="text-sm line-clamp-2">
                            {poll.description}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{poll.timeRemaining}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {poll.options.slice(0, 3).map((option) => (
                          <div key={option.id} className="relative">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900 text-sm line-clamp-1">{option.text}</span>
                              <span className="text-xs text-gray-600">{option.percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${option.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">{poll.totalVotes.toLocaleString()}</span> votes
                          </div>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/polls/${poll.id}`} className="flex items-center gap-1">
                              View Poll
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Call to Action */}
            <div className="text-center mt-12">
              <p className="text-gray-600 mb-4">Want to see more polls and participate?</p>
              <Button asChild size="lg" className="text-lg px-8 py-3">
                <Link href="/register">Join Choices Today</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Secure Voting Made Simple
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Create and participate in polls with confidence. Built with modern security 
              and privacy protection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Secure Voting */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Vote className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Secure Voting</CardTitle>
                <CardDescription>
                  Create and participate in polls with advanced security and verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Real-time results
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Trust-based verification
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Admin dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Analytics & insights
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Modern Authentication */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Fingerprint className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Modern Authentication</CardTitle>
                <CardDescription>
                  Secure login with biometric authentication and social login options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Biometric login
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Social login
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Device flow auth
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Multi-factor security
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Privacy Protection */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Privacy Protection</CardTitle>
                <CardDescription>
                  Your data is protected with advanced privacy controls and encryption
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    End-to-end encryption
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Privacy controls
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    GDPR compliant
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Data minimization
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Start Voting?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already making their voices heard. 
            Create your first poll in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-3">
              <Link href="/register">Get Started Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-blue-600">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
