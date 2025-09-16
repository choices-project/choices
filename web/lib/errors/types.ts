/**
 * Error Type Definitions
 * 
 * Type definitions for error handling and response formatting.
 */

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  errorCode: string;
  details?: ErrorDetails;
  timestamp: string;
}

export interface ErrorDetails {
  field?: string;
  value?: unknown;
  constraint?: string;
  context?: ErrorContext;
}

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
}

export type ErrorHandler = (error: Error) => ErrorResponse;

export type ErrorLogger = (error: Error, context?: ErrorContext) => void;

export interface ErrorHandlingConfig {
  logErrors: boolean;
  includeStackTrace: boolean;
  sanitizeErrors: boolean;
  maxErrorDetails: number;
}
