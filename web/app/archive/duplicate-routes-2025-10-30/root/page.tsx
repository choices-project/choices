import { Shield } from 'lucide-react'
import Link from 'next/link'
import React from 'react';

import WebAuthnFeatures from '@/features/auth/components/WebAuthnFeatures'
import PWAFeaturesIsolated from '@/features/pwa/components/PWAFeaturesIsolated'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Choices</h1>
            </div>
            <nav className="flex space-x-8">
              <Link href="/login" className="text-gray-600 hover:text-gray-900" data-testid="sign-in-button" aria-label="Sign in to your account">Sign In</Link>
              <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" data-testid="sign-up-button" aria-label="Get started with Choices">
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Secure Democratic Decision Making
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A privacy-first, unbiased polling platform for democratic participation. 
            Vote securely with modern authentication and transparent results.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12" role="group" aria-label="Authentication options">
            <Link href="/register" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors duration-200" data-testid="sign-up-button" aria-label="Get started with Choices platform">
              Get Started
            </Link>
            <Link href="/login" className="inline-block border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-8 rounded-lg text-lg transition-colors duration-200" data-testid="sign-in-button" aria-label="Sign in to your existing account">
              Sign In
            </Link>
          </div>

          {/* Features */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16" aria-label="Platform features">
            <article className="bg-white rounded-lg p-6 shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure Voting</h3>
              <p className="text-gray-600">Advanced encryption and authentication ensure your votes are secure and private.</p>
            </article>

            <article className="bg-white rounded-lg p-6 shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Privacy Protection</h3>
              <p className="text-gray-600">Your personal data is protected with industry-leading privacy measures.</p>
            </article>

            <article className="bg-white rounded-lg p-6 shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Transparent Results</h3>
              <p className="text-gray-600">See real-time results with full transparency and verifiable outcomes.</p>
            </article>
          </section>
        </div>
      </main>

      {/* WebAuthn Features - for E2E testing */}
      <WebAuthnFeatures />
      
      {/* PWA Features - for E2E testing */}
      <PWAFeaturesIsolated />

      {/* Footer */}
      <footer className="bg-white border-t" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
                <span className="text-lg font-bold text-gray-900">Choices</span>
              </div>
              <p className="text-gray-600 text-sm">
                Empowering democratic participation through ranked choice voting and transparent civic engagement.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Platform</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/polls" className="hover:text-blue-600">Polls</a></li>
                <li><a href="/dashboard" className="hover:text-blue-600">Dashboard</a></li>
                <li><a href="/civics-2-0" className="hover:text-blue-600">Civics</a></li>
                <li><a href="/analytics" className="hover:text-blue-600">Analytics</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Privacy & Legal</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/privacy" className="hover:text-blue-600">Privacy Policy</a></li>
                <li><a href="/account/privacy" className="hover:text-blue-600">Privacy Settings</a></li>
                <li><a href="/account/export" className="hover:text-blue-600">Data Export</a></li>
                <li><a href="/account/delete" className="hover:text-blue-600">Delete Account</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-600 text-sm">
                &copy; 2025 Choices. All rights reserved.
              </p>
              <div className="flex space-x-4 mt-4 md:mt-0">
                <a href="/privacy" className="text-sm text-gray-600 hover:text-blue-600">Privacy</a>
                <a href="/terms" className="text-sm text-gray-600 hover:text-blue-600">Terms</a>
                <a href="/contact" className="text-sm text-gray-600 hover:text-blue-600">Contact</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}



