/**
 * Error Type Definitions
 * 
 * Type definitions for error handling and response formatting.
 */

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

export type ErrorHandler = (error: Error) => ErrorResponse;

export type ErrorLogger = (error: Error, context?: ErrorContext) => void;

export type ErrorHandlingConfig = {
  logErrors: boolean;
  includeStackTrace: boolean;
  sanitizeErrors: boolean;
  maxErrorDetails: number;
}
