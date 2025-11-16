declare module 'web-push' {
  export type WebPushError = Error & {
    statusCode?: number;
    headers?: Record<string, string>;
    body?: string;
  };

  export type PushSubscription = {
    endpoint: string;
    keys: {
      auth: string;
      p256dh: string;
    };
  };

  export function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string
  ): void;

  export function sendNotification(
    subscription: PushSubscription,
    payload?: string,
    options?: Record<string, unknown>
  ): Promise<void>;
}

