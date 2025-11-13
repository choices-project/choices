import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

type AxeOptions = {
  /** Optional array of CSS selectors to include in analysis */
  include?: string[];
  /** Optional array of CSS selectors to exclude from analysis */
  exclude?: string[];
};

export async function runAxeAudit(page: Page, context: string, options: AxeOptions = {}) {
  const builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);

  if (options.include?.length) {
    for (const selector of options.include) {
      builder.include(selector);
    }
  }

  if (options.exclude?.length) {
    for (const selector of options.exclude) {
      builder.exclude(selector);
    }
  }

  const results = await builder.analyze();

  if (results.violations.length > 0) {
    console.error(`[axe] ${context} violations detected:`, results.violations);
  } else {
    console.info(`[axe] ${context} passed WCAG 2.0/2.1 A/AA checks`);
  }

  expect(results.violations, `${context} accessibility violations`).toEqual([]);
}

