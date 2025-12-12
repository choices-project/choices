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

  // Type assertion to work around version mismatch between @playwright/test and @axe-core/playwright
  // @axe-core/playwright may use a slightly different version of playwright-core types
  const builder = new AxeBuilder({ page: page as any }).withTags(['wcag2a', 'wcag2aa']);

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
    console.error(`[axe] ${context} violations detected:`, results.violations);
    if (!allowViolations) {
      expect(results.violations, `${context} accessibility violations`).toEqual([]);
    }
  } else {
    console.info(`[axe] ${context} passed WCAG 2.0/2.1 A/AA checks`);
    expect(results.violations, `${context} accessibility violations`).toEqual([]);
  }

  return results;
}

