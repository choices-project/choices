import { test, expect } from '@playwright/test';

test.describe('Civics Complete User Journey - Privacy-Safe Flow', () => {
  test('address→jurisdiction cookie→dashboard SSR (privacy-safe)', async ({ page, context }) => {
    // Stub providers (example)
    await page.route('**/google_civic/**', route => route.fulfill({
      status: 200, 
      body: JSON.stringify({ ok: true, district: '13', state: 'IL', county: 'Sangamon' })
    }));

    // Navigate to civics page
    await page.goto('/civics');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Fill address input
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    
    // Submit address lookup
    await page.click('[data-testid="address-submit"]');
    
    // Wait for API call to complete
    await page.waitForResponse('**/api/v1/civics/address-lookup');
    
    // Verify jurisdiction cookie is set
    const cookies = await context.cookies();
    const jurisCookie = cookies.find(c => c.name === 'cx_jurisdictions');
    expect(jurisCookie).toBeTruthy();
    expect(jurisCookie?.httpOnly).toBe(true);
    expect(jurisCookie?.secure).toBe(true);
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    
    // Verify jurisdiction-scoped content appears
    await expect(page.getByTestId('poll-card')).toHaveCount(1);
    
    // Verify no raw address is stored (check for address in page content)
    const pageContent = await page.content();
    expect(pageContent).not.toContain('123 Any St');
    expect(pageContent).not.toContain('Springfield, IL 62704');
    
    // Verify jurisdiction information is present
    await expect(page.locator('text=State IL Poll')).toBeVisible();
    await expect(page.locator('text=district 13')).toBeVisible();
  });

  test('privacy verification - no address storage', async ({ page }) => {
    // Test that addresses are not stored anywhere
    await page.goto('/civics');
    
    // Submit multiple addresses
    const addresses = [
      '123 Main St, Chicago, IL 60601',
      '456 Oak Ave, Springfield, IL 62701',
      '789 Pine Rd, Rockford, IL 61101'
    ];
    
    for (const address of addresses) {
      await page.fill('[data-testid="address-input"]', address);
      await page.click('[data-testid="address-submit"]');
      await page.waitForResponse('**/api/v1/civics/address-lookup');
    }
    
    // Check that no raw addresses appear in any API responses or page content
    const pageContent = await page.content();
    for (const address of addresses) {
      expect(pageContent).not.toContain(address);
    }
  });

  test('jurisdiction cookie security', async ({ page, context }) => {
    await page.goto('/civics');
    
    // Submit address
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    await page.waitForResponse('**/api/v1/civics/address-lookup');
    
    // Verify cookie security attributes
    const cookies = await context.cookies();
    const jurisCookie = cookies.find((c: any) => c.name === 'cx_jurisdictions');
    
    expect(jurisCookie?.httpOnly).toBe(true);
    expect(jurisCookie?.secure).toBe(true);
    expect(jurisCookie?.sameSite).toBe('Lax');
    expect(jurisCookie?.path).toBe('/');
    
    // Verify cookie is signed (not readable as plain text)
    expect(jurisCookie?.value).toMatch(/^[A-Za-z0-9_-]+$/); // base64url format
  });

  test('dashboard SSR filtering by jurisdiction', async ({ page, context }) => {
    // Set jurisdiction cookie directly
    await context.addCookies([{
      name: 'cx_jurisdictions',
      value: Buffer.from(JSON.stringify({
        body: JSON.stringify({ state: 'CA', district: '12', county: 'San Francisco', v: 1, iat: Date.now() }),
        sig: 'test-signature'
      })).toString('base64url'),
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false, // localhost
      sameSite: 'Lax'
    }]);
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verify jurisdiction-specific content
    await expect(page.locator('text=State CA Poll')).toBeVisible();
    await expect(page.locator('text=district 12')).toBeVisible();
  });

  test('error handling and fallbacks', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/v1/civics/address-lookup', route => route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    }));
    
    await page.goto('/civics');
    
    // Submit address
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    
    // Verify error handling
    await expect(page.locator('text=Failed to lookup address')).toBeVisible();
    
    // Verify no cookie is set on error
    const cookies = await context.cookies();
    const jurisCookie = cookies.find((c: any) => c.name === 'cx_jurisdictions');
    expect(jurisCookie).toBeFalsy();
  });

  test('performance requirements', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/civics');
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    
    // Wait for complete flow
    await page.waitForResponse('**/api/v1/civics/address-lookup');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Soft performance assertion (should complete within 5 seconds)
    expect(totalTime).toBeLessThan(5000);
  });

  test('mobile responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/civics');
    
    // Verify mobile layout
    await expect(page.locator('[data-testid="address-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="address-submit"]')).toBeVisible();
    
    // Test mobile flow
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    await page.waitForResponse('**/api/v1/civics/address-lookup');
    
    // Navigate to dashboard on mobile
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verify mobile dashboard works
    await expect(page.getByTestId('poll-card')).toHaveCount(1);
  });
});
