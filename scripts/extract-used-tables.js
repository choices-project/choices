#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// List of tables actually used in the codebase
const USED_TABLES = [
  'user_profiles', 'polls', 'votes', 'webauthn_credentials', 'webauthn_challenges',
  'hashtags', 'analytics_events', 'feedback', 'civics_representatives',
  'system_health', 'privacy_logs', 'admin_activity_log', 'candidates', 'civic_database_entries',
  'comments', 'contributions', 'data_quality_checks', 'elections', 'feed_interactions',
  'feeds', 'hashtag_analytics', 'hashtag_content', 'hashtag_engagement', 'hashtag_moderation',
  'hashtag_trending_history', 'hashtag_trends', 'hashtag_usage', 'hashtag_user_preferences',
  'idempotency_keys', 'performance_metrics', 'poll_demographic_insights', 'poll_snapshots',
  'poll_votes', 'private_user_data', 'profiles', 'pwa_events', 'rate_limits',
  'trending_topics', 'user_consent', 'user_hashtags', 'user_interests',
  'user_notification_preferences', 'user_onboarding_progress', 'user_privacy_budgets',
  'users', 'voting_records', 'hashtag_flags'
];

const inputFile = path.join(__dirname, '../web/types/database-backup-20251019-071147.ts');
const outputFile = path.join(__dirname, '../web/types/database-minimal.ts');

console.log('Reading full database types...');
const fullContent = fs.readFileSync(inputFile, 'utf8');

// Extract the header (Json type and Database structure)
const headerMatch = fullContent.match(/(export type Json[\s\S]*?public: \{\s*Tables: \{)/);
if (!headerMatch) {
  console.error('Could not find database structure header');
  process.exit(1);
}

const header = headerMatch[1];

// Extract each table definition
const tableDefinitions = [];
for (const tableName of USED_TABLES) {
  const tableRegex = new RegExp(
    `(${tableName}: \\{[\\s\\S]*?\\n      \\})(?=\\n      [a-z_]+:|\\n    \\})`,
    'm'
  );
  const match = fullContent.match(tableRegex);
  if (match) {
    tableDefinitions.push(match[1]);
    console.log(`✓ Extracted ${tableName}`);
  } else {
    console.log(`✗ Could not find ${tableName} - will create placeholder`);
    // Create a minimal placeholder
    tableDefinitions.push(`${tableName}: {
        Row: { id: string }
        Insert: { id?: string }
        Update: { id?: string }
      }`);
  }
}

// Extract the footer (Views, Functions, Enums, CompositeTypes)
const footerMatch = fullContent.match(/(Views: \{[\s\S]*?\n  \}\n\})/);
if (!footerMatch) {
  console.error('Could not find database structure footer');
  process.exit(1);
}

const footer = footerMatch[1];

// Assemble the minimal types file
const minimalTypes = `${header}
      ${tableDefinitions.join('\n      ')}
    }
    ${footer}`;

fs.writeFileSync(outputFile, minimalTypes);
console.log(`\n✓ Created minimal database types with ${USED_TABLES.length} tables`);
console.log(`✓ Output: ${outputFile}`);

// Calculate size reduction
const originalSize = fs.statSync(inputFile).size;
const minimalSize = fs.statSync(outputFile).size;
const reduction = ((1 - minimalSize / originalSize) * 100).toFixed(1);

console.log(`\n📊 Size reduction: ${originalSize} bytes → ${minimalSize} bytes (${reduction}% smaller)`);

