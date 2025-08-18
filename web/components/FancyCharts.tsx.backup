'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ChartData {
  name: string
  value: number
  color: string
  gradient?: string
}

interface FancyDonutChartProps {
  data: ChartData[]
  size?: number
  strokeWidth?: number
  title?: string
}

export function FancyDonutChart({ data, size = 200, strokeWidth = 20, title }: FancyDonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  let currentAngle = -90 // Start from top
  
  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          {data.map((item, index) => (
            <linearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={item.color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={item.color} stopOpacity="1" />
            </linearGradient>
          ))}
        </defs>
        
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100
          const angle = (percentage / 100) * 360
          const startAngle = currentAngle
          const endAngle = currentAngle + angle
          
          const x1 = size / 2 + radius * Math.cos((startAngle * Math.PI) / 180)
          const y1 = size / 2 + radius * Math.sin((startAngle * Math.PI) / 180)
          const x2 = size / 2 + radius * Math.cos((endAngle * Math.PI) / 180)
          const y2 = size / 2 + radius * Math.sin((endAngle * Math.PI) / 180)
          
          const largeArcFlag = angle > 180 ? 1 : 0
          
          const pathData = [
            `M ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`
          ].join(' ')
          
          currentAngle += angle
          
          return (
            <motion.path
              key={index}
              d={pathData}
              fill="none"
              stroke={`url(#gradient-${index})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: index * 0.2, ease: "easeOut" }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer transition-all duration-300"
              style={{
                filter: hoveredIndex === index ? 'drop-shadow(0 0 8px rgba(0,0,0,0.3))' : 'none'
              }}
            />
          )
        })}
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{total}</div>
          <div className="text-sm text-gray-600">{title || 'Total'}</div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <motion.div
            key={index}
            className="flex items-center gap-2 text-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-medium">{item.name}</span>
            <span className="text-gray-500">({item.value})</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

interface FancyBarChartProps {
  data: ChartData[]
  height?: number
  title?: string
}

export function FancyBarChart({ data, height = 300, title }: FancyBarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  
  const maxValue = Math.max(...data.map(item => item.value))
  
  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
      
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100
          
          return (
            <motion.div
              key={index}
              className="relative"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{item.value}</span>
                  <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
                </div>
              </div>
              
              <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full relative"
                  style={{
                    background: `linear-gradient(90deg, ${item.color}80, ${item.color})`,
                    width: `${percentage}%`
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                >
                  {/* Animated shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                    animate={{
                      x: hoveredIndex === index ? ['-100%', '100%'] : '-100%'
                    }}
                    transition={{
                      duration: hoveredIndex === index ? 1 : 0,
                      repeat: hoveredIndex === index ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

interface FancyProgressRingProps {
  percentage: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
}

export function FancyProgressRing({ 
  percentage, 
  size = 120, 
  strokeWidth = 8, 
  color = '#3b82f6',
  label 
}: FancyProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  
  return (
    <div className="relative inline-block">
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="text-2xl font-bold text-gray-900"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            {percentage}%
          </motion.div>
          {label && (
            <div className="text-xs text-gray-600 mt-1">{label}</div>
          )}
        </div>
      </div>
    </div>
  )
}

interface FancyMetricCardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  color?: string
}

export function FancyMetricCard({ 
  title, 
  value, 
  change, 
  trend = 'neutral', 
  icon, 
  color = '#3b82f6' 
}: FancyMetricCardProps) {
  return (
    <motion.div
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
      whileHover={{ y: -4, scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div 
            className="p-3 rounded-xl"
            style={{ backgroundColor: `${color}20` }}
          >
            <div style={{ color }}>
              {icon}
            </div>
          </div>
        )}
        
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          
          {change && (
            <div className="flex items-center gap-1 mt-1">
              <motion.div
                className={`w-0 h-0 border-l-4 border-r-4 border-l-transparent border-r-transparent ${
                  trend === 'up' ? 'border-b-green-500' : 
                  trend === 'down' ? 'border-t-red-500' : 'border-b-gray-500'
                }`}
                animate={{ 
                  y: trend === 'up' ? [-2, 0, -2] : 
                     trend === 'down' ? [2, 0, 2] : [0]
                }}
                transition={{ 
                  duration: 1, 
                  repeat: trend !== 'neutral' ? Infinity : 0,
                  ease: "easeInOut"
                }}
              />
              <span className={`text-xs ${
                trend === 'up' ? 'text-green-600' : 
                trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {change}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
