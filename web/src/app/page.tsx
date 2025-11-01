'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react';
import { Shield, Vote, Lock, Users, ArrowRight, CheckCircle } from 'lucide-react';




type Feature = {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
}

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userStableId, setUserStableId] = useState('')

  const features: Feature[] = [
    {
      icon: Shield,
      title: 'Privacy-Preserving',
      description: 'Your vote is cryptographically protected and unlinkable across polls'
    },
    {
      icon: Vote,
      title: 'Secure Voting',
      description: 'End-to-end verifiable voting with Merkle commitment audit trails'
    },
    {
      icon: Lock,
      title: 'Device Authentication',
      description: 'WebAuthn/Passkey support for secure, passwordless authentication'
    },
    {
      icon: Users,
      title: 'Verification Tiers',
      description: 'Multiple verification levels from basic to government-issued ID'
    }
  ]

  const handleGetStarted = () => {
    if (userStableId.trim()) {
      setIsAuthenticated(true)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Vote className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Choices</h1>
            </div>
                         <nav className="hidden md:flex space-x-8">
               <Link href="/polls" className="text-gray-600 hover:text-gray-900 transition-colors">Vote</Link>
               <Link href="/results" className="text-gray-600 hover:text-gray-900 transition-colors">Results</Link>
               <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
             </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Secure, Private
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Voting System
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Experience the future of digital voting with cryptographic privacy, 
              device-based authentication, and public auditability.
            </p>
            
            {!isAuthenticated ? (
              <div className="max-w-md mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Get Started</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="user-id" className="block text-sm font-medium text-gray-700 mb-2">
                        User ID
                      </label>
                      <input
                        type="text"
                        id="user-id"
                        value={userStableId}
                        onChange={(e) => setUserStableId(e.target.value)}
                        placeholder="Enter your user ID"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={handleGetStarted}
                      disabled={!userStableId.trim()}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Welcome!</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    You&apos;re logged in as: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{userStableId}</span>
                  </p>
                  <Link
                    href="/polls"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <span>View Available Polls</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Choices?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our voting system combines cutting-edge cryptography with user-friendly design
              to deliver the most secure and private voting experience possible.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature: Feature, index: number) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our three-step process ensures your vote is secure, private, and verifiable.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Authenticate</h3>
              <p className="text-gray-600">
                Use your device&apos;s biometric authentication or security key to verify your identity.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Token</h3>
              <p className="text-gray-600">
                Receive a cryptographically secure, unlinkable token for the specific poll.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Vote</h3>
              <p className="text-gray-600">
                Cast your vote with full privacy protection and public auditability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Vote className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold">Choices</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Privacy-preserving voting for the digital age
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <button className="hover:text-white transition-colors">Privacy Policy</button>
              <button className="hover:text-white transition-colors">Terms of Service</button>
              <button className="hover:text-white transition-colors">GitHub</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
