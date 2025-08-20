'use client';

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Fingerprint, 
  Vote, 
  Lock, 
  CheckCircle, 
  Users, 
  Zap,
  TrendingUp,
  Clock
} from 'lucide-react'

export default function HomePage() {
  // Mock trending poll data - in production this would come from the database
  const trendingPoll = {
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
    category: 'Technology & Media'
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
          </div>
        </div>
      </section>

      {/* Trending Poll Section */}
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

          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Trending
                      </Badge>
                      <Badge variant="secondary" className="text-sm">
                        {trendingPoll.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl mb-2">{trendingPoll.title}</CardTitle>
                    <CardDescription className="text-base">
                      {trendingPoll.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{trendingPoll.timeRemaining}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trendingPoll.options.map((option: any) => (
                    <div key={option.id} className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{option.text}</span>
                        <span className="text-sm text-gray-600">{option.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${option.percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{option.votes.toLocaleString()} votes</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{trendingPoll.totalVotes.toLocaleString()}</span> total votes
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/polls/${trendingPoll.id}`}>View Full Poll</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                  Secure login with biometric authentication and traditional methods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Biometric login (fingerprint, face)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Email & password
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Trust scoring
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Device security
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
                  Your data is protected with encryption and privacy controls
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
                    Data export & deletion
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Privacy controls
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Compliance ready
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple steps to secure voting and participation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Account</h3>
              <p className="text-gray-600">
                Sign up with email and optionally set up biometric authentication for enhanced security
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Participate</h3>
              <p className="text-gray-600">
                Vote on polls or create your own. All votes are secure and verified
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Results</h3>
              <p className="text-gray-600">
                View real-time results and analytics. Your privacy is always protected
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join users who trust Choices Platform for secure, private voting.
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

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Choices Platform</h3>
              <p className="text-gray-400 text-sm">
                Secure voting with modern authentication and privacy protection.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/register" className="hover:text-white">Sign Up</Link></li>
                <li><Link href="/login" className="hover:text-white">Sign In</Link></li>
                <li><Link href="/polls" className="hover:text-white">Browse Polls</Link></li>
                <li><Link href="/create-poll" className="hover:text-white">Create Poll</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/compliance" className="hover:text-white">Legal Compliance</Link></li>
                <li><Link href="/biometric" className="hover:text-white">Biometric Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
                <li><Link href="/status" className="hover:text-white">System Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Choices Platform. All rights reserved. Built with privacy in mind.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
