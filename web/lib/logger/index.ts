/**
 * Logger Module Index
 * 
 * Re-exports from the main logger module to provide a consistent
 * import path for the logger functionality.
 */

export {
  logger,
  devLog,
  logError
} from '@/lib/utils/logger';

// Default export for convenience
export { devLog as default } from '@/lib/utils/logger';
