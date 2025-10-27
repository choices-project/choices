/**
 * User Journey Mapping System
 * 
 * Comprehensive system for mapping user journeys, identifying critical paths,
 * and optimizing user experience through journey analysis.
 * 
 * Created: October 26, 2025
 * Status: ✅ IMPLEMENTATION READY
 */

import { logger } from '../utils/logger';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface UserJourney {
  id: string;
  name: string;
  description: string;
  steps: JourneyStep[];
  criticality: 'low' | 'medium' | 'high' | 'critical';
  frequency: number;
  successRate: number;
  averageDuration: number;
  userType: 'anonymous' | 'authenticated' | 'admin';
  category: 'onboarding' | 'voting' | 'analytics' | 'profile' | 'admin' | 'general';
}

export interface JourneyStep {
  id: string;
  name: string;
  description: string;
  component: string;
  action: string;
  expectedOutcome: string;
  actualOutcome?: string;
  duration: number;
  errors: JourneyError[];
  success: boolean;
  timestamp: Date;
  userAgent?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
}

export interface JourneyError {
  id: string;
  type: 'navigation' | 'validation' | 'api' | 'component' | 'network';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  resolved: boolean;
  context: Record<string, any>;
}

export interface CriticalPath {
  id: string;
  name: string;
  description: string;
  steps: string[];
  totalDuration: number;
  successRate: number;
  failurePoints: string[];
  optimizationOpportunities: OptimizationOpportunity[];
  userImpact: 'low' | 'medium' | 'high' | 'critical';
}

export interface OptimizationOpportunity {
  stepId: string;
  type: 'performance' | 'usability' | 'error-handling' | 'navigation';
  description: string;
  potentialImprovement: number;
  difficulty: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'critical';
  action: string;
}

export interface JourneyAnalysis {
  totalJourneys: number;
  successfulJourneys: number;
  failedJourneys: number;
  averageDuration: number;
  criticalPaths: CriticalPath[];
  commonFailurePoints: string[];
  optimizationOpportunities: OptimizationOpportunity[];
  recommendations: string[];
  generatedAt: Date;
}

// ============================================================================
// USER JOURNEY MAPPER CLASS
// ============================================================================

export class UserJourneyMapper {
  private journeys: Map<string, UserJourney> = new Map();
  private journeySteps: Map<string, JourneyStep[]> = new Map();
  private criticalPaths: Map<string, CriticalPath> = new Map();

  constructor() {
    this.initializeJourneyMapping();
  }

  /**
   * Initialize the journey mapping system
   */
  private initializeJourneyMapping(): void {
    logger.info('User Journey Mapper initialized');
    this.defineCoreJourneys();
    this.identifyCriticalPaths();
  }

