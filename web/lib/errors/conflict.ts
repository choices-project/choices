/**
 * Conflict Error Classes
 * 
 * Errors for when a request conflicts with the current state of the resource.
 */

import { ApplicationError, type ErrorDetails } from './base';

export class ConflictError extends ApplicationError {
  constructor(message = 'Resource conflict', details?: ErrorDetails) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class DuplicateVoteError extends ApplicationError {
  constructor(pollId: string, userId: string, details?: ErrorDetails) {
    super(`User has already voted on poll '${pollId}'`, 409, 'DUPLICATE_VOTE', Object.assign({}, details, {
      field: 'pollId',
      value: pollId,
      context: { userId }
    }));
  }
}

export class PollAlreadyExistsError extends ApplicationError {
  constructor(pollId: string, details?: ErrorDetails) {
    super(`Poll with ID '${pollId}' already exists`, 409, 'POLL_ALREADY_EXISTS', Object.assign({}, details, {
      field: 'pollId',
      value: pollId
    }));
  }
}

export class UserAlreadyExistsError extends ApplicationError {
  constructor(identifier: string, details?: ErrorDetails) {
    super(`User with identifier '${identifier}' already exists`, 409, 'USER_ALREADY_EXISTS', Object.assign({}, details, {
      field: 'identifier',
      value: identifier
    }));
  }
}

export class PasskeyAlreadyRegisteredError extends ApplicationError {
  constructor(userId: string, details?: ErrorDetails) {
    super(`User '${userId}' already has a passkey registered`, 409, 'PASSKEY_ALREADY_REGISTERED', Object.assign({}, details, {
      field: 'userId',
      value: userId
    }));
  }
}
