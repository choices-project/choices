/**
 * TemporalAnalysisChart Component
 * 
 * Displays temporal patterns in user engagement.
 * Shows when users are most active (time-of-day, day-of-week).
 * 
 * Features:
 * - Hour-of-day heatmap (24 hours)
 * - Day-of-week bar chart
 * - Peak times analysis
 * - Activity velocity trends
 * - CSV export functionality
 * 
 * Created: November 5, 2025
 * Status: ✅ Production-ready
 */

'use client';

import { 
  Download, 
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type HourlyData = {
  hour: number;
  activity: number;
  label: string;
};

type DailyData = {
  day: string;
  activity: number;
  dayIndex: number;
};

type VelocityData = {
  timestamp: string;
  velocity: number;
};

type TemporalData = {
  ok: boolean;
  hourly: HourlyData[];
  daily: DailyData[];
  velocity: VelocityData[];
  peakHour: number;
  peakDay: string;
  avgActivity: number;
};

type TemporalAnalysisChartProps = {
  className?: string;
  defaultTab?: 'hourly' | 'daily' | 'velocity';
  defaultDateRange?: '7d' | '30d' | '90d';
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * Get color based on activity level (for heatmap)
 */
const getActivityColor = (activity: number, maxActivity: number): string => {
  if (maxActivity === 0) return '#e5e7eb'; // gray-200
  
  const ratio = activity / maxActivity;
  
  if (ratio < 0.2) return '#dbeafe'; // blue-100
  if (ratio < 0.4) return '#93c5fd'; // blue-300
  if (ratio < 0.6) return '#60a5fa'; // blue-400
  if (ratio < 0.8) return '#3b82f6'; // blue-500
  return '#1d4ed8'; // blue-700
};

/**
 * Format hour for display (e.g., "2 AM", "2 PM")
 */
const formatHour = (hour: number): string => {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
};

export default function TemporalAnalysisChart({
  className = '',
  defaultTab = 'hourly',
  defaultDateRange = '30d'
}: TemporalAnalysisChartProps) {
  const [data, setData] = useState<TemporalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [dateRange, setDateRange] = useState(defaultDateRange);

  const fetchTemporalData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analytics/temporal?range=${dateRange}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch temporal data: ${response.statusText}`);
      }

      const result: TemporalData = await response.json();
      
      if (!result.ok) {
        throw new Error('Invalid API response');
      }

      setData(result);
    } catch (err) {
      console.error('Failed to fetch temporal data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load temporal data');
      
      // Use mock data for development
      const mockData = generateMockData(dateRange);
      setData(mockData);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchTemporalData();
  }, [fetchTemporalData]);

  const handleExport = useCallback(() => {
    if (!data) return;

    // Create CSV content
    const sections = [
      ['Hourly Activity'],
      ['Hour', 'Activity Count'],
      ...data.hourly.map(h => [h.label, h.activity.toString()]),
      [''],
      ['Daily Activity'],
      ['Day', 'Activity Count'],
      ...data.daily.map(d => [d.day, d.activity.toString()]),
      [''],
      ['Summary'],
      ['Peak Hour', formatHour(data.peakHour)],
      ['Peak Day', data.peakDay],
      ['Average Activity', data.avgActivity.toFixed(1)]
    ];

    const csvContent = sections.map(row => row.join(',')).join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `temporal-analysis-${dateRange}-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data, dateRange]);

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Temporal Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state (with mock data)
  const showError = error && data;

  if (!data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Temporal Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error ?? 'No data available'}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxHourlyActivity = Math.max(...data.hourly.map(h => h.activity), 0);
  const maxDailyActivity = Math.max(...data.daily.map(d => d.activity), 0);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Temporal Analysis
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              User activity patterns by time of day and day of week
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <Button
              onClick={handleExport}
              size="sm"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Error Notice */}
        {showError && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Using mock data for demonstration. {error}
            </p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <p className="text-sm text-gray-600">Peak Hour</p>
            <p className="text-2xl font-bold text-blue-700">{formatHour(data.peakHour)}</p>
            <p className="text-xs text-gray-500 mt-1">Most active time</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <p className="text-sm text-gray-600">Peak Day</p>
            <p className="text-2xl font-bold text-green-700">{data.peakDay}</p>
            <p className="text-xs text-gray-500 mt-1">Most active day</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <p className="text-sm text-gray-600">Avg Activity</p>
            <p className="text-2xl font-bold text-purple-700">{data.avgActivity.toFixed(0)}</p>
            <p className="text-xs text-gray-500 mt-1">Per time slot</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hourly">Hourly Pattern</TabsTrigger>
            <TabsTrigger value="daily">Daily Pattern</TabsTrigger>
            <TabsTrigger value="velocity">Velocity Trends</TabsTrigger>
          </TabsList>

          {/* Hourly Pattern Tab */}
          <TabsContent value="hourly" className="mt-6">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">24-Hour Activity Pattern</h3>
              <p className="text-xs text-gray-600">
                Shows user activity across all hours of the day (0 = midnight, 12 = noon)
              </p>
            </div>

            {/* Heatmap Grid */}
            <div className="mb-6 grid grid-cols-12 gap-2">
              {data.hourly.map((hour) => (
                <div
                  key={hour.hour}
                  className="relative aspect-square rounded transition-all hover:scale-110 cursor-pointer"
                  style={{
                    backgroundColor: getActivityColor(hour.activity, maxHourlyActivity)
                  }}
                  title={`${hour.label}: ${hour.activity} activities`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-700">
                      {hour.hour}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mb-6 flex items-center justify-center gap-4 text-xs">
              <span className="text-gray-600">Low</span>
              <div className="flex gap-1">
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((ratio) => (
                  <div
                    key={ratio}
                    className="w-6 h-4 rounded"
                    style={{ backgroundColor: getActivityColor(ratio * 100, 100) }}
                  />
                ))}
              </div>
              <span className="text-gray-600">High</span>
            </div>

            {/* Bar Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourly} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis label={{ value: 'Activity Count', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const data = payload[0]?.payload;
                      if (!data) return null;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-semibold text-gray-900">{data.label}</p>
                          <p className="text-sm text-blue-600">
                            Activity: <span className="font-medium">{data.activity}</span>
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Bar dataKey="activity" name="Activity Count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Daily Pattern Tab */}
          <TabsContent value="daily" className="mt-6">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Day-of-Week Pattern</h3>
              <p className="text-xs text-gray-600">
                Shows user activity across days of the week
              </p>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.daily} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis label={{ value: 'Activity Count', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const data = payload[0]?.payload;
                      if (!data) return null;
                      const percentage = maxDailyActivity > 0 
                        ? ((data.activity / maxDailyActivity) * 100).toFixed(1)
                        : 0;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-semibold text-gray-900">{data.day}</p>
                          <p className="text-sm text-green-600">
                            Activity: <span className="font-medium">{data.activity}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            {percentage}% of peak activity
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Bar dataKey="activity" name="Activity Count">
                    {data.daily.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.day === data.peakDay ? '#22c55e' : '#3b82f6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Days */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Engagement by Day</h3>
              <div className="space-y-2">
                {data.daily
                  .sort((a, b) => b.activity - a.activity)
                  .map((day, index) => (
                    <div 
                      key={day.day}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📅'}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{day.day}</p>
                          <p className="text-xs text-gray-500">
                            {((day.activity / maxDailyActivity) * 100).toFixed(0)}% of peak
                          </p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{day.activity}</p>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>

          {/* Velocity Trends Tab */}
          <TabsContent value="velocity" className="mt-6">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Engagement Velocity</h3>
              <p className="text-xs text-gray-600">
                Rate of change in user engagement over time
              </p>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.velocity} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis label={{ value: 'Velocity (activities/hour)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const data = payload[0]?.payload;
                      if (!data) return null;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-semibold text-gray-900">{data.timestamp}</p>
                          <p className="text-sm text-purple-600">
                            Velocity: <span className="font-medium">{data.velocity.toFixed(1)}</span>
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="velocity" 
                    stroke="#a855f7" 
                    strokeWidth={2}
                    name="Activity Velocity"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>

        {/* Refresh Button */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={fetchTemporalData}
            size="sm"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Generate mock data for development
 */
function generateMockData(_range: string): TemporalData {
  // Generate hourly data (24 hours)
  const hourly: HourlyData[] = Array.from({ length: 24 }, (_, i) => {
    // Simulate realistic patterns: low at night, high during day
    let baseActivity = 20;
    if (i >= 6 && i <= 9) baseActivity = 80; // Morning peak
    else if (i >= 12 && i <= 14) baseActivity = 90; // Lunch peak
    else if (i >= 18 && i <= 21) baseActivity = 100; // Evening peak
    else if (i >= 22 || i <= 5) baseActivity = 10; // Night low
    
    const activity = baseActivity + Math.floor(Math.random() * 20);
    
    return {
      hour: i,
      activity,
      label: formatHour(i)
    };
  });

  // Generate daily data (7 days)
  const daily: DailyData[] = DAYS.map((day, index) => ({
    day,
    dayIndex: index,
    activity: Math.floor(Math.random() * 200) + 400
  }));

  // Generate velocity data (last 24 data points)
  const velocity: VelocityData[] = Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    velocity: Math.floor(Math.random() * 50) + 30
  }));

  // Calculate peak values
  const peakHourData = hourly.length > 0 ? hourly.reduce((max, h) => h.activity > max.activity ? h : max, hourly[0]) : { hour: 0, activity: 0, label: '12 AM' };
  const peakDayData = daily.length > 0 ? daily.reduce((max, d) => d.activity > max.activity ? d : max, daily[0]) : { day: 'Monday', activity: 0, dayIndex: 0 };
  const avgActivity = hourly.length > 0 ? hourly.reduce((sum, h) => sum + h.activity, 0) / hourly.length : 0;

  return {
    ok: true,
    hourly,
    daily,
    velocity,
    peakHour: peakHourData.hour,
    peakDay: peakDayData.day,
    avgActivity
  };
}

