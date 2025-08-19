/**
 * GitHub Issue Integration Service
 * Transforms user feedback into actionable GitHub issues with intelligent analysis
 */

import { devLog } from './logger';

// GitHub API Configuration
interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  baseUrl?: string;
}

// Enhanced Feedback Analysis
interface FeedbackAnalysis {
  intent: 'bug' | 'feature' | 'improvement' | 'question' | 'compliment';
  urgency: number; // 1-10 scale
  complexity: number; // 1-10 scale
  impact: number; // 1-10 scale
  businessValue: number; // 1-10 scale
  userImpact: number; // 1-10 scale
  technicalUrgency: number; // 1-10 scale
  estimatedEffort: 'small' | 'medium' | 'large' | 'epic';
  suggestedLabels: string[];
  suggestedAssignee?: string;
  affectedComponents: string[];
  errorPatterns?: string[];
  performanceIssues?: string[];
  browserSpecific?: boolean;
  deviceSpecific?: boolean;
  userSegment: string[];
  featureArea: string[];
  revenueImpact?: 'low' | 'medium' | 'high';
  userExperienceImpact: number; // 1-10
  dependencies?: string[];
  relatedIssues?: string[];
}

// GitHub Issue Structure
interface GitHubIssue {
  title: string;
  body: string;
  labels: string[];
  assignees?: string[];
  milestone?: number;
  state?: 'open' | 'closed';
}

// Feedback to Issue Mapping
interface FeedbackToIssueMapping {
  feedbackId: string;
  issueNumber?: number;
  issueUrl?: string;
  status: 'pending' | 'created' | 'failed';
  error?: string;
  createdAt: string;
  updatedAt: string;
}

class GitHubIssueIntegration {
  private config: GitHubConfig;
  private mappings: Map<string, FeedbackToIssueMapping> = new Map();

  constructor(config: GitHubConfig) {
    this.config = config;
  }

  /**
   * Analyze feedback and generate comprehensive analysis
   */
  async analyzeFeedback(feedback: any): Promise<FeedbackAnalysis> {
    devLog('Analyzing feedback for issue generation:', { feedbackId: feedback.id });

    const analysis: FeedbackAnalysis = {
      intent: this.classifyIntent(feedback),
      urgency: this.calculateUrgency(feedback),
      complexity: this.estimateComplexity(feedback),
      impact: this.calculateImpact(feedback),
      businessValue: this.calculateBusinessValue(feedback),
      userImpact: this.calculateUserImpact(feedback),
      technicalUrgency: this.calculateTechnicalUrgency(feedback),
      estimatedEffort: this.estimateEffort(feedback),
      suggestedLabels: this.generateLabels(feedback),
      suggestedAssignee: this.suggestAssignee(feedback),
      affectedComponents: this.identifyAffectedComponents(feedback),
      errorPatterns: this.extractErrorPatterns(feedback),
      performanceIssues: this.identifyPerformanceIssues(feedback),
      browserSpecific: this.isBrowserSpecific(feedback),
      deviceSpecific: this.isDeviceSpecific(feedback),
      userSegment: this.identifyUserSegment(feedback),
      featureArea: this.identifyFeatureArea(feedback),
      revenueImpact: this.assessRevenueImpact(feedback),
      userExperienceImpact: this.calculateUserExperienceImpact(feedback),
      dependencies: this.identifyDependencies(feedback),
      relatedIssues: await this.findRelatedIssues(feedback)
    };

    devLog('Feedback analysis completed:', analysis);
    return analysis;
  }

  /**
   * Generate GitHub issue from feedback
   */
  async generateIssue(feedback: any, analysis: FeedbackAnalysis): Promise<GitHubIssue> {
    const template = this.selectTemplate(feedback.type, analysis.intent);
    const issue = this.populateTemplate(template, feedback, analysis);
    
    devLog('Generated GitHub issue:', issue);
    return issue;
  }

