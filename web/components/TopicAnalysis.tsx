'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, TrendingDown, Users, MapPin, 
  GraduationCap, DollarSign, Building2, 
  Filter, BarChart3, Target, Zap
} from 'lucide-react'
import { FancyDonutChart, FancyBarChart } from './FancyCharts'

interface TopicData {
  question: string
  totalVotes: number
  overallResult: {
    option: string
    percentage: number
    votes: number
  }
  breakdowns: {
    age: { range: string; option: string; percentage: number }[]
    location: { state: string; option: string; percentage: number }[]
    education: { level: string; option: string; percentage: number }[]
    income: { bracket: string; option: string; percentage: number }[]
    urbanRural: { type: string; option: string; percentage: number }[]
  }
  insights: string[]
}

const sampleTopicData: TopicData = {
  question: "Should the government provide universal basic income (UBI) of $1,000/month to all citizens?",
  totalVotes: 1250,
  overallResult: {
    option: "Yes",
    percentage: 68,
    votes: 850
  },
  breakdowns: {
    age: [
      { range: "18-24", option: "Yes", percentage: 82 },
      { range: "25-34", option: "Yes", percentage: 75 },
      { range: "35-44", option: "Yes", percentage: 65 },
      { range: "45-54", option: "Yes", percentage: 58 },
      { range: "55-64", option: "Yes", percentage: 45 },
      { range: "65+", option: "Yes", percentage: 38 }
    ],
    location: [
      { state: "California", option: "Yes", percentage: 78 },
      { state: "Texas", option: "Yes", percentage: 52 },
      { state: "New York", option: "Yes", percentage: 75 },
      { state: "Florida", option: "Yes", percentage: 48 },
      { state: "Illinois", option: "Yes", percentage: 72 }
    ],
    education: [
      { level: "High School", option: "Yes", percentage: 72 },
      { level: "Some College", option: "Yes", percentage: 70 },
      { level: "Bachelor's", option: "Yes", percentage: 65 },
      { level: "Graduate", option: "Yes", percentage: 58 }
    ],
    income: [
      { bracket: "Under $30k", option: "Yes", percentage: 85 },
      { bracket: "$30k-$50k", option: "Yes", percentage: 78 },
      { bracket: "$50k-$75k", option: "Yes", percentage: 65 },
      { bracket: "$75k-$100k", option: "Yes", percentage: 52 },
      { bracket: "$100k+", option: "Yes", percentage: 38 }
    ],
    urbanRural: [
      { type: "Urban", option: "Yes", percentage: 75 },
      { type: "Suburban", option: "Yes", percentage: 62 },
      { type: "Rural", option: "Yes", percentage: 48 }
    ]
  },
  insights: [
    "Younger voters strongly support UBI (82% of 18-24 year olds)",
    "Support decreases with age and income level",
    "Urban areas show higher support than rural areas",
    "Education level has minimal impact on support"
  ]
}

interface TopicAnalysisProps {
  data?: TopicData
  title?: string
  subtitle?: string
}

export function TopicAnalysis({ 
  data = sampleTopicData, 
  title = "Topic Analysis", 
  subtitle = "See how different demographics view this issue" 
}: TopicAnalysisProps) {
  const [activeBreakdown, setActiveBreakdown] = useState('age')
  const [showInsights, setShowInsights] = useState(false)

  const breakdownOptions = [
    { id: 'age', label: 'Age Groups', icon: Users, color: '#3b82f6' },
    { id: 'location', label: 'Location', icon: MapPin, color: '#10b981' },
    { id: 'education', label: 'Education', icon: GraduationCap, color: '#f59e0b' },
    { id: 'income', label: 'Income', icon: DollarSign, color: '#06b6d4' },
    { id: 'urbanRural', label: 'Urban/Rural', icon: Building2, color: '#84cc16' }
  ]

  const getActiveData = () => {
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16']
    const breakdown = data.breakdowns[activeBreakdown as keyof typeof data.breakdowns]
    
    return breakdown.map((item, index) => ({
      name: item[Object.keys(item)[0] as keyof typeof item] as string,
      value: item.percentage,
      color: colors[index % colors.length]
    }))
  }

  const getBreakdownLabel = () => {
    switch (activeBreakdown) {
      case 'age': return 'Age Groups'
      case 'location': return 'States'
      case 'education': return 'Education Level'
      case 'income': return 'Income Bracket'
      case 'urbanRural': return 'Area Type'
      default: return 'Demographic'
    }
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.h2 
          className="text-3xl font-bold text-gray-900 mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {title}
        </motion.h2>
        <motion.p 
          className="text-lg text-gray-600 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {subtitle}
        </motion.p>
      </div>

      {/* Question */}
      <motion.div
        className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Sample Poll Question:</h3>
        <p className="text-lg text-gray-700 mb-4">{data.question}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.totalVotes.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Votes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.overallResult.percentage}%</div>
              <div className="text-sm text-gray-600">Support</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Overall Result</div>
            <div className="text-lg font-semibold text-gray-900">{data.overallResult.option}</div>
          </div>
        </div>
      </motion.div>

      {/* Breakdown Toggle */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {breakdownOptions.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={() => setActiveBreakdown(option.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeBreakdown === option.id
                ? 'bg-blue-100 text-blue-700 shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <option.icon className="h-4 w-4" />
            {option.label}
          </motion.button>
        ))}
      </div>

      {/* Chart Display */}
      <motion.div
        key={activeBreakdown}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="text-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Support by {getBreakdownLabel()}
          </h3>
        </div>
        <div className="flex justify-center">
          <FancyDonutChart
            data={getActiveData()}
            size={300}
            strokeWidth={25}
            title={`${getBreakdownLabel()} Breakdown`}
          />
        </div>
      </motion.div>

      {/* Insights Toggle */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <button
          onClick={() => setShowInsights(!showInsights)}
          className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
        >
          <Target className="h-5 w-5" />
          {showInsights ? 'Hide Insights' : 'Show Key Insights'}
        </button>
      </motion.div>

      {/* Insights Panel */}
      {showInsights && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="border-t border-gray-200 pt-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Key Insights from {getBreakdownLabel()} Analysis
          </h3>
          <div className="grid gap-3">
            {data.insights.map((insight, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{insight}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Capability Showcase */}
      <motion.div
        className="text-center mt-8 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="h-5 w-5 text-green-600" />
          <span className="font-semibold text-green-800">Analysis Capabilities</span>
        </div>
        <p className="text-sm text-green-700">
          This demonstrates how we can break down any poll result by demographics, 
          revealing patterns and insights that help understand the full picture.
        </p>
      </motion.div>
    </div>
  )
}
