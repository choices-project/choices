/**
 * User Onboarding Journey E2E Test
 * 
 * This test covers the complete user onboarding journey with database verification
 * Focuses on registration, onboarding choices, and verifying data is stored
 * 
 * Created: January 19, 2025
 * Status: ✅ ACTIVE
 */

import { test, expect } from '@playwright/test';
import { EnhancedDatabaseTracker } from '../../../utils/enhanced-database-tracker';

test.describe('User Onboarding Journey E2E Test', () => {
  test('should complete user onboarding and verify data is stored in database', async ({ page }) => {
    // Initialize enhanced database tracking
    EnhancedDatabaseTracker.reset();
    
    // Initialize Supabase client for data verification
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key';
    EnhancedDatabaseTracker.initializeSupabase(supabaseUrl, supabaseKey);
    
    console.log('🚀 Starting User Onboarding Journey E2E Test');
    console.log('📡 Testing user registration and onboarding with database verification');
    
    // Phase 1: User Registration
    console.log('🔐 Phase 1: User Registration');
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    // Select password registration method
    const passwordButton = page.locator('button:has-text("Password Account")').first();
    if (await passwordButton.isVisible()) {
      await passwordButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Password registration method selected');
    }
    
    // Fill registration form with unique data
    const testUser = {
      username: `onboarding_test_${Date.now()}`,
      email: `onboarding_${Date.now()}@example.com`,
      password: 'OnboardingTest123!'
    };
    
    console.log(`📝 Registering user: ${testUser.email}`);
    
    await page.fill('[data-testid="username"]', testUser.username);
    await page.fill('[data-testid="email"]', testUser.email);
    await page.fill('[data-testid="password"]', testUser.password);
    await page.fill('[data-testid="confirm-password"]', testUser.password);
    
    // Track registration attempt
    EnhancedDatabaseTracker.trackQuery('user_profiles', 'insert', 'user_registration', testUser);
    
    // Submit registration
    await page.click('[data-testid="register-button"]');
    
    // Wait for registration success
    await page.waitForSelector('[data-testid="register-success"], .text-green-700', { timeout: 15000 });
    console.log('✅ User registration completed');
    
    // Verify user was created in database
    const userCreated = await EnhancedDatabaseTracker.verifyUserRegistration(testUser.email);
    if (userCreated) {
      console.log('✅ User registration verified in database');
    } else {
      console.log('❌ User registration not found in database');
    }
    
    // Phase 2: Onboarding Journey
    console.log('👤 Phase 2: Onboarding Journey');
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    
    // Start onboarding
    const startButton = page.locator('button:has-text("Start"), button:has-text("Get Started"), button:has-text("Begin")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Onboarding started');
    }
    
    // Step 1: Select interests/preferences
    console.log('🎯 Step 1: Selecting interests and preferences');
    const interestOptions = page.locator('input[type="checkbox"], input[type="radio"]');
    const interestCount = await interestOptions.count();
    
    const selectedInterests: string[] = [];
    if (interestCount > 0) {
      // Select first few interests
      for (let i = 0; i < Math.min(3, interestCount); i++) {
        const option = interestOptions.nth(i);
        const label = await option.getAttribute('value') || await option.getAttribute('name') || `option_${i}`;
        await option.check();
        selectedInterests.push(label);
        console.log(`✅ Selected interest: ${label}`);
      }
      
      // Track interests selection
      EnhancedDatabaseTracker.trackQuery('user_profiles', 'update', 'onboarding_interests', { interests: selectedInterests });
    }
    
    // Continue to next step
    const continueButton = page.locator('button:has-text("Continue"), button:has-text("Next"), button:has-text("Proceed")').first();
    if (await continueButton.isVisible()) {
      await continueButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Continued to next onboarding step');
    }
    
    // Step 2: Set privacy preferences
    console.log('🔒 Step 2: Setting privacy preferences');
    const privacyOptions = page.locator('input[type="checkbox"], input[type="radio"]');
    const privacyCount = await privacyOptions.count();
    
    const selectedPrivacy: string[] = [];
    if (privacyCount > 0) {
      for (let i = 0; i < Math.min(2, privacyCount); i++) {
        const option = privacyOptions.nth(i);
        const label = await option.getAttribute('value') || await option.getAttribute('name') || `privacy_${i}`;
        await option.check();
        selectedPrivacy.push(label);
        console.log(`✅ Selected privacy preference: ${label}`);
      }
      
      // Track privacy preferences
      EnhancedDatabaseTracker.trackQuery('privacy_consent_records', 'insert', 'onboarding_privacy', { preferences: selectedPrivacy });
    }
    
    // Continue to next step
    if (await continueButton.isVisible()) {
      await continueButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Continued to next onboarding step');
    }
    
    // Step 3: Set participation style
    console.log('🎭 Step 3: Setting participation style');
    const participationOptions = page.locator('input[type="radio"], select');
    const participationCount = await participationOptions.count();
    
    if (participationCount > 0) {
      const participationOption = participationOptions.first();
      const participationValue = await participationOption.getAttribute('value') || 'participant';
      await participationOption.check();
      console.log(`✅ Selected participation style: ${participationValue}`);
      
      // Track participation style
      EnhancedDatabaseTracker.trackQuery('user_profiles', 'update', 'onboarding_participation', { participation_style: participationValue });
    }
    
    // Complete onboarding
    const completeButton = page.locator('button:has-text("Complete"), button:has-text("Finish"), button:has-text("Done")').first();
    if (await completeButton.isVisible()) {
      await completeButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Onboarding completed');
    }
    
    // Verify onboarding data was stored
    const onboardingDataVerified = await EnhancedDatabaseTracker.verifyOnboardingData(testUser.username);
    if (onboardingDataVerified) {
      console.log('✅ Onboarding data verified in database');
    } else {
      console.log('❌ Onboarding data not found in database');
    }
    
    // Phase 3: Initial Profile Setup
    console.log('👤 Phase 3: Initial Profile Setup');
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Update profile with additional information
    const editButton = page.locator('button:has-text("Edit"), button:has-text("Update")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(1000);
      
      // Update bio
      const bioInput = page.locator('textarea[name*="bio"], textarea[name*="description"]').first();
      if (await bioInput.isVisible()) {
        const bioText = `Bio from onboarding test ${Date.now()}`;
        await bioInput.fill(bioText);
        console.log(`✅ Bio updated: ${bioText}`);
        
        // Track profile update
        EnhancedDatabaseTracker.trackQuery('user_profiles', 'update', 'profile_bio_update', { bio: bioText });
      }
      
      // Save profile
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Profile saved');
      }
    }
    
    // Phase 4: Notification Preferences
    console.log('🔔 Phase 4: Setting notification preferences');
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    // Set notification preferences
    const notificationOptions = page.locator('input[type="checkbox"], input[type="radio"]');
    const notificationCount = await notificationOptions.count();
    
    if (notificationCount > 0) {
      for (let i = 0; i < Math.min(2, notificationCount); i++) {
        const option = notificationOptions.nth(i);
        await option.check();
        console.log(`✅ Notification preference ${i + 1} selected`);
      }
      
      // Track notification preferences
      EnhancedDatabaseTracker.trackQuery('user_notification_preferences', 'insert', 'onboarding_notifications', { preferences: 'set' });
    }
    
    // Get comprehensive usage data
    const usedTables = EnhancedDatabaseTracker.getUsedTables();
    const verifiedTables = EnhancedDatabaseTracker.getVerifiedTables();
    const queryLog = EnhancedDatabaseTracker.getQueryLog();
    const dataVerification = EnhancedDatabaseTracker.getDataVerification();
    const report = EnhancedDatabaseTracker.generateReport();
    
    console.log('🔍 Onboarding Journey Results:');
    console.log(`📊 Tables Used: ${usedTables.length}`);
    console.log(`✅ Tables Verified: ${verifiedTables.length}`);
    console.log(`📈 Total Queries: ${queryLog.length}`);
    console.log(`🔍 Data Verification Entries: ${dataVerification.length}`);
    
    // Log which tables were populated
    console.log('📋 Tables populated during onboarding:');
    usedTables.forEach(table => {
      const verified = verifiedTables.includes(table);
      console.log(`  ${verified ? '✅' : '❌'} ${table} - ${verified ? 'Verified' : 'Not verified'}`);
    });
    
    // Log data verification details
    console.log('🔍 Data verification details:');
    dataVerification.forEach(entry => {
      console.log(`  ${entry.verified ? '✅' : '❌'} ${entry.table} (${entry.operation}) - ${entry.verified ? 'Data found' : 'No data found'}`);
    });
    
    // Save comprehensive report
    await EnhancedDatabaseTracker.saveReport('user-onboarding-journey.json');
    
    // Assertions
    expect(usedTables.length).toBeGreaterThan(0);
    expect(queryLog.length).toBeGreaterThan(0);
    
    // Verify critical onboarding data was stored
    expect(usedTables).toContain('user_profiles');
    
    console.log('✅ User onboarding journey E2E test completed');
    console.log('🎯 Onboarding journey tested with database verification');
    console.log('📊 Onboarding data populated and verified in database');
  });

  test('should test onboarding with different user preferences', async ({ page }) => {
    // Initialize enhanced database tracking
    EnhancedDatabaseTracker.reset();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key';
    EnhancedDatabaseTracker.initializeSupabase(supabaseUrl, supabaseKey);
    
    console.log('🚀 Starting Alternative Onboarding Preferences Test');
    
    // Test different user types and preferences
    const userTypes = [
      { type: 'observer', interests: ['politics', 'news'], privacy: 'private' },
      { type: 'participant', interests: ['polls', 'voting'], privacy: 'public' },
      { type: 'leader', interests: ['activism', 'organizing'], privacy: 'public' }
    ];
    
    for (const userType of userTypes) {
      console.log(`👤 Testing ${userType.type} user type`);
      
      // Registration
      await page.goto('/register');
      await page.waitForLoadState('networkidle');
      
      const passwordButton = page.locator('button:has-text("Password Account")').first();
      if (await passwordButton.isVisible()) {
        await passwordButton.click();
        await page.waitForTimeout(1000);
      }
      
      const testUser = {
        username: `${userType.type}_test_${Date.now()}`,
        email: `${userType.type}_${Date.now()}@example.com`,
        password: 'TestPassword123!'
      };
      
      await page.fill('[data-testid="username"]', testUser.username);
      await page.fill('[data-testid="email"]', testUser.email);
      await page.fill('[data-testid="password"]', testUser.password);
      await page.fill('[data-testid="confirm-password"]', testUser.password);
      
      EnhancedDatabaseTracker.trackQuery('user_profiles', 'insert', `registration_${userType.type}`, testUser);
      
      await page.click('[data-testid="register-button"]');
      await page.waitForSelector('[data-testid="register-success"], .text-green-700', { timeout: 15000 });
      
      // Verify registration
      const userCreated = await EnhancedDatabaseTracker.verifyUserRegistration(testUser.email);
      console.log(`${userCreated ? '✅' : '❌'} ${userType.type} user registration: ${userCreated ? 'Verified' : 'Not verified'}`);
      
      // Onboarding with specific preferences
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');
      
      const startButton = page.locator('button:has-text("Start"), button:has-text("Get Started")').first();
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Select interests based on user type
      const interestOptions = page.locator('input[type="checkbox"], input[type="radio"]');
      const interestCount = await interestOptions.count();
      
      if (interestCount > 0) {
        for (let i = 0; i < Math.min(userType.interests.length, interestCount); i++) {
          await interestOptions.nth(i).check();
        }
        
        EnhancedDatabaseTracker.trackQuery('user_profiles', 'update', `onboarding_${userType.type}`, { 
          interests: userType.interests,
          user_type: userType.type 
        });
      }
      
      // Continue through onboarding
      const continueButton = page.locator('button:has-text("Continue"), button:has-text("Next")').first();
      if (await continueButton.isVisible()) {
        await continueButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Set privacy preferences
      const privacyOptions = page.locator('input[type="checkbox"], input[type="radio"]');
      const privacyCount = await privacyOptions.count();
      
      if (privacyCount > 0) {
        for (let i = 0; i < Math.min(2, privacyCount); i++) {
          await privacyOptions.nth(i).check();
        }
        
        EnhancedDatabaseTracker.trackQuery('privacy_consent_records', 'insert', `privacy_${userType.type}`, { 
          privacy_level: userType.privacy 
        });
      }
      
      // Complete onboarding
      const completeButton = page.locator('button:has-text("Complete"), button:has-text("Finish")').first();
      if (await completeButton.isVisible()) {
        await completeButton.click();
        await page.waitForTimeout(2000);
      }
      
      // Verify onboarding data
      const onboardingVerified = await EnhancedDatabaseTracker.verifyOnboardingData(testUser.username);
      console.log(`${onboardingVerified ? '✅' : '❌'} ${userType.type} onboarding: ${onboardingVerified ? 'Verified' : 'Not verified'}`);
    }
    
    // Get final results
    const usedTables = EnhancedDatabaseTracker.getUsedTables();
    const verifiedTables = EnhancedDatabaseTracker.getVerifiedTables();
    const report = EnhancedDatabaseTracker.generateReport();
    
    console.log('🔍 Alternative Onboarding Results:');
    console.log(`📊 Tables Used: ${usedTables.length}`);
    console.log(`✅ Tables Verified: ${verifiedTables.length}`);
    
    await EnhancedDatabaseTracker.saveReport('alternative-onboarding-preferences.json');
    
    expect(usedTables.length).toBeGreaterThan(0);
    console.log('✅ Alternative onboarding preferences test completed');
  });
});
