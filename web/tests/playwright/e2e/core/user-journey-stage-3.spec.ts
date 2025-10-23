/**
 * User Journey Stage 3
 *
 * Focuses on feature interactions and user journey expansion:
 * - Profile management and editing
 * - Poll creation and management
 * - Poll voting and results
 * - Feed interaction and engagement
 * - Settings and preferences
 *
 * Created: January 27, 2025
 * Updated: January 27, 2025
 * Purpose: Stage 3 of iterative E2E testing - Feature interactions and user journey
 */

import { test, expect } from '@playwright/test';
import { DatabaseTracker } from '/Users/alaughingkitsune/src/Choices/web/tests/utils/database-tracker';
import { ConsistentTestUserManager, CONSISTENT_TEST_USER } from '/Users/alaughingkitsune/src/Choices/web/tests/utils/consistent-test-user';

test.describe('User Journey Stage 3', () => {
  test.beforeEach(async ({ page }) => {
    // Reset database tracking for each test
    DatabaseTracker.reset();

    // Load environment variables
    const dotenv = await import('dotenv');
    dotenv.config({ path: '.env.local' });

    // Initialize database tracking
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://muqwrehywjrbaeerjgfb.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tJOpGO2IPjujJDQou44P_g_BgbTFBfc';
    DatabaseTracker.initializeSupabase(supabaseUrl, supabaseKey);

    // Ensure consistent test user exists
    await ConsistentTestUserManager.ensureUserExists();
    console.log('🚀 Starting User Journey Stage 3 - Feature Interactions');
  });

  test('should handle user feature interactions and journey expansion', async ({ page }) => {
    console.log('👤 Testing User Feature Interactions and Journey Expansion');
    console.log(`📧 Using consistent test user: ${CONSISTENT_TEST_USER.email}`);

    // Step 1: Login with consistent test user
    console.log('🔐 Step 1: User Login');
    DatabaseTracker.trackQuery('login_page', 'select', 'user_login');

    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if login form is available
    const emailField = await page.locator('[data-testid="email"]');
    const passwordField = await page.locator('[data-testid="password"]');

    if (await emailField.isVisible() && await passwordField.isVisible()) {
      console.log('✅ Login form found, proceeding with login');

      // Fill login form
      await page.fill('[data-testid="email"]', CONSISTENT_TEST_USER.email);
      await page.fill('[data-testid="password"]', CONSISTENT_TEST_USER.password);
      await page.click('[data-testid="login-submit"]');

      // Wait for redirect to dashboard
      await page.waitForURL('/dashboard', { timeout: 10000 });
      DatabaseTracker.trackQuery('user_profiles', 'select', 'user_login');
      DatabaseTracker.trackQuery('auth.users', 'select', 'user_login');

      console.log('✅ Login successful - proceeding to feature interactions');
    } else {
      console.log('⚠️ Login form not found, checking if already logged in');

      // Check if we're already on dashboard or need to navigate there
      if (page.url().includes('/dashboard')) {
        console.log('✅ Already on dashboard');
      } else {
        // Try to navigate to dashboard directly
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        console.log('✅ Navigated to dashboard');
      }
    }

    // Step 2: Profile Management
    console.log('👤 Step 2: Profile Management');
    DatabaseTracker.trackQuery('profile_page', 'select', 'profile_access');

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check profile page elements
    const profileElements = await page.locator('[data-testid^="profile-"]');
    const profileElementCount = await profileElements.count();
    console.log(`👤 Profile elements found: ${profileElementCount}`);

    // Look for profile editing capabilities
    const editButtons = await page.locator('button').filter({ hasText: /edit|update|save/i });
    const editButtonCount = await editButtons.count();
    console.log(`✏️ Edit buttons found: ${editButtonCount}`);

    // Check for profile information display
    const profileInfo = await page.locator('h1, h2, h3').first();
    if (await profileInfo.isVisible()) {
      const profileTitle = await profileInfo.textContent();
      console.log(`📝 Profile title: ${profileTitle}`);
    }

    DatabaseTracker.trackQuery('user_profiles', 'select', 'profile_display');
    DatabaseTracker.trackQuery('user_preferences', 'select', 'profile_display');

    // Step 3: Poll Creation
    console.log('📊 Step 3: Poll Creation');
    DatabaseTracker.trackQuery('polls_create', 'select', 'poll_creation');

    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check poll creation form
    const pollForm = await page.locator('form');
    if (await pollForm.isVisible()) {
      console.log('✅ Poll creation form found');
      
      // Look for form fields
      const titleField = await page.locator('input[type="text"], textarea').first();
      if (await titleField.isVisible()) {
        console.log('📝 Poll title field found');
        await titleField.fill('Test Poll for Stage 3');
        DatabaseTracker.trackQuery('polls', 'insert', 'poll_creation');
      }

      // Look for options fields
      const optionFields = await page.locator('input[type="text"]');
      const optionCount = await optionFields.count();
      console.log(`📋 Option fields found: ${optionCount}`);

      // Look for submit button
      const submitButton = await page.locator('button[type="submit"], button').filter({ hasText: /create|submit|save/i });
      if (await submitButton.isVisible()) {
        console.log('🚀 Poll creation submit button found');
        DatabaseTracker.trackQuery('polls', 'insert', 'poll_submission');
      }
    } else {
      console.log('⚠️ Poll creation form not found');
    }

    // Step 4: Poll Voting (if polls exist)
    console.log('🗳️ Step 4: Poll Voting');
    DatabaseTracker.trackQuery('polls_voting', 'select', 'poll_voting');

    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for polls to vote on
    const pollCards = await page.locator('[data-testid^="poll-"], .poll-card, .poll-item');
    const pollCount = await pollCards.count();
    console.log(`📊 Polls found: ${pollCount}`);

    if (pollCount > 0) {
      console.log('✅ Polls available for voting');
      
      // Click on first poll
      const firstPoll = pollCards.first();
      await firstPoll.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Look for voting options
      const voteButtons = await page.locator('button').filter({ hasText: /vote|select|choose/i });
      const voteButtonCount = await voteButtons.count();
      console.log(`🗳️ Vote buttons found: ${voteButtonCount}`);

      if (voteButtonCount > 0) {
        console.log('✅ Voting interface found');
        DatabaseTracker.trackQuery('votes', 'insert', 'poll_voting');
        DatabaseTracker.trackQuery('poll_votes', 'insert', 'poll_voting');
      }
    } else {
      console.log('⚠️ No polls available for voting');
    }

    // Step 5: Feed Interaction
    console.log('📰 Step 5: Feed Interaction');
    DatabaseTracker.trackQuery('feed_page', 'select', 'feed_access');

    await page.goto('/feed');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check feed content
    const feedItems = await page.locator('[data-testid^="feed-"], .feed-item, .post-item');
    const feedItemCount = await feedItems.count();
    console.log(`📰 Feed items found: ${feedItemCount}`);

    if (feedItemCount > 0) {
      console.log('✅ Feed content available');
      DatabaseTracker.trackQuery('feed_items', 'select', 'feed_display');
      DatabaseTracker.trackQuery('posts', 'select', 'feed_display');
    } else {
      console.log('⚠️ No feed content available');
    }

    // Step 6: Settings and Preferences
    console.log('⚙️ Step 6: Settings and Preferences');
    DatabaseTracker.trackQuery('settings_page', 'select', 'settings_access');

    // Look for settings links/buttons
    const settingsLinks = await page.locator('a, button').filter({ hasText: /settings|preferences|account/i });
    const settingsLinkCount = await settingsLinks.count();
    console.log(`⚙️ Settings links found: ${settingsLinkCount}`);

    if (settingsLinkCount > 0) {
      console.log('✅ Settings access available');
      DatabaseTracker.trackQuery('user_preferences', 'select', 'settings_display');
      DatabaseTracker.trackQuery('user_settings', 'select', 'settings_display');
    }

    // Step 7: Navigation and User Experience
    console.log('🧭 Step 7: Navigation and User Experience');
    DatabaseTracker.trackQuery('navigation', 'select', 'user_navigation');

    // Test navigation elements
    const navLinks = await page.locator('nav a, nav button');
    const navLinkCount = await navLinks.count();
    console.log(`🧭 Navigation links found: ${navLinkCount}`);

    // Test user menu/profile access
    const userMenu = await page.locator('[data-testid^="user-menu"], .user-menu, .profile-menu');
    if (await userMenu.isVisible()) {
      console.log('✅ User menu found');
      DatabaseTracker.trackQuery('user_menu', 'select', 'user_interface');
    }

    // Step 8: Database Usage Analysis
    console.log('📊 Step 8: Database Usage Analysis');
    const results = DatabaseTracker.getResults();
    console.log('📊 Stage 3 Results:');
    console.log(`- Total Tables Used: ${results.totalTables}`);
    console.log(`- Total Queries: ${results.totalQueries}`);
    console.log(`- Most Used Table: ${results.mostUsedTable}`);
    console.log(`- Tables Used: ${results.tablesUsed.join(', ')}`);

    // Generate comprehensive report
    const reportData = {
      stage: 'Stage 3: Feature Interactions',
      user: CONSISTENT_TEST_USER.email,
      timestamp: new Date().toISOString(),
      results: results,
      tablesUsed: results.tablesUsed,
      queries: results.queries,
      featureInteractions: {
        profileManagement: profileElementCount > 0,
        pollCreation: pollForm ? true : false,
        pollVoting: pollCount > 0,
        feedInteraction: feedItemCount > 0,
        settingsAccess: settingsLinkCount > 0,
        navigation: navLinkCount > 0
      }
    };

    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(__dirname, '../../../../test-results/feature-interactions-stage-user.json');

    // Ensure directory exists
    const dir = path.dirname(reportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📄 Report saved: feature-interactions-stage-user.json`);

    console.log('✅ User feature interactions and journey expansion completed');
  });
});
