/**
 * Rate Limit Monitoring
 * 
 * Monitors rate limit violations and provides alerting capabilities
 * Integrated with existing security and logging infrastructure
 * 
 * Created: 2025-10-29
 * Status: In Progress
 */

import { logger } from '../utils/logger';
import { trackSophisticatedEvent } from '../utils/sophisticated-analytics';
import { getSecurityConfig } from '../security/config';
// Removed fs and path imports - not supported in Edge Runtime

export interface RateLimitViolation {
  ip: string;
  endpoint: string;
  timestamp: Date;
  count: number;
  maxRequests: number;
  userAgent?: string;
}

export interface RateLimitMetrics {
  totalViolations: number;
  violationsByIP: Map<string, number>;
  violationsByEndpoint: Map<string, number>;
  violationsLastHour: number;
  topViolatingIPs: Array<{ ip: string; count: number }>;
}

class RateLimitMonitor {
  private violations: RateLimitViolation[] = [];
  private metrics: RateLimitMetrics = {
    totalViolations: 0,
    violationsByIP: new Map(),
    violationsByEndpoint: new Map(),
    violationsLastHour: 0,
    topViolatingIPs: []
  };
  private securityConfig = getSecurityConfig();
  // Removed file storage - not supported in Edge Runtime
  // Using in-memory storage only

  /**
   * Record a rate limit violation
   */
  async recordViolation(violation: Omit<RateLimitViolation, 'timestamp'>): Promise<void> {
    const fullViolation: RateLimitViolation = {
      ip: violation.ip,
      endpoint: violation.endpoint,
      count: violation.count,
      maxRequests: violation.maxRequests,
      userAgent: violation.userAgent,
      timestamp: new Date()
    };

    this.violations.push(fullViolation);
    this.updateMetrics(fullViolation);
    this.checkAlerts(fullViolation);
    
    // Save to file storage
    await this.saveViolations();
    
    // Debug logging
    // Violation recorded and logged via logger.warn
    
    // Log security event
    logger.warn('Rate limit violation detected', {
      ip: fullViolation.ip,
      endpoint: fullViolation.endpoint,
      count: fullViolation.count,
      maxRequests: fullViolation.maxRequests,
      userAgent: fullViolation.userAgent
    });

    // Track in sophisticated analytics
    void trackSophisticatedEvent('error_occurred', {
      error_type: 'rate_limit_violation',
      ip_address: fullViolation.ip,
      endpoint: fullViolation.endpoint,
      violation_count: fullViolation.count,
      max_requests: fullViolation.maxRequests,
      user_agent: fullViolation.userAgent
    }, {
      ipAddress: fullViolation.ip,
      userAgent: fullViolation.userAgent
    });
  }

  /**
   * Update metrics based on new violation
   */
  private updateMetrics(violation: RateLimitViolation): void {
    this.metrics.totalViolations++;

    // Update IP violations
    const ipCount = this.metrics.violationsByIP.get(violation.ip) ?? 0;
    this.metrics.violationsByIP.set(violation.ip, ipCount + 1);

    // Update endpoint violations
    const endpointCount = this.metrics.violationsByEndpoint.get(violation.endpoint) ?? 0;
    this.metrics.violationsByEndpoint.set(violation.endpoint, endpointCount + 1);

    // Update last hour violations
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    this.metrics.violationsLastHour = this.violations.filter(
      v => v.timestamp > oneHourAgo
    ).length;

    // Update top violating IPs
    this.updateTopViolatingIPs();
  }

