'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Monitor,
  Smartphone,
  Tablet,
  Desktop,
  Wifi,
  WifiOff,
  Memory,
  HardDrive,
  Gauge,
  Target,
  BarChart3,
  LineChart,
  RefreshCw,
  Settings,
  Info
} from 'lucide-react'
import { getPerformanceMonitor, PerformanceMetrics, PerformanceAlert } from '@/lib/performance-monitor'

interface PerformanceSummary {
  score: number
  grade: string
  latestMetrics: PerformanceMetrics | null
  recentAlerts: PerformanceAlert[]
  totalAlerts: number
  deviceType: string
}

const PerformanceDashboard: React.FC = () => {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)

  useEffect(() => {
    const monitor = getPerformanceMonitor()
    
    const updateSummary = () => {
      setSummary(monitor.getPerformanceSummary())
    }

    // Initial update
    updateSummary()

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        updateSummary()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-yellow-600'
    if (score >= 70) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100'
    if (score >= 80) return 'bg-yellow-100'
    if (score >= 70) return 'bg-orange-100'
    return 'bg-red-100'
  }

  const getMetricColor = (metric: string, value: number | null) => {
    if (!value) return 'text-gray-400'
    
    const thresholds = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      ttfb: { good: 800, poor: 1800 }
    }
    
    const threshold = thresholds[metric as keyof typeof thresholds]
    if (!threshold) return 'text-gray-600'
    
    if (value <= threshold.good) return 'text-green-600'
    if (value <= threshold.poor) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMetricIcon = (metric: string, value: number | null) => {
    if (!value) return <Info className="w-4 h-4" />
    
    const color = getMetricColor(metric, value)
    if (color.includes('green')) return <CheckCircle className="w-4 h-4" />
    if (color.includes('yellow')) return <AlertTriangle className="w-4 h-4" />
    return <AlertTriangle className="w-4 h-4" />
  }

  const formatMetricValue = (metric: string, value: number | null) => {
    if (!value) return 'N/A'
    
    if (metric === 'cls') {
      return value.toFixed(3)
    }
    
    if (metric === 'memoryUsage') {
      return `${value.toFixed(1)} MB`
    }
    
    if (metric === 'networkSpeed') {
      return `${value.toFixed(1)} Mbps`
    }
    
    return `${Math.round(value)}ms`
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="w-4 h-4" />
      case 'tablet': return <Tablet className="w-4 h-4" />
      case 'desktop': return <Desktop className="w-4 h-4" />
      default: return <Monitor className="w-4 h-4" />
    }
  }

  const getOptimizationTips = () => {
    if (!summary?.latestMetrics) return []
    
    const tips = []
    const metrics = summary.latestMetrics
    
    if (metrics.fcp && metrics.fcp > 1800) {
      tips.push('Optimize First Contentful Paint by reducing render-blocking resources')
    }
    
    if (metrics.lcp && metrics.lcp > 2500) {
      tips.push('Improve Largest Contentful Paint by optimizing images and critical resources')
    }
    
    if (metrics.fid && metrics.fid > 100) {
      tips.push('Reduce First Input Delay by minimizing JavaScript execution time')
    }
    
    if (metrics.cls && metrics.cls > 0.1) {
      tips.push('Fix Cumulative Layout Shift by setting explicit dimensions for images and ads')
    }
    
    if (metrics.memoryUsage && metrics.memoryUsage > 50) {
      tips.push('High memory usage detected - consider optimizing memory-intensive operations')
    }
    
    return tips
  }

  if (!summary) {
    return (
      <div className="fixed bottom-6 left-6 z-50">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600">Loading performance data...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 cursor-pointer hover:shadow-xl transition-all duration-300"
            onClick={() => setIsExpanded(true)}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getScoreBgColor(summary.score)}`}>
                <Activity className={`w-5 h-5 ${getScoreColor(summary.score)}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${getScoreColor(summary.score)}`}>
                    {summary.score}
                  </span>
                  <span className="text-sm text-gray-500">/ 100</span>
                </div>
                <div className="text-xs text-gray-500">
                  Grade: {summary.grade} • {summary.deviceType}
                </div>
              </div>
              {summary.totalAlerts > 0 && (
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </div>
              )}
            </div>
          </motion.div>
        )}

        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="bg-white rounded-xl shadow-2xl border border-gray-200 w-96 max-h-[80vh] overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getScoreBgColor(summary.score)}`}>
                    <Activity className={`w-6 h-6 ${getScoreColor(summary.score)}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Performance Monitor</h3>
                    <p className="text-sm text-gray-500">Real-time metrics & optimization</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              {/* Performance Score */}
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(summary.score)} mb-2`}>
                  {summary.score}
                </div>
                <div className="text-sm text-gray-600">
                  Performance Score • Grade {summary.grade}
                </div>
                <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-500">
                  {getDeviceIcon(summary.deviceType)}
                  <span className="capitalize">{summary.deviceType}</span>
                  {summary.latestMetrics?.connectionType && (
                    <>
                      <span>•</span>
                      <Wifi className="w-3 h-3" />
                      <span>{summary.latestMetrics.connectionType}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Core Web Vitals */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Core Web Vitals
                </h4>
                <div className="space-y-3">
                  {[
                    { key: 'fcp', label: 'First Contentful Paint', icon: <Clock className="w-4 h-4" /> },
                    { key: 'lcp', label: 'Largest Contentful Paint', icon: <BarChart3 className="w-4 h-4" /> },
                    { key: 'fid', label: 'First Input Delay', icon: <Zap className="w-4 h-4" /> },
                    { key: 'cls', label: 'Cumulative Layout Shift', icon: <TrendingDown className="w-4 h-4" /> }
                  ].map((metric) => {
                    const value = summary.latestMetrics?.[metric.key as keyof PerformanceMetrics] as number
                    return (
                      <div
                        key={metric.key}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => setSelectedMetric(selectedMetric === metric.key ? null : metric.key)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-gray-600">{metric.icon}</div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{metric.label}</div>
                            <div className="text-xs text-gray-500">{metric.key.toUpperCase()}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getMetricIcon(metric.key, value)}
                          <span className={`text-sm font-medium ${getMetricColor(metric.key, value)}`}>
                            {formatMetricValue(metric.key, value)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* System Metrics */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  System Metrics
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'memoryUsage', label: 'Memory', icon: <Memory className="w-4 h-4" /> },
                    { key: 'networkSpeed', label: 'Network', icon: <Wifi className="w-4 h-4" /> },
                    { key: 'pageLoadTime', label: 'Load Time', icon: <Clock className="w-4 h-4" /> },
                    { key: 'timeToInteractive', label: 'TTI', icon: <Zap className="w-4 h-4" /> }
                  ].map((metric) => {
                    const value = summary.latestMetrics?.[metric.key as keyof PerformanceMetrics] as number
                    return (
                      <div key={metric.key} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-gray-600">{metric.icon}</div>
                          <span className="text-xs font-medium text-gray-700">{metric.label}</span>
                        </div>
                        <div className={`text-sm font-semibold ${getMetricColor(metric.key, value)}`}>
                          {formatMetricValue(metric.key, value)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Alerts */}
              {summary.recentAlerts.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Recent Alerts ({summary.totalAlerts})
                  </h4>
                  <div className="space-y-2">
                    {summary.recentAlerts.slice(0, 3).map((alert, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-3 rounded-lg text-sm ${
                          alert.type === 'critical' ? 'bg-red-50 text-red-700' :
                          alert.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-blue-50 text-blue-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-medium">{alert.metric.toUpperCase()}</span>
                        </div>
                        <div className="mt-1 text-xs opacity-80">{alert.message}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optimization Tips */}
              {getOptimizationTips().length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Optimization Tips
                  </h4>
                  <div className="space-y-2">
                    {getOptimizationTips().map((tip, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700"
                      >
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <RefreshCw className={`w-3 h-3 ${autoRefresh ? 'animate-spin' : ''}`} />
                  <span>Auto-refresh {autoRefresh ? 'on' : 'off'}</span>
                </div>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {autoRefresh ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PerformanceDashboard
