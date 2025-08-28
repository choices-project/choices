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

// Define callback types with rest-tuple pattern
type RTHandler<T> = (...args: [T]) => void;

export interface RealTimeSubscription {
  id: string;
  eventSource: EventSource;
  isActive: boolean;
  onMessage: RTHandler<RealTimeEvent>;
  onError: RTHandler<Event>;
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
        onMessage: (...args) => {
          const [event] = args;
          onMessage(event);
        },
        onError: (...args) => {
          const [error] = args;
          if (onError) {
            onError(error);
          } else {
            this.handleDefaultError(error);
          }
        }
      };

      // Set up event listeners
      eventSource.onmessage = (event) => {
        try {
          const realTimeEvent: RealTimeEvent = JSON.parse(event.data);
          // Use the event parameter to log additional context
          devLog('Real-time message received:', { 
            eventType: event.type, 
            eventData: realTimeEvent,
            timestamp: new Date().toISOString()
          });
          subscription.onMessage(realTimeEvent);
        } catch (error) {
          devLog('Error parsing real-time event:', error, 'Raw event data:', event.data);
        }
      };

      eventSource.onerror = (error) => {
        devLog('Real-time connection error:', error);
        // Use the error parameter to provide detailed error information
        const errorDetails = {
          type: error.type,
          target: error.target,
          timestamp: new Date().toISOString(),
          subscriptionId
        };
        devLog('Real-time error details:', errorDetails);
        subscription.onError(error);
        this.handleReconnect(subscriptionId, endpoint, onMessage);
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
    onUpdate: (event: RealTimeEvent) => void
  ): string {
    const endpoint = `/api/polls/${pollId}/updates`;
    const wrappedOnUpdate = (...args: [RealTimeEvent]) => {
      const [event] = args;
      devLog(`Poll update received for ${pollId}:`, event);
      onUpdate(event);
    };
    return this.subscribe(endpoint, wrappedOnUpdate);
  }

  /**
   * Subscribe to user activity updates
   */
  subscribeToUserActivity(
    userId: string,
    onUpdate: (event: RealTimeEvent) => void
  ): string {
    const endpoint = `/api/user/${userId}/activity`;
    const wrappedOnUpdate = (...args: [RealTimeEvent]) => {
      const [event] = args;
      devLog(`User activity update received for ${userId}:`, event);
      onUpdate(event);
    };
    return this.subscribe(endpoint, wrappedOnUpdate);
  }

  /**
   * Subscribe to admin dashboard updates
   */
  subscribeToAdminUpdates(
    onUpdate: (event: RealTimeEvent) => void
  ): string {
    const endpoint = '/api/admin/updates';
    const wrappedOnUpdate = (...args: [RealTimeEvent]) => {
      const [event] = args;
      devLog('Admin dashboard update received:', event);
      onUpdate(event);
    };
    return this.subscribe(endpoint, wrappedOnUpdate);
  }

  /**
   * Subscribe to feedback updates
   */
  subscribeToFeedbackUpdates(
    onUpdate: (event: RealTimeEvent) => void
  ): string {
    const endpoint = '/api/feedback/updates';
    const wrappedOnUpdate = (...args: [RealTimeEvent]) => {
      const [event] = args;
      devLog('Feedback update received:', event);
      onUpdate(event);
    };
    return this.subscribe(endpoint, wrappedOnUpdate);
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(
    subscriptionId: string,
    endpoint: string,
    onMessage: (...args: [RealTimeEvent]) => void
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
            this.handleReconnect(subscriptionId, endpoint, onMessage);
          };

          newEventSource.onopen = () => {
            devLog(`Real-time subscription ${subscriptionId} reconnected`);
            this.reconnectAttempts.set(subscriptionId, 0); // Reset attempts on successful connection
          };
        } catch (error) {
          devLog('Error reconnecting:', error);
          this.handleReconnect(subscriptionId, endpoint, onMessage);
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
    this.subscriptions.forEach((subscription: any, id: any) => {
      if (subscription.isActive) {
        subscription.eventSource.close();
      }
      this.unsubscribe(id);
    });
  }
}

// Export singleton instance
export const realTimeService = new RealTimeService();
export default realTimeService;
