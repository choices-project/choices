import React, { lazy, Suspense } from 'react';

"use client"

// Lazy load individual icon components for better tree-shaking
const Shield = lazy(() => import('lucide-react').then(module => ({ default: module.Shield })))
const Vote = lazy(() => import('lucide-react').then(module => ({ default: module.Vote })))
const CheckCircle = lazy(() => import('lucide-react').then(module => ({ default: module.CheckCircle })))
const TrendingUp = lazy(() => import('lucide-react').then(module => ({ default: module.TrendingUp })))
const Clock = lazy(() => import('lucide-react').then(module => ({ default: module.Clock })))
const Lock = lazy(() => import('lucide-react').then(module => ({ default: module.Lock })))
const Users = lazy(() => import('lucide-react').then(module => ({ default: module.Users })))
const BarChart3 = lazy(() => import('lucide-react').then(module => ({ default: module.BarChart3 })))
const ArrowRight = lazy(() => import('lucide-react').then(module => ({ default: module.ArrowRight })))

// Icon wrapper with loading fallback
const IconWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <Suspense fallback={<div className={`w-5 h-5 bg-gray-200 animate-pulse rounded ${className}`} />}>
    {children}
  </Suspense>
)

// Export lazy icons with wrappers
export const LazyShield = (props: any) => (
  <IconWrapper>
    <Shield {...props} />
  </IconWrapper>
)

export const LazyVote = (props: any) => (
  <IconWrapper>
    <Vote {...props} />
  </IconWrapper>
)

export const LazyCheckCircle = (props: any) => (
  <IconWrapper>
    <CheckCircle {...props} />
  </IconWrapper>
)

export const LazyTrendingUp = (props: any) => (
  <IconWrapper>
    <TrendingUp {...props} />
  </IconWrapper>
)

export const LazyClock = (props: any) => (
  <IconWrapper>
    <Clock {...props} />
  </IconWrapper>
)

export const LazyLock = (props: any) => (
  <IconWrapper>
    <Lock {...props} />
  </IconWrapper>
)

export const LazyUsers = (props: any) => (
  <IconWrapper>
    <Users {...props} />
  </IconWrapper>
)

export const LazyBarChart3 = (props: any) => (
  <IconWrapper>
    <BarChart3 {...props} />
  </IconWrapper>
)

export const LazyArrowRight = (props: any) => (
  <IconWrapper>
    <ArrowRight {...props} />
  </IconWrapper>
)
