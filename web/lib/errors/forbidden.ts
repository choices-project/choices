/**
 * Forbidden Error Classes
 * 
 * Errors for when access to a resource is denied due to permissions or business rules.
 */

import { withOptional } from '@/lib/util/objects';

import { ApplicationError, type ErrorDetails } from './base';

export class ForbiddenError extends ApplicationError {
  constructor(message: string = 'Access forbidden', details?: ErrorDetails) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class PollAccessDeniedError extends ApplicationError {
  constructor(pollId: string, action: string, details?: ErrorDetails) {
    super(`Access denied for ${action} on poll '${pollId}'`, 403, 'POLL_ACCESS_DENIED', withOptional(details ?? {}, {
      field: 'pollId',
      value: pollId,
      constraint: action
    }));
  }
}

export class PollClosedError extends ApplicationError {
  constructor(pollId: string, details?: ErrorDetails) {
    super(`Poll '${pollId}' is closed and cannot be modified`, 403, 'POLL_CLOSED', withOptional(details ?? {}, {
      field: 'pollId',
      value: pollId
    }));
  }
}

export class PollLockedError extends ApplicationError {
  constructor(pollId: string, details?: ErrorDetails) {
    super(`Poll '${pollId}' is locked and cannot be modified`, 403, 'POLL_LOCKED', withOptional(details ?? {}, {
      field: 'pollId',
      value: pollId
    }));
  }
}

export class AlreadyVotedError extends ApplicationError {
  constructor(pollId: string, userId: string, details?: ErrorDetails) {
    super(`User has already voted on poll '${pollId}'`, 403, 'ALREADY_VOTED', withOptional(details ?? {}, {
      field: 'pollId',
      value: pollId,
      context: { userId }
    }));
  }
}

export class VotingNotAllowedError extends ApplicationError {
  constructor(pollId: string, reason: string, details?: ErrorDetails) {
    super(`Voting not allowed on poll '${pollId}': ${reason}`, 403, 'VOTING_NOT_ALLOWED', withOptional(details ?? {}, {
      field: 'pollId',
      value: pollId,
      constraint: reason
    }));
  }
}

export class AdminOnlyError extends ApplicationError {
  constructor(action: string, details?: ErrorDetails) {
    super(`Admin privileges required for: ${action}`, 403, 'ADMIN_ONLY', withOptional(details ?? {}, {
      constraint: action
    }));
  }
}
