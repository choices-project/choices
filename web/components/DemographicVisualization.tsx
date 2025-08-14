'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, MapPin, GraduationCap, DollarSign, 
  Building2, Globe, Heart, Eye, EyeOff,
  Target, Zap, Shield, Database, Wifi, WifiOff
} from 'lucide-react'
import { FancyDonutChart, FancyBarChart } from './FancyCharts'
import { useDemographics } from '../hooks/useDemographics'

interface DemographicData {
  ageDistribution: { range: string; count: number; percentage: number }[];
  geographicSpread: { state: string; count: number; percentage: number }[];
  commonInterests: { interest: string; count: number; percentage: number }[];
  topValues: { value: string; count: number; percentage: number }[];
  educationLevels: { level: string; count: number; percentage: number }[];
  incomeBrackets: { bracket: string; count: number; percentage: number }[];
  urbanRural: { type: string; count: number; percentage: number }[];
}

interface DemographicVisualizationProps {
  data?: DemographicData;
  title: string;
  subtitle: string;
  showPrivacyToggle?: boolean;
  useRealData?: boolean;
}

export function DemographicVisualization({ 
  data: propData, 
  title, 
  subtitle, 
  showPrivacyToggle = true,
  useRealData = true
}: DemographicVisualizationProps) {
  const [activeTab, setActiveTab] = useState('interests')
  const [showDetailed, setShowDetailed] = useState(false)
  const [useMockData, setUseMockData] = useState(!useRealData)

  // Fetch real data if enabled
  const { data: realData, loading, error } = useDemographics()

  // Use real data if available, otherwise fall back to prop data or mock data
  const data = useMockData ? propData : (realData || propData)

  const tabs = [
    { id: 'interests', label: 'Common Interests', icon: Heart, color: '#ef4444' },
    { id: 'values', label: 'Top Values', icon: Target, color: '#8b5cf6' },
    { id: 'age', label: 'Age', icon: Users, color: '#3b82f6' },
    { id: 'location', label: 'Location', icon: MapPin, color: '#10b981' },
    { id: 'education', label: 'Education', icon: GraduationCap, color: '#f59e0b' },
    { id: 'income', label: 'Income', icon: DollarSign, color: '#06b6d4' },
    { id: 'urban', label: 'Urban/Rural', icon: Building2, color: '#84cc16' }
  ]

  const getActiveData = () => {
    if (!data) return []
    
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1']
    
    switch (activeTab) {
      case 'age':
        return data.ageDistribution.map((item, index) => ({
          name: item.range,
          value: item.percentage,
          color: colors[index % colors.length]
        }))
      case 'location':
        return data.geographicSpread.slice(0, 10).map((item, index) => ({
          name: item.state,
          value: item.percentage,
          color: colors[index % colors.length]
        }))
      case 'interests':
        return data.commonInterests.map((item, index) => ({
          name: item.interest,
          value: item.percentage,
          color: colors[index % colors.length]
        }))
      case 'values':
        return data.topValues.map((item, index) => ({
          name: item.value,
          value: item.percentage,
          color: colors[index % colors.length]
        }))
      case 'education':
        return data.educationLevels.map((item, index) => ({
          name: item.level,
          value: item.percentage,
          color: colors[index % colors.length]
        }))
      case 'income':
        return data.incomeBrackets.map((item, index) => ({
          name: item.bracket,
          value: item.percentage,
          color: colors[index % colors.length]
        }))
      case 'urban':
        return data.urbanRural.map((item, index) => ({
          name: item.type,
          value: item.percentage,
          color: colors[index % colors.length]
        }))
      default:
        return []
    }
  }

  const getTotalUsers = () => {
    if (!data) return 0
    return data.ageDistribution.reduce((sum, item) => sum + item.count, 0)
  }

  const getInsightMessage = () => {
    switch (activeTab) {
      case 'interests':
        return "We all care about the same things. The differences are in how we think we should achieve them."
      case 'values':
        return "Our values unite us more than our politics divide us."
      case 'age':
        return "Every generation has a voice. Young and old alike are shaping our future."
      case 'location':
        return "From coast to coast, we're all part of the same conversation."
      case 'education':
        return "Education levels vary, but wisdom and common sense are universal."
      case 'income':
        return "Economic circumstances differ, but our aspirations are shared."
      case 'urban':
        return "City, suburb, or rural - we all want the same things for our communities."
      default:
        return "Real people, real perspectives, real democracy."
    }
  }

  if (loading && useRealData && !useMockData) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading real demographic data...</p>
        </div>
      </div>
    )
  }

  if (error && useRealData && !useMockData) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="text-center">
          <WifiOff className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Connection Error</h3>
          <p className="text-gray-600 mb-4">Unable to load real data. Using demo data instead.</p>
          <button
            onClick={() => setUseMockData(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Use Demo Data
          </button>
        </div>
      </div>
    )
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
        
        {/* Data Source Toggle */}
        <motion.div 
          className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2">
            {useMockData ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
            <span>{useMockData ? 'Demo Data' : 'Live Data'}</span>
          </div>
          <button
            onClick={() => setUseMockData(!useMockData)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Switch to {useMockData ? 'Live' : 'Demo'} Data
          </button>
        </motion.div>
        
        {/* Privacy Toggle */}
        {showPrivacyToggle && (
          <motion.div 
            className="flex items-center justify-center gap-2 text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {showDetailed ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <button
              onClick={() => setShowDetailed(!showDetailed)}
              className="hover:text-gray-700 transition-colors"
            >
              {showDetailed ? 'Showing detailed data' : 'Showing anonymized data'}
            </button>
          </motion.div>
        )}
      </div>

      {/* Total Users Display */}
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-50 rounded-full">
          <Users className="h-6 w-6 text-blue-600" />
          <span className="text-2xl font-bold text-blue-600">
            {getTotalUsers().toLocaleString()}
          </span>
          <span className="text-blue-600 font-medium">active citizens</span>
          {!useMockData && realData && (
            <span className="text-xs text-blue-500">
              (Updated: {new Date(realData.lastUpdated).toLocaleTimeString()})
            </span>
          )}
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {tabs.map((tab, index) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-700 shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Chart Display */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="flex justify-center">
          <FancyDonutChart
            data={getActiveData()}
            size={300}
            strokeWidth={25}
            title={tabs.find(t => t.id === activeTab)?.label || ''}
          />
        </div>
      </motion.div>

      {/* Insight Message */}
      <motion.div
        className="text-center mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart className="h-5 w-5 text-red-600" />
          <span className="font-semibold text-gray-800">Finding Common Ground</span>
        </div>
        <p className="text-sm text-gray-700 italic">
          "{getInsightMessage()}"
        </p>
      </motion.div>

      {/* Detailed Breakdown */}
      {showDetailed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="border-t border-gray-200 pt-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Detailed Breakdown
          </h3>
          <div className="space-y-3">
            {getActiveData().map((item, index) => (
              <motion.div
                key={item.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-gray-700">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{item.value}%</span>
                  <span className="text-sm text-gray-500">
                    ({Math.round((item.value / 100) * getTotalUsers()).toLocaleString()} people)
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Trust Message */}
      <motion.div
        className="text-center mt-8 p-4 bg-green-50 rounded-lg border border-green-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Globe className="h-5 w-5 text-green-600" />
          <span className="font-semibold text-green-800">Real People, Real Data</span>
        </div>
        <p className="text-sm text-green-700">
          This is who's actually voting. No hidden demographics, no corporate filters.
        </p>
      </motion.div>
    </div>
  )
}

// Updated mock data focusing on common interests and values
export const mockDemographicData: DemographicData = {
  ageDistribution: [
    { range: '18-24', count: 125000, percentage: 15 },
    { range: '25-34', count: 250000, percentage: 30 },
    { range: '35-44', count: 200000, percentage: 24 },
    { range: '45-54', count: 150000, percentage: 18 },
    { range: '55-64', count: 75000, percentage: 9 },
    { range: '65+', count: 50000, percentage: 6 }
  ],
  geographicSpread: [
    { state: 'California', count: 150000, percentage: 18 },
    { state: 'Texas', count: 120000, percentage: 14 },
    { state: 'New York', count: 100000, percentage: 12 },
    { state: 'Florida', count: 90000, percentage: 11 },
    { state: 'Illinois', count: 75000, percentage: 9 },
    { state: 'Pennsylvania', count: 65000, percentage: 8 },
    { state: 'Ohio', count: 55000, percentage: 7 },
    { state: 'Michigan', count: 50000, percentage: 6 },
    { state: 'Georgia', count: 45000, percentage: 5 },
    { state: 'North Carolina', count: 40000, percentage: 5 }
  ],
  commonInterests: [
    { interest: 'Affordable Healthcare', count: 700000, percentage: 84 },
    { interest: 'Quality Education', count: 650000, percentage: 78 },
    { interest: 'Economic Security', count: 600000, percentage: 72 },
    { interest: 'Environmental Protection', count: 550000, percentage: 66 },
    { interest: 'Community Safety', count: 500000, percentage: 60 },
    { interest: 'Infrastructure Investment', count: 450000, percentage: 54 }
  ],
  topValues: [
    { value: 'Family & Community', count: 750000, percentage: 90 },
    { value: 'Fairness & Justice', count: 700000, percentage: 84 },
    { value: 'Personal Freedom', count: 650000, percentage: 78 },
    { value: 'Hard Work & Responsibility', count: 600000, percentage: 72 },
    { value: 'Innovation & Progress', count: 550000, percentage: 66 },
    { value: 'Tradition & Stability', count: 500000, percentage: 60 }
  ],
  educationLevels: [
    { level: 'Bachelor\'s Degree', count: 300000, percentage: 36 },
    { level: 'Some College', count: 200000, percentage: 24 },
    { level: 'High School', count: 175000, percentage: 21 },
    { level: 'Graduate Degree', count: 125000, percentage: 15 },
    { level: 'Less than HS', count: 50000, percentage: 6 }
  ],
  incomeBrackets: [
    { bracket: '$50k-$75k', count: 200000, percentage: 24 },
    { bracket: '$30k-$50k', count: 175000, percentage: 21 },
    { bracket: '$75k-$100k', count: 150000, percentage: 18 },
    { bracket: '$100k+', count: 125000, percentage: 15 },
    { bracket: '$20k-$30k', count: 100000, percentage: 12 },
    { bracket: 'Under $20k', count: 75000, percentage: 9 }
  ],
  urbanRural: [
    { type: 'Urban', count: 500000, percentage: 60 },
    { type: 'Suburban', count: 250000, percentage: 30 },
    { type: 'Rural', count: 100000, percentage: 12 }
  ]
}
