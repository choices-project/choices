"use client"

import { lazy, Suspense } from 'react'

// Lazy load heavy chart components
const ProfessionalChart = lazy(() => import('@/components/ProfessionalChart').then(module => ({ default: module.ProfessionalChart })))
const FancyCharts = lazy(() => import('@/components/FancyCharts').then(module => ({ default: module.FancyBarChart })))
const SimpleBarChart = lazy(() => import('@/components/SimpleBarChart').then(module => ({ default: module.SimpleBarChart })))
const SimpleChart = lazy(() => import('@/components/SimpleChart').then(module => ({ default: module.SimpleChart })))

// Chart wrapper with loading fallback
const ChartWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <Suspense fallback={
    <div className={`w-full h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center ${className}`}>
      <div className="text-gray-500">Loading chart...</div>
    </div>
  }>
    {children}
  </Suspense>
)

// Export lazy charts with wrappers
export const LazyProfessionalChart = (props: any) => (
  <ChartWrapper>
    <ProfessionalChart {...props} />
  </ChartWrapper>
)

export const LazyFancyCharts = (props: any) => (
  <ChartWrapper>
    <FancyCharts {...props} />
  </ChartWrapper>
)

export const LazySimpleBarChart = (props: any) => (
  <ChartWrapper>
    <SimpleBarChart {...props} />
  </ChartWrapper>
)

export const LazySimpleChart = (props: any) => (
  <ChartWrapper>
    <SimpleChart {...props} />
  </ChartWrapper>
)

