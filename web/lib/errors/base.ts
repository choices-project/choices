/**
 * Base Application Error Class
 * 
 * All application errors should extend this class to ensure consistent
 * error handling and proper HTTP status code mapping.
 */

import { withOptional } from '../util/objects';

export type ErrorResponse = {
  error: string;
  message: string;
  statusCode: number;
  errorCode: string;
  details?: ErrorDetails;
  timestamp: string;
}

export type ErrorDetails = {
  field?: string;
  value?: unknown;
  constraint?: string;
  context?: ErrorContext;
}

export type ErrorContext = {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
}

export abstract class ApplicationError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: ErrorDetails;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    details?: ErrorDetails
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.timestamp = new Date().toISOString();
    
    // Use withOptional to handle optional details property
    if (details !== undefined) {
      this.details = details;
    }

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Convert error to JSON response format
   */
  toJSON(): ErrorResponse {
    return withOptional(
      {
        error: this.name,
        message: this.message,
        statusCode: this.statusCode,
        errorCode: this.errorCode,
        timestamp: this.timestamp
      },
      { details: this.details }
    );
  }

  /**
   * Convert error to API response format
   */
  toResponse(): Response {
    return new Response(JSON.stringify(this.toJSON()), {
      status: this.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Error-Code': this.errorCode
      }
    });
  }
}