  /**
   * Create GitHub issue via API
   */
  async createGitHubIssue(issue: GitHubIssue): Promise<{ number: number; url: string }> {
    try {
      const response = await fetch(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(issue),
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      devLog('GitHub issue created successfully:', { number: result.number, url: result.html_url });
      
      return {
        number: result.number,
        url: result.html_url
      };
    } catch (error) {
      devLog('Error creating GitHub issue:', error);
      throw error;
    }
  }

  /**
   * Link feedback to GitHub issue
   */
  async linkFeedbackToIssue(feedbackId: string, issueNumber: number, issueUrl: string): Promise<void> {
    const mapping: FeedbackToIssueMapping = {
      feedbackId,
      issueNumber,
      issueUrl,
      status: 'created',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.mappings.set(feedbackId, mapping);
    devLog('Linked feedback to GitHub issue:', mapping);
  }

  /**
   * Find duplicate or related issues
   */
  async findRelatedIssues(feedback: any): Promise<string[]> {
    try {
      const searchQuery = this.buildSearchQuery(feedback);
      const response = await fetch(
        `https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Authorization': `token ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const result = await response.json();
      return result.items.slice(0, 5).map((item: any) => `#${item.number}`);
    } catch (error) {
      devLog('Error finding related issues:', error);
      return [];
    }
  }

  /**
   * Update issue status when feedback status changes
   */
  async updateIssueStatus(issueNumber: number, status: string): Promise<void> {
    try {
      const state = status === 'resolved' || status === 'closed' ? 'closed' : 'open';
      
      const response = await fetch(
        `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/issues/${issueNumber}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `token ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ state }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update issue status: ${response.status}`);
      }

      devLog('Issue status updated successfully:', { issueNumber, status });
    } catch (error) {
      devLog('Error updating issue status:', error);
      throw error;
    }
  }

  // Private helper methods

  private classifyIntent(feedback: any): 'bug' | 'feature' | 'improvement' | 'question' | 'compliment' {
    const { type, title, description, sentiment } = feedback;
    
    // Explicit type classification
    if (type === 'bug') return 'bug';
    if (type === 'feature') return 'feature';
    
    // Content-based classification
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('error') || text.includes('broken') || text.includes('not working')) {
      return 'bug';
    }
    
    if (text.includes('add') || text.includes('new') || text.includes('feature')) {
      return 'feature';
    }
    
    if (text.includes('improve') || text.includes('better') || text.includes('enhance')) {
      return 'improvement';
    }
    
    if (text.includes('how') || text.includes('question') || text.includes('?')) {
      return 'question';
    }
    
    if (sentiment === 'positive' && !text.includes('bug')) {
      return 'compliment';
    }
    
    return 'improvement';
  }

  private calculateUrgency(feedback: any): number {
    let urgency = 5; // Base urgency
    
    // Type-based urgency
    if (feedback.type === 'bug') urgency += 2;
    if (feedback.type === 'security') urgency += 3;
    
    // Sentiment-based urgency
    if (feedback.sentiment === 'negative') urgency += 1;
    
    // Priority-based urgency
    if (feedback.priority === 'urgent') urgency += 3;
    if (feedback.priority === 'high') urgency += 2;
    
    // User impact urgency
    if (feedback.user_journey?.errors?.length > 0) urgency += 2;
    
    return Math.min(urgency, 10);
  }

  private estimateComplexity(feedback: any): number {
    let complexity = 3; // Base complexity
    
    // Technical indicators
    if (feedback.user_journey?.errors?.length > 0) complexity += 2;
    if (feedback.metadata?.performanceMetrics) complexity += 1;
    if (feedback.screenshot) complexity += 1;
    
    // Content complexity
    const descriptionLength = feedback.description?.length || 0;
    if (descriptionLength > 500) complexity += 2;
    if (descriptionLength > 1000) complexity += 1;
    
    return Math.min(complexity, 10);
  }

  private calculateImpact(feedback: any): number {
    let impact = 5; // Base impact
    
    // User segment impact
    if (feedback.user_journey?.isAuthenticated) impact += 1;
    
    // Feature area impact
    const featureArea = this.identifyFeatureArea(feedback);
    if (featureArea.includes('core') || featureArea.includes('voting')) impact += 2;
    
    // Performance impact
    if (feedback.metadata?.performanceMetrics?.cls > 0.1) impact += 1;
    
    return Math.min(impact, 10);
  }

  private calculateBusinessValue(feedback: any): number {
    let value = 5; // Base business value
    
    // User engagement indicators
    if (feedback.user_journey?.totalPageViews > 10) value += 1;
    if (feedback.user_journey?.timeOnPage > 300) value += 1;
    
    // Feature importance
    const featureArea = this.identifyFeatureArea(feedback);
    if (featureArea.includes('voting') || featureArea.includes('polls')) value += 2;
    
    return Math.min(value, 10);
  }

  private calculateUserImpact(feedback: any): number {
    let impact = 5; // Base user impact
    
    // Sentiment impact
    if (feedback.sentiment === 'negative') impact += 2;
    if (feedback.sentiment === 'positive') impact += 1;
    
    // User journey impact
    if (feedback.user_journey?.errors?.length > 0) impact += 2;
    
    return Math.min(impact, 10);
  }

  private calculateTechnicalUrgency(feedback: any): number {
    let urgency = 3; // Base technical urgency
    
    // Error-based urgency
    if (feedback.user_journey?.errors?.length > 0) urgency += 3;
    
    // Performance urgency
    const metrics = feedback.metadata?.performanceMetrics;
    if (metrics?.cls > 0.1) urgency += 2;
    if (metrics?.fcp > 3000) urgency += 1;
    
    // Security urgency
    if (feedback.type === 'security') urgency += 3;
    
    return Math.min(urgency, 10);
  }

  private estimateEffort(feedback: any): 'small' | 'medium' | 'large' | 'epic' {
    const complexity = this.estimateComplexity(feedback);
    const affectedComponents = this.identifyAffectedComponents(feedback);
    
    if (complexity <= 4 && affectedComponents.length <= 1) return 'small';
    if (complexity <= 6 && affectedComponents.length <= 2) return 'medium';
    if (complexity <= 8 && affectedComponents.length <= 3) return 'large';
    return 'epic';
  }

  private generateLabels(feedback: any): string[] {
    const labels: string[] = [];
    
    // Type-based labels
    labels.push(feedback.type);
    
    // Priority-based labels
    if (feedback.priority === 'urgent') labels.push('urgent');
    if (feedback.priority === 'high') labels.push('high-priority');
    
    // Sentiment-based labels
    labels.push(`${feedback.sentiment}-feedback`);
    
    // Feature area labels
    const featureArea = this.identifyFeatureArea(feedback);
    labels.push(...featureArea.map((area: string) => `area:${area}`));
    
    // Technical labels
    if (feedback.user_journey?.errors?.length > 0) labels.push('bug');
    if (feedback.metadata?.performanceMetrics) labels.push('performance');
    
    return [...new Set(labels)]; // Remove duplicates
  }

  private suggestAssignee(feedback: any): string | undefined {
    // This would be enhanced with team member mapping
    const featureArea = this.identifyFeatureArea(feedback);
    
    // Simple assignment logic (would be enhanced with team structure)
    if (featureArea.includes('frontend')) return 'frontend-team';
    if (featureArea.includes('backend')) return 'backend-team';
    if (featureArea.includes('database')) return 'backend-team';
    
    return undefined;
  }

  private identifyAffectedComponents(feedback: any): string[] {
    const components: string[] = [];
    const text = `${feedback.title} ${feedback.description}`.toLowerCase();
    
    // Component detection based on content
    if (text.includes('poll') || text.includes('vote')) components.push('polling-system');
    if (text.includes('auth') || text.includes('login')) components.push('authentication');
    if (text.includes('dashboard') || text.includes('admin')) components.push('admin-panel');
    if (text.includes('feedback') || text.includes('widget')) components.push('feedback-system');
    if (text.includes('mobile') || text.includes('responsive')) components.push('responsive-design');
    
    return components;
  }

  private extractErrorPatterns(feedback: any): string[] {
    const patterns: string[] = [];
    const errors = feedback.user_journey?.errors || [];
    
    errors.forEach((error: any) => {
      if (error.message) patterns.push(error.message);
    });
    
    return patterns;
  }

  private identifyPerformanceIssues(feedback: any): string[] {
    const issues: string[] = [];
    const metrics = feedback.metadata?.performanceMetrics;
    
    if (metrics?.cls > 0.1) issues.push('high-cumulative-layout-shift');
    if (metrics?.fcp > 3000) issues.push('slow-first-contentful-paint');
    if (metrics?.lcp > 4000) issues.push('slow-largest-contentful-paint');
    
    return issues;
  }

  private isBrowserSpecific(feedback: any): boolean {
    const deviceInfo = feedback.user_journey?.deviceInfo;
    return deviceInfo?.browser !== undefined;
  }

  private isDeviceSpecific(feedback: any): boolean {
    const deviceInfo = feedback.user_journey?.deviceInfo;
    return deviceInfo?.type !== 'desktop';
  }

  private identifyUserSegment(feedback: any): string[] {
    const segments: string[] = [];
    
    if (feedback.user_journey?.isAuthenticated) {
      segments.push('authenticated-users');
    } else {
      segments.push('anonymous-users');
    }
    
    const deviceInfo = feedback.user_journey?.deviceInfo;
    if (deviceInfo?.type) {
      segments.push(`${deviceInfo.type}-users`);
    }
    
    return segments;
  }

  private identifyFeatureArea(feedback: any): string[] {
    const areas: string[] = [];
    const text = `${feedback.title} ${feedback.description}`.toLowerCase();
    
    if (text.includes('poll') || text.includes('vote')) areas.push('polling');
    if (text.includes('auth') || text.includes('login')) areas.push('authentication');
    if (text.includes('dashboard') || text.includes('admin')) areas.push('admin');
    if (text.includes('feedback')) areas.push('feedback');
    if (text.includes('mobile') || text.includes('responsive')) areas.push('responsive');
    
    return areas.length > 0 ? areas : ['general'];
  }

  private assessRevenueImpact(feedback: any): 'low' | 'medium' | 'high' {
    const featureArea = this.identifyFeatureArea(feedback);
    
    if (featureArea.includes('polling') || featureArea.includes('core')) return 'high';
    if (featureArea.includes('authentication') || featureArea.includes('admin')) return 'medium';
    return 'low';
  }

  private calculateUserExperienceImpact(feedback: any): number {
    let impact = 5; // Base UX impact
    
    if (feedback.sentiment === 'negative') impact += 2;
    if (feedback.user_journey?.errors?.length > 0) impact += 2;
    if (feedback.metadata?.performanceMetrics?.cls > 0.1) impact += 1;
    
    return Math.min(impact, 10);
  }

  private identifyDependencies(feedback: any): string[] {
    const dependencies: string[] = [];
    const text = `${feedback.title} ${feedback.description}`.toLowerCase();
    
    if (text.includes('database') || text.includes('supabase')) dependencies.push('database');
    if (text.includes('api') || text.includes('backend')) dependencies.push('backend-api');
    if (text.includes('frontend') || text.includes('ui')) dependencies.push('frontend');
    
    return dependencies;
  }

  private buildSearchQuery(feedback: any): string {
    const keywords = [
      feedback.title,
      ...this.identifyFeatureArea(feedback),
      ...this.identifyAffectedComponents(feedback)
    ].filter(Boolean);
    
    return `repo:${this.config.owner}/${this.config.repo} ${keywords.join(' ')}`;
  }

  private selectTemplate(type: string, intent: string): string {
    if (intent === 'bug') return 'bug-report';
    if (intent === 'feature') return 'feature-request';
    if (intent === 'improvement') return 'improvement';
    return 'general-feedback';
  }

  private populateTemplate(template: string, feedback: any, analysis: FeedbackAnalysis): GitHubIssue {
    const title = this.generateTitle(feedback, analysis);
    const body = this.generateBody(template, feedback, analysis);
    const labels = analysis.suggestedLabels;
    const assignees = analysis.suggestedAssignee ? [analysis.suggestedAssignee] : undefined;
    
    return { title, body, labels, assignees };
  }

  private generateTitle(feedback: any, analysis: FeedbackAnalysis): string {
    const intent = analysis.intent;
    const area = analysis.featureArea[0] || 'general';
    
    switch (intent) {
      case 'bug':
        return `🐛 [${area}] ${feedback.title}`;
      case 'feature':
        return `✨ [${area}] ${feedback.title}`;
      case 'improvement':
        return `🚀 [${area}] ${feedback.title}`;
      default:
        return `📝 [${area}] ${feedback.title}`;
    }
  }

  private generateBody(template: string, feedback: any, analysis: FeedbackAnalysis): string {
    const baseBody = this.getTemplateBody(template);
    
    return baseBody
      .replace('{{FEEDBACK_ID}}', feedback.id)
      .replace('{{TITLE}}', feedback.title)
      .replace('{{DESCRIPTION}}', feedback.description)
      .replace('{{TYPE}}', feedback.type)
      .replace('{{SENTIMENT}}', feedback.sentiment)
      .replace('{{PRIORITY}}', feedback.priority)
      .replace('{{URGENCY}}', analysis.urgency.toString())
      .replace('{{IMPACT}}', analysis.impact.toString())
      .replace('{{EFFORT}}', analysis.estimatedEffort)
      .replace('{{COMPONENTS}}', analysis.affectedComponents.join(', '))
      .replace('{{FEATURE_AREA}}', analysis.featureArea.join(', '))
      .replace('{{USER_SEGMENT}}', analysis.userSegment.join(', '))
      .replace('{{TECHNICAL_DETAILS}}', this.formatTechnicalDetails(feedback))
      .replace('{{USER_JOURNEY}}', this.formatUserJourney(feedback))
      .replace('{{RELATED_ISSUES}}', analysis.relatedIssues.join(', ') || 'None found');
  }

  private getTemplateBody(template: string): string {
    const templates = {
      'bug-report': `## 🐛 Bug Report
**Feedback ID:** {{FEEDBACK_ID}}
**Type:** {{TYPE}}
**Priority:** {{PRIORITY}}
**Sentiment:** {{SENTIMENT}}

### Description
{{DESCRIPTION}}

### Technical Details
{{TECHNICAL_DETAILS}}

### User Journey
{{USER_JOURNEY}}

### Priority Assessment
- **Urgency:** {{URGENCY}}/10
- **Impact:** {{IMPACT}}/10
- **Effort:** {{EFFORT}}
- **Affected Components:** {{COMPONENTS}}

### Related Issues
{{RELATED_ISSUES}}`,

      'feature-request': `## ✨ Feature Request
**Feedback ID:** {{FEEDBACK_ID}}
**Type:** {{TYPE}}
**Priority:** {{PRIORITY}}
**Sentiment:** {{SENTIMENT}}

### Description
{{DESCRIPTION}}

### User Value
This feature would benefit {{USER_SEGMENT}} users in the {{FEATURE_AREA}} area.

### Technical Considerations
- **Effort:** {{EFFORT}}
- **Impact:** {{IMPACT}}/10
- **Affected Components:** {{COMPONENTS}}

### Related Issues
{{RELATED_ISSUES}}`,

      'improvement': `## 🚀 Improvement Request
**Feedback ID:** {{FEEDBACK_ID}}
**Type:** {{TYPE}}
**Priority:** {{PRIORITY}}
**Sentiment:** {{SENTIMENT}}

### Description
{{DESCRIPTION}}

### Impact Assessment
- **User Impact:** {{IMPACT}}/10
- **Effort:** {{EFFORT}}
- **Feature Area:** {{FEATURE_AREA}}

### Related Issues
{{RELATED_ISSUES}}`,

      'general-feedback': `## 📝 General Feedback
**Feedback ID:** {{FEEDBACK_ID}}
**Type:** {{TYPE}}
**Priority:** {{PRIORITY}}
**Sentiment:** {{SENTIMENT}}

### Description
{{DESCRIPTION}}

### Context
- **User Segment:** {{USER_SEGMENT}}
- **Feature Area:** {{FEATURE_AREA}}
- **Impact:** {{IMPACT}}/10

### Related Issues
{{RELATED_ISSUES}}`
    };

    return templates[template as keyof typeof templates] || templates['general-feedback'];
  }

  private formatTechnicalDetails(feedback: any): string {
    const details: string[] = [];
    
    if (feedback.user_journey?.deviceInfo) {
      const device = feedback.user_journey.deviceInfo;
      details.push(`- **Device:** ${device.type} (${device.os}, ${device.browser})`);
    }
    
    if (feedback.metadata?.performanceMetrics) {
      const metrics = feedback.metadata.performanceMetrics;
      details.push(`- **Performance:** CLS: ${metrics.cls || 'N/A'}, FCP: ${metrics.fcp || 'N/A'}ms`);
    }
    
    if (feedback.user_journey?.errors?.length > 0) {
      details.push(`- **Errors:** ${feedback.user_journey.errors.length} error(s) detected`);
    }
    
    return details.length > 0 ? details.join('\n') : 'No technical details available';
  }

  private formatUserJourney(feedback: any): string {
    const journey = feedback.user_journey;
    if (!journey) return 'No user journey data available';
    
    const details: string[] = [];
    
    if (journey.currentPage) details.push(`- **Page:** ${journey.currentPage}`);
    if (journey.timeOnPage) details.push(`- **Time on Page:** ${journey.timeOnPage}s`);
    if (journey.totalPageViews) details.push(`- **Total Page Views:** ${journey.totalPageViews}`);
    if (journey.sessionId) details.push(`- **Session ID:** ${journey.sessionId}`);
    
    return details.length > 0 ? details.join('\n') : 'Basic user journey data available';
  }
}

// Export the service
export { GitHubIssueIntegration, type FeedbackAnalysis, type GitHubIssue, type FeedbackToIssueMapping };
