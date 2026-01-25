#!/usr/bin/env node
/**
 * Verify migration files for syntax and best practices
 *
 * Run via: `npm run tools:verify:migrations`
 */
import 'dotenv/config';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const MIGRATIONS_DIR = join(process.cwd(), '../../supabase/migrations');

interface MigrationCheck {
  file: string;
  issues: string[];
  warnings: string[];
}

function checkMigration(file: string): MigrationCheck {
  const filePath = join(MIGRATIONS_DIR, file);
  const content = readFileSync(filePath, 'utf-8');
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check for BEGIN/COMMIT transaction blocks
  if (!content.includes('begin;') && !content.includes('BEGIN;')) {
    warnings.push('Missing transaction block (BEGIN/COMMIT)');
  }

  // Check for comments on indexes
  const indexMatches = content.match(/create\s+index[^;]+/gi);
  if (indexMatches) {
    indexMatches.forEach((match, idx) => {
      const nextComment = content.indexOf('comment on index', content.indexOf(match));
      if (nextComment === -1 || nextComment > content.indexOf(match) + 500) {
        warnings.push(`Index ${idx + 1} may be missing a comment`);
      }
    });
  }

  // Check for CONCURRENTLY on unique indexes (best practice)
  if (content.includes('create unique index') && !content.includes('concurrently')) {
    warnings.push('Unique index should use CONCURRENTLY to avoid locking');
  }

  // Check for partial index WHERE clauses (best practice for filtered queries)
  const fullIndexMatches = content.match(/create\s+index[^;]+on\s+\w+\([^)]+\)[^;]*;/gi);
  if (fullIndexMatches) {
    fullIndexMatches.forEach((match) => {
      if (!match.toLowerCase().includes('where') && match.includes('is_active')) {
        warnings.push('Consider using partial index (WHERE clause) for is_active/status filters');
      }
    });
  }

  // Check for foreign key indexes (critical best practice)
  const fkMatches = content.match(/foreign\s+key\s+\([^)]+\)/gi);
  if (fkMatches) {
    fkMatches.forEach((match) => {
      const columnMatch = match.match(/\(([^)]+)\)/);
      if (columnMatch) {
        const column = columnMatch[1];
        const indexPattern = new RegExp(`create\\s+index[^;]*on[^;]*\\([^)]*${column}[^)]*\\)`, 'i');
        if (!indexPattern.test(content)) {
          issues.push(`Missing index on foreign key column: ${column}`);
        }
      }
    });
  }

  // Check for proper error handling
  if (content.includes('alter table') && !content.includes('if not exists') && !content.includes('if exists')) {
    warnings.push('ALTER TABLE statements should use IF EXISTS/IF NOT EXISTS for idempotency');
  }

  return { file, issues, warnings };
}

async function main(): Promise<void> {
  console.log('🔍 Verifying migration files...\n');

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql') && f.startsWith('20260127'))
    .sort();

  if (files.length === 0) {
    console.log('⚠️  No migrations found matching pattern 20260127*.sql');
    return;
  }

  console.log(`Found ${files.length} migration file(s):\n`);

  let totalIssues = 0;
  let totalWarnings = 0;

  for (const file of files) {
    const check = checkMigration(file);
    totalIssues += check.issues.length;
    totalWarnings += check.warnings.length;

    if (check.issues.length === 0 && check.warnings.length === 0) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`\n📋 ${file}`);
      if (check.issues.length > 0) {
        console.log('  ❌ Issues:');
        check.issues.forEach((issue) => console.log(`    - ${issue}`));
      }
      if (check.warnings.length > 0) {
        console.log('  ⚠️  Warnings:');
        check.warnings.forEach((warning) => console.log(`    - ${warning}`));
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Total issues: ${totalIssues}`);
  console.log(`  Total warnings: ${totalWarnings}`);

  if (totalIssues > 0) {
    console.log('\n❌ Migration verification failed. Fix issues before applying.');
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log('\n⚠️  Migrations have warnings. Review before applying.');
    process.exit(0);
  } else {
    console.log('\n✅ All migrations pass verification!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Verification failed:', error);
  process.exit(1);
});