  /**
   * Define core user journeys
   */
  private defineCoreJourneys(): void {
    // Onboarding Journey
    this.addJourney({
      id: 'onboarding-flow',
      name: 'User Onboarding Flow',
      description: 'Complete user onboarding from registration to first poll participation',
      steps: [
        {
          id: 'landing-page',
          name: 'Landing Page',
          description: 'User visits landing page',
          component: 'LandingPage',
          action: 'page_load',
          expectedOutcome: 'Page loads successfully',
          duration: 0,
          errors: [],
          success: true,
          timestamp: new Date()
        },
        {
          id: 'registration',
          name: 'User Registration',
          description: 'User creates account',
          component: 'RegisterForm',
          action: 'form_submit',
          expectedOutcome: 'Account created successfully',
          duration: 0,
          errors: [],
          success: true,
          timestamp: new Date()
        },
        {
          id: 'profile-setup',
          name: 'Profile Setup',
          description: 'User completes profile information',
          component: 'ProfileSetupStep',
          action: 'form_submit',
          expectedOutcome: 'Profile completed',
          duration: 0,
          errors: [],
          success: true,
          timestamp: new Date()
        },
        {
          id: 'first-poll',
          name: 'First Poll Participation',
          description: 'User participates in their first poll',
          component: 'PollCard',
          action: 'vote_cast',
          expectedOutcome: 'Vote recorded successfully',
          duration: 0,
          errors: [],
          success: true,
          timestamp: new Date()
        }
      ],
      criticality: 'critical',
      frequency: 100,
      successRate: 85,
      averageDuration: 300000, // 5 minutes
      userType: 'anonymous',
      category: 'onboarding'
    });

    // Voting Journey
    this.addJourney({
      id: 'voting-flow',
      name: 'Poll Voting Flow',
      description: 'User discovers, views, and votes on a poll',
      steps: [
        {
          id: 'poll-discovery',
          name: 'Poll Discovery',
          description: 'User finds a poll to vote on',
          component: 'PollCard',
          action: 'poll_click',
          expectedOutcome: 'Poll details loaded',
          duration: 0,
          errors: [],
          success: true,
          timestamp: new Date()
        },
        {
          id: 'poll-view',
          name: 'Poll View',
          description: 'User views poll details and options',
          component: 'PollClient',
          action: 'page_load',
          expectedOutcome: 'Poll options displayed',
          duration: 0,
          errors: [],
          success: true,
          timestamp: new Date()
        },
        {
          id: 'vote-cast',
          name: 'Vote Casting',
          description: 'User casts their vote',
          component: 'VoteForm',
          action: 'vote_submit',
          expectedOutcome: 'Vote recorded',
          duration: 0,
          errors: [],
          success: true,
          timestamp: new Date()
        },
        {
          id: 'results-view',
          name: 'Results View',
          description: 'User views poll results',
          component: 'PollResults',
          action: 'results_display',
          expectedOutcome: 'Results shown',
          duration: 0,
          errors: [],
          success: true,
          timestamp: new Date()
        }
      ],
      criticality: 'critical',
      frequency: 1000,
      successRate: 92,
      averageDuration: 120000, // 2 minutes
      userType: 'authenticated',
      category: 'voting'
    });

    // Analytics Journey
    this.addJourney({
      id: 'analytics-flow',
      name: 'Analytics Viewing Flow',
      description: 'User views poll analytics and insights',
      steps: [
        {
          id: 'analytics-access',
          name: 'Analytics Access',
          description: 'User accesses analytics page',
          component: 'AnalyticsPage',
          action: 'page_load',
          expectedOutcome: 'Analytics page loaded',
          duration: 0,
          errors: [],
          success: true,
          timestamp: new Date()
        },
        {
          id: 'sophisticated-analytics',
          name: 'Sophisticated Analytics',
          description: 'User views sophisticated analytics',
          component: 'SophisticatedAnalytics',
          action: 'analytics_load',
          expectedOutcome: 'Analytics data displayed',
          duration: 0,
          errors: [],
          success: true,
          timestamp: new Date()
        },
        {
          id: 'chart-interaction',
          name: 'Chart Interaction',
          description: 'User interacts with analytics charts',
          component: 'AccessibleResultsChart',
          action: 'chart_interaction',
          expectedOutcome: 'Chart responds to interaction',
          duration: 0,
          errors: [],
          success: true,
          timestamp: new Date()
        }
      ],
      criticality: 'high',
      frequency: 200,
      successRate: 88,
      averageDuration: 180000, // 3 minutes
      userType: 'authenticated',
      category: 'analytics'
    });

    // Admin Journey
    this.addJourney({
      id: 'admin-flow',
      name: 'Admin Management Flow',
      description: 'Admin user manages polls and system settings',
      steps: [
        {
          id: 'admin-dashboard',
          name: 'Admin Dashboard',
          description: 'Admin accesses dashboard',
          component: 'ComprehensiveAdminDashboard',
          action: 'page_load',
          expectedOutcome: 'Dashboard loaded',
          duration: 0,
          errors: [],
          success: true,
          timestamp: new Date()
        },
        {
          id: 'poll-management',
          name: 'Poll Management',
          description: 'Admin manages polls',
          component: 'AdminPollManagement',
          action: 'poll_action',
          expectedOutcome: 'Poll action completed',
          duration: 0,
          errors: [],
          success: true,
          timestamp: new Date()
        },
        {
          id: 'system-settings',
          name: 'System Settings',
          description: 'Admin updates system settings',
          component: 'SystemSettings',
          action: 'settings_update',
          expectedOutcome: 'Settings saved',
          duration: 0,
          errors: [],
          success: true,
          timestamp: new Date()
        }
      ],
      criticality: 'high',
      frequency: 50,
      successRate: 95,
      averageDuration: 600000, // 10 minutes
      userType: 'admin',
      category: 'admin'
    });
  }

