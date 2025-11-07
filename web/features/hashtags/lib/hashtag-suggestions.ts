/**
 * Hashtag Suggestions Service
 * 
 * Smart hashtag suggestions based on user behavior, content analysis,
 * and trending patterns. Includes auto-complete, related hashtags,
 * and intelligent recommendations.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { createClient } from '@supabase/supabase-js';

import { logger } from '@/lib/utils/logger';

import type {
  HashtagSuggestion,
  HashtagCategory,
  Hashtag
} from '../types';
import {
  extractHashtagsFromText
} from '../utils/hashtag-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================================
// SUGGESTION ALGORITHMS
// ============================================================================

/**
 * Get smart hashtag suggestions based on user context
 */
export async function getSmartSuggestions(
  userId: string,
  context: {
    text?: string;
    category?: HashtagCategory;
    contentType?: 'poll' | 'comment' | 'profile' | 'feed';
    limit?: number;
  } = {}
): Promise<HashtagSuggestion[]> {
  try {
    const { text, category, contentType = 'poll', limit = 10 } = context;
    
    // Extract hashtags from text if provided
    const _extractedHashtags = text ? extractHashtagsFromText(text) : [];
    
    // Get user's current hashtags for context
    const userHashtags = await getUserHashtags(userId);
    
    // Get suggestions from multiple sources
    const suggestions: HashtagSuggestion[] = [];
    
    // 1. Content-based suggestions
    if (text) {
      const contentSuggestions = await getContentBasedSuggestions(text, userHashtags, limit);
      suggestions.push(...contentSuggestions);
    }
    
    // 2. Category-based suggestions
    if (category) {
      const categorySuggestions = await getCategoryBasedSuggestions(category, userHashtags, limit);
      suggestions.push(...categorySuggestions);
    }
    
    // 3. Trending suggestions
    const trendingSuggestions = await getTrendingSuggestions(userHashtags, limit);
    suggestions.push(...trendingSuggestions);
    
    // 4. Related hashtag suggestions
    const relatedSuggestions = await getRelatedSuggestions(userHashtags, limit);
    suggestions.push(...relatedSuggestions);
    
    // 5. User behavior-based suggestions
    const behaviorSuggestions = await getBehaviorBasedSuggestions(userId, userHashtags, limit);
    suggestions.push(...behaviorSuggestions);
    
    // Remove duplicates and rank by relevance
    const uniqueSuggestions = deduplicateSuggestions(suggestions);
    const rankedSuggestions = rankSuggestions(uniqueSuggestions, {
      userHashtags,
      ...(category && { category }),
      ...(contentType && { contentType }),
      ...(text && { text })
    });
    
    return rankedSuggestions.slice(0, limit);
  } catch (error) {
    logger.error('Failed to get smart suggestions:', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Get auto-complete suggestions for hashtag input
 */
export async function getAutoCompleteSuggestions(
  query: string,
  userId?: string,
  limit = 5
): Promise<HashtagSuggestion[]> {
  try {
    if (!query || query.length < 1) return [];
    
    const normalizedQuery = query.toLowerCase().replace(/^#/, '');
    
    // Get hashtags matching the query
    const { data: hashtags, error } = await supabase
      .from('hashtags')
      .select('*')
      .ilike('name', `%${normalizedQuery}%`)
      .order('usage_count', { ascending: false })
      .limit(limit * 2); // Get more to filter and rank
    
    if (error) throw error;
    
    // Convert to suggestions
    const suggestions: HashtagSuggestion[] = (hashtags ?? []).map(hashtag => {
      const confidence = calculateMatchConfidence(normalizedQuery, String(hashtag.name));
      return {
        hashtag: hashtag as Hashtag,
        reason: 'related',
        confidence,
        confidence_score: confidence,
        source: 'similar' as const,
        metadata: {
          trending_score: Number(hashtag.trend_score),
          related_hashtags: [],
          category_match: true,
          user_history: false,
          social_proof: Number(hashtag.usage_count) ?? 0
        }
      };
    });
    
    // Sort by confidence and usage
    const rankedSuggestions = suggestions
      .sort((a, b) => {
        const confidenceDiff = b.confidence - a.confidence;
        if (Math.abs(confidenceDiff) > 0.1) return confidenceDiff;
        return (b.confidence ?? 0) - (a.confidence ?? 0);
      })
      .slice(0, limit);
    
    return rankedSuggestions;
  } catch (error) {
    logger.error('Failed to get auto-complete suggestions:', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Get related hashtags for a given hashtag
 */
export async function getRelatedHashtags(
  hashtagId: string,
  limit = 10
): Promise<HashtagSuggestion[]> {
  try {
    // Get hashtag details
    const { data: hashtag, error: hashtagError } = await supabase
      .from('hashtags')
      .select('*')
      .eq('id', hashtagId)
      .single();
    
    if (hashtagError) throw hashtagError;
    
    // Get hashtags from same category
    const { data: categoryHashtags, error: categoryError } = await supabase
      .from('hashtags')
      .select('*')
      .eq('category', hashtag.category)
      .neq('id', hashtagId)
      .order('usage_count', { ascending: false })
      .limit(limit);
    
    if (categoryError) throw categoryError;
    
    // Get co-occurring hashtags
    const { data: coOccurring, error: coOccurringError } = await supabase
      .from('hashtag_co_occurrence')
      .select('related_hashtag_id, co_occurrence_count, hashtags(*)')
      .eq('hashtag_id', hashtagId)
      .order('co_occurrence_count', { ascending: false })
      .limit(limit);
    
    if (coOccurringError) throw coOccurringError;
    
    // Combine and rank suggestions
    const suggestions: HashtagSuggestion[] = [];
    
    // Add category-based suggestions
    (categoryHashtags ?? []).forEach(relatedHashtag => {
      suggestions.push({
        hashtag: relatedHashtag as Hashtag,
        reason: 'related',
        confidence: 0.7,
        confidence_score: 0.7,
        source: 'similar' as const
      });
    });
    
    // Add co-occurring suggestions
    (coOccurring ?? []).forEach(coOccur => {
      if (coOccur.hashtags && Array.isArray(coOccur.hashtags) && coOccur.hashtags.length > 0) {
        const hashtag = coOccur.hashtags[0];
        suggestions.push({
          hashtag,
          reason: 'related',
          confidence: Math.min(0.9, coOccur.co_occurrence_count / 100),
          confidence_score: Math.min(0.9, coOccur.co_occurrence_count / 100),
          source: 'similar' as const
        });
      }
    });
    
    // Remove duplicates and rank
    const uniqueSuggestions = deduplicateSuggestions(suggestions);
    return uniqueSuggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  } catch (error) {
    logger.error('Failed to get related hashtags:', error);
    throw error;
  }
}

/**
 * Get trending hashtag suggestions
 */
export async function getTrendingSuggestions(
  excludeHashtagIds: string[] = [],
  limit = 10
): Promise<HashtagSuggestion[]> {
  try {
    // Get trending hashtags from the last 24 hours
    const { data: trending, error } = await supabase
      .from('hashtags')
      .select('*')
      .eq('is_trending', true)
      .not('id', 'in', `(${excludeHashtagIds.join(',')})`)
      .order('trending_score', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return (trending ?? []).map(hashtag => ({
      hashtag: hashtag as Hashtag,
        reason: 'trending',
      confidence: 0.8,
      confidence_score: 0.8,
      source: 'trending' as const,
      metadata: {
        trending_score: hashtag.trend_score,
        related_hashtags: [],
        category_match: false,
        user_history: false,
        social_proof: hashtag.usage_count ?? 0
      }
    }));
  } catch (error) {
    logger.error('Failed to get trending suggestions:', error);
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getUserHashtags(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_hashtags')
    .select('hashtag_id')
    .eq('user_id', userId);
  
  if (error) throw error;
  return data?.map(uh => uh.hashtag_id) ?? [];
}

async function getContentBasedSuggestions(
  text: string,
  userHashtags: string[],
  limit: number
): Promise<HashtagSuggestion[]> {
  // Extract keywords from text
  const keywords = extractKeywordsFromText(text);
  
  // Find hashtags related to keywords
  const suggestions: HashtagSuggestion[] = [];
  
  for (const keyword of keywords) {
    const { data: hashtags, error } = await supabase
      .from('hashtags')
      .select('*')
      .or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`)
      .not('id', 'in', `(${userHashtags.join(',')})`)
      .order('usage_count', { ascending: false })
      .limit(3);
    
    if (error) continue;
    
    (hashtags ?? []).forEach(hashtag => {
      suggestions.push({
        hashtag: hashtag as Hashtag,
        reason: 'related',
        confidence: 0.6,
        confidence_score: 0.6,
        source: 'similar' as const
      });
    });
  }
  
  return suggestions.slice(0, limit);
}

async function getCategoryBasedSuggestions(
  category: HashtagCategory,
  userHashtags: string[],
  limit: number
): Promise<HashtagSuggestion[]> {
  const { data: hashtags, error } = await supabase
    .from('hashtags')
    .select('*')
    .eq('category', category)
    .not('id', 'in', `(${userHashtags.join(',')})`)
    .order('usage_count', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  
  return (hashtags ?? []).map(hashtag => ({
    hashtag: hashtag as Hashtag,
    reason: 'popular',
    confidence: 0.7,
    confidence_score: 0.7,
    source: 'popular' as const
  }));
}

async function getRelatedSuggestions(
  userHashtags: string[],
  limit: number
): Promise<HashtagSuggestion[]> {
  if (userHashtags.length === 0) return [];
  
  // Get co-occurring hashtags for user's hashtags
  const { data: coOccurring, error } = await supabase
    .from('hashtag_co_occurrence')
    .select('related_hashtag_id, co_occurrence_count, hashtags(*)')
    .in('hashtag_id', userHashtags)
    .not('related_hashtag_id', 'in', `(${userHashtags.join(',')})`)
    .order('co_occurrence_count', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  
  return (coOccurring ?? []).map(coOccur => {
    const hashtag = Array.isArray(coOccur.hashtags) ? coOccur.hashtags[0] : coOccur.hashtags;
    return {
      hashtag: hashtag as Hashtag,
      reason: 'personal',
      confidence: Math.min(0.9, coOccur.co_occurrence_count / 50),
      confidence_score: Math.min(0.9, coOccur.co_occurrence_count / 50),
      source: 'similar' as const
    };
  });
}

async function getBehaviorBasedSuggestions(
  userId: string,
  userHashtags: string[],
  limit: number
): Promise<HashtagSuggestion[]> {
  // Get user's engagement history
  const { data: engagement, error } = await supabase
    .from('hashtag_engagement')
    .select('hashtag_id, engagement_type, timestamp')
    .eq('user_id', userId)
    .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('timestamp', { ascending: false });
  
  if (error) throw error;
  
  // Find patterns in user behavior
  const hashtagEngagement = new Map<string, number>();
  (engagement ?? []).forEach(eng => {
    const count = hashtagEngagement.get(eng.hashtag_id) ?? 0;
    hashtagEngagement.set(eng.hashtag_id, count + 1);
  });
  
  // Get suggested hashtags based on behavior
  const suggestions: HashtagSuggestion[] = [];
  
  for (const [hashtagId, engagementCount] of hashtagEngagement) {
    if (userHashtags.includes(hashtagId)) continue;
    
    const { data: hashtag } = await supabase
      .from('hashtags')
      .select('*')
      .eq('id', hashtagId)
      .single();
    
    if (hashtag) {
      suggestions.push({
        hashtag: hashtag as Hashtag,
        reason: 'personal',
        confidence: Math.min(0.8, engagementCount / 10),
        confidence_score: Math.min(0.8, engagementCount / 10),
        source: 'similar' as const
      });
    }
  }
  
  return suggestions.slice(0, limit);
}

function extractKeywordsFromText(text: string): string[] {
  // Simple keyword extraction - could be enhanced with NLP
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !STOP_WORDS.has(word));
  
  // Count word frequency
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) ?? 0) + 1);
  });
  
  // Return top keywords
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

function calculateMatchConfidence(query: string, hashtagName: string): number {
  const queryLower = query.toLowerCase();
  const hashtagLower = hashtagName.toLowerCase();
  
  if (hashtagLower === queryLower) return 1.0;
  if (hashtagLower.startsWith(queryLower)) return 0.9;
  if (hashtagLower.includes(queryLower)) return 0.7;
  
  // Calculate edit distance for fuzzy matching
  const editDistance = calculateEditDistance(queryLower, hashtagLower);
  const maxLength = Math.max(queryLower.length, hashtagLower.length);
  return Math.max(0, 1 - (editDistance / maxLength));
}

function calculateEditDistance(str1: string, str2: string): number {
  const matrix: number[][] = Array(str2.length + 1).fill(0).map(() => Array(str1.length + 1).fill(0));
  
  for (let i = 0; i <= str1.length; i++) {
    const row = matrix[0];
    if (row) row[i] = i;
  }
  for (let j = 0; j <= str2.length; j++) {
    const row = matrix[j];
    if (row) row[0] = j;
  }
  
  for (let j = 1; j <= str2.length; j++) {
    const row = matrix[j];
    if (!row) continue;
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      const prevI = row[i - 1] ?? 0;
      const prevJ = matrix[j - 1]?.[i] ?? 0;
      const prevBoth = matrix[j - 1]?.[i - 1] ?? 0;
      row[i] = Math.min(
        prevI + 1,
        prevJ + 1,
        prevBoth + cost
      );
    }
  }
  
  return matrix[str2.length]?.[str1.length] ?? 0;
}

function deduplicateSuggestions(suggestions: HashtagSuggestion[]): HashtagSuggestion[] {
  const seen = new Set<string>();
  return suggestions.filter(suggestion => {
    if (seen.has(suggestion.hashtag.id)) return false;
    seen.add(suggestion.hashtag.id);
    return true;
  });
}

function rankSuggestions(
  suggestions: HashtagSuggestion[],
  _context: {
    userHashtags: string[];
    category?: HashtagCategory;
    contentType?: string;
    text?: string;
  }
): HashtagSuggestion[] {
  return suggestions.sort((a, b) => {
    // Primary: confidence score
    const confidenceDiff = b.confidence - a.confidence;
    if (Math.abs(confidenceDiff) > 0.1) return confidenceDiff;
    
    // Secondary: usage count
    const usageDiff = (b.hashtag.usage_count ?? 0) - (a.hashtag.usage_count ?? 0);
    if (Math.abs(usageDiff) > 100) return usageDiff;
    
    // Tertiary: trending status
    if (a.hashtag.is_trending !== b.hashtag.is_trending) return a.hashtag.is_trending ? -1 : 1;
    
    // Quaternary: verified status
    if (a.hashtag.is_verified !== b.hashtag.is_verified) return a.hashtag.is_verified ? -1 : 1;
    
    return 0;
  });
}

// Common stop words to filter out
const STOP_WORDS = new Set([
  'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these',
  'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
  'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'is',
  'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do',
  'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'can', 'shall', 'a', 'an', 'the'
]);
