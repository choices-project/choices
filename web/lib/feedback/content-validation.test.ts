/**
 * @jest-environment node
 *
 * Regression tests for feedback content validation.
 *
 * History: between Dec 2025 and May 2026 every feedback submission was
 * silently dropped because the previous validator rejected:
 *   - any URL  (`https?:\/\/[^\s]+`)
 *   - any 5+ consecutive uppercase letters
 *   - 3+ exclamation marks
 * Real bug reports routinely contain URLs and acronyms; the rules were a
 * 100% false-positive trap. These tests pin the new permissive behaviour
 * so we never regress.
 */

import {
  DEFAULT_FEEDBACK_CONTENT_CONFIG,
  validateFeedbackContent,
} from './content-validation';

describe('validateFeedbackContent — permissive rules', () => {
  it.each<[string, string]>([
    ['plain bug report', 'Vote count showing 0 after voting on a ranked poll'],
    [
      'with full page URL (most common bug-report shape)',
      'On https://www.choices-app.com/polls/af07ccf3-0c5c-41b3-8261-b91a76a02b0d the total votes stays at 0.',
    ],
    [
      'with ALL-CAPS acronym (RANKED, GITHUB, OAUTH)',
      'GITHUB OAuth login goes through but RANKED poll counts stay at 0',
    ],
    [
      'with emphatic punctuation (!!! / ???)',
      'This is really broken!!! Why does the count not update???',
    ],
    [
      'with code-style snippet & error text',
      'API call to /api/polls/X/results returns total_votes: 0 even after a ballot.',
    ],
    [
      'multiline pasted stack trace',
      'TypeError: cannot read property "x" of undefined\n    at /api/foo (line 12)',
    ],
  ])('accepts %s', (_label, description) => {
    expect(validateFeedbackContent(description, 'description')).toEqual({ valid: true });
  });

  it.each<[string, string]>([
    ['title with acronym', 'GITHUB login broken'],
    ['title with URL', 'see https://www.choices-app.com/polls/ABC'],
    ['short emphatic title', 'PLEASE FIX THIS!!!'],
  ])('accepts %s in title field', (_label, title) => {
    expect(validateFeedbackContent(title, 'title')).toEqual({ valid: true });
  });
});

describe('validateFeedbackContent — rejection rules', () => {
  it('rejects classic spam wording (click here)', () => {
    expect(
      validateFeedbackContent('Click here to win free money!', 'description').valid,
    ).toBe(false);
  });

  it.each<[string]>([
    ['Buy now and get free money'],
    ['phishing campaign reported on the site'],
    ['scam attempt detected'],
    ['VIAGRA cheap deals here'],
  ])('rejects %s', (input) => {
    expect(validateFeedbackContent(input, 'description').valid).toBe(false);
  });

  it('rejects content past the length cap', () => {
    const tooLong = 'a'.repeat(DEFAULT_FEEDBACK_CONTENT_CONFIG.maxLength + 1);
    const result = validateFeedbackContent(tooLong, 'description');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/too long/i);
  });

  it('rejects non-string content as a defensive guard', () => {
    expect(
      validateFeedbackContent(undefined as unknown as string, 'description').valid,
    ).toBe(false);
  });
});

describe('validateFeedbackContent — config is overridable', () => {
  it('honours a custom spam pattern list', () => {
    const result = validateFeedbackContent('totally fine message', 'description', {
      ...DEFAULT_FEEDBACK_CONTENT_CONFIG,
      spamPatterns: [/\btotally\b/i],
    });
    expect(result.valid).toBe(false);
  });

  it('honours a custom max length', () => {
    const result = validateFeedbackContent('hi', 'description', {
      ...DEFAULT_FEEDBACK_CONTENT_CONFIG,
      maxLength: 1,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/too long/i);
  });
});
