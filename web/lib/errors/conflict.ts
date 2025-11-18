/**
 * Conflict Error Classes
 *
 * Errors for when a request conflicts with the current state of the resource.
 */

import { ApplicationError, type ErrorDetails } from './base';

const EMPTY_DETAILS: ErrorDetails = {};
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
const sanitizeDetails = (details?: ErrorDetails): ErrorDetails =>
  details ? mergeDetailsDefined(details) : EMPTY_DETAILS;
const mergeDetails = (details: ErrorDetails | undefined, extras: Partial<ErrorDetails>): ErrorDetails =>
  mergeDetailsDefined(sanitizeDetails(details), extras);

export class ConflictError extends ApplicationError {
  constructor(message: string = 'Resource conflict', details?: ErrorDetails) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class DuplicateVoteError extends ApplicationError {
  constructor(pollId: string, userId: string, details?: ErrorDetails) {
    super(
      `User has already voted on poll '${pollId}'`,
      409,
      'DUPLICATE_VOTE',
      mergeDetails(details, {
        field: 'pollId',
        value: pollId,
        context: { userId }
      })
    );
  }
}

export class PollAlreadyExistsError extends ApplicationError {
  constructor(pollId: string, details?: ErrorDetails) {
    super(
      `Poll with ID '${pollId}' already exists`,
      409,
      'POLL_ALREADY_EXISTS',
      mergeDetails(details, {
        field: 'pollId',
        value: pollId
      })
    );
  }
}

export class UserAlreadyExistsError extends ApplicationError {
  constructor(identifier: string, details?: ErrorDetails) {
    super(
      `User with identifier '${identifier}' already exists`,
      409,
      'USER_ALREADY_EXISTS',
      mergeDetails(details, {
        field: 'identifier',
        value: identifier
      })
    );
  }
}

export class PasskeyAlreadyRegisteredError extends ApplicationError {
  constructor(userId: string, details?: ErrorDetails) {
    super(
      `User '${userId}' already has a passkey registered`,
      409,
      'PASSKEY_ALREADY_REGISTERED',
      mergeDetails(details, {
        field: 'userId',
        value: userId
      })
    );
  }
}
