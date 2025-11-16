/**
 * Hashtag Utility Functions
 * 
 * Utility functions for hashtag operations, validation, formatting, and analytics
 * 
 * Created: December 19, 2024
 * Status: ✅ ACTIVE
 */

import type { 
  Hashtag, 
  HashtagCategory,
  HashtagValidation
} from '../types';
import {
  formatUsageCount as _formatUsageCount,
  formatEngagementRate as _formatEngagementRate,
  formatGrowthRate as _formatGrowthRate,
  formatTrendingScore as _formatTrendingScore,
} from '@/lib/utils/format-utils';

// ============================================================================
// HASHTAG VALIDATION UTILITIES
// ============================================================================

/**
 * Validate hashtag name format
 */
export function validateHashtagName(name: string): HashtagValidation {
  const normalizedName = normalizeHashtagName(name);
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Basic validation
  if (!normalizedName || normalizedName.length < 2) {
    errors.push('Hashtag must be at least 2 characters long');
  }

  if (normalizedName.length > 50) {
    errors.push('Hashtag must be less than 50 characters');
  }

  if (!/^[a-z0-9_-]+$/.test(normalizedName)) {
    errors.push('Hashtag can only contain letters, numbers, underscores, and hyphens');
  }

  // Check for common issues
  if (normalizedName.includes('__')) {
    warnings.push('Avoid consecutive underscores');
  }

  if (normalizedName.endsWith('_')) {
    warnings.push('Avoid ending with underscore');
  }

  if (normalizedName.startsWith('_')) {
    warnings.push('Avoid starting with underscore');
  }

  // Generate suggestions for common issues
  if (name.includes(' ')) {
    suggestions.push(normalizedName);
    warnings.push('Spaces will be converted to underscores automatically');
  }

  if (normalizedName !== normalizedName.toLowerCase()) {
    suggestions.push(normalizedName.toLowerCase());
  }

  const availability: HashtagValidation['availability'] = {
    is_available: errors.length === 0,
    similar_hashtags: [],
  };

  const [firstError] = errors;
  if (firstError) {
    availability.conflict_reason = firstError;
  }

  return {
    name,
    is_valid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    normalized_name: normalizedName,
    availability,
  };
}

/**
 * Normalize hashtag name
 */
export function normalizeHashtagName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^#/, '') // Remove leading #
    .replace(/\s+/g, '_') // Convert spaces to underscores
    .trim();
}

/**
 * Format hashtag for display
 */
export function formatHashtagForDisplay(name: string): string {
  return `#${normalizeHashtagName(name)}`;
}

// ============================================================================
// HASHTAG CATEGORY UTILITIES
// ============================================================================

/**
 * Get hashtag category color
 */
export function getHashtagCategoryColor(category: HashtagCategory): string {
  const colors: Record<HashtagCategory, string> = {
    politics: 'bg-red-100 text-red-700 border-red-200',
    civics: 'bg-blue-100 text-blue-700 border-blue-200',
    social: 'bg-green-100 text-green-700 border-green-200',
    environment: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    economy: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    health: 'bg-pink-100 text-pink-700 border-pink-200',
    education: 'bg-purple-100 text-purple-700 border-purple-200',
    technology: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    culture: 'bg-orange-100 text-orange-700 border-orange-200',
    sports: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    entertainment: 'bg-violet-100 text-violet-700 border-violet-200',
    news: 'bg-slate-100 text-slate-700 border-slate-200',
    local: 'bg-amber-100 text-amber-700 border-amber-200',
    national: 'bg-rose-100 text-rose-700 border-rose-200',
    international: 'bg-teal-100 text-teal-700 border-teal-200',
    custom: 'bg-gray-100 text-gray-700 border-gray-200',
    global: 'bg-blue-100 text-blue-700 border-blue-200',
    activism: 'bg-red-100 text-red-700 border-red-200',
    community: 'bg-green-100 text-green-700 border-green-200',
    business: 'bg-purple-100 text-purple-700 border-purple-200'
  };

  return colors[category] ?? colors.custom ?? 'bg-gray-100 text-gray-700 border-gray-200';
}

/**
 * Get hashtag category icon
 */
export function getHashtagCategoryIcon(category: HashtagCategory): string {
  const icons: Record<HashtagCategory, string> = {
    politics: '🏛️',
    civics: '🗳️',
    social: '👥',
    environment: '🌱',
    economy: '💰',
    health: '🏥',
    education: '📚',
    technology: '💻',
    culture: '🎭',
    sports: '⚽',
    entertainment: '🎬',
    news: '📰',
    local: '🏘️',
    national: '🇺🇸',
    international: '🌍',
    custom: '🏷️',
    global: '🌐',
    activism: '✊',
    community: '🤝',
    business: '💼'
  };

  return icons[category] ?? icons.custom ?? '🏷️';
}

