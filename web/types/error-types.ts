/**
 * Error Type Definitions
 * 
 * Comprehensive type definitions for error handling, including
 * error codes, error contexts, and error response formats.
 */

export type ErrorCode = 
  // Authentication errors
  | 'AUTH_REQUIRED'
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_SESSION_EXPIRED'
  | 'AUTH_INSUFFICIENT_PERMISSIONS'
  | 'AUTH_WEBAUTHN_FAILED'
  | 'AUTH_PASSKEY_NOT_FOUND'
  | 'AUTH_PASSKEY_EXISTS'
  
  // Validation errors
  | 'VALIDATION_FAILED'
  | 'VALIDATION_INVALID_INPUT'
  | 'VALIDATION_MISSING_FIELD'
  | 'VALIDATION_INVALID_FORMAT'
  | 'VALIDATION_OUT_OF_RANGE'
  | 'VALIDATION_INVALID_VOTE_DATA'
  | 'VALIDATION_POLL_CONFIG_ERROR'
  
  // Not found errors
  | 'NOT_FOUND'
  | 'POLL_NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'VOTE_NOT_FOUND'
  | 'OPTION_NOT_FOUND'
  
  // Forbidden errors
  | 'FORBIDDEN'
  | 'POLL_ACCESS_DENIED'
  | 'POLL_CLOSED'
  | 'POLL_LOCKED'
  | 'ALREADY_VOTED'
  | 'VOTING_NOT_ALLOWED'
  | 'ADMIN_ONLY'
  
  // Conflict errors
  | 'CONFLICT'
  | 'DUPLICATE_VOTE'
  | 'POLL_ALREADY_EXISTS'
  | 'USER_ALREADY_EXISTS'
  | 'PASSKEY_ALREADY_REGISTERED'
  
  // Internal server errors
  | 'INTERNAL_SERVER_ERROR'
  | 'DATABASE_ERROR'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'VOTE_PROCESSING_ERROR'
  | 'RESULTS_CALCULATION_ERROR'
  | 'CONFIGURATION_ERROR';

export type HttpStatusCode = 
  | 400 | 401 | 403 | 404 | 409 | 429 | 500 | 502 | 503 | 504;

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  sessionId?: string;
  timestamp?: string;
}

export interface ErrorDetails {
  field?: string;
  value?: unknown;
  constraint?: string;
  context?: ErrorContext;
  stack?: string;
  cause?: Error;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: HttpStatusCode;
  errorCode: ErrorCode;
  details?: ErrorDetails;
  timestamp: string;
  requestId?: string;
}

export interface ValidationErrorDetails extends ErrorDetails {
  field: string;
  value: unknown;
  constraint: string;
  expectedType?: string;
  receivedType?: string;
}

export interface AuthenticationErrorDetails extends ErrorDetails {
  authMethod?: 'webauthn' | 'session' | 'token';
  credentialId?: string;
  sessionId?: string;
  userId?: string;
}

export interface AuthorizationErrorDetails extends ErrorDetails {
  requiredPermission?: string;
  requiredRole?: string;
  userRole?: string;
  resourceId?: string;
  action?: string;
}

export interface DatabaseErrorDetails extends ErrorDetails {
  operation?: string;
  table?: string;
  constraint?: string;
  query?: string;
  parameters?: unknown[];
}

export interface ExternalServiceErrorDetails extends ErrorDetails {
  serviceName?: string;
  endpoint?: string;
  statusCode?: number;
  responseBody?: string;
  retryAfter?: number;
}

export interface ErrorHandlerConfig {
  logErrors: boolean;
  includeStackTrace: boolean;
  sanitizeErrors: boolean;
  maxErrorDetails: number;
  enableErrorReporting: boolean;
  errorReportingEndpoint?: string;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByCode: Record<ErrorCode, number>;
  errorsByEndpoint: Record<string, number>;
  errorsByUser: Record<string, number>;
  averageErrorRate: number;
  lastErrorAt: string;
}

export interface ErrorBoundaryProps {
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  children: React.ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}
