/**
 * Simplified Logger Module
 * 
 * Provides devLog for development logging and basic console logging for production.
 * Replaces complex logger system with simple, effective logging.
 */

// Simple devLog function for development
export const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.debug('[DEV]', ...args);
  }
};

// Production logging helpers
export const logInfo = (...args: unknown[]) => {
  // eslint-disable-next-line no-console
  console.info(...args);
};

export const logWarn = (...args: unknown[]) => {
  // eslint-disable-next-line no-console
  console.warn(...args);
};

export const logError = (...args: unknown[]) => {
  // eslint-disable-next-line no-console
  console.error(...args);
};

// Backward compatibility - logger object for existing imports
export const logger = {
  debug: devLog,
  info: logInfo,
  warn: logWarn,
  error: logError,
  performance: logInfo, // Performance logs use info level
};

// Legacy exports for compatibility
export { devLog as default };