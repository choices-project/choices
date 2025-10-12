/**
 * Test Setup Helpers
 * 
 * Centralized test setup utilities for:
 * - Mock data generation
 * - Test environment configuration
 * - Common test utilities
 * - Database test helpers
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Test configuration
export const TEST_CONFIG = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key',
  TEST_USER_EMAIL: 'test@example.com',
  TEST_USER_PASSWORD: 'password123',
  TEST_ADMIN_EMAIL: 'admin@example.com',
  TEST_ADMIN_PASSWORD: 'admin123',
};

// Mock data generators
export class MockDataGenerator {
  static generateUser(overrides: Partial<any> = {}) {
    return {
      id: 'user-' + Math.random().toString(36).substr(2, 9),
      email: 'test@example.com',
      username: 'testuser',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      onboarding_completed: true,
      is_active: true,
      ...overrides,
    };
  }

  static generatePoll(overrides: Partial<any> = {}) {
    return {
      id: 'poll-' + Math.random().toString(36).substr(2, 9),
      title: 'Test Poll',
      description: 'Test poll description',
      status: 'active',
      voting_method: 'single',
      category: 'general',
      privacy_level: 'public',
      created_by: 'user-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_votes: 0,
      ...overrides,
    };
  }

  static generatePollOption(overrides: Partial<any> = {}) {
    return {
      id: 'option-' + Math.random().toString(36).substr(2, 9),
      poll_id: 'poll-123',
      text: 'Test Option',
      votes: 0,
      created_at: new Date().toISOString(),
      ...overrides,
    };
  }

  static generateVote(overrides: Partial<any> = {}) {
    return {
      id: 'vote-' + Math.random().toString(36).substr(2, 9),
      poll_id: 'poll-123',
      user_id: 'user-123',
      option_id: 'option-123',
      created_at: new Date().toISOString(),
      ...overrides,
    };
  }

  static generateHashtag(overrides: Partial<any> = {}) {
    return {
      id: 'hashtag-' + Math.random().toString(36).substr(2, 9),
      name: 'testhashtag',
      description: 'Test hashtag description',
      usage_count: 0,
      created_at: new Date().toISOString(),
      ...overrides,
    };
  }

  static generateRepresentative(overrides: Partial<any> = {}) {
    return {
      id: 'rep-' + Math.random().toString(36).substr(2, 9),
      name: 'Test Representative',
      party: 'Democrat',
      office: 'U.S. Senator',
      level: 'federal',
      state: 'CA',
      district: 'CA-12',
      created_at: new Date().toISOString(),
      ...overrides,
    };
  }

  static generateAnalyticsEvent(overrides: Partial<any> = {}) {
    return {
      id: 'event-' + Math.random().toString(36).substr(2, 9),
      user_id: 'user-123',
      event_type: 'page_view',
      event_data: {},
      created_at: new Date().toISOString(),
      ...overrides,
    };
  }
}

// Test database helpers
export class TestDatabaseHelper {
  private supabase: any;

  constructor() {
    this.supabase = createClient<Database>(
      TEST_CONFIG.SUPABASE_URL,
      TEST_CONFIG.SUPABASE_ANON_KEY
    );
  }

  async cleanupTestData() {
    // Clean up test data in reverse dependency order
    await this.supabase.from('votes').delete().neq('id', '');
    await this.supabase.from('poll_options').delete().neq('id', '');
    await this.supabase.from('polls').delete().neq('id', '');
    await this.supabase.from('user_profiles').delete().neq('id', '');
    await this.supabase.from('hashtags').delete().neq('id', '');
    await this.supabase.from('representatives').delete().neq('id', '');
    await this.supabase.from('analytics_events').delete().neq('id', '');
  }

  async createTestUser(userData: any = {}) {
    const user = MockDataGenerator.generateUser(userData);
    const { data, error } = await this.supabase
      .from('user_profiles')
      .insert(user)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createTestPoll(pollData: any = {}) {
    const poll = MockDataGenerator.generatePoll(pollData);
    const { data, error } = await this.supabase
      .from('polls')
      .insert(poll)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createTestPollOptions(pollId: string, options: string[]) {
    const pollOptions = options.map(text => 
      MockDataGenerator.generatePollOption({ poll_id: pollId, text })
    );
    
    const { data, error } = await this.supabase
      .from('poll_options')
      .insert(pollOptions)
      .select();

    if (error) throw error;
    return data;
  }

  async createTestVote(voteData: any = {}) {
    const vote = MockDataGenerator.generateVote(voteData);
    const { data, error } = await this.supabase
      .from('votes')
      .insert(vote)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createTestHashtag(hashtagData: any = {}) {
    const hashtag = MockDataGenerator.generateHashtag(hashtagData);
    const { data, error } = await this.supabase
      .from('hashtags')
      .insert(hashtag)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createTestRepresentative(repData: any = {}) {
    const representative = MockDataGenerator.generateRepresentative(repData);
    const { data, error } = await this.supabase
      .from('representatives')
      .insert(representative)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createTestAnalyticsEvent(eventData: any = {}) {
    const event = MockDataGenerator.generateAnalyticsEvent(eventData);
    const { data, error } = await this.supabase
      .from('analytics_events')
      .insert(event)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// Test environment helpers
export class TestEnvironmentHelper {
  static setupTestEnvironment() {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.NEXT_PUBLIC_SUPABASE_URL = TEST_CONFIG.SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = TEST_CONFIG.SUPABASE_ANON_KEY;
    
    // Mock console methods to reduce noise in tests
    const originalConsole = console;
    global.console = {
      ...originalConsole,
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
  }

  static restoreTestEnvironment() {
    // Restore original console
    global.console = console;
  }

  static mockFetch() {
    global.fetch = jest.fn();
  }

  static mockLocalStorage() {
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });
    return localStorageMock;
  }

  static mockSessionStorage() {
    const sessionStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
    });
    return sessionStorageMock;
  }
}

// Test assertion helpers
export class TestAssertionHelper {
  static expectValidUser(user: any) {
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('username');
    expect(user).toHaveProperty('created_at');
    expect(user).toHaveProperty('updated_at');
    expect(user).toHaveProperty('onboarding_completed');
    expect(user).toHaveProperty('is_active');
  }

  static expectValidPoll(poll: any) {
    expect(poll).toHaveProperty('id');
    expect(poll).toHaveProperty('title');
    expect(poll).toHaveProperty('status');
    expect(poll).toHaveProperty('voting_method');
    expect(poll).toHaveProperty('category');
    expect(poll).toHaveProperty('privacy_level');
    expect(poll).toHaveProperty('created_by');
    expect(poll).toHaveProperty('created_at');
    expect(poll).toHaveProperty('updated_at');
  }

  static expectValidPollOption(option: any) {
    expect(option).toHaveProperty('id');
    expect(option).toHaveProperty('poll_id');
    expect(option).toHaveProperty('text');
    expect(option).toHaveProperty('votes');
    expect(option).toHaveProperty('created_at');
  }

  static expectValidVote(vote: any) {
    expect(vote).toHaveProperty('id');
    expect(vote).toHaveProperty('poll_id');
    expect(vote).toHaveProperty('user_id');
    expect(vote).toHaveProperty('option_id');
    expect(vote).toHaveProperty('created_at');
  }

  static expectValidHashtag(hashtag: any) {
    expect(hashtag).toHaveProperty('id');
    expect(hashtag).toHaveProperty('name');
    expect(hashtag).toHaveProperty('description');
    expect(hashtag).toHaveProperty('usage_count');
    expect(hashtag).toHaveProperty('created_at');
  }

  static expectValidRepresentative(representative: any) {
    expect(representative).toHaveProperty('id');
    expect(representative).toHaveProperty('name');
    expect(representative).toHaveProperty('party');
    expect(representative).toHaveProperty('office');
    expect(representative).toHaveProperty('level');
    expect(representative).toHaveProperty('state');
    expect(representative).toHaveProperty('district');
    expect(representative).toHaveProperty('created_at');
  }

  static expectValidAnalyticsEvent(event: any) {
    expect(event).toHaveProperty('id');
    expect(event).toHaveProperty('user_id');
    expect(event).toHaveProperty('event_type');
    expect(event).toHaveProperty('event_data');
    expect(event).toHaveProperty('created_at');
  }
}

// Test performance helpers
export class TestPerformanceHelper {
  static measureExecutionTime(fn: () => any): Promise<{ result: any; duration: number }> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const result = fn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      resolve({ result, duration });
    });
  }

  static async measureAsyncExecutionTime(fn: () => Promise<any>): Promise<{ result: any; duration: number }> {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    return { result, duration };
  }

  static expectExecutionTime(duration: number, maxDuration: number) {
    expect(duration).toBeLessThan(maxDuration);
  }
}

// Test error helpers
export class TestErrorHelper {
  static expectApiError(response: any, status: number, message: string) {
    expect(response.status).toBe(status);
    expect(response.error).toBe(message);
  }

  static expectValidationError(response: any, field: string) {
    expect(response.status).toBe(400);
    expect(response.error).toContain(field);
  }

  static expectAuthenticationError(response: any) {
    expect(response.status).toBe(401);
    expect(response.error).toContain('Authentication');
  }

  static expectAuthorizationError(response: any) {
    expect(response.status).toBe(403);
    expect(response.error).toContain('Authorization');
  }

  static expectServerError(response: any) {
    expect(response.status).toBe(500);
    expect(response.error).toContain('Server');
  }
}

// Export all helpers
export {
  TEST_CONFIG,
  MockDataGenerator,
  TestDatabaseHelper,
  TestEnvironmentHelper,
  TestAssertionHelper,
  TestPerformanceHelper,
  TestErrorHelper,
};