  /**
   * Add a journey to the mapping
   */
  addJourney(journey: UserJourney): void {
    this.journeys.set(journey.id, journey);
    this.journeySteps.set(journey.id, journey.steps);
    logger.info(`Added journey: ${journey.name}`);
  }

  /**
   * Track a journey step
   */
  trackJourneyStep(journeyId: string, stepId: string, success: boolean, duration: number, errors: JourneyError[] = []): void {
    const journey = this.journeys.get(journeyId);
    if (!journey) {
      logger.warn(`Journey ${journeyId} not found`);
      return;
    }

    const step = journey.steps.find(s => s.id === stepId);
    if (!step) {
      logger.warn(`Step ${stepId} not found in journey ${journeyId}`);
      return;
    }

    step.success = success;
    step.duration = duration;
    step.errors = errors;
    step.timestamp = new Date();

    // Update journey statistics
    this.updateJourneyStatistics(journeyId);
  }

  /**
   * Update journey statistics
   */
  private updateJourneyStatistics(journeyId: string): void {
    const journey = this.journeys.get(journeyId);
    if (!journey) return;

    const successfulSteps = journey.steps.filter(step => step.success).length;
    journey.successRate = (successfulSteps / journey.steps.length) * 100;
    journey.averageDuration = journey.steps.reduce((total, step) => total + step.duration, 0);
  }

  /**
   * Identify critical paths
   */
  private identifyCriticalPaths(): void {
    for (const [id, journey] of this.journeys) {
      if (journey.criticality === 'critical' || journey.criticality === 'high') {
        const criticalPath: CriticalPath = {
          id: `critical-${id}`,
          name: `Critical Path: ${journey.name}`,
          description: `Critical path for ${journey.name}`,
          steps: journey.steps.map(step => step.id),
          totalDuration: journey.averageDuration,
          successRate: journey.successRate,
          failurePoints: journey.steps.filter(step => !step.success).map(step => step.id),
          optimizationOpportunities: this.identifyPathOptimizations(journey),
          userImpact: journey.criticality === 'critical' ? 'critical' : 'high'
        };
        
        this.criticalPaths.set(criticalPath.id, criticalPath);
      }
    }
  }

