/**
 * Validation Error Classes
 *
 * Errors related to input validation, data format validation, and business rule validation.
 */

import { ApplicationError, type ErrorDetails } from './base';

function mergeDetailsDefined(base: ErrorDetails = {}, extras?: Partial<ErrorDetails>): ErrorDetails {
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  if (extras) {
    for (const [k, v] of Object.entries(extras)) {
      if (v !== undefined) {
        result[k] = v;
      }
    }
  }
  return result as ErrorDetails;
}

const EMPTY_DETAILS: ErrorDetails = {};
const sanitizeDetails = (details?: ErrorDetails): ErrorDetails =>
  details ? mergeDetailsDefined(details) : EMPTY_DETAILS;
const mergeDetails = (details: ErrorDetails | undefined, extras: Partial<ErrorDetails>): ErrorDetails =>
  mergeDetailsDefined(sanitizeDetails(details), extras);

export class ValidationError extends ApplicationError {
  constructor(message: string = 'Validation failed', details?: ErrorDetails) {
    super(message, 400, 'VALIDATION_FAILED', details);
  }
}

export class InvalidInputError extends ApplicationError {
  constructor(message: string = 'Invalid input provided', details?: ErrorDetails) {
    super(message, 400, 'VALIDATION_INVALID_INPUT', details);
  }
}

export class MissingFieldError extends ApplicationError {
  constructor(field: string, details?: ErrorDetails) {
    super(
      `Missing required field: ${field}`,
      400,
      'VALIDATION_MISSING_FIELD',
      mergeDetails(details, { field })
    );
  }
}

export class InvalidFormatError extends ApplicationError {
  constructor(field: string, expectedFormat: string, details?: ErrorDetails) {
    super(
      `Invalid format for field '${field}'. Expected: ${expectedFormat}`,
      400,
      'VALIDATION_INVALID_FORMAT',
      mergeDetails(details, {
        field,
        constraint: expectedFormat
      })
    );
  }
}

export class OutOfRangeError extends ApplicationError {
  constructor(field: string, min?: number, max?: number, details?: ErrorDetails) {
    const range = min !== undefined && max !== undefined
      ? `between ${min} and ${max}`
      : min !== undefined
        ? `greater than or equal to ${min}`
        : `less than or equal to ${max}`;

    super(
      `Field '${field}' must be ${range}`,
      400,
      'VALIDATION_OUT_OF_RANGE',
      mergeDetails(details, {
        field,
        constraint: range
      })
    );
  }
}

export class InvalidVoteDataError extends ApplicationError {
  constructor(message: string = 'Invalid vote data provided', details?: ErrorDetails) {
    super(message, 400, 'VALIDATION_INVALID_VOTE_DATA', details);
  }
}

export class PollConfigurationError extends ApplicationError {
  constructor(message: string = 'Invalid poll configuration', details?: ErrorDetails) {
    super(message, 400, 'VALIDATION_POLL_CONFIG_ERROR', details);
  }
}
