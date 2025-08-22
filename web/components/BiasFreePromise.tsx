'use client'

import { motion } from 'framer-motion';
import { 
  Shield, Users, TrendingUp, Eye, 
  Building2, Globe, Zap, CheckCircle,
  XCircle, Heart
} from 'lucide-react'

interface Promise {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

interface BiasFreePromiseProps {
  title: string;
  promises: Promise[];
}

export function BiasFreePromise({ title, promises }: BiasFreePromiseProps) {
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
          {title}
        </motion.h2>
        <motion.p 
          className="text-lg text-gray-600 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Our platform is built on principles of transparency, data integrity, and unbiased methodology.
        </motion.p>
      </div>

      {/* Promises Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {promises.map((promise: any, index: any) => (
          <motion.div
            key={index}
            className="relative p-6 rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-all duration-300 hover:shadow-lg"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            {/* Icon */}
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: `${promise.color}20` }}
            >
              <div style={{ color: promise.color }}>
                {promise.icon}
              </div>
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {promise.title}
            </h3>
            <p className="text-gray-600 mb-3">
              {promise.description}
            </p>


          </motion.div>
        ))}
      </div>

      {/* Comparison Section */}
      <motion.div
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* What We Do */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              What We Actually Do
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Heart className="h-4 w-4 text-green-600" />
                Community-driven question creation
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Eye className="h-4 w-4 text-green-600" />
                Transparent demographic breakdowns
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Shield className="h-4 w-4 text-green-600" />
                Privacy protection with encryption
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Real-time, unfiltered results
              </li>
            </ul>
          </div>

          {/* What Others Do */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              What "Other" Sites Do
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Building2 className="h-4 w-4 text-red-600" />
                Corporate-driven question creation
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Eye className="h-4 w-4 text-red-600" />
                Obscured funding and methodology
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Zap className="h-4 w-4 text-red-600" />
                Algorithmic result manipulation
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <TrendingUp className="h-4 w-4 text-red-600" />
                Curated data presentation
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Trust Indicators */}
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          <Shield className="h-4 w-4" />
          <span>Independent Platform • Unbiased Methodology</span>
        </div>
      </motion.div>
    </div>
  )
}

// Default promises for the platform
export const defaultPromises: Promise[] = [
  {
    icon: <Users className="h-6 w-6" />,
    title: "Community-Driven Questions",
    description: "Our polls are created by actual citizens, ensuring diverse perspectives and authentic engagement.",
    color: "#3b82f6"
  },
  {
    icon: <Eye className="h-6 w-6" />,
    title: "Complete Transparency",
    description: "See exactly who&apos;s voting, where they&apos;re from, and what they think. No hidden demographics or obscured data.",
    color: "#10b981"
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Independent Methodology",
    description: "Our platform operates independently, ensuring unbiased data collection and analysis.",
    color: "#8b5cf6"
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Unfiltered Results",
    description: "What you see is what people actually voted. No algorithmic manipulation or statistical adjustments.",
    color: "#f59e0b"
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Diverse Participation",
    description: "Our community represents the full spectrum of society, ensuring comprehensive demographic coverage.",
    color: "#ef4444"
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Real-Time Democracy",
    description: "Get real-time results as votes come in. Experience democratic participation as it happens.",
    color: "#06b6d4"
  }
]
