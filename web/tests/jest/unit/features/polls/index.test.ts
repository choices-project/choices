/**
 * Poll Utilities Tests
 * 
 * Comprehensive test suite for poll utility functions
 * 
 * Created: October 11, 2025
 */

import {
  formatPollDate,
  calculatePollDuration,
  isPollActive,
  validatePollTitle,
  validatePollDescription,
  validatePollOptions,
  validatePollSettings,
  formatPollDuration,
  calculateParticipationRate,
  getPollStatusText,
  getVotingMethodText,
  allowsMultipleVotes,
  calculateOptionPercentage,
  sortOptionsByVotes,
  isPollExpired,
  getTimeRemaining,
  formatTimeRemaining,
  sanitizePollTitleForUrl,
  generatePollSummary
} from '../../../../features/polls/utils/index';

describe('Poll Utilities', () => {
  describe('formatPollDate', () => {
    it('should format date string correctly', () => {
      const date = '2025-10-11T12:00:00Z';
      const result = formatPollDate(date);
      expect(result).toBe('10/11/2025');
    });

    it('should format Date object correctly', () => {
      const date = new Date('2025-10-11T12:00:00Z');
      const result = formatPollDate(date);
      expect(result).toBe('10/11/2025');
    });
  });

  describe('calculatePollDuration', () => {
    it('should calculate duration correctly', () => {
      const start = '2025-10-11T10:00:00Z';
      const end = '2025-10-11T12:00:00Z';
      const result = calculatePollDuration(start, end);
      expect(result).toBe(2 * 60 * 60 * 1000); // 2 hours in milliseconds
    });
  });

  describe('isPollActive', () => {
    it('should return true for active poll', () => {
      const start = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      const end = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
      const result = isPollActive(start, end);
      expect(result).toBe(true);
    });

    it('should return false for expired poll', () => {
      const start = new Date(Date.now() - 1000 * 60 * 60 * 2); // 2 hours ago
      const end = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      const result = isPollActive(start, end);
      expect(result).toBe(false);
    });

    it('should return false for future poll', () => {
      const start = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
      const end = new Date(Date.now() + 1000 * 60 * 60 * 2); // 2 hours from now
      const result = isPollActive(start, end);
      expect(result).toBe(false);
    });
  });

  describe('validatePollTitle', () => {
    it('should validate correct title', () => {
      const result = validatePollTitle('What is your favorite color?');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty title', () => {
      const result = validatePollTitle('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Title is required');
    });

    it('should reject title that is too long', () => {
      const longTitle = 'a'.repeat(201);
      const result = validatePollTitle(longTitle);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Title must be 200 characters or less');
    });
  });

  describe('validatePollDescription', () => {
    it('should validate correct description', () => {
      const result = validatePollDescription('This is a test poll description.');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty description', () => {
      const result = validatePollDescription('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Description is required');
    });

    it('should reject description that is too long', () => {
      const longDescription = 'a'.repeat(1001);
      const result = validatePollDescription(longDescription);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Description must be 1000 characters or less');
    });
  });

  describe('validatePollOptions', () => {
    it('should validate correct options', () => {
      const result = validatePollOptions(['Option 1', 'Option 2', 'Option 3']);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject too few options', () => {
      const result = validatePollOptions(['Option 1']);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('At least 2 options are required');
    });

    it('should reject too many options', () => {
      const manyOptions = Array.from({ length: 11 }, (_, i) => `Option ${i + 1}`);
      const result = validatePollOptions(manyOptions);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Maximum 10 options allowed');
    });

    it('should filter out empty options', () => {
      const result = validatePollOptions(['Option 1', '', 'Option 2', '   ']);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validatePollSettings', () => {
    it('should validate correct settings', () => {
      const settings = { maxSelections: 3, maxVotes: 100 };
      const result = validatePollSettings(settings);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid maxSelections', () => {
      const settings = { maxSelections: 0 };
      const result = validatePollSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Max selections must be at least 1');
    });

    it('should reject invalid maxVotes', () => {
      const settings = { maxVotes: 0 };
      const result = validatePollSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Max votes must be at least 1');
    });
  });

  describe('formatPollDuration', () => {
    it('should format duration with days', () => {
      const duration = 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000 + 30 * 60 * 1000; // 2d 3h 30m
      const result = formatPollDuration(duration);
      expect(result).toBe('2d 3h 30m');
    });

    it('should format duration with hours only', () => {
      const duration = 3 * 60 * 60 * 1000 + 30 * 60 * 1000; // 3h 30m
      const result = formatPollDuration(duration);
      expect(result).toBe('3h 30m');
    });

    it('should format duration with minutes only', () => {
      const duration = 30 * 60 * 1000; // 30m
      const result = formatPollDuration(duration);
      expect(result).toBe('30m');
    });
  });

  describe('calculateParticipationRate', () => {
    it('should calculate participation rate correctly', () => {
      const result = calculateParticipationRate(25, 100);
      expect(result).toBe(25);
    });

    it('should return 0 for zero users', () => {
      const result = calculateParticipationRate(10, 0);
      expect(result).toBe(0);
    });

    it('should round to nearest integer', () => {
      const result = calculateParticipationRate(33, 100);
      expect(result).toBe(33);
    });
  });

  describe('getPollStatusText', () => {
    it('should return correct status text for all statuses', () => {
      expect(getPollStatusText('draft')).toBe('Draft');
      expect(getPollStatusText('active')).toBe('Active');
      expect(getPollStatusText('closed')).toBe('Closed');
      expect(getPollStatusText('archived')).toBe('Archived');
      expect(getPollStatusText('locked')).toBe('Locked');
      expect(getPollStatusText('post-close')).toBe('Post-Close');
    });
  });

  describe('getVotingMethodText', () => {
    it('should return correct method text for all methods', () => {
      expect(getVotingMethodText('single')).toBe('Single Choice');
      expect(getVotingMethodText('approval')).toBe('Approval Voting');
      expect(getVotingMethodText('ranked')).toBe('Ranked Choice');
      expect(getVotingMethodText('range')).toBe('Range Voting');
      expect(getVotingMethodText('quadratic')).toBe('Quadratic Voting');
      expect(getVotingMethodText('multiple')).toBe('Multiple Choice');
    });
  });

  describe('allowsMultipleVotes', () => {
    it('should return true for methods that allow multiple votes', () => {
      expect(allowsMultipleVotes('approval')).toBe(true);
      expect(allowsMultipleVotes('multiple')).toBe(true);
    });

    it('should return false for methods that do not allow multiple votes', () => {
      expect(allowsMultipleVotes('single')).toBe(false);
      expect(allowsMultipleVotes('ranked')).toBe(false);
      expect(allowsMultipleVotes('range')).toBe(false);
      expect(allowsMultipleVotes('quadratic')).toBe(false);
    });
  });

  describe('calculateOptionPercentage', () => {
    it('should calculate percentage correctly', () => {
      const result = calculateOptionPercentage(25, 100);
      expect(result).toBe(25);
    });

    it('should return 0 for zero total votes', () => {
      const result = calculateOptionPercentage(10, 0);
      expect(result).toBe(0);
    });

    it('should round to nearest integer', () => {
      const result = calculateOptionPercentage(33, 100);
      expect(result).toBe(33);
    });
  });

  describe('sortOptionsByVotes', () => {
    it('should sort options by vote count in descending order', () => {
      const options = [
        { id: '1', text: 'Option 1', votes: 10 },
        { id: '2', text: 'Option 2', votes: 30 },
        { id: '3', text: 'Option 3', votes: 20 }
      ];
      const result = sortOptionsByVotes(options as any);
      expect(result[0]?.votes).toBe(30);
      expect(result[1]?.votes).toBe(20);
      expect(result[2]?.votes).toBe(10);
    });

    it('should handle options without votes', () => {
      const options = [
        { id: '1', text: 'Option 1' },
        { id: '2', text: 'Option 2', votes: 10 }
      ];
      const result = sortOptionsByVotes(options as any);
      expect(result[0]?.votes).toBe(10);
      expect(result[1]?.votes).toBeUndefined();
    });
  });

  describe('isPollExpired', () => {
    it('should return true for expired poll', () => {
      const endDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      const result = isPollExpired(endDate);
      expect(result).toBe(true);
    });

    it('should return false for active poll', () => {
      const endDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
      const result = isPollExpired(endDate);
      expect(result).toBe(false);
    });
  });

  describe('getTimeRemaining', () => {
    it('should return correct time remaining', () => {
      const endDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
      const result = getTimeRemaining(endDate);
      expect(result).toBeCloseTo(60 * 60 * 1000, -2); // Approximately 1 hour in milliseconds
    });

    it('should return 0 for expired poll', () => {
      const endDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      const result = getTimeRemaining(endDate);
      expect(result).toBe(0);
    });
  });

  describe('formatTimeRemaining', () => {
    it('should format time remaining with days', () => {
      const timeRemaining = 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000 + 30 * 60 * 1000; // 2d 3h 30m
      const result = formatTimeRemaining(timeRemaining);
      expect(result).toBe('2d 3h 30m remaining');
    });

    it('should format time remaining with hours only', () => {
      const timeRemaining = 3 * 60 * 60 * 1000 + 30 * 60 * 1000; // 3h 30m
      const result = formatTimeRemaining(timeRemaining);
      expect(result).toBe('3h 30m remaining');
    });

    it('should format time remaining with minutes only', () => {
      const timeRemaining = 30 * 60 * 1000; // 30m
      const result = formatTimeRemaining(timeRemaining);
      expect(result).toBe('30m remaining');
    });

    it('should return "Expired" for zero time remaining', () => {
      const result = formatTimeRemaining(0);
      expect(result).toBe('Expired');
    });
  });

  describe('sanitizePollTitleForUrl', () => {
    it('should sanitize title correctly', () => {
      const title = 'What is your favorite color?';
      const result = sanitizePollTitleForUrl(title);
      expect(result).toBe('what-is-your-favorite-color');
    });

    it('should handle special characters', () => {
      const title = 'Poll with @#$%^&*() special chars!';
      const result = sanitizePollTitleForUrl(title);
      expect(result).toBe('poll-with-special-chars');
    });

    it('should handle multiple spaces and hyphens', () => {
      const title = 'Poll   with---multiple   spaces';
      const result = sanitizePollTitleForUrl(title);
      expect(result).toBe('poll-with-multiple-spaces');
    });
  });

  describe('generatePollSummary', () => {
    it('should generate correct summary', () => {
      const poll = {
        id: '1',
        title: 'Test Poll',
        description: 'Test Description',
        options: [],
        status: 'active' as const,
        startDate: new Date(),
        endDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user1',
        settings: {} as any,
        category: 'general' as any,
        tags: [],
        privacyLevel: 'public' as const,
        votingMethod: 'single' as const,
        totalVotes: 100,
        participationRate: 25
      };
      const result = generatePollSummary(poll);
      expect(result).toBe('Active • Single Choice • 25% participation');
    });
  });
});
