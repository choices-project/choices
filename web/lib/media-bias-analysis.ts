// Media Bias Analysis & Poll Origin Tracking System
// Detects propaganda and bias by comparing mainstream media polls with real public opinion

import { getSupabaseServerClient } from '@/utils/supabase/server';
import { devLog } from '@/lib/logger';
import { cookies } from 'next/headers';

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface MediaPoll {
  id: string;
  headline: string;
  question: string;
  options: MediaPollOption[];
  source: MediaSource;
  methodology: PollMethodology;
  results: MediaPollResults;
  biasIndicators: BiasIndicator[];
  factCheck: FactCheckResult;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaPollOption {
  id: string;
  text: string;
  percentage: number;
  framing: 'positive' | 'negative' | 'neutral' | 'leading';
  biasScore: number; // 0-1 scale
}

export interface MediaSource {
  id: string;
  name: string;
  network: string;
  bias: 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'unknown';
  reliability: number; // 0-1 scale
  ownership: string;
  funding: string[];
  politicalAffiliations: string[];
  factCheckRating: 'reliable' | 'mixed' | 'unreliable' | 'unknown';
  propagandaIndicators: string[];
}

export interface PollMethodology {
  sampleSize: number;
  marginOfError: number;
  confidenceLevel: number;
  methodology: 'random' | 'online' | 'phone' | 'mixed' | 'unknown';
  demographics: DemographicBreakdown;
  timing: {
    startDate: Date;
    endDate: Date;
    duration: number; // hours
  };
  questionOrder: string[];
  contextProvided: string;
  leadingQuestions: string[];
}

export interface DemographicBreakdown {
  age: Record<string, number>;
  gender: Record<string, number>;
  education: Record<string, number>;
  income: Record<string, number>;
  geography: Record<string, number>;
  politicalAffiliation: Record<string, number>;
}

export interface MediaPollResults {
  totalResponses: number;
  optionResults: Record<string, number>;
  demographicBreakdown: Record<string, any>;
  crossTabs: Record<string, any>;
  rawData: any;
}

export interface BiasIndicator {
  type: 'framing' | 'methodology' | 'timing' | 'demographics' | 'question_order' | 'context';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  impact: number; // 0-1 scale
  recommendations: string[];
}

export interface FactCheckResult {
  accuracy: 'true' | 'mostly_true' | 'mixed' | 'mostly_false' | 'false' | 'unknown';
  sources: FactCheckSource[];
  claims: FactCheckClaim[];
  overallScore: number; // 0-1 scale
  summary: string;
  lastUpdated: Date;
}

export interface FactCheckSource {
  name: string;
  url: string;
  reliability: number;
  bias: string;
  conclusion: string;
}

export interface FactCheckClaim {
  claim: string;
  accuracy: 'true' | 'mostly_true' | 'mixed' | 'mostly_false' | 'false';
  evidence: string[];
  sources: string[];
}

export interface PublicOpinionComparison {
  id: string;
  mediaPollId: string;
  ourPollId: string;
  comparison: {
    questionAlignment: number; // 0-1 scale
    optionAlignment: number; // 0-1 scale
    resultDifference: number; // percentage difference
    biasDetection: BiasDetectionResult;
  };
  analysis: {
    propagandaIndicators: string[];
    biasScore: number; // 0-1 scale
    manipulationTechniques: string[];
    recommendations: string[];
  };
  createdAt: Date;
}

export interface BiasDetectionResult {
  overallBias: number; // 0-1 scale
  framingBias: number;
  methodologyBias: number;
  timingBias: number;
  demographicBias: number;
  questionBias: number;
  contextBias: number;
  propagandaTechniques: string[];
  manipulationScore: number; // 0-1 scale
}

// ============================================================================
// MEDIA SOURCES DATABASE
// ============================================================================

export const MEDIA_SOURCES: MediaSource[] = [
  // Major Networks
  {
    id: 'cnn',
    name: 'CNN',
    network: 'CNN',
    bias: 'left',
    reliability: 0.75,
    ownership: 'Warner Bros. Discovery',
    funding: ['advertising', 'subscriptions', 'corporate_sponsors'],
    politicalAffiliations: ['Democratic Party', 'liberal organizations'],
    factCheckRating: 'mixed',
    propagandaIndicators: ['emotional_framing', 'selective_reporting', 'opinion_as_fact']
  },
  {
    id: 'fox',
    name: 'Fox News',
    network: 'Fox News',
    bias: 'right',
    reliability: 0.70,
    ownership: 'Fox Corporation',
    funding: ['advertising', 'subscriptions', 'corporate_sponsors'],
    politicalAffiliations: ['Republican Party', 'conservative organizations'],
    factCheckRating: 'mixed',
    propagandaIndicators: ['misleading_headlines', 'opinion_as_fact', 'selective_context']
  },
  {
    id: 'msnbc',
    name: 'MSNBC',
    network: 'MSNBC',
    bias: 'left',
    reliability: 0.72,
    ownership: 'NBCUniversal',
    funding: ['advertising', 'subscriptions', 'corporate_sponsors'],
    politicalAffiliations: ['Democratic Party', 'liberal organizations'],
    factCheckRating: 'mixed',
    propagandaIndicators: ['emotional_framing', 'selective_reporting', 'opinion_as_fact']
  },
  {
    id: 'abc',
    name: 'ABC News',
    network: 'ABC',
    bias: 'center-left',
    reliability: 0.80,
    ownership: 'Walt Disney Company',
    funding: ['advertising', 'subscriptions', 'corporate_sponsors'],
    politicalAffiliations: ['moderate_liberal'],
    factCheckRating: 'reliable',
    propagandaIndicators: ['slight_liberal_bias', 'corporate_influence']
  },
  {
    id: 'cbs',
    name: 'CBS News',
    network: 'CBS',
    bias: 'center-left',
    reliability: 0.82,
    ownership: 'Paramount Global',
    funding: ['advertising', 'subscriptions', 'corporate_sponsors'],
    politicalAffiliations: ['moderate_liberal'],
    factCheckRating: 'reliable',
    propagandaIndicators: ['slight_liberal_bias', 'corporate_influence']
  },
  {
    id: 'nbc',
    name: 'NBC News',
    network: 'NBC',
    bias: 'center-left',
    reliability: 0.78,
    ownership: 'NBCUniversal',
    funding: ['advertising', 'subscriptions', 'corporate_sponsors'],
    politicalAffiliations: ['moderate_liberal'],
    factCheckRating: 'reliable',
    propagandaIndicators: ['slight_liberal_bias', 'corporate_influence']
  },
  {
    id: 'reuters',
    name: 'Reuters',
    network: 'Reuters',
    bias: 'center',
    reliability: 0.95,
    ownership: 'Thomson Reuters',
    funding: ['subscriptions', 'financial_services'],
    politicalAffiliations: ['neutral'],
    factCheckRating: 'reliable',
    propagandaIndicators: ['minimal_bias', 'corporate_influence']
  },
  {
    id: 'ap',
    name: 'Associated Press',
    network: 'AP',
    bias: 'center',
    reliability: 0.94,
    ownership: 'Non-profit cooperative',
    funding: ['subscriptions', 'member_contributions'],
    politicalAffiliations: ['neutral'],
    factCheckRating: 'reliable',
    propagandaIndicators: ['minimal_bias']
  },
  {
    id: 'bbc',
    name: 'BBC News',
    network: 'BBC',
    bias: 'center-left',
    reliability: 0.88,
    ownership: 'British Broadcasting Corporation',
    funding: ['license_fees', 'government_funding'],
    politicalAffiliations: ['moderate_liberal'],
    factCheckRating: 'reliable',
    propagandaIndicators: ['slight_liberal_bias', 'government_influence']
  }
];

// ============================================================================
// PROPAGANDA DETECTION ALGORITHMS
// ============================================================================

export class PropagandaDetector {
  private static readonly PROPAGANDA_TECHNIQUES = {
    emotional_framing: {
      keywords: ['shocking', 'outrageous', 'scandalous', 'devastating', 'terrifying'],
      weight: 0.8
    },
    leading_questions: {
      patterns: [
        /don't you think/i,
        /wouldn't you agree/i,
        /isn't it obvious/i,
        /clearly.*right\?/i
      ],
      weight: 0.9
    },
    selective_reporting: {
      indicators: ['missing_context', 'cherry_picked_data', 'omitted_facts'],
      weight: 0.7
    },
    opinion_as_fact: {
      keywords: ['obviously', 'clearly', 'undoubtedly', 'certainly'],
      weight: 0.8
    },
    misleading_headlines: {
      patterns: [
        /.*vs.*/i,
        /.*slams.*/i,
        /.*destroys.*/i,
        /.*exposed.*/i
      ],
      weight: 0.6
    },
    timing_manipulation: {
      indicators: ['election_timing', 'crisis_timing', 'anniversary_timing'],
      weight: 0.5
    },
    demographic_skewing: {
      indicators: ['age_bias', 'geographic_bias', 'education_bias'],
      weight: 0.6
    }
  };

  static analyzePoll(poll: MediaPoll): BiasDetectionResult {
    const analysis = {
      overallBias: 0,
      framingBias: this.analyzeFraming(poll),
      methodologyBias: this.analyzeMethodology(poll),
      timingBias: this.analyzeTiming(poll),
      demographicBias: this.analyzeDemographics(poll),
      questionBias: this.analyzeQuestions(poll),
      contextBias: this.analyzeContext(poll),
      propagandaTechniques: [] as string[],
      manipulationScore: 0
    };

    // Detect propaganda techniques
    analysis.propagandaTechniques = this.detectPropagandaTechniques(poll);

    // Calculate overall bias
    analysis.overallBias = (
      analysis.framingBias * 0.25 +
      analysis.methodologyBias * 0.20 +
      analysis.timingBias * 0.15 +
      analysis.demographicBias * 0.15 +
      analysis.questionBias * 0.15 +
      analysis.contextBias * 0.10
    );

    // Calculate manipulation score
    analysis.manipulationScore = this.calculateManipulationScore(poll, analysis.propagandaTechniques);

    return analysis;
  }

  private static analyzeFraming(poll: MediaPoll): number {
    let biasScore = 0;
    const text = `${poll.headline} ${poll.question}`.toLowerCase();

    // Check for emotional framing
    const emotionalWords = this.PROPAGANDA_TECHNIQUES.emotional_framing.keywords;
    const emotionalCount = emotionalWords.filter(word => text.includes(word)).length;
    biasScore += (emotionalCount / emotionalWords.length) * this.PROPAGANDA_TECHNIQUES.emotional_framing.weight;

    // Check for opinion-as-fact language
    const opinionWords = this.PROPAGANDA_TECHNIQUES.opinion_as_fact.keywords;
    const opinionCount = opinionWords.filter(word => text.includes(word)).length;
    biasScore += (opinionCount / opinionWords.length) * this.PROPAGANDA_TECHNIQUES.opinion_as_fact.weight;

    return Math.min(biasScore, 1);
  }

  private static analyzeMethodology(poll: MediaPoll): number {
    let biasScore = 0;
    const method = poll.methodology;

    // Check sample size adequacy
    if (method.sampleSize < 1000) biasScore += 0.3;
    if (method.sampleSize < 500) biasScore += 0.5;

    // Check margin of error
    if (method.marginOfError > 5) biasScore += 0.2;
    if (method.marginOfError > 8) biasScore += 0.3;

    // Check methodology type
    if (method.methodology === 'online') biasScore += 0.2;
    if (method.methodology === 'unknown') biasScore += 0.4;

    // Check for leading questions
    if (method.leadingQuestions.length > 0) {
      biasScore += (method.leadingQuestions.length / 5) * 0.5;
    }

    return Math.min(biasScore, 1);
  }

  private static analyzeTiming(poll: MediaPoll): number {
    let biasScore = 0;
    const timing = poll.methodology.timing;

    // Check for election timing
    const now = new Date();
    const electionMonths = [10, 11]; // October, November
    if (electionMonths.includes(timing.startDate.getMonth())) {
      biasScore += 0.3;
    }
    
    // Check for recent timing bias (polls too close to current date)
    const daysSinceStart = Math.floor((now.getTime() - timing.startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceStart < 7) {
      biasScore += 0.1; // Very recent polls might be rushed
    }

    // Check for crisis timing
    // This would need more sophisticated analysis
    const duration = timing.duration;
    if (duration < 24) biasScore += 0.2; // Very short polls
    if (duration > 168) biasScore += 0.1; // Very long polls

    return Math.min(biasScore, 1);
  }

  private static analyzeDemographics(poll: MediaPoll): number {
    let biasScore = 0;
    const demo = poll.methodology.demographics;

    // Check for age bias
    const ageGroups = Object.keys(demo.age);
    if (ageGroups.length < 4) biasScore += 0.2;

    // Check for geographic bias
    const geoGroups = Object.keys(demo.geography);
    if (geoGroups.length < 3) biasScore += 0.2;

    // Check for political affiliation bias
    const polGroups = Object.keys(demo.politicalAffiliation);
    if (polGroups.length < 3) biasScore += 0.3;

    return Math.min(biasScore, 1);
  }

  private static analyzeQuestions(poll: MediaPoll): number {
    let biasScore = 0;

    // Check for leading questions
    const leadingPatterns = this.PROPAGANDA_TECHNIQUES.leading_questions.patterns;
    const questionText = poll.question.toLowerCase();
    
    leadingPatterns.forEach(pattern => {
      if (pattern.test(questionText)) {
        biasScore += this.PROPAGANDA_TECHNIQUES.leading_questions.weight;
      }
    });

    // Check option bias
    const optionBias = poll.options.reduce((sum: any, option: any) => sum + option.biasScore, 0) / poll.options.length;
    biasScore += optionBias * 0.5;

    return Math.min(biasScore, 1);
  }

  private static analyzeContext(poll: MediaPoll): number {
    let biasScore = 0;

    // Check if context is provided
    if (!poll.methodology.contextProvided || poll.methodology.contextProvided.length < 50) {
      biasScore += 0.3;
    }

    // Check for selective context
    const context = poll.methodology.contextProvided.toLowerCase();
    if (context.includes('but') || context.includes('however')) {
      biasScore += 0.2;
    }

    return Math.min(biasScore, 1);
  }

  private static detectPropagandaTechniques(poll: MediaPoll): string[] {
    const techniques: string[] = [];
    const text = `${poll.headline} ${poll.question}`.toLowerCase();

    // Check for emotional framing
    const emotionalWords = this.PROPAGANDA_TECHNIQUES.emotional_framing.keywords;
    if (emotionalWords.some(word => text.includes(word))) {
      techniques.push('emotional_framing');
    }

    // Check for leading questions
    const leadingPatterns = this.PROPAGANDA_TECHNIQUES.leading_questions.patterns;
    if (leadingPatterns.some(pattern => pattern.test(text))) {
      techniques.push('leading_questions');
    }

    // Check for misleading headlines
    const headlinePatterns = this.PROPAGANDA_TECHNIQUES.misleading_headlines.patterns;
    if (headlinePatterns.some(pattern => pattern.test(poll.headline))) {
      techniques.push('misleading_headlines');
    }

    // Check for opinion-as-fact
    const opinionWords = this.PROPAGANDA_TECHNIQUES.opinion_as_fact.keywords;
    if (opinionWords.some(word => text.includes(word))) {
      techniques.push('opinion_as_fact');
    }

    return techniques;
  }

  private static calculateManipulationScore(poll: MediaPoll, techniques: string[]): number {
    let score = 0;

    // Base score from techniques
    techniques.forEach(technique => {
      const techniqueData = this.PROPAGANDA_TECHNIQUES[technique as keyof typeof this.PROPAGANDA_TECHNIQUES];
      if (techniqueData) {
        score += techniqueData.weight;
      }
    });

    // Add source bias
    const source = poll.source;
    if (source.bias !== 'center') {
      score += 0.2;
    }

    // Add methodology issues
    if (poll.methodology.sampleSize < 1000) score += 0.1;
    if (poll.methodology.marginOfError > 5) score += 0.1;

    return Math.min(score, 1);
  }
}

// ============================================================================
// MEDIA BIAS ANALYSIS SERVICE
// ============================================================================

export class MediaBiasAnalysisService {
  private supabase;

  constructor() {
    const cookieStore = cookies();
    this.supabase = getSupabaseServerClient();
  }

  async trackMediaPoll(poll: Omit<MediaPoll, 'id' | 'createdAt' | 'updatedAt'>): Promise<MediaPoll | null> {
    try {
      // Analyze for bias and propaganda
      const biasAnalysis = PropagandaDetector.analyzePoll(poll as MediaPoll);
      
      // Create bias indicators
      const biasIndicators = this.createBiasIndicators(biasAnalysis);
      
      // Fact check the poll
      const factCheck = await this.factCheckPoll(poll);

      if (!this.supabase) { throw new Error('Supabase client not available'); }
      const supabaseClient = await this.supabase
      const { data, error } = await supabaseClient
        .from('media_polls')
        .insert([{
          ...poll,
          bias_analysis: biasAnalysis,
          bias_indicators: biasIndicators,
          fact_check: factCheck
        }] as any)
        .select()
        .single();

      if (error) throw error;

      return data ? this.mapMediaPollFromDB(data) : null;
    } catch (error) {
      devLog('Error tracking media poll:', error);
      return null;
    }
  }

  async compareWithPublicOpinion(mediaPollId: string, ourPollId: string): Promise<PublicOpinionComparison | null> {
    try {
      const mediaPoll = await this.getMediaPoll(mediaPollId);
      const ourPoll = await this.getOurPoll(ourPollId);

      if (!mediaPoll || !ourPoll) return null;

      const comparison = this.calculateComparison(mediaPoll, ourPoll);
      const analysis = this.analyzeDifferences(mediaPoll, ourPoll, comparison);

      if (!this.supabase) { throw new Error('Supabase client not available'); }
      const supabaseClient = await this.supabase
      const { data, error } = await supabaseClient
        .from('public_opinion_comparisons')
        .insert([{
          media_poll_id: mediaPollId,
          our_poll_id: ourPollId,
          comparison,
          analysis
        }] as any)
        .select()
        .single();

      if (error) throw error;

      return data ? this.mapComparisonFromDB(data) : null;
    } catch (error) {
      devLog('Error comparing polls:', error);
      return null;
    }
  }

  private createBiasIndicators(analysis: BiasDetectionResult): BiasIndicator[] {
    const indicators: BiasIndicator[] = [];

    if (analysis.framingBias > 0.5) {
      indicators.push({
        type: 'framing',
        severity: analysis.framingBias > 0.8 ? 'high' : 'medium',
        description: 'Poll uses emotionally charged or leading language',
        evidence: ['Emotional keywords detected', 'Leading question patterns found'],
        impact: analysis.framingBias,
        recommendations: ['Use neutral language', 'Avoid leading questions']
      });
    }

    if (analysis.methodologyBias > 0.5) {
      indicators.push({
        type: 'methodology',
        severity: analysis.methodologyBias > 0.8 ? 'high' : 'medium',
        description: 'Poll methodology may introduce bias',
        evidence: ['Small sample size', 'High margin of error', 'Leading questions'],
        impact: analysis.methodologyBias,
        recommendations: ['Increase sample size', 'Improve methodology', 'Remove leading questions']
      });
    }

    return indicators;
  }

  private async factCheckPoll(poll: any): Promise<FactCheckResult> {
    // This would integrate with fact-checking APIs
    // For now, return a basic structure with poll-specific analysis
    const pollText = `${poll.headline} ${poll.question}`.toLowerCase();
    const hasFactualClaims = pollText.includes('fact') || pollText.includes('data') || pollText.includes('study');
    
    return {
      accuracy: hasFactualClaims ? 'mixed' : 'unknown',
      sources: [],
      claims: [{
        claim: poll.question,
        accuracy: 'mixed',
        evidence: [],
        sources: []
      }],
      overallScore: hasFactualClaims ? 0.6 : 0.5,
      summary: hasFactualClaims ? 'Contains factual claims requiring verification' : 'Fact check pending',
      lastUpdated: new Date()
    };
  }

  private calculateComparison(mediaPoll: MediaPoll, ourPoll: any): any {
    // Calculate alignment between polls
    const questionAlignment = this.calculateQuestionAlignment(mediaPoll.question, ourPoll.question);
    const optionAlignment = this.calculateOptionAlignment(mediaPoll.options, ourPoll.options);
    const resultDifference = this.calculateResultDifference(mediaPoll.results, ourPoll.results);

    return {
      questionAlignment,
      optionAlignment,
      resultDifference,
      biasDetection: PropagandaDetector.analyzePoll(mediaPoll)
    };
  }

  private analyzeDifferences(mediaPoll: MediaPoll, _ourPoll: any, comparison: any): any {
    const propagandaIndicators = this.identifyPropagandaIndicators(mediaPoll, comparison);
    const biasScore = comparison.biasDetection.overallBias;
    const manipulationTechniques = comparison.biasDetection.propagandaTechniques;

    return {
      propagandaIndicators,
      biasScore,
      manipulationTechniques,
      recommendations: this.generateRecommendations(comparison)
    };
  }

  private calculateQuestionAlignment(mediaQuestion: string, ourQuestion: string): number {
    // Simple similarity calculation - would use more sophisticated NLP in production
    const mediaWords = mediaQuestion.toLowerCase().split(' ');
    const ourWords = ourQuestion.toLowerCase().split(' ');
    const commonWords = mediaWords.filter(word => ourWords.includes(word));
    return commonWords.length / Math.max(mediaWords.length, ourWords.length);
  }

  private calculateOptionAlignment(mediaOptions: MediaPollOption[], ourOptions: any[]): number {
    // Compare option similarity
    let totalAlignment = 0;
    mediaOptions.forEach(mediaOption => {
      const bestMatch = ourOptions.reduce((best: any, ourOption: any) => {
        const similarity = this.calculateTextSimilarity(mediaOption.text, ourOption.text);
        return similarity > best ? similarity : best;
      }, 0);
      totalAlignment += bestMatch;
    });
    return totalAlignment / mediaOptions.length;
  }

  private calculateResultDifference(mediaResults: MediaPollResults, ourResults: any): number {
    // Calculate percentage difference in results between media poll and our poll
    if (!mediaResults || !ourResults || !mediaResults.optionResults || !ourResults.optionResults) {
      return 0; // No data to compare
    }

    const mediaOptions = Object.keys(mediaResults.optionResults);
    const ourOptions = Object.keys(ourResults.optionResults);
    
    if (mediaOptions.length === 0 || ourOptions.length === 0) {
      return 0; // No options to compare
    }

    // Calculate total difference across all matching options
    let totalDifference = 0;
    let comparisonCount = 0;

    mediaOptions.forEach(option => {
      if (ourOptions.includes(option)) {
        const mediaPercentage = mediaResults.optionResults[option] || 0;
        const ourPercentage = ourResults.optionResults[option] || 0;
        const difference = Math.abs(mediaPercentage - ourPercentage);
        totalDifference += difference;
        comparisonCount++;
      }
    });

    // Return average difference, or 0 if no comparisons were made
    return comparisonCount > 0 ? totalDifference / comparisonCount : 0;
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple similarity calculation
    const words1 = text1.toLowerCase().split(' ');
    const words2 = text2.toLowerCase().split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  private identifyPropagandaIndicators(_mediaPoll: MediaPoll, comparison: any): string[] {
    const indicators: string[] = [];

    if (comparison.questionAlignment < 0.7) {
      indicators.push('question_framing_difference');
    }

    if (comparison.optionAlignment < 0.6) {
      indicators.push('option_bias_detected');
    }

    if (comparison.resultDifference > 0.2) {
      indicators.push('significant_result_discrepancy');
    }

    if (comparison.biasDetection.manipulationScore > 0.7) {
      indicators.push('high_manipulation_score');
    }

    return indicators;
  }

  private generateRecommendations(comparison: any): string[] {
    const recommendations: string[] = [];

    if (comparison.biasDetection.overallBias > 0.7) {
      recommendations.push('Consider this poll highly biased and potentially manipulative');
    }

    if (comparison.questionAlignment < 0.7) {
      recommendations.push('Question framing significantly differs from neutral presentation');
    }

    if (comparison.resultDifference > 0.2) {
      recommendations.push('Results show significant discrepancy with public opinion');
    }

    return recommendations;
  }

  // Database mapping methods
  private mapMediaPollFromDB(data: any): MediaPoll {
    return {
      id: data.id,
      headline: data.headline,
      question: data.question,
      options: data.options || [],
      source: data.source,
      methodology: data.methodology,
      results: data.results,
      biasIndicators: data.bias_indicators || [],
      factCheck: data.fact_check,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapComparisonFromDB(data: any): PublicOpinionComparison {
    return {
      id: data.id,
      mediaPollId: data.media_poll_id,
      ourPollId: data.our_poll_id,
      comparison: data.comparison,
      analysis: data.analysis,
      createdAt: new Date(data.created_at)
    };
  }

  private async getMediaPoll(id: string): Promise<MediaPoll | null> {
    if (!this.supabase) { throw new Error('Supabase client not available'); }
    const supabaseClient = await this.supabase
    const { data, error } = await supabaseClient
      .from('media_polls')
      .select('id, source_id, title, content, created_at')
              .eq('id', id as any)
      .single();

    if (error) return null;
    return data ? this.mapMediaPollFromDB(data) : null;
  }

  private async getOurPoll(_id: string): Promise<any> {
    // This would fetch from our polls table
    return null;
  }
}

