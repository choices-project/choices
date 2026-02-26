/**
 * Structured logging utilities for ingestion scripts.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
}

class Logger {
  private minLevel: LogLevel;
  private structured: boolean;
  
  constructor(options: { minLevel?: LogLevel; structured?: boolean } = {}) {
    this.minLevel = options.minLevel || 'info';
    this.structured = options.structured || false;
  }
  
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }
  
  private formatMessage(level: LogLevel, message: string, data?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const icon = {
      debug: '🔍',
      info: 'ℹ️ ',
      warn: '⚠️ ',
      error: '❌',
    }[level];
    
    if (this.structured) {
      const entry: LogEntry = {
        timestamp,
        level,
        message,
        ...(data && { data }),
      };
      return JSON.stringify(entry);
    }
    
    return `[${timestamp}] ${icon} ${message}${data ? ` ${JSON.stringify(data)}` : ''}`;
  }
  
  debug(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, data));
    }
  }
  
  info(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, data));
    }
  }
  
  warn(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }
  
  error(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, data));
    }
  }
  
  progress(current: number, total: number, label?: string): void {
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;
    const message = label
      ? `${label}: ${current}/${total} (${percent}%)`
      : `Progress: ${current}/${total} (${percent}%)`;
    this.info(message, { current, total, percent });
  }
  
  metrics(operation: string, metrics: Record<string, number | string>): void {
    if (this.structured) {
      const entry = {
        timestamp: new Date().toISOString(),
        level: 'info' as const,
        type: 'metrics',
        operation,
        ...metrics,
      };
      console.log(JSON.stringify(entry));
    } else if (this.shouldLog('info')) {
      this.info(`Metrics for ${operation}`, { operation, ...metrics });
    }
  }
}

export const logger = new Logger({
  minLevel: process.env.LOG_LEVEL as LogLevel || 'info',
  structured: process.env.STRUCTURED_LOGS === 'true',
});

export function createLogger(options: { minLevel?: LogLevel; structured?: boolean }): Logger {
  return new Logger(options);
}
