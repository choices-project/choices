/**
 * Feedback content validation.
 *
 * Goals (in order):
 *  1. Reject obvious spam wording (the only rule that catches real abuse).
 *  2. Enforce length bounds (defence-in-depth alongside the Zod schema).
 *
 * NON-goals — rules that previously lived here and silently dropped legitimate
 * bug reports for five months:
 *  - "Reject 5+ consecutive uppercase letters" → kills any acronym
 *    (RANKED, GITHUB, OAUTH, HTTPS, GraphQL artifacts, …) and the very common
 *    user habit of typing in caps to emphasise frustration. Real spammers
 *    rarely use ALL-CAPS in feedback dialogs.
 *  - "Reject any URL" → URLs are the single most valuable piece of context
 *    in a bug report (the page where the bug happened).
 *  - "Reject 3+ exclamation marks" → users naturally emphasise frustration
 *    that way; spam relies on it far less than the rule implies.
 *
 * These rules together blocked the report the user submitted from a poll
 * page (description likely contained `https://www.choices-app.com/polls/...`
 * or an acronym) and produced a 400 with no UI surfacing.
 */

export type FeedbackField = 'title' | 'description';

export type FeedbackContentValidationResult = {
  valid: boolean;
  reason?: string;
};

export type FeedbackContentValidationConfig = {
  /** Max length per field, defence-in-depth alongside Zod schema bounds. */
  maxLength: number;
  /** Case-insensitive regex matched against the content. Hits → reject. */
  spamPatterns: readonly RegExp[];
};

export const DEFAULT_FEEDBACK_CONTENT_CONFIG: FeedbackContentValidationConfig = {
  maxLength: 1000,
  spamPatterns: [
    /\b(?:viagra|cialis)\b/i,
    /\bclick here\b/i,
    /\bbuy now\b/i,
    /\bfree money\b/i,
    /\bcrypto (?:airdrop|giveaway|scam)\b/i,
    /\b(?:scam|phishing)\b/i,
  ],
};

export function validateFeedbackContent(
  content: string,
  fieldName: FeedbackField,
  config: FeedbackContentValidationConfig = DEFAULT_FEEDBACK_CONTENT_CONFIG,
): FeedbackContentValidationResult {
  if (typeof content !== 'string') {
    return { valid: false, reason: `${fieldName} is required` };
  }

  if (content.length > config.maxLength) {
    return {
      valid: false,
      reason: `${fieldName} too long (max ${config.maxLength} characters)`,
    };
  }

  for (const pattern of config.spamPatterns) {
    if (pattern.test(content)) {
      return {
        valid: false,
        reason: `Looks like spam, please rephrase the ${fieldName}`,
      };
    }
  }

  return { valid: true };
}
