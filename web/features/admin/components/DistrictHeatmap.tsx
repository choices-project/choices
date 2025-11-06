/**
 * DistrictHeatmap Component
 * 
 * Visualizes engagement metrics across congressional districts.
 * Features:
 * - Color-coded engagement levels (green → yellow → red)
 * - State and level filtering
 * - K-anonymity enforcement (minimum 5 users per district)
 * - Export functionality (CSV)
 * - Privacy-first: Only shows aggregated data
 * 
 * Created: November 5, 2025
 * Status: ✅ Production-ready
 */

'use client';

import { 
  Download, 
  MapPin, 
  Filter, 
  AlertCircle,
  RefreshCw 
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type HeatmapEntry = {
  district_id: string;
  district_name: string;
  state: string;
  level: string;
  engagement_count: number;
  representative_count: number;
};

type HeatmapData = {
  ok: boolean;
  heatmap: HeatmapEntry[];
  k_anonymity: number;
};

type DistrictHeatmapProps = {
  className?: string;
  defaultState?: string;
  defaultLevel?: 'federal' | 'state' | 'local';
  defaultMinCount?: number;
};

const US_STATES = [
  'All States', 'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI',
  'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND',
  'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA',
  'WA', 'WV', 'WI', 'WY', 'DC'
];

const LEVELS = ['All Levels', 'federal', 'state', 'local'];

/**
 * Get color based on engagement count
 * Green (low) → Yellow (medium) → Red (high)
 */
const getEngagementColor = (count: number, maxCount: number): string => {
  if (maxCount === 0) return '#22c55e'; // green-500
  
  const ratio = count / maxCount;
  
  if (ratio < 0.33) {
    // Green to Yellow
    const r = Math.round(34 + (234 - 34) * (ratio / 0.33));
    const g = 197;
    const b = 94;
    return `rgb(${r}, ${g}, ${b})`;
  } else if (ratio < 0.67) {
    // Yellow to Orange
    const r = 234;
    const g = Math.round(197 - (197 - 159) * ((ratio - 0.33) / 0.34));
    const b = Math.round(94 - 64 * ((ratio - 0.33) / 0.34));
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Orange to Red
    const r = Math.round(234 - (234 - 239) * ((ratio - 0.67) / 0.33));
    const g = Math.round(159 - (159 - 68) * ((ratio - 0.67) / 0.33));
    const b = Math.round(30 - (30 - 68) * ((ratio - 0.67) / 0.33));
    return `rgb(${r}, ${g}, ${b})`;
  }
};

export default function DistrictHeatmap({
  className = '',
  defaultState = 'All States',
  defaultLevel = 'federal',
  defaultMinCount = 5
}: DistrictHeatmapProps) {
  const [data, setData] = useState<HeatmapEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState(defaultState);
  const [selectedLevel, setSelectedLevel] = useState<string>(defaultLevel);
  const [minCount, setMinCount] = useState(defaultMinCount);
  const [kAnonymity, setKAnonymity] = useState(5);

  const fetchHeatmapData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedState !== 'All States') {
        params.append('state', selectedState);
      }
      if (selectedLevel !== 'All Levels') {
        params.append('level', selectedLevel);
      }
      params.append('min_count', String(minCount));

      const response = await fetch(`/api/v1/civics/heatmap?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch heatmap data: ${response.statusText}`);
      }

      const result: HeatmapData = await response.json();
      
      if (!result.ok) {
        throw new Error('API returned unsuccessful response');
      }

      setData(result.heatmap);
      setKAnonymity(result.k_anonymity);
    } catch (err) {
      console.error('Failed to fetch heatmap data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load heatmap data');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedState, selectedLevel, minCount]);

  useEffect(() => {
    fetchHeatmapData();
  }, [fetchHeatmapData]);

  const handleExport = useCallback(() => {
    if (data.length === 0) return;

    // Create CSV content
    const headers = ['District ID', 'District Name', 'State', 'Level', 'Engagement Count', 'Representatives'];
    const rows = data.map(entry => [
      entry.district_id,
      entry.district_name,
      entry.state,
      entry.level,
      entry.engagement_count.toString(),
      entry.representative_count.toString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `district-heatmap-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data]);

  // Prepare chart data
  const chartData = data.map(entry => ({
    name: entry.district_id,
    engagement: entry.engagement_count,
    fullData: entry
  }));

  const maxEngagement = Math.max(...data.map(d => d.engagement_count), 0);

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            District Engagement Heatmap
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

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            District Engagement Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              District Engagement Heatmap
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Engagement metrics by congressional district (K-anonymity: {kAnonymity})
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={data.length === 0}
            size="sm"
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {US_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Min Count:</label>
            <input
              type="number"
              min="1"
              max="50"
              value={minCount}
              onChange={(e) => setMinCount(Math.max(1, parseInt(e.target.value) || 5))}
              className="w-20 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <Button
            onClick={fetchHeatmapData}
            size="sm"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Privacy Notice */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-800">
            <strong>Privacy Protected:</strong> Only districts with at least {kAnonymity} users are shown 
            to ensure k-anonymity. Individual users cannot be identified.
          </p>
        </div>

        {/* Empty state */}
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <MapPin className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">No data available</p>
            <p className="text-sm">Try adjusting your filters or lowering the minimum count</p>
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Districts</p>
                <p className="text-2xl font-bold text-gray-900">{data.length}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Engagement</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.reduce((sum, d) => sum + d.engagement_count, 0).toLocaleString()}
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Avg per District</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(data.reduce((sum, d) => sum + d.engagement_count, 0) / data.length)}
                </p>
              </div>
            </div>

            {/* Color Legend */}
            <div className="mb-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }} />
                <span className="text-gray-600">Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#eab308' }} />
                <span className="text-gray-600">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }} />
                <span className="text-gray-600">High</span>
              </div>
            </div>

            {/* Chart */}
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: 'Engagement Count', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const data = payload[0].payload.fullData;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-semibold text-gray-900">{data.district_name}</p>
                          <p className="text-sm text-gray-600">{data.district_id}</p>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm">
                              <span className="text-gray-600">Engagement:</span>{' '}
                              <span className="font-medium">{data.engagement_count}</span>
                            </p>
                            <p className="text-sm">
                              <span className="text-gray-600">Representatives:</span>{' '}
                              <span className="font-medium">{data.representative_count}</span>
                            </p>
                            <p className="text-sm">
                              <span className="text-gray-600">Level:</span>{' '}
                              <span className="font-medium capitalize">{data.level}</span>
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Bar dataKey="engagement" name="Engagement Count">
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getEngagementColor(entry.engagement, maxEngagement)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Districts */}
            {data.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Top 5 Most Engaged Districts</h3>
                <div className="space-y-2">
                  {data
                    .sort((a, b) => b.engagement_count - a.engagement_count)
                    .slice(0, 5)
                    .map((district, index) => (
                      <div 
                        key={district.district_id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono">{index + 1}</Badge>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{district.district_name}</p>
                            <p className="text-xs text-gray-500">{district.district_id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {district.engagement_count.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">engagements</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

