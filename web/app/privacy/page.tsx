
import { Shield, Eye, Lock, Download, Trash2, Settings, FileText, Users, Clock } from 'lucide-react'
import type { Metadata } from 'next'
import React from 'react';

export const metadata: Metadata = {
  title: 'Privacy Policy - Ranked Choice Democracy',
  description: 'Your privacy matters. Learn how we protect your data and give you control over your information.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
          <p className="text-lg text-gray-600">
            Your privacy matters. Learn how we protect your data and give you control over your information.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: January 15, 2025
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Your Privacy Controls
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a 
              href="/account/export" 
              className="flex items-center p-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <Download className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Download Your Data</div>
                <div className="text-sm text-gray-600">Get a copy of all your data</div>
              </div>
            </a>
            <a 
              href="/account/delete" 
              className="flex items-center p-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <Trash2 className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Delete Your Account</div>
                <div className="text-sm text-gray-600">Remove all your data</div>
              </div>
            </a>
          </div>
        </div>

        {/* Main Content */}
        <div className="prose prose-lg max-w-none">
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Privacy Matters</h2>
            <p className="text-gray-700 mb-4">
              We believe in transparent, user-controlled data practices. This policy explains what data we collect, 
              why we collect it, and how you can control it.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <Shield className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">Our Commitment</h3>
                  <p className="text-green-800 text-sm">
                    We never sell your data, we don&apos;t track you across other websites, and you have complete control 
                    over what information you share.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* What We Collect */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Data We Collect</h2>
            
            <div className="space-y-6">
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Lock className="h-5 w-5 text-blue-600 mr-2" />
                  Essential Data (Required for Platform Function)
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Account Information:</strong> Email, username, password (encrypted)</li>
                  <li>• <strong>Voting Records:</strong> Your poll votes and preferences (anonymous)</li>
                  <li>• <strong>Representative Data:</strong> Your elected officials and districts</li>
                </ul>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Eye className="h-5 w-5 text-blue-600 mr-2" />
                  Analytics Data (Optional - You Control This)
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Usage Patterns:</strong> Which pages you visit and how you navigate</li>
                  <li>• <strong>Performance Data:</strong> How fast pages load and any errors</li>
                  <li>• <strong>Device Information:</strong> Browser type and device for accessibility</li>
                  <li>• <strong>Geographic Location:</strong> Your state/region for representative accuracy</li>
                </ul>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>You can opt out of analytics data collection at any time</strong> in your account settings.
                  </p>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText className="h-5 w-5 text-blue-600 mr-2" />
                  Privacy Data (For Your Rights)
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Consent Records:</strong> What you&apos;ve agreed to share</li>
                  <li>• <strong>Data Requests:</strong> When you ask for your data or deletion</li>
                  <li>• <strong>Audit Logs:</strong> Security and access records</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Why We Collect */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why We Collect This Data</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Users className="h-5 w-5 text-green-600 mr-2" />
                  For Democracy & Election Integrity
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Prevent Bot Manipulation:</strong> Stop automated attacks on polls</li>
                  <li>• <strong>Ensure Fair Representation:</strong> Verify geographic distribution</li>
                  <li>• <strong>Maintain Trust:</strong> Protect the integrity of democratic processes</li>
                </ul>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Settings className="h-5 w-5 text-blue-600 mr-2" />
                  For Better User Experience
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Improve Navigation:</strong> Make the platform easier to use</li>
                  <li>• <strong>Fix Performance Issues:</strong> Speed up slow pages</li>
                  <li>• <strong>Enhance Accessibility:</strong> Support users with different needs</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Control & Rights</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Granular Consent</h3>
              <p className="text-blue-800 mb-3">You can choose exactly what data to share:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                  <span className="text-blue-800">Essential Data: Required for platform function</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                  <span className="text-blue-800">Analytics Data: Optional - improve your experience</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                  <span className="text-blue-800">Location Data: Optional - show relevant representatives</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                  <span className="text-blue-800">Usage Data: Optional - help us improve the platform</span>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Rights (GDPR/CCPA Compliant)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-gray-700"><strong>Access:</strong> See all data we have about you</span>
                  </div>
                  <div className="flex items-center">
                    <Settings className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-gray-700"><strong>Correction:</strong> Fix any inaccurate information</span>
                  </div>
                  <div className="flex items-center">
                    <Trash2 className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-gray-700"><strong>Deletion:</strong> Request complete data removal</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Download className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-gray-700"><strong>Portability:</strong> Download your data in standard formats</span>
                  </div>
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-gray-700"><strong>Restriction:</strong> Limit how we use your data</span>
                  </div>
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-gray-700"><strong>Objection:</strong> Opt out of certain data processing</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Data Protection */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Protection Measures</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Lock className="h-5 w-5 text-green-600 mr-2" />
                  Security
                </h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• Encryption at rest and in transit</li>
                  <li>• Row Level Security (RLS) policies</li>
                  <li>• Access controls and authentication</li>
                  <li>• Regular security audits</li>
                </ul>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Shield className="h-5 w-5 text-blue-600 mr-2" />
                  Data Minimization
                </h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• Only collect what we need</li>
                  <li>• Data used only for stated purposes</li>
                  <li>• Automatic deletion after specified periods</li>
                  <li>• No cross-site tracking</li>
                </ul>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Settings className="h-5 w-5 text-purple-600 mr-2" />
                  Your Privacy Controls
                </h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• Opt-out anytime</li>
                  <li>• Download your data</li>
                  <li>• Complete account deletion</li>
                  <li>• Anonymous usage options</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
            
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Clock className="h-5 w-5 text-blue-600 mr-2" />
                How Long We Keep Data
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Analytics Data:</span>
                    <span className="font-medium text-gray-900">30 days, then deleted</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">User Profiles:</span>
                    <span className="font-medium text-gray-900">1 year, then anonymized</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Audit Logs:</span>
                    <span className="font-medium text-gray-900">90 days, then deleted</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Consent Records:</span>
                    <span className="font-medium text-gray-900">7 years (legal requirement)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Data Requests:</span>
                    <span className="font-medium text-gray-900">3 years (legal requirement)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Voting Records:</span>
                    <span className="font-medium text-gray-900">Anonymized immediately</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            
            <div className="bg-white border rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Privacy Questions</h3>
                  <div className="space-y-2 text-gray-700">
                    <div>• <strong>Email:</strong> privacy@rankedchoicedemocracy.org</div>
                    <div>• <strong>Data Rights:</strong> rights@rankedchoicedemocracy.org</div>
                    <div>• <strong>Security Issues:</strong> security@rankedchoicedemocracy.org</div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Response Times</h3>
                  <div className="space-y-2 text-gray-700">
                    <div>• <strong>General Inquiries:</strong> 48 hours</div>
                    <div>• <strong>Data Rights Requests:</strong> 30 days maximum</div>
                    <div>• <strong>Security Issues:</strong> 24 hours</div>
                    <div>• <strong>Urgent Matters:</strong> Immediate response</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Trust Statement */}
          <section className="mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-green-900 mb-3 flex items-center">
                <Shield className="h-6 w-6 mr-2" />
                Your Trust Matters
              </h2>
              <p className="text-green-800 mb-4">
                We&apos;re committed to protecting your privacy while enabling democratic participation. 
                This platform only works if users trust it with their data and their votes.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">Our Commitments</h3>
                  <ul className="space-y-1 text-green-800 text-sm">
                    <li>• Transparency: Clear, honest communication</li>
                    <li>• Control: You decide what data to share</li>
                    <li>• Security: Strong protection for your information</li>
                    <li>• Rights: Easy access to your privacy rights</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">Questions or Concerns?</h3>
                  <p className="text-green-800 text-sm">
                    We&apos;re here to help. Contact us anytime with privacy questions or concerns. 
                    Your privacy and trust are essential to our mission of improving democracy.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
