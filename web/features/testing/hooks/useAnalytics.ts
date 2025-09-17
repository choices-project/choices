/**
 * Analytics Hook
 * 
 * This module provides a React hook for analytics functionality.
 */

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

export interface AnalyticsConfig {
  enabled: boolean;
  provider?: string;
  apiKey?: string;
}

export function useAnalytics() {
  const [config, setConfig] = useState<AnalyticsConfig>({
    enabled: false,
    provider: 'none'
  });

  const [events, setEvents] = useState<AnalyticsEvent[]>([]);

  useEffect(() => {
    // Initialize analytics configuration
    setConfig({
      enabled: true,
      provider: 'test'
    });
  }, []);

  const trackEvent = (event: AnalyticsEvent) => {
    if (!config.enabled) return;

    const eventWithTimestamp = {
      ...event,
      timestamp: new Date()
    };

    setEvents(prev => [...prev, eventWithTimestamp]);
    logger.info('Analytics event tracked:', eventWithTimestamp);
  };

  const trackPageView = (page: string) => {
    trackEvent({
      name: 'page_view',
      properties: { page }
    });
  };

  const trackUserAction = (action: string, properties?: Record<string, any>) => {
    trackEvent({
      name: 'user_action',
      properties: { action, ...properties }
    });
  };

  const getEvents = () => events;

  const clearEvents = () => {
    setEvents([]);
  };

  return {
    config,
    trackEvent,
    trackPageView,
    trackUserAction,
    getEvents,
    clearEvents,
    isEnabled: config.enabled
  };
}





