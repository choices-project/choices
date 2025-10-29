import { test, expect } from '@playwright/test';

test.describe('Infinite Loop Debug Dashboard', () => {
  test('should load debug page and monitor for infinite loops', async ({ page }) => {
    // Navigate to debug page
    await page.goto('/debug-infinite-loop');
    await page.waitForLoadState('networkidle');
    
    // Check if page loads
    await expect(page.locator('h1')).toContainText('Infinite Loop Debug Dashboard');
    
    // Wait a bit to let the debug component run
    await page.waitForTimeout(5000);
    
    // Check render count - should be reasonable (not infinite)
    const renderCountText = await page.locator('text=/Total Renders/').textContent();
    const renderCount = parseInt(renderCountText?.match(/\d+/)?.[0] || '0');
    
    console.log(`🔍 Debug page render count: ${renderCount}`);
    
    // If render count is too high, it indicates an infinite loop
    expect(renderCount).toBeLessThan(50); // Should not have more than 50 renders in 5 seconds
    
    // Check for error messages
    const errorLog = await page.locator('[class*="text-red-600"]').allTextContents();
    if (errorLog.length > 0) {
      console.log('🚨 Errors detected:', errorLog);
    }
    
    // Check store states
    const storeStates = await page.locator('[class*="text-blue-600"]').allTextContents();
    console.log('🏪 Store states found:', storeStates.length);
    
    // Take a screenshot for analysis
    await page.screenshot({ path: 'test-results/debug-infinite-loop.png' });
  });

  test('should test store hooks individually', async ({ page }) => {
    await page.goto('/debug-infinite-loop');
    await page.waitForLoadState('networkidle');
    
    // Click the "Test Store Hooks" button
    await page.click('text=Test Store Hooks');
    
    // Wait for console logs
    await page.waitForTimeout(2000);
    
    // Check console for store hook test results
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('Store hook')) {
        consoleLogs.push(msg.text());
      }
    });
    
    // Wait for console logs to appear
    await page.waitForTimeout(3000);
    
    console.log('🧪 Store hook test results:', consoleLogs);
    
    // Should have some store hook test results
    expect(consoleLogs.length).toBeGreaterThan(0);
  });

  test('should monitor render frequency over time', async ({ page }) => {
    await page.goto('/debug-infinite-loop');
    await page.waitForLoadState('networkidle');
    
    // Monitor for 10 seconds
    const startTime = Date.now();
    const renderCounts: number[] = [];
    
    // Check render count every second
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(1000);
      
      const renderCountText = await page.locator('text=/Total Renders/').textContent();
      const renderCount = parseInt(renderCountText?.match(/\d+/)?.[0] || '0');
      renderCounts.push(renderCount);
      
      console.log(`📊 Second ${i + 1}: ${renderCount} renders`);
    }
    
    // Calculate render rate
    const totalRenders = renderCounts[renderCounts.length - 1] ?? 0;
    const renderRate = totalRenders / 10; // renders per second
    
    console.log(`📈 Average render rate: ${renderRate.toFixed(2)} renders/second`);
    
    // If render rate is too high, it indicates an infinite loop
    expect(renderRate).toBeLessThan(5); // Should not exceed 5 renders per second
    
    // Check if render count is increasing linearly (indicating infinite loop)
    const isIncreasing = renderCounts.every((count, index) => 
      index === 0 || count >= (renderCounts[index - 1] ?? 0)
    );
    
    if (isIncreasing && (totalRenders ?? 0) > 20) {
      console.log('🚨 WARNING: Render count is continuously increasing - possible infinite loop');
    }
  });
});