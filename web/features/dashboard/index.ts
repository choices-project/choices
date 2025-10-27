/**
 * DASHBOARD Feature Exports
 * 
 * Feature exports for dashboard functionality
 * Types are now centralized in /web/types/
 * 
 * Updated: October 26, 2025
 * Status: ✅ REFACTORED
 */

// Dashboard Components
export { default as PersonalDashboard } from './components/PersonalDashboard';

// Dashboard Types - Now using centralized types
export type { PersonalAnalytics } from '@/types/dashboard-PersonalAnalytics';
export type { ElectedOfficial } from '@/types/dashboard-ElectedOfficial';

