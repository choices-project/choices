/**
 * Analytics Page - ADMIN ONLY
 * 
 * Unified analytics dashboard with comprehensive insights.
 * 
 * Consolidated: November 5, 2025
 * - Uses EnhancedAnalyticsDashboard (existing component)
 * - Integrated new charts via tabs
 * - Single source of truth for analytics
 * 
 * Access: Admin-only
 */

'use client';

import React from 'react';
import { EnhancedAnalyticsDashboard } from '@/features/analytics';

/**
 * Simple page wrapper for EnhancedAnalyticsDashboard
 * All functionality is in the dashboard component
 */
export default function AnalyticsPage() {
  return <EnhancedAnalyticsDashboard enableRealTime enableNewSchema />;
}
