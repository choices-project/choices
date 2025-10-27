'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

interface LineChartProps {
  data: any[]
  dataKey?: string
  xAxisKey?: string
  height?: number
  width?: number
  className?: string
  strokeColor?: string
}

export default function RechartsLineImpl({ 
  data, 
  dataKey = 'value', 
  xAxisKey = 'name',
  height = 300,
  className = '',
  strokeColor = '#3b82f6'
}: LineChartProps) {
  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} stroke={strokeColor} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

