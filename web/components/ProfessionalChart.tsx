'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Progress from '@radix-ui/react-progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
  trend: string;
  confidence: number;
  previousValue?: number;
}

interface ProfessionalChartProps {
  data: ChartDataPoint[];
  title: string;
  subtitle?: string;
  type: 'bar' | 'progress' | 'trend';
  height?: number;
  showTrends?: boolean;
  showConfidence?: boolean;
}

export function ProfessionalChart({
  data,
  title,
  subtitle,
  type,
  height = 300,
  showTrends = true,
  showConfidence = true
}: ProfessionalChartProps) {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value)), [data]);
  const sortedData = useMemo(() => [...data].sort((a, b) => b.value - a.value), [data]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const renderBarChart = () => (
    <div className="space-y-4">
      {sortedData.map((item, index) => {
        const percentage = (item.value / maxValue) * 100;
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
          <Progress.Root className="relative overflow-hidden bg-gray-100 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.value}%` }}
              transition={{ 
                duration: 1.5, 
                delay: index * 0.2,
                ease: "easeOut"
              }}
            >
              <Progress.Indicator 
                className="h-full transition-all duration-300 ease-out"
                style={{ backgroundColor: item.color }}
              />
            </motion.div>
          </Progress.Root>
        </motion.div>
      ))}
    </div>
  );

  const renderTrendChart = () => (
    <div className="space-y-4">
      {sortedData.map((item, index) => {
        const trendChange = item.previousValue ? item.value - item.previousValue : 0;
        
        return (
          <motion.div
            key={item.name}
            variants={itemVariants}
            className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-900">{item.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold" style={{ color: item.color }}>
                  {item.value}%
                </span>
                {showTrends && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    trendChange > 0 ? 'bg-green-100 text-green-700' :
                    trendChange < 0 ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {trendChange > 0 && <TrendingUp className="h-3 w-3" />}
                    {trendChange < 0 && <TrendingDown className="h-3 w-3" />}
                    {trendChange === 0 && <Minus className="h-3 w-3" />}
                    {trendChange > 0 ? '+' : ''}{trendChange.toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ 
                      duration: 1.2, 
                      delay: index * 0.1 + 0.5,
                      ease: "easeOut"
                    }}
                  />
                </div>
              </div>
              {showConfidence && (
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  ±{item.confidence}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
      style={{ height }}
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-600">{subtitle}</p>
        )}
      </div>

      <div className="h-full">
        {type === 'bar' && renderBarChart()}
        {type === 'progress' && renderProgressChart()}
        {type === 'trend' && renderTrendChart()}
      </div>
    </motion.div>
  );
}