  /**
   * Identify path optimizations
   */
  private identifyPathOptimizations(journey: UserJourney): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];
    
    for (const step of journey.steps) {
      // Performance optimizations
      if (step.duration > 5000) { // 5 seconds
        opportunities.push({
          stepId: step.id,
          type: 'performance',
          description: `Step ${step.name} takes ${step.duration}ms`,
          potentialImprovement: 30,
          difficulty: 'medium',
          priority: 'high',
          action: `Optimize ${step.component} component performance`
        });
      }
      
      // Error handling optimizations
      if (step.errors.length > 0) {
        opportunities.push({
          stepId: step.id,
          type: 'error-handling',
          description: `Step ${step.name} has ${step.errors.length} errors`,
          potentialImprovement: 20,
          difficulty: 'low',
          priority: 'high',
          action: `Improve error handling in ${step.component}`
        });
      }
      
      // Usability optimizations
      if (step.component.includes('Form') && step.duration > 3000) {
        opportunities.push({
          stepId: step.id,
          type: 'usability',
          description: `Form ${step.name} could be more user-friendly`,
          potentialImprovement: 15,
          difficulty: 'medium',
          priority: 'medium',
          action: `Improve form UX in ${step.component}`
        });
      }
    }
    
    return opportunities;
  }

  /**
   * Get journey analysis
   */
  getJourneyAnalysis(): JourneyAnalysis {
    const totalJourneys = this.journeys.size;
    const successfulJourneys = Array.from(this.journeys.values())
      .filter(journey => journey.successRate > 80).length;
    const failedJourneys = totalJourneys - successfulJourneys;
    
    const averageDuration = Array.from(this.journeys.values())
      .reduce((total, journey) => total + journey.averageDuration, 0) / totalJourneys;
    
    const criticalPaths = Array.from(this.criticalPaths.values());
    
    const commonFailurePoints = this.identifyCommonFailurePoints();
    const optimizationOpportunities = this.getAllOptimizationOpportunities();
    const recommendations = this.generateJourneyRecommendations();
    
    return {
      totalJourneys,
      successfulJourneys,
      failedJourneys,
      averageDuration,
      criticalPaths,
      commonFailurePoints,
      optimizationOpportunities,
      recommendations,
      generatedAt: new Date()
    };
  }

  /**
   * Identify common failure points
   */
  private identifyCommonFailurePoints(): string[] {
    const failureCounts = new Map<string, number>();
    
    for (const journey of this.journeys.values()) {
      for (const step of journey.steps) {
        if (!step.success) {
          const count = failureCounts.get(step.component) || 0;
          failureCounts.set(step.component, count + 1);
        }
      }
    }
    
    return Array.from(failureCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([component]) => component);
  }

  /**
   * Get all optimization opportunities
   */
  private getAllOptimizationOpportunities(): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];
    
    for (const criticalPath of this.criticalPaths.values()) {
      opportunities.push(...criticalPath.optimizationOpportunities);
    }
    
    return opportunities.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Generate journey recommendations
   */
  private generateJourneyRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const analysis = this.getJourneyAnalysis();
    
    if (analysis.failedJourneys > 0) {
      recommendations.push(`Improve success rate for ${analysis.failedJourneys} failing journeys`);
    }
    
    if (analysis.averageDuration > 300000) { // 5 minutes
      recommendations.push('Optimize journey duration - average is over 5 minutes');
    }
    
    if (analysis.commonFailurePoints.length > 0) {
      recommendations.push(`Focus on fixing common failure points: ${analysis.commonFailurePoints.join(', ')}`);
    }
    
    recommendations.push('Implement journey tracking for real-time monitoring');
    recommendations.push('Add user feedback collection at key journey points');
    recommendations.push('Optimize critical paths for better user experience');
    
    return recommendations;
  }

  /**
   * Get critical paths
   */
  getCriticalPaths(): CriticalPath[] {
    return Array.from(this.criticalPaths.values());
  }

  /**
   * Get journey by ID
   */
  getJourney(journeyId: string): UserJourney | undefined {
    return this.journeys.get(journeyId);
  }

  /**
   * Get all journeys
   */
  getAllJourneys(): UserJourney[] {
    return Array.from(this.journeys.values());
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let mapperInstance: UserJourneyMapper | null = null;

export const getUserJourneyMapper = (): UserJourneyMapper => {
  if (!mapperInstance) {
    mapperInstance = new UserJourneyMapper();
  }
  return mapperInstance;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Track a journey step
 */
export const trackJourneyStep = (
  journeyId: string, 
  stepId: string, 
  success: boolean, 
  duration: number, 
  errors: JourneyError[] = []
): void => {
  const mapper = getUserJourneyMapper();
  mapper.trackJourneyStep(journeyId, stepId, success, duration, errors);
};

/**
 * Get journey analysis
 */
export const getJourneyAnalysis = (): JourneyAnalysis => {
  const mapper = getUserJourneyMapper();
  return mapper.getJourneyAnalysis();
};

/**
 * Get critical paths
 */
export const getCriticalPaths = (): CriticalPath[] => {
  const mapper = getUserJourneyMapper();
  return mapper.getCriticalPaths();
};

export default getUserJourneyMapper;
