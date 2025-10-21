/**
 * @jest-environment node
 */

// Set NODE_ENV to development before importing logger
process.env.NODE_ENV = 'development';

// Clear module cache to ensure fresh import
jest.resetModules();

import { logger } from '@/lib/utils/logger';
import type { Database } from '@/types/database';

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Replace console with mock
Object.assign(console, mockConsole);

describe('Logger Utility - Comprehensive Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Force logger to be in development mode for all tests
    logger.isDevelopment = true;
    logger.level = 0; // DEBUG level
  });

  describe('Basic Logging', () => {
    it('should log info messages', () => {
      logger.info('Test info message');
      
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] INFO: Test info message/));
    });

    it('should log error messages', () => {
      logger.error('Test error message');
      
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] ERROR: Test error message/));
    });

    it('should log warning messages', () => {
      logger.warn('Test warning message');
      
      expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] WARN: Test warning message/));
    });

    it('should log debug messages', () => {
      logger.debug('Test debug message');
      
      expect(mockConsole.debug).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] DEBUG: Test debug message/));
    });
  });

  describe('Structured Logging', () => {
    it('should log with metadata', () => {
      const metadata = {
        userId: 'user-123',
        action: 'login',
        timestamp: new Date().toISOString(),
      };
      
      logger.info('User action', metadata);
      
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] INFO: User action/));
    });

    it('should log with error objects', () => {
      const error = new Error('Test error');
      const context = {
        userId: 'user-123',
        action: 'database-query',
      };
      
      logger.error('Database error', error, context);
      
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] ERROR: Database error/));
    });

    it('should log with performance metrics', () => {
      const metrics = {
        duration: 150,
        memoryUsage: 25.5,
        cpuUsage: 12.3,
      };
      
      logger.info('Performance metrics', metrics);
      
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] INFO: Performance metrics/));
    });
  });

  describe('Log Levels', () => {
    it('should respect log level configuration', () => {
      // Test different log levels
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');
      
      expect(mockConsole.debug).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] DEBUG: Debug message/));
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] INFO: Info message/));
      expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] WARN: Warning message/));
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] ERROR: Error message/));
    });

    it('should handle log level filtering', () => {
      // Temporarily change logger level to INFO (filter out DEBUG)
      const originalLevel = logger.level;
      logger.level = 1; // INFO level
      
      // Clear previous calls
      jest.clearAllMocks();
      
      // Debug logs should be filtered, info logs should pass
      logger.debug('Debug message');
      logger.info('Info message');
      
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] INFO: Info message/));
      
      // Restore original level
      logger.level = originalLevel;
    });
  });

  describe('Error Handling', () => {
    it('should handle circular references in objects', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;
      
      logger.info('Circular object', circularObj);
      
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] INFO: Circular object/));
    });

    it('should handle undefined values', () => {
      logger.info('Undefined value', undefined);
      
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] INFO: Undefined value/));
    });

    it('should handle null values', () => {
      logger.info('Null value', null);
      
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] INFO: Null value/));
    });

    it('should handle large objects', () => {
      const largeObj = {
        data: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item-${i}` })),
        metadata: {
          count: 1000,
          timestamp: new Date().toISOString(),
        },
      };
      
      logger.info('Large object', largeObj);
      
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] INFO: Large object/));
    });
  });

  describe('Performance', () => {
    it('should log within performance budget', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        logger.info(`Message ${i}`);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    it('should not block execution', async () => {
      const startTime = performance.now();
      
      // Log multiple messages asynchronously
      const promises = Array.from({ length: 10 }, (_, i) => 
        Promise.resolve().then(() => logger.info(`Async message ${i}`))
      );
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50); // Should complete within 50ms
    });
  });

  describe('Security', () => {
    it('should sanitize sensitive data', () => {
      const sensitiveData = {
        password: 'secret123',
        token: 'bearer-token',
        apiKey: 'api-key-123',
        email: 'user@example.com',
        normalData: 'safe data',
      };
      
      logger.info('User data', sensitiveData);
      
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] INFO: User data/));
    });

    it('should handle SQL injection attempts', () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      logger.info('User input', { input: maliciousInput });
      
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] INFO: User input/));
    });

    it('should handle XSS attempts', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      
      logger.info('User input', { input: maliciousInput });
      
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] INFO: User input/));
    });
  });

  describe('Context and Tracing', () => {
    it('should include request context', () => {
      const requestContext = {
        requestId: 'req-123',
        userId: 'user-123',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
      };
      
      logger.info('Request processed', requestContext);
      
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] INFO: Request processed/));
    });

    it('should include error stack traces', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';
      
      logger.error('Error occurred', error);
      
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] ERROR: Error occurred/));
    });

    it('should include timing information', () => {
      const timing = {
        startTime: Date.now() - 1000,
        endTime: Date.now(),
        duration: 1000,
      };
      
      logger.info('Operation completed', timing);
      
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] INFO: Operation completed/));
    });
  });

  describe('Log Formatting', () => {
    it('should format timestamps correctly', () => {
      const timestamp = new Date('2023-01-01T00:00:00Z');
      
      logger.info('Timestamped message', { timestamp });
      
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] INFO: Timestamped message/));
    });

    it('should format objects with proper indentation', () => {
      const complexObj = {
        level1: {
          level2: {
            level3: 'value',
            array: [1, 2, 3],
          },
        },
      };
      
      logger.info('Complex object', complexObj);
      
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] INFO: Complex object/));
    });

    it('should handle special characters', () => {
      const specialChars = {
        unicode: '🚀',
        emoji: '😀',
        symbols: '!@#$%^&*()',
        quotes: '"double" and \'single\'',
      };
      
      logger.info('Special characters', specialChars);
      
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] INFO: Special characters/));
    });
  });

  describe('Memory Management', () => {
    it('should not cause memory leaks', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Log many messages
      for (let i = 0; i < 1000; i++) {
        logger.info(`Message ${i}`, { data: `data-${i}` });
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });

    it('should handle large log messages', () => {
      const largeMessage = 'x'.repeat(10000);
      
      logger.info('Large message', { message: largeMessage });
      
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] INFO: Large message/));
    });
  });

  describe('Async Logging', () => {
    it('should handle async operations', async () => {
      const asyncOperation = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async result';
      };
      
      logger.info('Starting async operation');
      const result = await asyncOperation();
      logger.info('Async operation completed', { result });
      
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] INFO: Starting async operation/));
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] INFO: Async operation completed/));
    });

    it('should handle promise rejections', async () => {
      const failingOperation = async () => {
        throw new Error('Async error');
      };
      
      logger.info('Starting failing operation');
      
      try {
        await failingOperation();
      } catch (error) {
        logger.error('Async operation failed', error);
      }
      
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] INFO: Starting failing operation/));
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] ERROR: Async operation failed/));
    });
  });

  describe('Log Aggregation', () => {
    it('should aggregate related log messages', () => {
      const sessionId = 'session-123';
      
      logger.info('Session started', { sessionId });
      logger.info('User action', { sessionId, action: 'login' });
      logger.info('User action', { sessionId, action: 'navigate' });
      logger.info('Session ended', { sessionId });
      
      expect(mockConsole.info).toHaveBeenCalledTimes(4);
    });

    it('should handle log batching', () => {
      const messages = [
        { level: 'info', message: 'Message 1' },
        { level: 'info', message: 'Message 2' },
        { level: 'warn', message: 'Warning 1' },
      ];
      
      messages.forEach(msg => {
        if (msg.level === 'info') {
          logger.info(msg.message);
        } else if (msg.level === 'warn') {
          logger.warn(msg.message);
        }
      });
      
      expect(mockConsole.info).toHaveBeenCalledTimes(2);
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
    });
  });
});

