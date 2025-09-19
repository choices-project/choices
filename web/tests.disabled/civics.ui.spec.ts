import { test, expect } from '@playwright/test';

test.describe('civics UI components', () => {
  test('renders representative cards with mocked data', async ({ page }) => {
    // Mock the Google Civic API response
    await page.route('**/api/v1/civics/address-lookup', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          source: 'live',
          data: {
            representatives: [
              {
                name: 'Mock Representative',
                office: 'U.S. House of Representatives',
                party: 'D',
                district: 'CA-12',
                contact: {
                  email: 'mock@example.com',
                  phone: '(555) 123-4567',
                  website: 'https://mock.example.com'
                },
                fec: {
                  total_receipts: 1500000,
                  cash_on_hand: 500000,
                  cycle: 2024
                },
                voting: {
                  party_alignment: 0.85,
                  recent_votes: 5
                }
              },
              {
                name: 'Mock Senator',
                office: 'U.S. Senate',
                party: 'R',
                district: 'CA',
                contact: {
                  email: 'senator@example.com',
                  phone: '(555) 987-6543',
                  website: 'https://senator.example.com'
                }
              }
            ]
          },
          attribution: {
            address_lookup: 'Google Civic Information API',
            representatives: 'GovTrack.us API',
            finance: 'Federal Election Commission',
            voting: 'Congress.gov API'
          }
        })
      });
    });

    // Navigate to civics demo page
    await page.goto('/civics-demo');

    // Check that the form is visible
    await expect(page.locator('input[placeholder="Enter your address"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Fill in the address
    await page.fill('input[placeholder="Enter your address"]', '1600 Pennsylvania Ave NW, Washington, DC');

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for the results to load
    await expect(page.locator('.representative-card')).toBeVisible({ timeout: 10000 });

    // Check that representative cards are rendered
    const representativeCards = page.locator('.representative-card');
    await expect(representativeCards).toHaveCount(2);

    // Check first representative card content
    const firstCard = representativeCards.first();
    await expect(firstCard.locator('h3')).toContainText('Mock Representative');
    await expect(firstCard.locator('text=U.S. House of Representatives')).toBeVisible();
    await expect(firstCard.locator('text=CA-12')).toBeVisible();

    // Check contact information
    await expect(firstCard.locator('a[href="mailto:mock@example.com"]')).toBeVisible();
    await expect(firstCard.locator('text=(555) 123-4567')).toBeVisible();
    await expect(firstCard.locator('a[href="https://mock.example.com"]')).toBeVisible();

    // Check second representative card
    const secondCard = representativeCards.nth(1);
    await expect(secondCard.locator('h3')).toContainText('Mock Senator');
    await expect(secondCard.locator('text=U.S. Senate')).toBeVisible();
    await expect(secondCard.locator('text=CA')).toBeVisible();

    // Check attribution is displayed
    await expect(page.locator('text=Google Civic Information API')).toBeVisible();
  });

  test('handles API errors gracefully', async ({ page }) => {
    // Mock API error response
    await page.route('**/api/v1/civics/address-lookup', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error',
          message: 'Google Civic API is temporarily unavailable'
        })
      });
    });

    await page.goto('/civics-demo');
    await page.fill('input[placeholder="Enter your address"]', '1600 Pennsylvania Ave NW, Washington, DC');
    await page.click('button[type="submit"]');

    // Check that error message is displayed
    await expect(page.locator('.bg-red-100.text-red-700')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Internal server error')).toBeVisible();
  });

  test('validates address input', async ({ page }) => {
    await page.goto('/civics-demo');

    // Test empty address
    await page.click('button[type="submit"]');
    await expect(page.locator('input[placeholder="Enter your address"]:invalid')).toBeVisible();

    // Test very short address
    await page.fill('input[placeholder="Enter your address"]', '123');
    await page.click('button[type="submit"]');
    await expect(page.locator('input[placeholder="Enter your address"]:invalid')).toBeVisible();
  });

  test('shows loading state during API call', async ({ page }) => {
    // Mock delayed API response
    await page.route('**/api/v1/civics/address-lookup', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          source: 'live',
          data: { representatives: [] }
        })
      });
    });

    await page.goto('/civics-demo');
    await page.fill('input[placeholder="Enter your address"]', '1600 Pennsylvania Ave NW, Washington, DC');
    await page.click('button[type="submit"]');

    // Check that loading state is shown
    await expect(page.locator('text=Looking up...')).toBeVisible();
    await expect(page.locator('button[type="submit"]:disabled')).toBeVisible();
  });

  test('displays privacy messaging', async ({ page }) => {
    await page.goto('/civics-demo');

    // Check privacy messaging is visible
    await expect(page.locator('text=Privacy first')).toBeVisible();
    await expect(page.locator('text=We don\'t store your address')).toBeVisible();
    await expect(page.locator('text=Voting from a different address?')).toBeVisible();
  });

  test('shows feature disabled message when flag is off', async ({ page }) => {
    // Mock feature disabled response
    await page.route('**/api/v1/civics/address-lookup', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Feature not available'
        })
      });
    });

    await page.goto('/civics-demo');
    await page.fill('input[placeholder="Enter your address"]', '1600 Pennsylvania Ave NW, Washington, DC');
    await page.click('button[type="submit"]');

    // Check that feature disabled message is shown
    await expect(page.locator('text=Feature not available')).toBeVisible({ timeout: 10000 });
  });
});
