import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { seedTestPolls, seedTestVotes, cleanupTestData, getDatabaseStats } from '../helpers/seed-test-data';

/**
 * Database Seeding Integration Test
 * 
 * Tests the database seeding functionality and provides test data
 * for other integration tests.
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

describe('Database Seeding Integration', () => {
  let seededPollIds: string[] = [];

  beforeAll(async () => {
    console.log('🚀 Starting database seeding test...');
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up seeded test data...');
    await cleanupTestData();
  });

  it('should seed test polls successfully', async () => {
    console.log('🌱 Seeding test polls...');
    
    seededPollIds = await seedTestPolls();
    
    expect(seededPollIds).toBeDefined();
    expect(seededPollIds.length).toBeGreaterThan(0);
    expect(seededPollIds.length).toBe(6); // We expect 6 test polls
    
    console.log(`✅ Successfully seeded ${seededPollIds.length} test polls`);
  });

  it('should seed test votes successfully', async () => {
    console.log('🗳️ Seeding test votes...');
    
    await seedTestVotes(seededPollIds);
    
    console.log('✅ Successfully seeded test votes');
  });

  it('should verify database stats after seeding', async () => {
    console.log('📊 Checking database stats...');
    
    const stats = await getDatabaseStats();
    
    expect(stats.pollsCount).toBeGreaterThan(0);
    expect(stats.votesCount).toBeGreaterThan(0);
    expect(stats.activePolls).toBeGreaterThan(0);
    
    console.log('📈 Database Stats:', {
      polls: stats.pollsCount,
      votes: stats.votesCount,
      active: stats.activePolls,
      closed: stats.closedPolls
    });
  });

  it('should have polls with different types and statuses', async () => {
    console.log('🔍 Verifying poll variety...');
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: polls, error } = await supabase
      .from('polls')
      .select('title, poll_type, status')
      .in('id', seededPollIds);

    expect(error).toBeNull();
    expect(polls).toBeDefined();
    expect(polls?.length).toBe(6);

    // Check for different poll types
    const pollTypes = polls?.map(p => p.poll_type) || [];
    expect(pollTypes).toContain('single_choice');
    expect(pollTypes).toContain('multiple_choice');
    expect(pollTypes).toContain('ranked_choice');
    expect(pollTypes).toContain('approval_voting');

    // Check for different statuses
    const statuses = polls?.map(p => p.status) || [];
    expect(statuses).toContain('active');
    expect(statuses).toContain('draft');
    expect(statuses).toContain('closed');

    console.log('✅ Poll variety verified:', {
      types: [...new Set(pollTypes)],
      statuses: [...new Set(statuses)]
    });
  });
});
