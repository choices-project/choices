
import { motion, useReducedMotion } from 'framer-motion';
import { 
  Shield, Users, TrendingUp, Eye, 
  Building2, Globe, Zap, CheckCircle,
  XCircle, Heart
} from 'lucide-react'
import React from 'react';

'use client'

type Promise = {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

type BiasFreePromiseProps = {
  title: string;
  promises: Promise[];
}

export function BiasFreePromise({ title, promises }: BiasFreePromiseProps) {
  const shouldReduceMotion = useReducedMotion();
  const anim = (delay = 0) => shouldReduceMotion
    ? {}
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay } };

  return (
    <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.h2 
          className="text-3xl font-bold text-foreground mb-4"
          {...anim(0)}
        >
          {title}
        </motion.h2>
        <motion.p 
          className="text-lg text-muted-foreground max-w-3xl mx-auto"
          {...anim(0.1)}
        >
          Our platform is built on principles of transparency, data integrity, and unbiased methodology.
        </motion.p>
      </div>

      {/* Promises Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {promises.map((promise: any, index: any) => (
          <motion.div
            key={index}
            className="relative p-6 rounded-xl border-2 border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
            {...anim(index * 0.1)}
            {...(!shouldReduceMotion ? { whileHover: { y: -5 } } : {})}
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
            <h3 className="text-xl font-bold text-foreground mb-2">
              {promise.title}
            </h3>
            <p className="text-muted-foreground mb-3">
              {promise.description}
            </p>


          </motion.div>
        ))}
      </div>

      {/* Comparison Section */}
      <motion.div
        className="bg-gradient-to-r from-muted to-muted rounded-xl p-6 border border-border"
        {...anim(0.6)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* What We Do */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              What We Actually Do
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-foreground/80">
                <Heart className="h-4 w-4 text-green-600" />
                Community-driven question creation
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground/80">
                <Eye className="h-4 w-4 text-green-600" />
                Transparent demographic breakdowns
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground/80">
                <Shield className="h-4 w-4 text-green-600" />
                Privacy protection with encryption
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground/80">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Real-time, unfiltered results
              </li>
            </ul>
          </div>

          {/* What Others Do */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              What &quot;Other&quot; Sites Do
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-foreground/80">
                <Building2 className="h-4 w-4 text-red-600" />
                Corporate-driven question creation
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground/80">
                <Eye className="h-4 w-4 text-red-600" />
                Obscured funding and methodology
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground/80">
                <Zap className="h-4 w-4 text-red-600" />
                Algorithmic result manipulation
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground/80">
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
        {...anim(0.8)}
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
