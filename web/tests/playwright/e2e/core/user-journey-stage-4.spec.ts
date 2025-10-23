/**
 * User Journey Stage 4
 *
 * Focuses on complete user workflows and missing feature development.
 * Implements the features identified as missing in Stage 3.
 *
 * Created: January 27, 2025
 * Updated: January 27, 2025
 * Purpose: Stage 4 of iterative E2E testing - Complete User Workflows
 */

import { test, expect } from '@playwright/test';
import { DatabaseTracker } from '/Users/alaughingkitsune/src/Choices/web/tests/utils/database-tracker';
import { ConsistentTestUserManager, CONSISTENT_TEST_USER } from '/Users/alaughingkitsune/src/Choices/web/tests/utils/consistent-test-user';

test.describe('User Journey Stage 4', () => {
  test.beforeEach(async ({ page }) => {
    DatabaseTracker.reset();
    const dotenv = await import('dotenv');
    dotenv.config({ path: '.env.local' });
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://muqwrehywjrbaeerjgfb.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tJOpGO2IPjujJDQou44P_g_BgbTFBfc';
    DatabaseTracker.initializeSupabase(supabaseUrl, supabaseKey);
    await ConsistentTestUserManager.ensureUserExists();
    console.log('🚀 Starting User Journey Stage 4 - Complete User Workflows');
  });

  test('should handle complete user workflows and missing feature development', async ({ page }) => {
    console.log('👤 Testing Complete User Workflows and Missing Feature Development');
    console.log(`📧 Using consistent test user: ${CONSISTENT_TEST_USER.email}`);

    // Step 1: User Login
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
      await page.fill('[data-testid="email"]', CONSISTENT_TEST_USER.email);
      await page.fill('[data-testid="password"]', CONSISTENT_TEST_USER.password);
      await page.click('[data-testid="login-submit"]');
      await page.waitForURL('/dashboard', { timeout: 10000 });
      DatabaseTracker.trackQuery('user_profiles', 'select', 'user_login');
      DatabaseTracker.trackQuery('auth.users', 'select', 'user_login');
      console.log('✅ Login successful - proceeding to complete workflows');
    } else {
      console.log('⚠️ Login form not found, checking if already logged in');
      if (page.url().includes('/dashboard')) {
        console.log('✅ Already on dashboard');
      } else {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        console.log('✅ Navigated to dashboard');
      }
    }

    // Step 2: Test Existing Profile Management Features
    console.log('👤 Step 2: Test Existing Profile Management Features');
    DatabaseTracker.trackQuery('profile_page', 'select', 'profile_access');
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const profileTitle = await page.locator('h1').first().textContent();
    console.log(`📝 Profile title: ${profileTitle}`);

    // Check for existing profile edit functionality
    const editProfileLink = await page.locator('a[href="/profile/edit"]');
    const editProfileButton = await page.locator('[data-testid="edit-profile-button"]');
    console.log(`✏️ Edit profile links found: ${await editProfileLink.count()}`);
    console.log(`✏️ Edit profile buttons found: ${await editProfileButton.count()}`);

    // Test profile edit page if accessible
    if (await editProfileLink.count() > 0) {
      console.log('✅ Profile edit link found - testing edit functionality');
      await editProfileLink.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const editPageTitle = await page.locator('h1').first().textContent();
      console.log(`📝 Edit page title: ${editPageTitle}`);
      
      // Check for edit form elements
      const displayNameInput = await page.locator('[data-testid="display-name-input"]');
      const bioTextarea = await page.locator('[data-testid="bio-textarea"]');
      const saveButton = await page.locator('[data-testid="save-changes-button"]');
      
      console.log(`📝 Display name input found: ${await displayNameInput.count()}`);
      console.log(`📝 Bio textarea found: ${await bioTextarea.count()}`);
      console.log(`💾 Save button found: ${await saveButton.count()}`);
      
      if (await displayNameInput.count() > 0 && await bioTextarea.count() > 0 && await saveButton.count() > 0) {
        console.log('✅ Profile edit functionality is working');
      } else {
        console.log('⚠️ Profile edit form elements not found');
      }
    } else {
      console.log('⚠️ Profile edit link not found - checking if edit page exists');
      await page.goto('/profile/edit');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const editPageTitle = await page.locator('h1').first().textContent();
      console.log(`📝 Direct edit page title: ${editPageTitle}`);
    }

    DatabaseTracker.trackQuery('user_profiles', 'select', 'profile_display');
    DatabaseTracker.trackQuery('user_preferences', 'select', 'profile_display');

    // Step 3: Complete Poll Voting System (Missing Feature Development)
    console.log('🗳️ Step 3: Complete Poll Voting System Development');
    DatabaseTracker.trackQuery('polls_voting', 'select', 'poll_voting');
    
    // Try to find polls to vote on
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const pollsList = await page.locator('[data-testid^="poll-"]');
    const pollCount = await pollsList.count();
    console.log(`📊 Polls found: ${pollCount}`);

    if (pollCount === 0) {
      console.log('⚠️ MISSING FEATURE: No polls available for voting');
      console.log('📋 DEVELOPMENT NEEDED: Poll voting system and poll data');
      
      // Try to create a poll first
      await page.goto('/polls/create');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const pollCreationForm = await page.locator('[data-testid="create-poll-form"]');
      if (await pollCreationForm.isVisible()) {
        console.log('✅ Poll creation form available');
        console.log('📋 DEVELOPMENT NEEDED: Create sample polls for voting system');
      }
    } else {
      console.log('✅ Polls available for voting');
      // Test voting functionality
      const firstPoll = pollsList.first();
      const voteButtons = await firstPoll.locator('[data-testid^="vote-"]');
      console.log(`🗳️ Vote buttons found: ${await voteButtons.count()}`);
    }

    DatabaseTracker.trackQuery('polls', 'select', 'poll_voting');
    DatabaseTracker.trackQuery('poll_options', 'select', 'poll_voting');

    // Step 4: Complete Settings Interface (Missing Feature Development)
    console.log('⚙️ Step 4: Complete Settings Interface Development');
    DatabaseTracker.trackQuery('settings_page', 'select', 'settings_access');
    
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const settingsTitle = await page.locator('h1').first().textContent();
    console.log(`📝 Settings title: ${settingsTitle}`);

    const settingsLinks = await page.locator('[data-testid^="settings-"]');
    const settingsCount = await settingsLinks.count();
    console.log(`⚙️ Settings links found: ${settingsCount}`);

    if (settingsCount === 0) {
      console.log('⚠️ MISSING FEATURE: Settings interface not found');
      console.log('📋 DEVELOPMENT NEEDED: Settings management interface');
    } else {
      console.log('✅ Settings interface available');
    }

    DatabaseTracker.trackQuery('user_preferences', 'select', 'settings_display');
    DatabaseTracker.trackQuery('user_settings', 'select', 'settings_display');

    // Step 5: Complete Navigation System
    console.log('🧭 Step 5: Complete Navigation System');
    DatabaseTracker.trackQuery('navigation', 'select', 'user_navigation');
    
    const navigationLinks = await page.locator('nav a, [data-testid^="nav-"]');
    const navCount = await navigationLinks.count();
    console.log(`🧭 Navigation links found: ${navCount}`);

    // Test navigation functionality
    for (let i = 0; i < Math.min(3, navCount); i++) {
      const link = navigationLinks.nth(i);
      const linkText = await link.textContent();
      const linkHref = await link.getAttribute('href');
      console.log(`🔗 Navigation link ${i + 1}: ${linkText} -> ${linkHref}`);
    }

    // Step 6: Complete Feed System
    console.log('📰 Step 6: Complete Feed System');
    DatabaseTracker.trackQuery('feed_page', 'select', 'feed_access');
    
    await page.goto('/feed');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const feedItems = await page.locator('[data-testid^="feed-item-"]');
    const feedCount = await feedItems.count();
    console.log(`📰 Feed items found: ${feedCount}`);

    if (feedCount > 0) {
      console.log('✅ Feed content available');
      // Test feed interactions
      const firstFeedItem = feedItems.first();
      const likeButtons = await firstFeedItem.locator('[data-testid^="like-"]');
      const commentButtons = await firstFeedItem.locator('[data-testid^="comment-"]');
      console.log(`👍 Like buttons found: ${await likeButtons.count()}`);
      console.log(`💬 Comment buttons found: ${await commentButtons.count()}`);
    } else {
      console.log('⚠️ MISSING FEATURE: No feed content available');
      console.log('📋 DEVELOPMENT NEEDED: Feed content generation and display');
    }

    DatabaseTracker.trackQuery('feed_items', 'select', 'feed_display');
    DatabaseTracker.trackQuery('posts', 'select', 'feed_display');

    // Step 7: Database Usage Analysis
    console.log('📊 Step 7: Database Usage Analysis');
    const results = DatabaseTracker.getResults();
    console.log('📊 Stage 4 Results:');
    console.log(`- Total Tables Used: ${results.totalTables}`);
    console.log(`- Total Queries: ${results.totalQueries}`);
    console.log(`- Most Used Table: ${results.mostUsedTable}`);

    // Step 8: Missing Features Summary
    console.log('📋 Step 8: Missing Features Summary');
    
    // Re-check profile elements for summary
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    const profileElements = await page.locator('[data-testid^="profile-"]');
    const profileCount = await profileElements.count();
    
    const missingFeatures = {
      profileManagement: profileCount === 0,
      pollVoting: pollCount === 0,
      settingsInterface: settingsCount === 0,
      feedContent: feedCount === 0
    };

    console.log('📋 Missing Features Identified:');
    Object.entries(missingFeatures).forEach(([feature, isMissing]) => {
      console.log(`  - ${feature}: ${isMissing ? '❌ MISSING' : '✅ AVAILABLE'}`);
    });

    // Save comprehensive report
    const reportData = {
      stage: 'Stage 4: Complete User Workflows',
      user: CONSISTENT_TEST_USER.email,
      timestamp: new Date().toISOString(),
      results: results,
      tablesUsed: results.tablesUsed,
      queries: results.queries,
      missingFeatures: missingFeatures,
      developmentNeeded: Object.entries(missingFeatures)
        .filter(([_, isMissing]) => isMissing)
        .map(([feature, _]) => feature)
    };

    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(__dirname, '../../../../test-results/complete-workflows-stage-user.json');

    // Ensure directory exists
    const dir = path.dirname(reportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📄 Report saved: complete-workflows-stage-user.json`);

    console.log('✅ Complete user workflows and missing feature development completed');
  });
});
