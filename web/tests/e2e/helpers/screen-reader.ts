import type { Page } from '@playwright/test';

type AnnouncementLog = {
  message: string;
  timestamp: number;
};

type WaitForAnnouncementOptions = {
  priority?: 'polite' | 'assertive';
  textFragment: string;
  timeout?: number;
};

const ANNOUNCE_LOG_KEY = '__announceLogs';
const ANNOUNCE_HOOK_KEY = '__onScreenReaderAnnounce';
const SR_HOOK_STATUS_KEY = '__srHookStatus';

/**
 * Injects a window hook that records screen reader announcements triggered via
 * `ScreenReaderSupport.announce`. The log is stored on `window.__announceLogs`.
 */
export const installScreenReaderCapture = async (page: Page): Promise<void> => {
  await page.addInitScript(
    ({
      announceLogKey,
      hookKey,
      hookStatusKey,
    }: {
      announceLogKey: string;
      hookKey: string;
      hookStatusKey: string;
    }) => {
      const announceLogs: AnnouncementLog[] = [];
      const originalInfo = window.console.info.bind(window.console);

      Object.assign(window as typeof window & { [announceLogKey]?: AnnouncementLog[] }, {
        [announceLogKey]: announceLogs,
      });

      window.console.info = (...args: unknown[]) => {
        try {
          const message = args
            .map((arg) => {
              if (typeof arg === 'string') {
                return arg;
              }
              if (typeof arg === 'object') {
                try {
                  return JSON.stringify(arg);
                } catch {
                  return String(arg);
                }
              }
              return String(arg);
            })
            .join(' ');

          if (message.includes('[WidgetRenderer][announce]')) {
            announceLogs.push({ message, timestamp: Date.now() });
            if (announceLogs.length > 100) {
              announceLogs.splice(0, announceLogs.length - 100);
            }
          }
        } catch {
          // ignore logging capture errors
        }

        originalInfo(...(args as Parameters<typeof console.info>));
      };

      Object.assign(
        window as typeof window & { [hookStatusKey]?: string },
        { [hookStatusKey]: 'console-capture' },
      );

      const existingHook = (window as typeof window & {
        [hookKey]?: (data: { message: string; priority: 'polite' | 'assertive'; timestamp: number }) => void;
      })[hookKey];

      (window as typeof window & {
        [hookKey]?: (data: { message: string; priority: 'polite' | 'assertive'; timestamp: number }) => void;
      })[hookKey] = (data) => {
        announceLogs.push({
          message: `[WidgetRenderer][announce] ${JSON.stringify({
            key: 'direct',
            message: data.message,
            priority: data.priority,
          })}`,
          timestamp: data.timestamp ?? Date.now(),
        });
        if (announceLogs.length > 100) {
          announceLogs.splice(0, announceLogs.length - 100);
        }
        existingHook?.(data);
      };
    },
    {
      announceLogKey: ANNOUNCE_LOG_KEY,
      hookKey: ANNOUNCE_HOOK_KEY,
      hookStatusKey: SR_HOOK_STATUS_KEY,
    },
  );
};

/**
 * Waits until a matching screen reader announcement has been recorded.
 */
export const waitForAnnouncement = async (
  page: Page,
  { priority, textFragment, timeout = 10_000 }: WaitForAnnouncementOptions,
): Promise<void> => {
  await page.waitForFunction(
    ({ announceLogKey, priority, textFragment }) => {
      const logs =
        (window as typeof window & { [announceLogKey]?: AnnouncementLog[] })[announceLogKey] ?? [];

      const normalizedFragment = textFragment.toLowerCase();

      const foundInLogs = logs.some(({ message }) => {
        const payloadStart = message.indexOf('{');
        let parsed:
          | {
              message?: string;
              priority?: string;
            }
          | null = null;

        if (payloadStart !== -1) {
          try {
            parsed = JSON.parse(message.slice(payloadStart));
          } catch {
            parsed = null;
          }
        }

        const matchesPriority = priority
          ? parsed?.priority === priority || message.includes(priority)
          : true;

        if (!matchesPriority) {
          return false;
        }

        const haystack = (parsed?.message ?? message).toLowerCase();
        return haystack.includes(normalizedFragment);
      });

      if (foundInLogs) {
        return true;
      }

      const liveRegions = Array.from(
        document.querySelectorAll<HTMLElement>('[role="status"], [aria-live]'),
      );
      return liveRegions.some((node) => node.textContent?.toLowerCase().includes(normalizedFragment));
    },
    { announceLogKey: ANNOUNCE_LOG_KEY, priority, textFragment },
    { timeout },
  );
};

/**
 * Verifies that the capture hook executed successfully.
 */
export const hasAnnouncementCapture = async (page: Page): Promise<boolean> => {
  return page.evaluate(
    ({ announceLogKey }) =>
      Array.isArray(
        (window as typeof window & { [announceLogKey]?: unknown[] })[announceLogKey],
      ),
    { announceLogKey: ANNOUNCE_LOG_KEY },
  );
};

