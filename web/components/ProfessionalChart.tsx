'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { motion, Variants } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'

interface ChartData {
  name: string
  value: number
  color: string
  confidence?: number
  previousValue?: number
}

interface ProfessionalChartProps {
  data: ChartData[]
  title?: string
  subtitle?: string
  type?: 'bar' | 'progress'
  showTrends?: boolean
  showConfidence?: boolean
  maxValue?: number
}

export function ProfessionalChart({
  data,
  title,
  subtitle,
  type = 'bar',
  showTrends = false,
  showConfidence = false,
  maxValue
}: ProfessionalChartProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const sortedData = [...data].sort((a, b) => b.value - a.value)
  const calculatedMaxValue = maxValue || Math.max(...data.map(item => item.value))

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  }

  const renderBarChart = () => (
    <div className="space-y-4">
      {sortedData.map((item, index) => {
        const percentage = (item.value / calculatedMaxValue) * 100;
        const trendChange = item.previousValue ? item.value - item.previousValue : 0;
        const trendPercentage = item.previousValue ? (trendChange / item.previousValue) * 100 : 0;

        return (
          <motion.div
            key={item.name}
            variants={itemVariants}
            className="group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 min-w-0 flex-1">
                  {item.name}
                </span>
                {showTrends && (
                  <div className="flex items-center gap-1">
                    {trendChange > 0 && <TrendingUp className="h-3 w-3 text-green-500" />}
                    {trendChange < 0 && <TrendingDown className="h-3 w-3 text-red-500" />}
                    {trendChange === 0 && <Minus className="h-3 w-3 text-gray-400" />}
                    <span className={`text-xs font-medium ${
                      trendChange > 0 ? 'text-green-600' : 
                      trendChange < 0 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {trendChange > 0 ? '+' : ''}{trendPercentage.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">
                  {item.value}%
                </span>
                {showConfidence && (
                  <span className="text-xs text-gray-500">
                    ±{item.confidence}
                  </span>
                )}
              </div>
            </div>
            
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <div className="relative">
                    <motion.div
                      className="h-3 bg-gray-100 rounded-full overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                    >
                      <motion.div
                        className="h-full rounded-full relative"
                        style={{ backgroundColor: item.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ 
                          duration: 1.2, 
                          delay: index * 0.1 + 0.3,
                          ease: "easeOut"
                        }}
                        whileHover={{ 
                          scale: 1.02,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      </motion.div>
                    </motion.div>
                  </div>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg"
                    sideOffset={5}
                  >
                    <div className="font-medium">{item.name}</div>
                    <div className="text-gray-300">
                      Support: {item.value}% | Confidence: ±{item.confidence}
                    </div>
                    {showTrends && item.previousValue && (
                      <div className="text-gray-300">
                        Change: {trendChange > 0 ? '+' : ''}{trendChange.toFixed(1)}%
                      </div>
                    )}
                    <Tooltip.Arrow className="fill-gray-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          </motion.div>
        );
      })}
    </div>
  );

  const renderProgressChart = () => (
    <div className="space-y-6">
      {sortedData.map((item, index) => (
        <motion.div
          key={item.name}
          variants={itemVariants}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{item.name}</span>
            <span className="text-sm font-bold text-gray-900">{item.value}%</span>
          </div>
          <div className="relative">
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full relative"
                style={{ backgroundColor: item.color }}
                initial={{ width: 0 }}
                animate={{ width: `${item.value}%` }}
                transition={{ 
                  duration: 1.2, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        {type === 'bar' ? renderBarChart() : renderProgressChart()}
      </motion.div>
    </div>
  );
}
