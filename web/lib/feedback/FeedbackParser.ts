/**
 * Feedback Parser - Processes user suggestions and feedback
 * 
 * This system parses user feedback from various sources:
 * - Interest selection suggestions
 * - Poll suggestions
 * - General feedback widget
 * - Admin dashboard submissions
 */

import { devLog } from '@/lib/logger';

export interface ParsedFeedback {
  id: string;
  type: 'interest_suggestion' | 'poll_suggestion' | 'demographic_suggestion' | 'general_feedback' | 'bug_report' | 'feature_request';
  category: 'interest' | 'demographic' | 'poll' | 'general' | 'bug' | 'feature';
  title: string;
  description: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  metadata: {
    source: 'onboarding' | 'feedback_widget' | 'admin_dashboard' | 'api';
    userId?: string;
    userAgent?: string;
    timestamp: string;
    originalText: string;
  };
  aiAnalysis?: {
    extractedKeywords: string[];
    suggestedCategory?: string;
    confidence: number;
    relatedInterests?: string[];
  };
}

export interface InterestSuggestion {
  type: 'interest' | 'demographic';
  text: string;
  userId?: string;
  timestamp: string;
}

export interface PollSuggestion {
  title: string;
  description: string;
  category: string;
  suggestedBy: string;
  votes: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export class FeedbackParser {
  private static instance: FeedbackParser;
  
  public static getInstance(): FeedbackParser {
    if (!FeedbackParser.instance) {
      FeedbackParser.instance = new FeedbackParser();
    }
    return FeedbackParser.instance;
  }

  /**
   * Parse interest/demographic suggestions from onboarding
   */
  async parseInterestSuggestion(suggestion: InterestSuggestion): Promise<ParsedFeedback> {
    const { type, text, userId, timestamp } = suggestion;
    
    // Basic parsing
    const cleanedText = this.cleanText(text);
    const keywords = this.extractKeywords(cleanedText);
    const sentiment = this.analyzeSentiment(cleanedText);
    const priority = this.determinePriority(type, sentiment, keywords);
    
    // AI analysis (simplified for now)
    const aiAnalysis = await this.performAIAnalysis(cleanedText, type);
    
    const parsed: ParsedFeedback = {
      id: this.generateId(),
      type: type === 'interest' ? 'interest_suggestion' : 'demographic_suggestion',
      category: type,
      title: this.generateTitle(cleanedText, type),
      description: cleanedText,
      sentiment,
      priority,
      tags: keywords,
      metadata: {
        source: 'onboarding',
        userId,
        timestamp,
        originalText: text
      },
      aiAnalysis
    };

    devLog('Parsed interest suggestion:', parsed);
    return parsed;
  }

  /**
   * Parse poll suggestions from community
   */
  async parsePollSuggestion(suggestion: PollSuggestion): Promise<ParsedFeedback> {
    const { title, description, category, suggestedBy, votes, status, createdAt } = suggestion;
    
    const cleanedTitle = this.cleanText(title);
    const cleanedDescription = this.cleanText(description);
    const keywords = this.extractKeywords(`${cleanedTitle} ${cleanedDescription}`);
    const sentiment = this.analyzeSentiment(cleanedDescription);
    const priority = this.determinePollPriority(votes, status, sentiment);
    
    const aiAnalysis = await this.performAIAnalysis(cleanedDescription, 'poll');
    
    const parsed: ParsedFeedback = {
      id: this.generateId(),
      type: 'poll_suggestion',
      category: 'poll',
      title: cleanedTitle,
      description: cleanedDescription,
      sentiment,
      priority,
      tags: [...keywords, category],
      metadata: {
        source: 'feedback_widget',
        userId: suggestedBy,
        timestamp: createdAt,
        originalText: `${title} - ${description}`
      },
      aiAnalysis
    };

    devLog('Parsed poll suggestion:', parsed);
    return parsed;
  }

  /**
   * Parse general feedback from feedback widget
   */
  async parseGeneralFeedback(feedback: {
    text: string;
    type?: string;
    userId?: string;
    timestamp: string;
  }): Promise<ParsedFeedback> {
    const { text, type, userId, timestamp } = feedback;
    
    const cleanedText = this.cleanText(text);
    const keywords = this.extractKeywords(cleanedText);
    const sentiment = this.analyzeSentiment(cleanedText);
    const feedbackType = this.determineFeedbackType(cleanedText, type);
    const priority = this.determinePriority(feedbackType, sentiment, keywords);
    
    const aiAnalysis = await this.performAIAnalysis(cleanedText, feedbackType);
    
    const parsed: ParsedFeedback = {
      id: this.generateId(),
      type: feedbackType,
      category: this.mapTypeToCategory(feedbackType),
      title: this.generateTitle(cleanedText, feedbackType),
      description: cleanedText,
      sentiment,
      priority,
      tags: keywords,
      metadata: {
        source: 'feedback_widget',
        userId,
        timestamp,
        originalText: text
      },
      aiAnalysis
    };

    devLog('Parsed general feedback:', parsed);
    return parsed;
  }

  /**
   * Batch process multiple feedback items
   */
  async batchProcess(feedbackItems: any[]): Promise<ParsedFeedback[]> {
    const results: ParsedFeedback[] = [];
    
    for (const item of feedbackItems) {
      try {
        let parsed: ParsedFeedback;
        
        if (item.type && (item.type === 'interest' || item.type === 'demographic')) {
          parsed = await this.parseInterestSuggestion(item);
        } else if (item.category && item.votes !== undefined) {
          parsed = await this.parsePollSuggestion(item);
        } else {
          parsed = await this.parseGeneralFeedback(item);
        }
        
        results.push(parsed);
      } catch (error) {
        devLog('Error parsing feedback item:', error);
        // Continue processing other items
      }
    }
    
    return results;
  }

  /**
   * Get suggestions for new interest categories based on feedback
   */
  async getSuggestedInterests(parsedFeedback: ParsedFeedback[]): Promise<{
    interest: string[];
    demographic: string[];
  }> {
    const interestSuggestions = new Set<string>();
    const demographicSuggestions = new Set<string>();
    
    for (const feedback of parsedFeedback) {
      if (feedback.type === 'interest_suggestion' && feedback.aiAnalysis?.extractedKeywords) {
        feedback.aiAnalysis.extractedKeywords.forEach(keyword => {
          if (this.isValidInterestCategory(keyword)) {
            interestSuggestions.add(keyword);
          }
        });
      } else if (feedback.type === 'demographic_suggestion' && feedback.aiAnalysis?.extractedKeywords) {
        feedback.aiAnalysis.extractedKeywords.forEach(keyword => {
          if (this.isValidDemographicCategory(keyword)) {
            demographicSuggestions.add(keyword);
          }
        });
      }
    }
    
    return {
      interest: Array.from(interestSuggestions),
      demographic: Array.from(demographicSuggestions)
    };
  }

  // Private helper methods

  private cleanText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-&]/g, '')
      .toLowerCase();
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - in production, use NLP library
    const words = text.split(' ')
      .filter(word => word.length > 2)
      .filter(word => !this.isStopWord(word));
    
    // Remove duplicates and return top keywords
    return [...new Set(words)].slice(0, 10);
  }

  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    // Simple sentiment analysis - in production, use proper NLP
    const positiveWords = ['good', 'great', 'awesome', 'love', 'like', 'excellent', 'amazing'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'horrible', 'dislike', 'worst'];
    
    const words = text.toLowerCase().split(' ');
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private determinePriority(type: string, sentiment: string, keywords: string[]): 'low' | 'medium' | 'high' | 'urgent' {
    // Priority logic based on type, sentiment, and keywords
    if (type === 'bug_report' || sentiment === 'negative') return 'high';
    if (type === 'feature_request' && sentiment === 'positive') return 'medium';
    if (keywords.some(k => ['urgent', 'critical', 'important'].includes(k))) return 'urgent';
    return 'low';
  }

  private determinePollPriority(votes: number, status: string, sentiment: string): 'low' | 'medium' | 'high' | 'urgent' {
    if (votes > 100 && sentiment === 'positive') return 'high';
    if (votes > 50) return 'medium';
    if (status === 'approved') return 'high';
    return 'low';
  }

  private determineFeedbackType(text: string, providedType?: string): ParsedFeedback['type'] {
    if (providedType) {
      return providedType as ParsedFeedback['type'];
    }
    
    // Auto-detect feedback type based on content
    if (text.includes('bug') || text.includes('error') || text.includes('broken')) {
      return 'bug_report';
    }
    if (text.includes('feature') || text.includes('add') || text.includes('suggest')) {
      return 'feature_request';
    }
    return 'general_feedback';
  }

  private mapTypeToCategory(type: ParsedFeedback['type']): ParsedFeedback['category'] {
    switch (type) {
      case 'interest_suggestion': return 'interest';
      case 'demographic_suggestion': return 'demographic';
      case 'poll_suggestion': return 'poll';
      case 'bug_report': return 'bug';
      case 'feature_request': return 'feature';
      default: return 'general';
    }
  }

  private generateTitle(text: string, type: string): string {
    const words = text.split(' ').slice(0, 6);
    return words.join(' ').replace(/^\w/, c => c.toUpperCase());
  }

  private generateId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an'];
    return stopWords.includes(word.toLowerCase());
  }

  private isValidInterestCategory(keyword: string): boolean {
    // Check if keyword could be a valid interest category
    return keyword.length > 3 && !this.isStopWord(keyword);
  }

  private isValidDemographicCategory(keyword: string): boolean {
    // Check if keyword could be a valid demographic category
    return keyword.length > 3 && !this.isStopWord(keyword);
  }

  private async performAIAnalysis(text: string, type: string): Promise<ParsedFeedback['aiAnalysis']> {
    // Simplified AI analysis - in production, use proper NLP/AI service
    const keywords = this.extractKeywords(text);
    const confidence = Math.min(0.9, keywords.length * 0.1);
    
    return {
      extractedKeywords: keywords,
      suggestedCategory: type,
      confidence,
      relatedInterests: keywords.slice(0, 3)
    };
  }
}

// Export singleton instance
export const feedbackParser = FeedbackParser.getInstance();
