/**
 * Centralized Formatting Utilities
 * 
 * Provides consistent formatting functions across the application.
 * Eliminates duplicate formatting code and standardizes number/date formatting.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

// ============================================================================
// NUMBER FORMATTING
// ============================================================================

/**
 * Format usage count with appropriate suffixes (K, M, B)
 */
export function formatUsageCount(count: number): string {
  if (count < 1000) {
    return count.toString();
  }
  
  if (count < 1000000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  
  if (count < 1000000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  
  return `${(count / 1000000000).toFixed(1)}B`;
}

/**
 * Format engagement rate as percentage
 */
export function formatEngagementRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/**
 * Format growth rate as percentage with sign
 */
export function formatGrowthRate(rate: number): string {
  const sign = rate >= 0 ? '+' : '';
  return `${sign}${(rate * 100).toFixed(1)}%`;
}

/**
 * Format trending score with appropriate precision
 */
export function formatTrendingScore(score: number): string {
  if (score < 1) {
    return score.toFixed(2);
  }
  
  if (score < 10) {
    return score.toFixed(1);
  }
  
  return Math.round(score).toString();
}

/**
 * Format currency with appropriate precision
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

// ============================================================================
// DATE/TIME FORMATTING
// ============================================================================

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(d);
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(d);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  
  return formatDate(d);
}

// ============================================================================
// TEXT FORMATTING
// ============================================================================

/**
 * Format text for display with proper capitalization
 */
export function formatDisplayName(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format hashtag name for display
 */
export function formatHashtagName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  return `${text.slice(0, maxLength - 3)  }...`;
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ============================================================================
// PERFORMANCE FORMATTING
// ============================================================================

/**
 * Format performance metrics
 */
export function formatPerformanceMetric(value: number, unit: 'ms' | 'bytes' | 'count' | 'score'): string {
  switch (unit) {
    case 'ms':
      return `${value.toFixed(1)}ms`;
    case 'bytes':
      return formatFileSize(value);
    case 'count':
      return formatUsageCount(value);
    case 'score':
      return formatTrendingScore(value);
    default:
      return value.toString();
  }
}

/**
 * Format percentage with appropriate precision
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if a value is a valid number
 */
export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Check if a value is a valid date
 */
export function isValidDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Check if a string is a valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
