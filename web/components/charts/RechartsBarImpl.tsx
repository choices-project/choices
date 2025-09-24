'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

type BarChartProps = {
  data: any[]
  dataKey?: string
  xAxisKey?: string
  height?: number
  width?: number
  className?: string
}

export default function RechartsBarImpl({ 
  data, 
  dataKey = 'value', 
  xAxisKey = 'name',
  height = 300,
  className = ''
}: BarChartProps) {
  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip />
          <Bar dataKey={dataKey} fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
