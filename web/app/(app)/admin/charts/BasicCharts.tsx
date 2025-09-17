import React from 'react';
import { Bar, Line, Pie } from '@/components/charts';

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface BasicLineChartProps {
  data: ChartData[];
  dataKey: string;
  title: string;
  height?: number;
  color?: string;
}

export const BasicLineChart: React.FC<BasicLineChartProps> = ({
  data,
  dataKey,
  title,
  height = 300,
  color = '#0088FE',
}) => {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <Line 
        data={data} 
        dataKey={dataKey} 
        xAxisKey="name"
        height={height}
        strokeColor={color}
      />
    </div>
  );
};

interface BasicBarChartProps {
  data: ChartData[];
  dataKey: string;
  title: string;
  height?: number;
  color?: string;
}

export const BasicBarChart: React.FC<BasicBarChartProps> = ({
  data,
  dataKey,
  title,
  height = 300,
  color = '#00C49F',
}) => {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <Bar 
        data={data} 
        dataKey={dataKey} 
        xAxisKey="name"
        height={height}
      />
    </div>
  );
};

interface BasicPieChartProps {
  data: ChartData[];
  title: string;
  height?: number;
}

export const BasicPieChart: React.FC<BasicPieChartProps> = ({
  data,
  title,
  height = 300,
}) => {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <Pie 
        data={data} 
        dataKey="value"
        nameKey="name"
        height={height}
        colors={COLORS}
      />
    </div>
  );
};

// Metric card component for quick stats
interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendValue?: number;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  trendValue,
  icon,
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
  };

  const trendColorClasses = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600',
  };

  const getTrendColor = (trend: string) => {
    if (trend?.includes('+')) return trendColorClasses.positive;
    if (trend?.includes('-')) return trendColorClasses.negative;
    return trendColorClasses.neutral;
  };

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]} shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 ${getTrendColor(trend)}`}>
              {trend} {trendValue && `(${trendValue})`}
            </p>
          )}
        </div>
        {icon && <div className="text-2xl opacity-75">{icon}</div>}
      </div>
    </div>
  );
};

// Chart wrapper component for consistent styling
interface ChartWrapperProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  title,
  children,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-lg border shadow-sm p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
};

// Loading skeleton for charts
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => {
  return (
    <div className="w-full">
      <div className="h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
      <div
        className="bg-gray-200 rounded animate-pulse"
        style={{ height: `${height}px` }}
      ></div>
    </div>
  );
};
