'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
  trend: string;
  confidence: number;
  previousValue?: number;
}

interface SimpleChartProps {
  data: ChartDataPoint[];
  title: string;
  subtitle?: string;
  type: 'bar' | 'progress' | 'trend';
  height?: number;
  showTrends?: boolean;
  showConfidence?: boolean;
}

export function SimpleChart({
  data,
  title,
  subtitle,
  type,
  height = 300,
  showTrends = true,
  showConfidence = true
}: SimpleChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  const renderBarChart = () => (
    <div className="space-y-4">
      {sortedData.map((item, index) => {
        const percentage = (item.value / maxValue) * 100;
        const trendChange = item.previousValue ? item.value - item.previousValue : 0;
        const trendPercentage = item.previousValue ? (trendChange / item.previousValue) * 100 : 0;

        return (
          <div key={item.name} className="group">
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
            
            <div className="relative">
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full relative transition-all duration-1000 ease-out"
                  style={{ 
                    backgroundColor: item.color,
                    width: `${percentage}%`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderProgressChart = () => (
    <div className="space-y-6">
      {sortedData.map((item, index) => (
        <div key={item.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{item.name}</span>
            <span className="text-sm font-bold text-gray-900">{item.value}%</span>
          </div>
          <div className="relative overflow-hidden bg-gray-100 rounded-full h-2">
            <div
              className="h-full transition-all duration-1000 ease-out"
              style={{ 
                backgroundColor: item.color,
                width: `${item.value}%`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderTrendChart = () => (
    <div className="space-y-4">
      {sortedData.map((item, index) => {
        const trendChange = item.previousValue ? item.value - item.previousValue : 0;
        
        return (
          <div
            key={item.name}
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
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      backgroundColor: item.color,
                      width: `${item.value}%`
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
          </div>
        );
      })}
    </div>
  );

  return (
    <div
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
    </div>
  );
}