/**
 * Auto-categorize hashtag based on name
 */
export function autoCategorizeHashtag(name: string): HashtagCategory {
  const normalizedName = normalizeHashtagName(name);
  
  // Politics and civics keywords
  if (/\b(politics|government|election|vote|democracy|republican|democrat|liberal|conservative|senate|congress|president|mayor|governor)\b/.test(normalizedName)) {
    return 'politics';
  }
  
  if (/\b(civics|civic|community|public|citizen|rights|freedom|justice|law|legal)\b/.test(normalizedName)) {
    return 'civics';
  }
  
  // Environment keywords
  if (/\b(environment|climate|green|sustainability|renewable|carbon|pollution|conservation|nature|eco)\b/.test(normalizedName)) {
    return 'environment';
  }
  
  // Health keywords
  if (/\b(health|medical|healthcare|medicine|doctor|hospital|wellness|fitness|mental|therapy)\b/.test(normalizedName)) {
    return 'health';
  }
  
  // Education keywords
  if (/\b(education|school|university|college|student|teacher|learning|academic|research|study)\b/.test(normalizedName)) {
    return 'education';
  }
  
  // Technology keywords
  if (/\b(tech|technology|digital|ai|artificial|software|programming|coding|internet|cyber|data)\b/.test(normalizedName)) {
    return 'technology';
  }
  
  // Economy keywords
  if (/\b(economy|economic|finance|business|money|market|trade|commerce|employment|job|work)\b/.test(normalizedName)) {
    return 'economy';
  }
  
  // Social keywords
  if (/\b(social|community|society|people|human|family|relationship|friendship|support|help)\b/.test(normalizedName)) {
    return 'social';
  }
  
  // Culture keywords
  if (/\b(culture|cultural|art|music|literature|tradition|heritage|diversity|identity|creative)\b/.test(normalizedName)) {
    return 'culture';
  }
  
  // Sports keywords
  if (/\b(sports|sport|athletic|fitness|exercise|team|game|competition|olympic|football|basketball|soccer)\b/.test(normalizedName)) {
    return 'sports';
  }
  
  // Entertainment keywords
  if (/\b(entertainment|entertain|movie|film|tv|television|show|music|game|fun|comedy|drama)\b/.test(normalizedName)) {
    return 'entertainment';
  }
  
  // News keywords
  if (/\b(news|current|breaking|update|report|journalism|media|press|coverage|headline)\b/.test(normalizedName)) {
    return 'news';
  }
  
  // Geographic keywords
  if (/\b(local|neighborhood|city|town|community|regional|area|district|ward)\b/.test(normalizedName)) {
    return 'local';
  }
  
  if (/\b(national|country|federal|state|nation|patriotic|american|usa|united)\b/.test(normalizedName)) {
    return 'national';
  }
  
  if (/\b(international|global|world|foreign|international|worldwide|global|overseas)\b/.test(normalizedName)) {
    return 'international';
  }
  
  return 'custom';
}

// ============================================================================
// HASHTAG FORMATTING UTILITIES
// ============================================================================

/**
 * Format usage count for display
 */
export function formatUsageCount(count: number): string {
  return _formatUsageCount(count);
}

/**
 * Format engagement rate
 */
export function formatEngagementRate(rate: number): string {
  return _formatEngagementRate(rate);
}

/**
 * Format growth rate
 */
export function formatGrowthRate(rate: number): string {
  return _formatGrowthRate(rate);
}

/**
 * Format trending score
 */
export function formatTrendingScore(score: number): string {
  return _formatTrendingScore(score);
}

// ============================================================================
// HASHTAG ANALYTICS UTILITIES
// ============================================================================

/**
 * Calculate hashtag engagement rate
 */
export function calculateEngagementRate(views: number, interactions: number): number {
  if (views === 0) return 0;
  return interactions / views;
}

/**
 * Calculate hashtag growth rate
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate trending score
 */
export function calculateTrendingScore(
  usageCount: number,
  growthRate: number,
  recency: number,
  engagementRate: number
): number {
  const weights = {
    usage: 0.3,
    growth: 0.3,
    recency: 0.2,
    engagement: 0.2
  };
  
  const normalizedUsage = Math.log(usageCount + 1) / Math.log(1000);
  const normalizedGrowth = Math.max(0, Math.min(1, growthRate / 100));
  const normalizedRecency = Math.max(0, Math.min(1, recency));
  const normalizedEngagement = Math.max(0, Math.min(1, engagementRate));
  
  return (
    normalizedUsage * weights.usage +
    normalizedGrowth * weights.growth +
    normalizedRecency * weights.recency +
    normalizedEngagement * weights.engagement
  ) * 100;
}

