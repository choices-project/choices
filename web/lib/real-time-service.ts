/**
 * Real-time Service for Choices Platform
 * 
 * Provides real-time updates using Server-Sent Events (SSE)
 * for live data synchronization across the application.
 */

import { devLog } from './logger';

export interface RealTimeEvent {
  type: string;
  data: any;
  timestamp: string;
  userId?: string;
}

export interface RealTimeSubscription {
  id: string;
  eventSource: EventSource;
  isActive: boolean;
  onMessage: (event: RealTimeEvent) => void;
  onError: (error: Event) => void;
}

class RealTimeService {
  private subscriptions: Map<string, RealTimeSubscription> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  /**
   * Subscribe to real-time updates
   */
  subscribe(
    endpoint: string,
    onMessage: (event: RealTimeEvent) => void,
    onError?: (error: Event) => void
  ): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const eventSource = new EventSource(endpoint);
      
      const subscription: RealTimeSubscription = {
        id: subscriptionId,
        eventSource,
        isActive: true,
        onMessage,
        onError: onError || this.handleDefaultError
      };

      // Set up event listeners
      eventSource.onmessage = (event) => {
        try {
          const realTimeEvent: RealTimeEvent = JSON.parse(event.data);
          subscription.onMessage(realTimeEvent);
        } catch (error) {
          devLog('Error parsing real-time event:', error);
        }
      };

      eventSource.onerror = (error) => {
        subscription.onError(error);
        this.handleReconnect(subscriptionId, endpoint, onMessage, onError);
      };

      eventSource.onopen = () => {
        devLog(`Real-time subscription ${subscriptionId} connected`);
      };

      this.subscriptions.set(subscriptionId, subscription);
      return subscriptionId;

    } catch (error) {
      devLog('Error creating real-time subscription:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    
    if (subscription) {
      subscription.isActive = false;
      subscription.eventSource.close();
      this.subscriptions.delete(subscriptionId);
      this.reconnectAttempts.delete(subscriptionId);
      devLog(`Real-time subscription ${subscriptionId} unsubscribed`);
      return true;
    }
    
    return false;
  }

  /**
   * Subscribe to poll updates
   */
  subscribeToPollUpdates(
    pollId: string,
    onUpdate: (data: any) => void,
    onError?: (error: Event) => void
  ): string {
    const endpoint = `/api/polls/${pollId}/updates`;
    return this.subscribe(endpoint, onUpdate, onError);
  }

  /**
   * Subscribe to user activity updates
   */
  subscribeToUserActivity(
    userId: string,
    onUpdate: (data: any) => void,
    onError?: (error: Event) => void
  ): string {
    const endpoint = `/api/user/${userId}/activity`;
    return this.subscribe(endpoint, onUpdate, onError);
  }

  /**
   * Subscribe to admin dashboard updates
   */
  subscribeToAdminUpdates(
    onUpdate: (data: any) => void,
    onError?: (error: Event) => void
  ): string {
    const endpoint = '/api/admin/updates';
    return this.subscribe(endpoint, onUpdate, onError);
  }

  /**
   * Subscribe to feedback updates
   */
  subscribeToFeedbackUpdates(
    onUpdate: (data: any) => void,
    onError?: (error: Event) => void
  ): string {
    const endpoint = '/api/feedback/updates';
    return this.subscribe(endpoint, onUpdate, onError);
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(
    subscriptionId: string,
    endpoint: string,
    onMessage: (event: RealTimeEvent) => void,
    onError?: (error: Event) => void
  ) {
    const attempts = this.reconnectAttempts.get(subscriptionId) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      devLog(`Max reconnection attempts reached for ${subscriptionId}`);
      this.unsubscribe(subscriptionId);
      return;
    }

    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription || !subscription.isActive) {
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, attempts); // Exponential backoff
    
    setTimeout(() => {
      if (subscription.isActive) {
        devLog(`Attempting to reconnect ${subscriptionId} (attempt ${attempts + 1})`);
        this.reconnectAttempts.set(subscriptionId, attempts + 1);
        
        // Close existing connection
        subscription.eventSource.close();
        
        // Create new connection
        try {
          const newEventSource = new EventSource(endpoint);
          subscription.eventSource = newEventSource;
          
          newEventSource.onmessage = (event) => {
            try {
              const realTimeEvent: RealTimeEvent = JSON.parse(event.data);
              subscription.onMessage(realTimeEvent);
            } catch (error) {
              devLog('Error parsing real-time event:', error);
            }
          };

          newEventSource.onerror = (error) => {
            subscription.onError(error);
            this.handleReconnect(subscriptionId, endpoint, onMessage, onError);
          };

          newEventSource.onopen = () => {
            devLog(`Real-time subscription ${subscriptionId} reconnected`);
            this.reconnectAttempts.set(subscriptionId, 0); // Reset attempts on successful connection
          };
        } catch (error) {
          devLog('Error reconnecting:', error);
          this.handleReconnect(subscriptionId, endpoint, onMessage, onError);
        }
      }
    }, delay);
  }

  /**
   * Default error handler
   */
  private handleDefaultError(error: Event): void {
    devLog('Real-time connection error:', error);
  }

  /**
   * Get subscription status
   */
  getSubscriptionStatus(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    return subscription ? subscription.isActive : false;
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys()).filter(id => 
      this.getSubscriptionStatus(id)
    );
  }

  /**
   * Close all subscriptions
   */
  closeAll(): void {
    this.subscriptions.forEach((subscription, id) => {
      this.unsubscribe(id);
    });
  }
}

// Export singleton instance
export const realTimeService = new RealTimeService();
export default realTimeService;
