import { test } from '@playwright/test';
import { ensureLoggedOut, loginTestUser, waitForPageReady } from '../../helpers/e2e-setup';

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;

test.describe('Production Cookie Inspection', () => {
  test('inspect cookies after login and during profile access', async ({ page, context }) => {
    test.setTimeout(180_000);

    if (!regularEmail || !regularPassword) {
      test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
      return;
    }

    // Step 1: Logout and clear all cookies
    await ensureLoggedOut(page);
    await context.clearCookies();

    console.log('\n=== STEP 1: Initial State (After Logout) ===');
    const initialCookies = await context.cookies();
    console.log('Cookies after logout:', initialCookies.length);
    initialCookies.forEach(cookie => {
      console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 50)}... (domain: ${cookie.domain}, path: ${cookie.path}, secure: ${cookie.secure}, httpOnly: ${cookie.httpOnly})`);
    });

    // Step 2: Navigate to login page
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const cookiesBeforeLogin = await context.cookies();
    console.log('\n=== STEP 2: Before Login ===');
    console.log('Cookies before login:', cookiesBeforeLogin.length);
    cookiesBeforeLogin.forEach(cookie => {
      console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 50)}...`);
    });

    // Step 3: Perform login
    console.log('\n=== STEP 3: Performing Login ===');
    await loginTestUser(page, {
      email: regularEmail,
      password: regularPassword,
      username: regularEmail.split('@')[0] ?? 'e2e-user',
    });
    await waitForPageReady(page);

    // Step 4: Check cookies immediately after login
    await page.waitForTimeout(2_000); // Wait for cookies to be set
    const cookiesAfterLogin = await context.cookies();
    console.log('\n=== STEP 4: After Login ===');
    console.log('Cookies after login:', cookiesAfterLogin.length);

    const authCookies = cookiesAfterLogin.filter(c =>
      c.name.includes('auth') ||
      c.name.includes('session') ||
      c.name.startsWith('sb-')
    );

    console.log('\nAuth-related cookies:', authCookies.length);
    authCookies.forEach(cookie => {
      console.log(`  - ${cookie.name}:`);
      console.log(`    Value length: ${cookie.value.length}`);
      console.log(`    Domain: ${cookie.domain || '(not set)'}`);
      console.log(`    Path: ${cookie.path}`);
      console.log(`    Secure: ${cookie.secure}`);
      console.log(`    HttpOnly: ${cookie.httpOnly}`);
      console.log(`    SameSite: ${cookie.sameSite || '(not set)'}`);
      console.log(`    Expires: ${cookie.expires ? new Date(cookie.expires * 1000).toISOString() : 'Session cookie'}`);
      if (cookie.value.length < 200) {
        console.log(`    Value preview: ${cookie.value.substring(0, 100)}...`);
      }
    });

    // Step 5: Check current URL after login
    const urlAfterLogin = page.url();
    console.log('\n=== STEP 5: URL After Login ===');
    console.log('Current URL:', urlAfterLogin);

    // Step 6: Navigate to profile page
    console.log('\n=== STEP 6: Navigating to Profile ===');
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2_000);

    // Step 7: Check cookies after profile navigation
    const cookiesAfterProfileNav = await context.cookies();
    console.log('\n=== STEP 7: After Profile Navigation ===');
    console.log('Cookies after profile nav:', cookiesAfterProfileNav.length);

    const authCookiesAfterNav = cookiesAfterProfileNav.filter(c =>
      c.name.includes('auth') ||
      c.name.includes('session') ||
      c.name.startsWith('sb-')
    );

    console.log('\nAuth-related cookies after nav:', authCookiesAfterNav.length);
    authCookiesAfterNav.forEach(cookie => {
      console.log(`  - ${cookie.name}: ${cookie.value.length} chars`);
    });

    // Step 8: Check final URL
    const finalUrl = page.url();
    console.log('\n=== STEP 8: Final URL ===');
    console.log('Final URL:', finalUrl);
    console.log('Expected: /profile');
    console.log('Redirected to auth:', finalUrl.includes('/auth'));

    // Step 9: Check network requests for Set-Cookie headers
    console.log('\n=== STEP 9: Network Request Analysis ===');
    const requests: Array<{ url: string; status: number; setCookie: string[] }> = [];
    page.on('response', (response) => {
      const setCookieHeaders = response.headers()['set-cookie'];
      if (setCookieHeaders) {
        requests.push({
          url: response.url(),
          status: response.status(),
          setCookie: Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders],
        });
      }
    });

    // Reload to capture response headers
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1_000);

    console.log('\nResponses with Set-Cookie headers:', requests.length);
    requests.forEach((req, i) => {
      console.log(`\n${i + 1}. ${req.url} (${req.status})`);
      req.setCookie.forEach((cookie: string, j: number) => {
        const cookieParts = cookie.split(';');
        const cookieName = cookieParts[0].split('=')[0];
        console.log(`   Cookie ${j + 1}: ${cookieName}`);
        cookieParts.forEach((part: string, k: number) => {
          if (k > 0) console.log(`     ${part.trim()}`);
        });
      });
    });

    // Step 10: Extract Supabase project ref from cookies
    const supabaseCookies = cookiesAfterLogin.filter(c => c.name.startsWith('sb-'));
    if (supabaseCookies.length > 0) {
      console.log('\n=== STEP 10: Supabase Cookie Analysis ===');
      supabaseCookies.forEach(cookie => {
        const match = cookie.name.match(/^sb-([^-]+)-/);
        if (match) {
          console.log(`Project ref from cookie name: ${match[1]}`);
        }
        console.log(`Full cookie name: ${cookie.name}`);
      });
    }

    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Total cookies after login: ${cookiesAfterLogin.length}`);
    console.log(`Auth-related cookies: ${authCookies.length}`);
    console.log(`Profile page accessible: ${!finalUrl.includes('/auth')}`);
    console.log(`Has sb-*-auth-token cookie: ${authCookies.some(c => c.name.includes('auth-token'))}`);
    console.log(`Has sb-access-token cookie: ${authCookies.some(c => c.name === 'sb-access-token')}`);

    // Take screenshot
    await page.screenshot({ path: 'test-results/cookie-inspection.png', fullPage: true });
    console.log('\nScreenshot saved to test-results/cookie-inspection.png');

    // Export cookie data for analysis
    const cookieData = {
      afterLogin: cookiesAfterLogin.map(c => ({
        name: c.name,
        domain: c.domain,
        path: c.path,
        secure: c.secure,
        httpOnly: c.httpOnly,
        sameSite: c.sameSite,
        valueLength: c.value.length,
      })),
      afterProfileNav: cookiesAfterProfileNav.map(c => ({
        name: c.name,
        domain: c.domain,
        path: c.path,
        secure: c.secure,
        httpOnly: c.httpOnly,
        sameSite: c.sameSite,
        valueLength: c.value.length,
      })),
      finalUrl,
      urlAfterLogin,
    };

    console.log('\n=== COOKIE DATA (JSON) ===');
    console.log(JSON.stringify(cookieData, null, 2));

    // Assertions for debugging (not failing the test)
    if (authCookies.length === 0) {
      console.log('\n⚠️  WARNING: No auth cookies found after login!');
    }
    if (finalUrl.includes('/auth')) {
      console.log('\n⚠️  WARNING: Profile page redirected to auth page');
    }
  });
});

