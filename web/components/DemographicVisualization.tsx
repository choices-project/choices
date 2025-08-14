'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, MapPin, GraduationCap, DollarSign, 
  Building2, Globe, TrendingUp, Eye, EyeOff 
} from 'lucide-react'
import { FancyDonutChart, FancyBarChart } from './FancyCharts'

interface DemographicData {
  ageDistribution: { range: string; count: number; percentage: number }[];
  geographicSpread: { state: string; count: number; percentage: number }[];
  politicalBreakdown: { affiliation: string; count: number; percentage: number }[];
  educationLevels: { level: string; count: number; percentage: number }[];
  incomeBrackets: { bracket: string; count: number; percentage: number }[];
  urbanRural: { type: string; count: number; percentage: number }[];
}

interface DemographicVisualizationProps {
  data: DemographicData;
  title: string;
  subtitle: string;
  showPrivacyToggle?: boolean;
}

export function DemographicVisualization({ 
  data, 
  title, 
  subtitle, 
  showPrivacyToggle = true 
}: DemographicVisualizationProps) {
  const [activeTab, setActiveTab] = useState('age')
  const [showDetailed, setShowDetailed] = useState(false)

  const tabs = [
    { id: 'age', label: 'Age', icon: Users, color: '#3b82f6' },
    { id: 'location', label: 'Location', icon: MapPin, color: '#10b981' },
    { id: 'politics', label: 'Politics', icon: TrendingUp, color: '#8b5cf6' },
    { id: 'education', label: 'Education', icon: GraduationCap, color: '#f59e0b' },
    { id: 'income', label: 'Income', icon: DollarSign, color: '#ef4444' },
    { id: 'urban', label: 'Urban/Rural', icon: Building2, color: '#06b6d4' }
  ]

  const getActiveData = () => {
    switch (activeTab) {
      case 'age':
        return data.ageDistribution.map(item => ({
          name: item.range,
          value: item.percentage,
          color: '#3b82f6'
        }))
      case 'location':
        return data.geographicSpread.slice(0, 10).map(item => ({
          name: item.state,
          value: item.percentage,
          color: '#10b981'
        }))
      case 'politics':
        return data.politicalBreakdown.map(item => ({
          name: item.affiliation,
          value: item.percentage,
          color: '#8b5cf6'
        }))
      case 'education':
        return data.educationLevels.map(item => ({
          name: item.level,
          value: item.percentage,
          color: '#f59e0b'
        }))
      case 'income':
        return data.incomeBrackets.map(item => ({
          name: item.bracket,
          value: item.percentage,
          color: '#ef4444'
        }))
      case 'urban':
        return data.urbanRural.map(item => ({
          name: item.type,
          value: item.percentage,
          color: '#06b6d4'
        }))
      default:
        return []
    }
  }

  const getTotalUsers = () => {
    return data.ageDistribution.reduce((sum, item) => sum + item.count, 0)
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
        
        {/* Privacy Toggle */}
        {showPrivacyToggle && (
          <motion.div 
            className="flex items-center justify-center gap-2 text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
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
        transition={{ delay: 0.3 }}
      >
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-50 rounded-full">
          <Users className="h-6 w-6 text-blue-600" />
          <span className="text-2xl font-bold text-blue-600">
            {getTotalUsers().toLocaleString()}
          </span>
          <span className="text-blue-600 font-medium">active citizens</span>
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
        transition={{ delay: 0.4 }}
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

// Mock data for development
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
  politicalBreakdown: [
    { affiliation: 'Independent', count: 350000, percentage: 42 },
    { affiliation: 'Democrat', count: 250000, percentage: 30 },
    { affiliation: 'Republican', count: 200000, percentage: 24 },
    { affiliation: 'Other', count: 50000, percentage: 6 }
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
