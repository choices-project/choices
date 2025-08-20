'use client'

import { motion } from 'framer-motion'
import { 
  Vote, Users, BarChart3, Shield, Zap, 
  Star, Crown, CheckCircle, ArrowRight,
  Lock, Unlock
} from 'lucide-react'

interface Tier {
  level: number;
  name: string;
  price: string;
  features: string[];
  cta: string;
  popular?: boolean;
  color: string;
  icon: React.ReactNode;
}

interface TierSystemProps {
  tiers: Tier[];
  currentTier?: number;
}

export function TierSystem({ tiers, currentTier = 0 }: TierSystemProps) {
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
          Choose Your Level of Engagement
        </motion.h2>
        <motion.p 
          className="text-lg text-gray-600 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Start free, upgrade when you're ready. No pressure, no hidden fees.
        </motion.p>
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
                {tier.level === 0 ? 'Forever free' : 'per month'}
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
                  ) : (
                    <Lock className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${
                    currentTier >= tier.level ? 'text-gray-700' : 'text-gray-500'
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
                  Current Plan
                </>
              ) : currentTier > tier.level ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Already Upgraded
                </>
              ) : (
                <>
                  {tier.level === 0 ? 'Get Started' : tier.cta}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* Trust Message */}
      <motion.div
        className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="font-semibold text-gray-900">No Commitment Required</span>
        </div>
        <p className="text-sm text-gray-600">
          Upgrade or downgrade anytime. Cancel whenever you want. Your data stays with you.
        </p>
      </motion.div>
    </div>
  )
}

// Default tiers for the platform
export const defaultTiers: Tier[] = [
  {
    level: 0,
    name: "Citizen",
    price: "Free",
    features: [
      "Vote on unlimited polls",
      "View basic results",
      "Access to community polls",
      "Basic privacy protection"
    ],
    cta: "Start Free",
    color: "#6b7280",
    icon: <Vote className="h-6 w-6" />
  },
  {
    level: 1,
    name: "Activist",
    price: "$9.99",
    features: [
      "Everything in Citizen",
      "Create your own polls",
      "Detailed analytics",
      "Comment on polls",
      "Enhanced privacy controls",
      "Priority support"
    ],
    cta: "Upgrade Now",
    popular: true,
    color: "#3b82f6",
    icon: <Users className="h-6 w-6" />
  },
  {
    level: 2,
    name: "Organizer",
    price: "$19.99",
    features: [
      "Everything in Activist",
      "Custom poll templates",
      "Advanced analytics",
      "Team collaboration",
      "API access",
      "Dedicated support",
      "Early access to features"
    ],
    cta: "Upgrade Now",
    color: "#8b5cf6",
    icon: <Crown className="h-6 w-6" />
  }
]