  /**
   * Update top violating IPs list
   */
  private updateTopViolatingIPs(): void {
    this.metrics.topViolatingIPs = Array.from(this.metrics.violationsByIP.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Check if alerts should be triggered
   */
  private checkAlerts(violation: RateLimitViolation): void {
    const ipCount = this.metrics.violationsByIP.get(violation.ip) ?? 0;
    
    // Use security config for alert thresholds
    const maxIPViolations = this.securityConfig.rateLimit.maxRequests * 2; // 2x the general limit
    const maxSystemViolations = this.securityConfig.rateLimit.maxRequests * 10; // 10x the general limit
    
    // Alert if single IP has excessive violations
    if (ipCount > maxIPViolations) {
      this.triggerAlert('HIGH_IP_VIOLATIONS', {
        ip: violation.ip,
        count: ipCount,
        threshold: maxIPViolations,
        message: `IP ${violation.ip} has ${ipCount} rate limit violations (threshold: ${maxIPViolations})`
      });
    }

    // Alert if system-wide violations exceed threshold
    if (this.metrics.violationsLastHour > maxSystemViolations) {
      this.triggerAlert('HIGH_SYSTEM_VIOLATIONS', {
        count: this.metrics.violationsLastHour,
        threshold: maxSystemViolations,
        message: `${this.metrics.violationsLastHour} rate limit violations in the last hour (threshold: ${maxSystemViolations})`
      });
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(type: string, data: Record<string, unknown>): void {
    logger.warn(`🚨 RATE LIMIT ALERT [${type}]:`, data);
    
    // Track security alert in analytics
    void trackSophisticatedEvent('error_occurred', {
      error_type: 'rate_limit_alert',
      alert_type: type,
      alert_data: data
    });

    // In production, this would send to monitoring service
    // e.g., Sentry, DataDog, PagerDuty, etc.
  }

  /**
   * Get current metrics
   */
  getMetrics(): RateLimitMetrics {
    return { ...this.metrics };
  }

  /**
   * Get violations for a specific IP
   */
  getViolationsForIP(ip: string): RateLimitViolation[] {
    return this.violations.filter(v => v.ip === ip);
  }

  /**
   * Get violations for a specific endpoint
   */
  getViolationsForEndpoint(endpoint: string): RateLimitViolation[] {
    return this.violations.filter(v => v.endpoint === endpoint);
  }

  /**
   * Get all violations (for monitoring API)
   */
  getAllViolations(): RateLimitViolation[] {
    return [...this.violations];
  }

  /**
   * Load violations from file storage
   */
  public async loadViolations(): Promise<void> {
    try {
      // const data = await fs.readFile(this.storagePath, 'utf8'); // Disabled for Edge Runtime
      // const parsed = JSON.parse(data); // Disabled for Edge Runtime
      // this.violations = parsed.violations.map((v: any) => ({ // Disabled for Edge Runtime
      //   ...v,
      //   timestamp: new Date(v.timestamp)
      // }));
      // this.updateMetricsFromViolations(); // Disabled for Edge Runtime
    } catch {
      // File doesn't exist or is invalid, start fresh
      this.violations = [];
    }
  }

  /**
   * Save violations to file storage
   */
  private async saveViolations(): Promise<void> {
    try {
      // await fs.mkdir(path.dirname(this.storagePath), { recursive: true }); // Disabled for Edge Runtime
      // await fs.writeFile(this.storagePath, JSON.stringify({ // Disabled for Edge Runtime
      //   violations: this.violations,
      //   lastUpdated: new Date().toISOString()
      // }));
    } catch (error) {
      logger.warn('Failed to save rate limit violations:', error);
    }
  }

  /**
   * Update metrics from current violations
   */
  private updateMetricsFromViolations(): void {
    this.metrics = {
      totalViolations: this.violations.length,
      violationsByIP: new Map(),
      violationsByEndpoint: new Map(),
      violationsLastHour: 0,
      topViolatingIPs: []
    };

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    for (const violation of this.violations) {
      // Count by IP
      const ipCount = this.metrics.violationsByIP.get(violation.ip) ?? 0;
      this.metrics.violationsByIP.set(violation.ip, ipCount + 1);

      // Count by endpoint
      const endpointCount = this.metrics.violationsByEndpoint.get(violation.endpoint) ?? 0;
      this.metrics.violationsByEndpoint.set(violation.endpoint, endpointCount + 1);

      // Count last hour
      if (violation.timestamp > oneHourAgo) {
        this.metrics.violationsLastHour++;
      }
    }

    // Update top violating IPs
    this.metrics.topViolatingIPs = Array.from(this.metrics.violationsByIP.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Clear old violations (older than 24 hours)
   */
  cleanupOldViolations(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.violations = this.violations.filter(v => v.timestamp > oneDayAgo);
  }

  /**
   * Get rate limit status for an IP
   */
  getIPStatus(ip: string): {
    isBlocked: boolean;
    violationCount: number;
    lastViolation?: Date;
  } {
    const violations = this.getViolationsForIP(ip);
    const recentViolations = violations.filter(
      v => v.timestamp > new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
    );

    return {
      isBlocked: recentViolations.length > 0,
      violationCount: violations.length,
      lastViolation: violations.length > 0 ? violations[violations.length - 1]?.timestamp : undefined
    };
  }
}

// Global instance to ensure singleton across Next.js contexts
declare global {
  var __rateLimitMonitor: RateLimitMonitor | undefined;
}

// Export singleton instance
export const rateLimitMonitor = (() => {
  if (!global.__rateLimitMonitor) {
    global.__rateLimitMonitor = new RateLimitMonitor();
    
    // Initialize by loading violations from file
    void global.__rateLimitMonitor.loadViolations();
    
    // Cleanup old violations every hour
    setInterval(() => {
      global.__rateLimitMonitor?.cleanupOldViolations();
    }, 60 * 60 * 1000);
  }
  return global.__rateLimitMonitor;
})();
