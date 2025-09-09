// Real-time service for admin dashboard

export interface SubscriptionCallback {
  (data: any): void;
}

export interface SubscriptionId {
  event: string;
  callback: SubscriptionCallback;
}

export class RealTimeService {
  private static instance: RealTimeService;
  private listeners: Map<string, SubscriptionCallback[]> = new Map();
  private subscriptions: Map<string, SubscriptionId> = new Map();

  static getInstance(): RealTimeService {
    if (!RealTimeService.instance) {
      RealTimeService.instance = new RealTimeService();
    }
    return RealTimeService.instance;
  }

  subscribe(event: string, callback: SubscriptionCallback): string {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    
    const subscriptionId = `${event}_${Date.now()}_${Math.random()}`;
    this.subscriptions.set(subscriptionId, { event, callback });
    
      return subscriptionId;
  }

  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      const callbacks = this.listeners.get(subscription.event);
      if (callbacks) {
        const index = callbacks.indexOf(subscription.callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
      this.subscriptions.delete(subscriptionId);
    }
  }

  emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Admin-specific subscription methods
  subscribeToAdminUpdates(callback: SubscriptionCallback): string {
    return this.subscribe('admin_updates', callback);
  }

  subscribeToFeedbackUpdates(callback: SubscriptionCallback): string {
    return this.subscribe('feedback_updates', callback);
  }

  subscribeToUserUpdates(callback: SubscriptionCallback): string {
    return this.subscribe('user_updates', callback);
  }

  subscribeToPollUpdates(callback: SubscriptionCallback): string {
    return this.subscribe('poll_updates', callback);
  }

  // Cleanup all subscriptions
  cleanup(): void {
    this.listeners.clear();
    this.subscriptions.clear();
  }
}

export const realTimeService = RealTimeService.getInstance();