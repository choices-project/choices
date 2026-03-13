# E2E Test Selector Guide

**Purpose:** Standardized guide for writing reliable E2E test selectors in Playwright

**Last Updated:** January 21, 2026

## Overview

This guide provides best practices for writing E2E test selectors that are:
- **Reliable** - Work consistently across different environments
- **Maintainable** - Easy to update when UI changes
- **Accessible** - Prefer semantic selectors that align with accessibility

## Selector Priority

Use selectors in this order of preference:

### 1. **data-testid** (Highest Priority)
Use for test-specific elements that need reliable selection.

```typescript
// ✅ Good
page.getByTestId('poll-card')
page.getByTestId('poll-link')
page.getByTestId('poll-results-section')

// ❌ Avoid
page.locator('[data-testid="poll-card"]') // Use getByTestId instead
```

**When to use:**
- Interactive elements (buttons, links, forms)
- Key content sections
- Elements that may change styling but not purpose

**Naming Convention:**
- Use kebab-case: `poll-card`, `poll-link`, `poll-results`
- Be descriptive: `poll-retry-button` not `retry-btn`
- Include context: `poll-card` not just `card`

### 2. **getByRole()** (Semantic Elements)
Use for semantic HTML elements with accessible roles.

```typescript
// ✅ Good
page.getByRole('button', { name: /save/i })
page.getByRole('link', { name: /view poll/i })
page.getByRole('heading', { name: 'Poll Results' })
page.getByRole('alert')
page.getByRole('status')

// ❌ Avoid
page.locator('button') // Too generic
page.locator('button:has-text("Save")') // Use getByRole instead
```

**When to use:**
- Buttons, links, headings, form inputs
- Landmark elements (main, nav, article)
- ARIA roles (alert, status, region)

### 3. **filter() with hasText** (Text Matching)
Use for matching elements by text content with regex.

```typescript
// ✅ Good
page.getByRole('button').filter({ hasText: /try again|retry|reload/i })
page.getByText(/loading/i)
page.getByText(/error/i)

// ❌ Avoid
page.locator('button:has-text(/retry/i)') // CSS selector doesn't support regex
page.locator('text=/retry/i') // Use getByText or filter instead
```

**When to use:**
- Matching text content with patterns
- Case-insensitive matching
- Multiple text alternatives

### 4. **CSS Selectors** (Last Resort)
Use only when other methods don't work.

```typescript
// ✅ Good (when necessary)
page.locator('[data-poll-id]')
page.locator('h1, h2')
page.locator('[aria-busy="true"]')

// ❌ Avoid
page.locator('div > div > button') // Too fragile
page.locator('.class-name') // May change with styling
```

**When to use:**
- Data attributes for non-test elements
- ARIA attributes
- Structural elements that are stable

## Common Patterns

### Poll Detection

```typescript
// Strategy 1: data-testid (preferred)
const pollCard = page.getByTestId('poll-card');

// Strategy 2: data-poll-id attribute
const pollCard = page.locator('[data-poll-id]').first();

// Strategy 3: Poll links
const pollLink = page.locator('a[href*="/polls/"]').first();

// Strategy 4: API response (for dynamic content)
const response = await page.waitForResponse(
  (res) => res.url().includes('/api/polls') && res.request().method() === 'GET'
);
const body = await response.json();
const pollId = body.data?.polls?.[0]?.id;
```

### Error States

```typescript
// ✅ Good - Multiple strategies
const errorByTestId = page.getByTestId('poll-error');
const errorByRole = page.getByRole('alert');
const errorByText = page.getByText(/error|not found/i);

// Count all error indicators
const hasError = await errorByTestId.count() + 
                 await errorByRole.count() + 
                 await errorByText.count();
```

### Loading States

```typescript
// ✅ Good
const loadingByAria = page.locator('[aria-busy="true"]');
const loadingByText = page.getByText(/loading/i);
const loadingByTestId = page.getByTestId('poll-loading');

// Wait for loading to complete
await loadingByAria.waitFor({ state: 'hidden', timeout: 10_000 });
```

### Retry Buttons

```typescript
// ✅ Good
const retryButton = page.getByRole('button').filter({ hasText: /try again|retry|reload/i });

// ❌ Avoid
const retryButton = page.locator('button:has-text(/retry/i)'); // CSS doesn't support regex
```

## Anti-Patterns

### ❌ Don't Use CSS Selectors with Regex

