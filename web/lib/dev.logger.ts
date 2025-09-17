/**
 * Development Logger
 * 
 * Provides development-specific logging functionality.
 * This is a placeholder implementation that re-exports the main logger.
 */

import { devLog } from './logger';

export const dev = {
  logger: {
    info: devLog,
    error: devLog,
    warn: devLog,
    debug: devLog
  }
};
