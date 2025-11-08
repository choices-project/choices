/**
 * Not Implemented Error
 *
 * Surfaces intentional gaps where functionality has not yet been wired.
 * Prefer throwing this instead of returning silent fallbacks so callers can
 * decide how to degrade gracefully.
 */

import { ApplicationError } from './base';
import type { ErrorDetails } from './types';

export class NotImplementedError extends ApplicationError {
  constructor(message = 'Feature not implemented', details?: ErrorDetails) {
    super(message, 501, 'NOT_IMPLEMENTED', details);
  }
}


