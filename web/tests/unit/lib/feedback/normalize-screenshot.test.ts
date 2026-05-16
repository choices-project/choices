import { normalizeFeedbackScreenshot } from '@/lib/feedback/normalize-screenshot';

describe('normalizeFeedbackScreenshot', () => {
  it('accepts https URLs', () => {
    expect(normalizeFeedbackScreenshot('https://example.com/a.png')).toBe(
      'https://example.com/a.png',
    );
  });

  it('accepts data:image URLs', () => {
    const dataUrl = 'data:image/png;base64,abc';
    expect(normalizeFeedbackScreenshot(dataUrl)).toBe(dataUrl);
  });

  it('rejects non-image data URLs', () => {
    expect(normalizeFeedbackScreenshot('data:text/plain,x')).toBeNull();
  });

  it('returns null for empty values', () => {
    expect(normalizeFeedbackScreenshot(null)).toBeNull();
    expect(normalizeFeedbackScreenshot('')).toBeNull();
  });
});
