/**
 * Internal Server Error Classes
 * 
 * Errors for unexpected server-side issues and system failures.
 */

import { ApplicationError, type ErrorDetails } from './base';

export class InternalServerError extends ApplicationError {
  constructor(message: string = 'Internal server error', details?: ErrorDetails) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', details);
  }
}

export class DatabaseError extends ApplicationError {
  constructor(operation: string, details?: ErrorDetails) {
    super(`Database error during ${operation}`, 500, 'DATABASE_ERROR', {
      ...details,
      constraint: operation
    });
  }
}

export class ExternalServiceError extends ApplicationError {
  constructor(service: string, details?: ErrorDetails) {
    super(`External service '${service}' is unavailable`, 500, 'EXTERNAL_SERVICE_ERROR', {
      ...details,
      field: 'service',
      value: service
    });
  }
}

export class VoteProcessingError extends ApplicationError {
  constructor(pollId: string, details?: ErrorDetails) {
    super(`Error processing vote for poll '${pollId}'`, 500, 'VOTE_PROCESSING_ERROR', {
      ...details,
      field: 'pollId',
      value: pollId
    });
  }
}

export class ResultsCalculationError extends ApplicationError {
  constructor(pollId: string, details?: ErrorDetails) {
    super(`Error calculating results for poll '${pollId}'`, 500, 'RESULTS_CALCULATION_ERROR', {
      ...details,
      field: 'pollId',
      value: pollId
    });
  }
}

export class ConfigurationError extends ApplicationError {
  constructor(configKey: string, details?: ErrorDetails) {
    super(`Configuration error for '${configKey}'`, 500, 'CONFIGURATION_ERROR', {
      ...details,
      field: 'configKey',
      value: configKey
    });
  }
}
