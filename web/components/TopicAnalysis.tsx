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
    age: { range: string; yes: number; no: number }[]
    location: { state: string; yes: number; no: number }[]
    education: { level: string; yes: number; no: number }[]
    income: { bracket: string; yes: number; no: number }[]
    urbanRural: { type: string; yes: number; no: number }[]
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
      { range: "18-24", yes: 82, no: 18 },
      { range: "25-34", yes: 75, no: 25 },
      { range: "35-44", yes: 65, no: 35 },
      { range: "45-54", yes: 58, no: 42 },
      { range: "55-64", yes: 45, no: 55 },
      { range: "65+", yes: 38, no: 62 }
    ],
    location: [
      { state: "California", yes: 78, no: 22 },
      { state: "Texas", yes: 52, no: 48 },
      { state: "New York", yes: 75, no: 25 },
      { state: "Florida", yes: 48, no: 52 },
      { state: "Illinois", yes: 72, no: 28 }
    ],
    education: [
      { level: "High School", yes: 72, no: 28 },
      { level: "Some College", yes: 70, no: 30 },
      { level: "Bachelor's", yes: 65, no: 35 },
      { level: "Graduate", yes: 58, no: 42 }
    ],
    income: [
      { bracket: "Under $30k", yes: 85, no: 15 },
      { bracket: "$30k-$50k", yes: 78, no: 22 },
      { bracket: "$50k-$75k", yes: 65, no: 35 },
      { bracket: "$75k-$100k", yes: 52, no: 48 },
      { bracket: "$100k+", yes: 38, no: 62 }
    ],
    urbanRural: [
      { type: "Urban", yes: 75, no: 25 },
      { type: "Suburban", yes: 62, no: 38 },
      { type: "Rural", yes: 48, no: 52 }
    ]
  },
  insights: {
    yes: [
      "Younger voters strongly support UBI (82% of 18-24 year olds)",
      "Support decreases with age and income level",
      "Urban areas show higher support than rural areas",
      "Education level has minimal impact on support"
    ],
    no: [
      "Older voters strongly oppose UBI (62% of 65+ year olds)",
      "Opposition increases with age and income level",
      "Rural areas show higher opposition than urban areas",
      "Higher education correlates with increased opposition"
    ]
  }
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
  const [showYes, setShowYes] = useState(true)

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
    
    return breakdown.map((item, index) => {
      const key = Object.keys(item)[0] as keyof typeof item
      const name = item[key] as string
      const value = showYes ? item.yes : item.no
      const color = showYes ? colors[index % colors.length] : '#ef4444' // Red for No
      
      return {
        name,
        value,
        color
      }
    })
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

      {/* Yes/No Toggle */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <motion.button
            onClick={() => setShowYes(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
              showYes
                ? 'bg-green-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <TrendingUp className="h-4 w-4" />
            Support (Yes)
          </motion.button>
          <motion.button
            onClick={() => setShowYes(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
              !showYes
                ? 'bg-red-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <TrendingDown className="h-4 w-4" />
            Oppose (No)
          </motion.button>
        </div>
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
            {showYes ? 'Support' : 'Opposition'} by {getBreakdownLabel()}
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
            {data.insights[showYes ? 'yes' : 'no'].map((insight, index) => (
              <motion.div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  showYes 
                    ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200' 
                    : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {showYes ? (
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
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
