#!/usr/bin/env tsx
/**
 * Script to check recent feedback submissions in Supabase
 * Usage: npx tsx scripts/check-feedback.ts [--limit=10] [--hours=24]
 */

import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { config } from 'dotenv';

import { createClient } from '@supabase/supabase-js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

// Use service role key with admin privileges (bypasses RLS)
// The service role key should have full access to all tables
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkRecentFeedback(limit = 10, hours = 24) {
  // eslint-disable-next-line no-console
  console.log(`\n🔍 Checking for feedback submissions from the last ${hours} hours...\n`);

  const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .gte('created_at', hoursAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('❌ Error fetching feedback:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    // eslint-disable-next-line no-console
    console.log('📭 No feedback submissions found in the last', hours, 'hours.\n');
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`✅ Found ${data.length} feedback submission(s):\n`);
  // eslint-disable-next-line no-console
  console.log('═'.repeat(80));

  data.forEach((feedback, index) => {
    const createdAt = new Date(feedback.created_at).toLocaleString();
    const userInfo = feedback.user_id ? `User ID: ${feedback.user_id}` : 'Anonymous';
    
    // eslint-disable-next-line no-console
    console.log(`\n📝 Feedback #${index + 1}`);
    // eslint-disable-next-line no-console
    console.log('─'.repeat(80));
    // eslint-disable-next-line no-console
    console.log(`ID:           ${feedback.id}`);
    // eslint-disable-next-line no-console
    console.log(`Type:         ${feedback.feedback_type || feedback.type || 'N/A'}`);
    // eslint-disable-next-line no-console
    console.log(`Title:        ${feedback.title || 'N/A'}`);
    // eslint-disable-next-line no-console
    console.log(`Sentiment:    ${feedback.sentiment || 'N/A'}`);
    // eslint-disable-next-line no-console
    console.log(`Status:       ${feedback.status || 'N/A'}`);
    // eslint-disable-next-line no-console
    console.log(`Priority:     ${feedback.priority || 'N/A'}`);
    // eslint-disable-next-line no-console
    console.log(`User:         ${userInfo}`);
    // eslint-disable-next-line no-console
    console.log(`Created:      ${createdAt}`);
    
    if (feedback.description) {
      const desc = feedback.description.length > 200 
        ? feedback.description.substring(0, 200) + '...' 
        : feedback.description;
      // eslint-disable-next-line no-console
      console.log(`Description:  ${desc}`);
    }
    
    if (feedback.tags && Array.isArray(feedback.tags) && feedback.tags.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`Tags:         ${feedback.tags.join(', ')}`);
    }
    
    if (feedback.user_journey) {
      const journey = typeof feedback.user_journey === 'string' 
        ? JSON.parse(feedback.user_journey) 
        : feedback.user_journey;
      if (journey?.currentPage) {
        // eslint-disable-next-line no-console
        console.log(`Page:         ${journey.currentPage}`);
      }
      if (journey?.deviceInfo?.deviceType) {
        // eslint-disable-next-line no-console
        console.log(`Device:       ${journey.deviceInfo.deviceType}`);
      }
    }
    
    if (feedback.metadata) {
      const metadata = typeof feedback.metadata === 'string' 
        ? JSON.parse(feedback.metadata) 
        : feedback.metadata;
      if (metadata?.security?.ipAddress) {
        // eslint-disable-next-line no-console
        console.log(`IP Address:   ${metadata.security.ipAddress}`);
      }
    }
  });

  // eslint-disable-next-line no-console
  console.log('\n' + '═'.repeat(80));
  // eslint-disable-next-line no-console
  console.log(`\n✅ Total: ${data.length} feedback submission(s)\n`);
}

// Parse command line arguments
const args = process.argv.slice(2);
let limit = 10;
let hours = 24;

args.forEach(arg => {
  if (arg.startsWith('--limit=')) {
    limit = parseInt(arg.split('=')[1], 10) || 10;
  } else if (arg.startsWith('--hours=')) {
    hours = parseInt(arg.split('=')[1], 10) || 24;
  }
});

checkRecentFeedback(limit, hours).catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

