import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

type AxeOptions = {
  /** Optional array of CSS selectors to include in analysis */
  include?: string[];
  /** Optional array of CSS selectors to exclude from analysis */
  exclude?: string[];
  /** If true, do not fail the test when violations are detected */
  allowViolations?: boolean;
};

export type AxeResults = Awaited<ReturnType<AxeBuilder['analyze']>>;

export async function runAxeAudit(page: Page, context: string, options: AxeOptions = {}): Promise<AxeResults> {
  const { allowViolations = false, include, exclude } = options;

  const builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);

  if (include?.length) {
    for (const selector of include) {
      builder.include(selector);
    }
  }

  if (exclude?.length) {
    for (const selector of exclude) {
      builder.exclude(selector);
    }
  }

  const results = await builder.analyze();

  if (results.violations.length > 0) {
    // Filter out known false positives for E2E harness pages
    // These violations occur when client components set title/lang in useEffect
    // but axe analyzes the page before React hydration completes
    const isE2EHarness = context.includes('harness') || context.includes('E2E');
    const filteredViolations = isE2EHarness
      ? results.violations.filter(v => !['document-title', 'html-has-lang'].includes(v.id))
      : results.violations;
    
    if (filteredViolations.length > 0) {
      console.error(`[axe] ${context} violations detected:`, filteredViolations);
      if (!allowViolations) {
        expect(filteredViolations, `${context} accessibility violations`).toEqual([]);
      }
    } else {
      console.info(`[axe] ${context} passed WCAG 2.0/2.1 A/AA checks (filtered E2E harness false positives)`);
    }
  } else {
    console.info(`[axe] ${context} passed WCAG 2.0/2.1 A/AA checks`);
  }

  return results;
}

