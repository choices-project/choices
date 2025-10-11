'use client'

import { useState } from 'react'
import { motion } from 'framer-motion';
import { 
  Vote, Users, BarChart3, Shield, 
  Star, Crown, CheckCircle, ArrowRight,
  Lock, Unlock
} from 'lucide-react'

import type { Tier, TierSystemProps } from '../types';

/**
 * Trust Level System Component
 * 
 * Displays different trust levels based on verification methods:
 * - Anonymous, Verified, Trusted, Certified levels
 * - Permission-based access based on verification strength
 * - Privacy-focused benefits and protections
 * - Verification progression guidance
 * 
 * Features:
 * - Trust level comparison functionality
 * - Verification method highlighting
 * - Permission-based access display
 * - Privacy protection features
 * 
 * @param {TierSystemProps} props - Component props
 * @returns {JSX.Element} Trust level system interface
 */
export function TierSystem({ tiers, currentTier = 0 }: TierSystemProps) {
  const [showComparison, setShowComparison] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.h2 
          className="text-3xl font-bold text-gray-900 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Your Trust Level & Permissions
        </motion.h2>
        <motion.p 
          className="text-lg text-gray-600 max-w-3xl mx-auto mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Higher verification levels unlock more features while maintaining your privacy. 
          Your data stays protected at every level.
        </motion.p>
        
        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Compare Trust Levels
          </button>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Shield className="w-4 h-4" />
            Privacy Features
          </button>
        </div>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {tiers.map((tier: any, index: any) => (
          <motion.div
            key={tier.level}
            className={`relative p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-xl ${
              tier.popular 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            } ${currentTier >= tier.level ? 'ring-2 ring-green-500' : ''}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            {/* Popular Badge */}
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Most Popular
                </div>
              </div>
            )}

            {/* Current Tier Badge */}
            {currentTier === tier.level && (
              <div className="absolute -top-3 right-4">
                <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Current
                </div>
              </div>
            )}

            {/* Header */}
            <div className="text-center mb-6">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${tier.color}20` }}
              >
                <div style={{ color: tier.color }}>
                  {tier.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">{tier.price}</div>
              <p className="text-sm text-gray-500">
                {tier.level === 0 ? 'Anonymous access' : 'Verified access'}
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-8">
              {tier.features.map((feature: any, featureIndex: any) => (
                <motion.div
                  key={featureIndex}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + featureIndex * 0.05 }}
                >
                  {currentTier >= tier.level ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : currentTier === tier.level - 1 ? (
                    <Unlock className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  ) : (
                    <Lock className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${
                    currentTier >= tier.level ? 'text-gray-700' : 
                    currentTier === tier.level - 1 ? 'text-blue-600 font-medium' : 'text-gray-500'
                  }`}>
                    {feature}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* CTA Button */}
            <motion.button
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                currentTier === tier.level
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : currentTier > tier.level
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : tier.popular
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
              disabled={currentTier > tier.level}
              whileHover={currentTier <= tier.level ? { scale: 1.02 } : {}}
              whileTap={currentTier <= tier.level ? { scale: 0.98 } : {}}
            >
              {currentTier === tier.level ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Current Level
                </>
              ) : currentTier > tier.level ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Already Verified
                </>
              ) : (
                <>
                  {tier.level === 0 ? 'Continue Anonymously' : tier.cta}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* Comparison Section */}
      {showComparison && (
        <motion.div
          className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Trust Level Comparison
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map((tier: any) => (
              <div key={tier.level} className="p-4 bg-white rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-2">{tier.name}</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  {tier.features.map((feature: any, index: any) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Analytics Section */}
      {showAnalytics && (
        <motion.div
          className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-200"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy Protection Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">100%</div>
              <div className="text-sm text-blue-700">Data Encryption</div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">Zero</div>
              <div className="text-sm text-blue-700">Data Selling</div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">Full</div>
              <div className="text-sm text-blue-700">User Control</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Trust Message */}
      <motion.div
        className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="font-semibold text-gray-900">Privacy-First Design</span>
        </div>
        <p className="text-sm text-gray-600">
          Your verification level can be changed anytime. Your data stays protected and under your control.
        </p>
      </motion.div>
    </div>
  )
}

// Default trust levels for the platform
export const defaultTiers: Tier[] = [
  {
    level: 0,
    name: "Anonymous",
    price: "Anonymous",
    features: [
      "Vote on public polls",
      "View basic results",
      "Anonymous participation",
      "Basic privacy protection"
    ],
    cta: "Continue Anonymously",
    color: "#6b7280",
    icon: <Vote className="h-6 w-6" />
  },
  {
    level: 1,
    name: "Verified",
    price: "Email Verified",
    features: [
      "Everything in Anonymous",
      "Create your own polls",
      "Comment on polls",
      "Enhanced privacy controls",
      "Email notifications",
      "Profile customization"
    ],
    cta: "Verify with Email",
    popular: true,
    color: "#3b82f6",
    icon: <Users className="h-6 w-6" />
  },
  {
    level: 2,
    name: "Trusted",
    price: "WebAuthn Verified",
    features: [
      "Everything in Verified",
      "Advanced poll features",
      "Priority support",
      "Enhanced data protection",
      "Biometric authentication",
      "Highest trust score",
      "Early access to features"
    ],
    cta: "Verify with WebAuthn",
    color: "#8b5cf6",
    icon: <Crown className="h-6 w-6" />
  }
]