/**
 * Get hashtag performance level
 */
export function getHashtagPerformanceLevel(score: number): 'low' | 'medium' | 'high' | 'viral' {
  if (score >= 80) return 'viral';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

// ============================================================================
// HASHTAG SEARCH UTILITIES
// ============================================================================

/**
 * Generate hashtag suggestions based on input
 */
export function generateHashtagSuggestions(
  input: string,
  existingHashtags: Hashtag[],
  userHashtags: string[] = []
): string[] {
  const normalizedInput = normalizeHashtagName(input);
  const suggestions: string[] = [];
  
  // Exact matches
  const exactMatches = existingHashtags
    .filter(h => h.name.includes(normalizedInput))
    .map(h => h.name)
    .slice(0, 5);
  
  suggestions.push(...exactMatches);
  
  // Partial matches
  const partialMatches = existingHashtags
    .filter(h => h.name.startsWith(normalizedInput))
    .map(h => h.name)
    .slice(0, 3);
  
  suggestions.push(...partialMatches);
  
  // Related hashtags
  const relatedHashtags = existingHashtags
    .filter(h => h.category && h.usage_count > 100)
    .sort((a, b) => b.usage_count - a.usage_count)
    .map(h => h.name)
    .slice(0, 3);
  
  suggestions.push(...relatedHashtags);
  
  // Remove duplicates and user's existing hashtags
  return [...new Set(suggestions)]
    .filter(suggestion => !userHashtags.includes(suggestion))
    .slice(0, 10);
}

/**
 * Extract hashtags from text
 */
export function extractHashtagsFromText(text: string): string[] {
  const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
  const matches = text.match(hashtagRegex) ?? [];
  return matches.map(tag => normalizeHashtagName(tag));
}

/**
 * Remove hashtags from text
 */
export function removeHashtagsFromText(text: string): string {
  const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
  return text.replace(hashtagRegex, '').trim();
}

// ============================================================================
// HASHTAG COMPARISON UTILITIES
// ============================================================================

/**
 * Compare hashtags by usage
 */
export function compareHashtagsByUsage(a: Hashtag, b: Hashtag): number {
  return b.usage_count - a.usage_count;
}

/**
 * Compare hashtags by trending score
 */
export function compareHashtagsByTrending(a: Hashtag, b: Hashtag): number {
  return (b.trend_score ?? 0) - (a.trend_score ?? 0);
}

/**
 * Compare hashtags by follower count
 */
export function compareHashtagsByFollowers(a: Hashtag, b: Hashtag): number {
  return b.usage_count - a.usage_count;
}

/**
 * Compare hashtags by creation date
 */
export function compareHashtagsByDate(a: Hashtag, b: Hashtag): number {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

// ============================================================================
// HASHTAG FILTERING UTILITIES
// ============================================================================

/**
 * Filter hashtags by category
 */
export function filterHashtagsByCategory(hashtags: Hashtag[], category: HashtagCategory): Hashtag[] {
  return hashtags.filter(h => h.category === category);
}

/**
 * Filter hashtags by trending status
 */
export function filterTrendingHashtags(hashtags: Hashtag[]): Hashtag[] {
  return hashtags.filter(h => h.is_trending);
}

/**
 * Filter hashtags by verification status
 */
export function filterVerifiedHashtags(hashtags: Hashtag[]): Hashtag[] {
  return hashtags.filter(h => h.is_verified);
}

/**
 * Filter hashtags by usage threshold
 */
export function filterHashtagsByUsage(hashtags: Hashtag[], minUsage: number): Hashtag[] {
  return hashtags.filter(h => h.usage_count >= minUsage);
}

// ============================================================================
// HASHTAG EXPORT UTILITIES
// ============================================================================

/**
 * Export hashtags to CSV format
 */
export function exportHashtagsToCSV(hashtags: Hashtag[]): string {
  const headers = ['Name', 'Display Name', 'Category', 'Usage Count', 'Engagement Rate', 'Trending Score', 'Created At'];
  const rows = hashtags.map(h => [
    h.name,
    h.display_name,
    h.category ?? '',
    h.usage_count.toString(),
    '0', // engagement_rate not available in Hashtag interface
    (h.trend_score ?? 0).toString(),
    h.created_at
  ]);
  
  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}

/**
 * Export hashtags to JSON format
 */
export function exportHashtagsToJSON(hashtags: Hashtag[]): string {
  return JSON.stringify(hashtags, null, 2);
}