```typescript
// ❌ Bad - CSS selectors don't support regex
page.locator('button:has-text(/retry/i)')
page.locator('[role="alert"]:has-text(/warning/i)')

// ✅ Good - Use filter() instead
page.getByRole('button').filter({ hasText: /retry/i })
page.getByRole('alert').filter({ hasText: /warning/i })
```

### ❌ Don't Use Fragile Selectors

```typescript
// ❌ Bad - Breaks if HTML structure changes
page.locator('div > div > div > button')
page.locator('.container .card .button')

// ✅ Good - Use semantic or test IDs
page.getByTestId('poll-card')
page.getByRole('button', { name: /view/i })
```

### ❌ Don't Use test.skip() Incorrectly

```typescript
// ❌ Bad
test.skip('E2E credentials not available');

// ✅ Good
test.skip(true, 'E2E credentials not available');
```

## Wait Strategies

### Wait for Elements

```typescript
// ✅ Good - Wait for specific state
await page.getByTestId('poll-card').waitFor({ state: 'visible', timeout: 10_000 });

// ✅ Good - Wait for any valid state
await Promise.race([
  pollContent.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => null),
  loadingState.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => null),
  errorState.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => null),
]);
```

### Wait for Network

```typescript
// ✅ Good - Wait for API response
const response = await page.waitForResponse(
  (res) => res.url().includes('/api/polls') && res.request().method() === 'GET',
  { timeout: 30_000 }
);
```

## Data Attributes to Add

When creating new components, add these data attributes:

```typescript
// Poll cards
<Card data-testid="poll-card" data-poll-id={poll.id} data-poll-title={poll.title}>
  <Link href={`/polls/${poll.id}`} data-testid="poll-link">
    View Poll
  </Link>
</Card>

// Error displays
<EnhancedErrorDisplay data-testid="poll-error">
  {/* error content */}
</EnhancedErrorDisplay>

// Loading states
<div data-testid="poll-loading" aria-busy="true">
  Loading...
</div>

// Results sections
<section data-testid="poll-results-section">
  {/* results */}
</section>
```

## Examples

### Complete Poll Detection Helper

```typescript
async function findPollId(page: Page): Promise<string | null> {
  // Strategy 1: data-testid
  const pollCard = page.getByTestId('poll-card').first();
  if (await pollCard.count() > 0) {
    const pollId = await pollCard.getAttribute('data-poll-id');
    if (pollId) return pollId;
  }

  // Strategy 2: Poll links
  const pollLink = page.locator('a[href*="/polls/"]').first();
  if (await pollLink.count() > 0) {
    const href = await pollLink.getAttribute('href');
    if (href) {
      const match = href.match(/\/polls\/([^/]+)/);
      if (match?.[1]) return match[1];
    }
  }

  // Strategy 3: API response
  try {
    const response = await page.waitForResponse(
      (res) => res.url().includes('/api/polls') && res.request().method() === 'GET',
      { timeout: 10_000 }
    );
    const body = await response.json();
    return body.data?.polls?.[0]?.id || null;
  } catch {
    return null;
  }
}
```

### Error State Detection

```typescript
async function checkErrorState(page: Page): Promise<{ hasError: boolean; errorText: string }> {
  const errorByTestId = page.getByTestId('poll-error');
  const errorByRole = page.getByRole('alert');
  const errorByText = page.getByText(/error|not found/i);

  const hasError = (await errorByTestId.count()) + 
                  (await errorByRole.count()) + 
                  (await errorByText.count()) > 0;

  let errorText = '';
  if (await errorByTestId.count() > 0) {
    errorText = await errorByTestId.first().textContent() || '';
  } else if (await errorByRole.count() > 0) {
    errorText = await errorByRole.first().textContent() || '';
  } else if (await errorByText.count() > 0) {
    errorText = await errorByText.first().textContent() || '';
  }

  return { hasError, errorText };
}
```

## Production Considerations

### Timeouts

```typescript
// Production may be slower - use longer timeouts
const PRODUCTION_TIMEOUT = 30_000; // 30 seconds
const LOCAL_TIMEOUT = 10_000; // 10 seconds

const timeout = process.env.BASE_URL?.includes('choices-app.com') 
  ? PRODUCTION_TIMEOUT 
  : LOCAL_TIMEOUT;

await page.waitForSelector('[data-testid="poll-card"]', { timeout });
```

### Wait for Page Ready

```typescript
// Always wait for page to be ready
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
await waitForPageReady(page);
await page.waitForTimeout(3_000); // Additional wait for dynamic content
```

## Resources

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Selectors](https://playwright.dev/docs/selectors)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
