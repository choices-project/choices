/**
 * Not Found Error Classes
 * 
 * Errors for when requested resources cannot be found.
 */

import { withOptional } from '@/lib/util/objects';

import { ApplicationError, type ErrorDetails } from './base';

export class NotFoundError extends ApplicationError {
  constructor(resource: string = 'Resource', details?: ErrorDetails) {
    super(`${resource} not found`, 404, 'NOT_FOUND', details);
  }
}

export class PollNotFoundError extends ApplicationError {
  constructor(pollId: string, details?: ErrorDetails) {
    super(`Poll with ID '${pollId}' not found`, 404, 'POLL_NOT_FOUND', withOptional(details || {}, {
      field: 'pollId',
      value: pollId
    }));
  }
}

export class UserNotFoundError extends ApplicationError {
  constructor(userId: string, details?: ErrorDetails) {
    super(`User with ID '${userId}' not found`, 404, 'USER_NOT_FOUND', withOptional(details || {}, {
      field: 'userId',
      value: userId
    }));
  }
}

export class VoteNotFoundError extends ApplicationError {
  constructor(voteId: string, details?: ErrorDetails) {
    super(`Vote with ID '${voteId}' not found`, 404, 'VOTE_NOT_FOUND', withOptional(details || {}, {
      field: 'voteId',
      value: voteId
    }));
  }
}

export class OptionNotFoundError extends ApplicationError {
  constructor(optionId: string, details?: ErrorDetails) {
    super(`Option with ID '${optionId}' not found`, 404, 'OPTION_NOT_FOUND', withOptional(details || {}, {
      field: 'optionId',
      value: optionId
    }));
  }
}
