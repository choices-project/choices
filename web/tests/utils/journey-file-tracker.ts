/**
 * Journey File Tracker
 * 
 * Automatically tracks all files touched by user/admin journeys
 * and runs strict TypeScript/linting cleanup on them.
 * 
 * Created: January 27, 2025
 * Updated: January 27, 2025
 * Purpose: Automated file tracking and cleanup for journey expansion
 * 
 * Current Status: Stage 1 COMPLETE - Registration/Login working perfectly, ready for Stage 2
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { DatabaseTracker } from './database-tracker';

export class JourneyFileTracker {
  private static trackedFiles = new Set<string>();
  private static journeyFiles = new Set<string>();
  private static lastCleanupTime = 0;
  private static databaseReport: any = null;

  /**
   * Initialize with core journey files
   */
  static initialize() {
    // Core journey test files
    this.journeyFiles.add('tests/playwright/e2e/core/user-journey-stage.spec.ts');
    this.journeyFiles.add('tests/playwright/e2e/core/admin-journey-stage.spec.ts');
    this.journeyFiles.add('tests/utils/database-tracker.ts');
    this.journeyFiles.add('tests/utils/consistent-test-user.ts');
    this.journeyFiles.add('tests/utils/admin-user-setup.ts');
    this.journeyFiles.add('tests/registry/testIds.ts');
    
    // Core E2E test files that journeys interact with
    this.trackedFiles.add('tests/playwright/e2e/core/admin-journey-complete.spec.ts');
    this.trackedFiles.add('tests/playwright/e2e/core/complete-platform-journey.spec.ts');
    this.trackedFiles.add('tests/playwright/e2e/core/user-journey-complete.spec.ts');
    this.trackedFiles.add('tests/playwright/e2e/core/real-database-activity-test.spec.ts');
    this.trackedFiles.add('tests/playwright/e2e/core/authentication.spec.ts');
    this.trackedFiles.add('tests/playwright/e2e/core/core-issues-test.spec.ts');
    this.trackedFiles.add('tests/utils/database-tracker.ts');
    this.trackedFiles.add('tests/utils/real-test-user-manager.ts');
    
    // Application files touched by user journeys
    this.trackedFiles.add('app/(app)/dashboard/page.tsx');
    this.trackedFiles.add('app/(app)/profile/page.tsx');
    this.trackedFiles.add('app/(app)/profile/edit/page.tsx');
    this.trackedFiles.add('app/(app)/profile/preferences/page.tsx');
    this.trackedFiles.add('app/(app)/polls/page.tsx');
    this.trackedFiles.add('app/(app)/polls/create/page.tsx');
    this.trackedFiles.add('app/(app)/polls/[id]/page.tsx');
    this.trackedFiles.add('app/(app)/feed/page.tsx');
    this.trackedFiles.add('app/auth/page.tsx');
    this.trackedFiles.add('app/auth/verify/route.ts');
    
    // API routes touched by user journeys
    this.trackedFiles.add('app/api/profile/route.ts');
    this.trackedFiles.add('app/api/polls/route.ts');
    this.trackedFiles.add('app/api/feeds/route.ts');
    this.trackedFiles.add('app/api/hashtags/route.ts');
    
    console.log('🎯 Journey File Tracker initialized');
    console.log(`📁 Journey files: ${this.journeyFiles.size}`);
    console.log(`📁 Tracked files: ${this.trackedFiles.size}`);
  }

  /**
   * Add files touched by journey expansion
   */
  static addTouchedFiles(files: string[]) {
    let added = 0;
    files.forEach(file => {
      if (!this.trackedFiles.has(file)) {
        this.trackedFiles.add(file);
        added++;
      }
    });
    
    if (added > 0) {
      console.log(`📁 Added ${added} new files to tracking`);
      this.saveTrackingState();
    }
  }

  /**
   * Get all tracked files
   */
  static getTrackedFiles(): string[] {
    return Array.from(this.trackedFiles);
  }

  /**
   * Get journey files
   */
  static getJourneyFiles(): string[] {
    return Array.from(this.journeyFiles);
  }

  /**
   * Run strict cleanup on all tracked files
   */
  static async runStrictCleanup(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastCleanupTime < 5000) {
      console.log('⏳ Skipping cleanup (too recent)');
      return true;
    }

    console.log('🧹 Running strict cleanup on tracked files...');
    this.lastCleanupTime = now;

    try {
      // TypeScript checking for tracked files only
      const tsFiles = this.getTrackedFiles().filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
      if (tsFiles.length > 0) {
        console.log(`🔍 TypeScript checking ${tsFiles.length} files...`);
        // Use project's TypeScript configuration for proper path resolution
        const tsCommand = `npx tsc --noEmit --project tsconfig.json --skipLibCheck`;
        execSync(tsCommand, { stdio: 'inherit' });
        console.log('✅ TypeScript check passed');
      }

      // ESLint strict checking using project config
      const lintFiles = this.getTrackedFiles();
      if (lintFiles.length > 0) {
        console.log(`🔍 ESLint checking ${lintFiles.length} files...`);
        // Use project's ESLint config for proper React/JSX support
        const lintCommand = `npx eslint ${lintFiles.map(f => `"${f}"`).join(' ')} --max-warnings=0`;
        execSync(lintCommand, { stdio: 'inherit' });
        console.log('✅ ESLint check passed');
      }

      console.log('✅ Strict cleanup completed successfully');
      return true;
    } catch (error) {
      console.log('❌ Strict cleanup failed - errors found');
      console.log('🔧 Fix errors in tracked files before continuing');
      return false;
    }
  }

  /**
   * Run journey tests and track new files
   */
  static async runJourneyTests(): Promise<boolean> {
    console.log('🧪 Running journey tests...');
    
    try {
      // Initialize database tracking
      DatabaseTracker.reset();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://muqwrehywjrbaeerjgfb.supabase.co';
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tJOpGO2IPjujJDQou44P_g_BgbTFBfc';
      DatabaseTracker.initializeSupabase(supabaseUrl, supabaseKey);
      
      // Run user journey test FIRST (primary journey with consistent user)
      console.log('👤 Running user journey test (PRIMARY - CONSISTENT USER)...');
      execSync('npm run test:user-journey-complete', { stdio: 'inherit' });
      
      // Run admin verification test SECOND (verifies consistent user's actions + admin features)
      console.log('👨‍💼 Running admin verification test (VERIFIES CONSISTENT USER + ADMIN FEATURES)...');
      execSync('npm run test:admin-journey-complete', { stdio: 'inherit' });
      
      // Generate database report
      this.databaseReport = DatabaseTracker.generateReport();
      console.log('📊 Database tracking completed');
      console.log(`📈 Tables used: ${this.databaseReport.tablesUsed.size}`);
      console.log(`📈 Total queries: ${this.databaseReport.queries.length}`);
      
      // Save database report
      await DatabaseTracker.saveReport('test-results/reports/journey-expansion-database-report.json');
      
      // Also try to load any existing stage reports
      await this.loadExistingReports();
      
      console.log('✅ Journey tests completed');
      return true;
    } catch (error) {
      console.log('❌ Journey tests failed');
      return false;
    }
  }

  /**
   * Expand journey and run cleanup
   */
  static async expandJourney(newFiles: string[]): Promise<boolean> {
    console.log('🚀 Expanding journey with new files...');
    
    // Add new files to tracking
    this.addTouchedFiles(newFiles);
    
    // Run strict cleanup on all tracked files
    const cleanupSuccess = await this.runStrictCleanup();
    
    if (!cleanupSuccess) {
      console.log('❌ Journey expansion failed - fix errors first');
      return false;
    }
    
    console.log('✅ Journey expansion completed successfully');
    return true;
  }

  /**
   * Save tracking state to file
   */
  static saveTrackingState() {
    const state = {
      trackedFiles: Array.from(this.trackedFiles),
      journeyFiles: Array.from(this.journeyFiles),
      lastCleanup: this.lastCleanupTime
    };
    
    writeFileSync('journey-tracking-state.json', JSON.stringify(state, null, 2));
  }

  /**
   * Load tracking state from file
   */
  static loadTrackingState() {
    if (existsSync('journey-tracking-state.json')) {
      const state = JSON.parse(readFileSync('journey-tracking-state.json', 'utf8'));
      this.trackedFiles = new Set(state.trackedFiles || []);
      this.journeyFiles = new Set(state.journeyFiles || []);
      this.lastCleanupTime = state.lastCleanup || 0;
      console.log('📁 Loaded tracking state from file');
    }
  }

  /**
   * Generate cleanup command for tracked files
   */
  static generateCleanupCommand(): string {
    const files = this.getTrackedFiles();
    return `npm run cleanup:journey-strict -- ${files.join(' ')}`;
  }

  /**
   * Get status report
   */
  static getStatusReport(): string {
    const databaseInfo = this.databaseReport ? `
📊 Database Tracking:
  - Tables Used: ${this.databaseReport.summary.totalTables}
  - Total Queries: ${this.databaseReport.summary.totalQueries}
  - Most Used Table: ${this.databaseReport.summary.mostUsedTable}
` : '📊 Database Tracking: No data yet';

    return `
🎯 Journey File Tracker Status
📁 Journey Files: ${this.journeyFiles.size}
📁 Tracked Files: ${this.trackedFiles.size}
🕒 Last Cleanup: ${new Date(this.lastCleanupTime).toISOString()}

${databaseInfo}

📋 Tracked Files:
${Array.from(this.trackedFiles).map(f => `  - ${f}`).join('\n')}
    `.trim();
  }

  /**
   * Get database report
   */
  static getDatabaseReport(): any {
    return this.databaseReport;
  }

  /**
   * Load existing database reports from test runs
   */
  static async loadExistingReports(): Promise<void> {
    try {
      // Look for stage reports in the current directory
      const fs = await import('fs');
      const path = await import('path');
      
      const reportFiles = [
        'registration-login-stage-user.json',
        'registration-login-stage-admin.json',
        'admin-journey-stage-login.json',
        'admin-journey-stage-access.json'
      ];
      
      let totalTables = 0;
      let totalQueries = 0;
      const allDetails: any[] = [];
      
      for (const reportFile of reportFiles) {
        const reportPath = path.join(process.cwd(), reportFile);
        if (fs.existsSync(reportPath)) {
          try {
            const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
            if (reportData.summary) {
              totalTables += reportData.summary.totalTables || 0;
              totalQueries += reportData.summary.totalQueries || 0;
            }
            if (reportData.details && Array.isArray(reportData.details)) {
              allDetails.push(...reportData.details);
            }
          } catch (error) {
            console.log(`⚠️ Could not parse report ${reportFile}: ${error}`);
          }
        }
      }
      
      if (totalTables > 0 || totalQueries > 0) {
        this.databaseReport = {
          summary: {
            totalTables,
            totalQueries,
            mostUsedTable: allDetails.length > 0 ? allDetails[0].tableName : 'unknown'
          },
          details: allDetails
        };
        console.log(`📊 Loaded existing reports: ${totalTables} tables, ${totalQueries} queries`);
      }
    } catch (error) {
      console.log(`⚠️ Error loading existing reports: ${error}`);
    }
  }

  /**
   * Get database table usage summary
   */
  static getDatabaseSummary(): string {
    if (!this.databaseReport) {
      return '📊 No database data available - run journey tests first';
    }

    const { summary, details } = this.databaseReport;
    if (!details || !Array.isArray(details)) {
      return '📊 No database details available';
    }

    const topTables = details
      .sort((a: any, b: any) => b.queryCount - a.queryCount)
      .slice(0, 10);

    return `
📊 Database Usage Summary
📈 Total Tables: ${summary.totalTables}
📈 Total Queries: ${summary.totalQueries}
📈 Most Used: ${summary.mostUsedTable}

🏆 Top 10 Tables:
${topTables.map((table: any, i: number) => 
  `  ${i + 1}. ${table.tableName} (${table.queryCount} queries)`
).join('\n')}
    `.trim();
  }
}

// Auto-initialize when imported
JourneyFileTracker.initialize();

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  const runCommand = async () => {
    switch (command) {
      case 'track':
        console.log('🎯 Tracking journey files...');
        JourneyFileTracker.loadTrackingState();
        console.log(JourneyFileTracker.getStatusReport());
        break;
        
      case 'cleanup':
        console.log('🧹 Running strict cleanup...');
        const cleanupSuccess = await JourneyFileTracker.runStrictCleanup();
        if (cleanupSuccess) {
          console.log('✅ Cleanup completed successfully');
        } else {
          console.log('❌ Cleanup failed - fix errors first');
          process.exit(1);
        }
        break;
        
      case 'expand':
        console.log('🚀 Expanding journey...');
        const newFiles = process.argv.slice(3);
        if (newFiles.length === 0) {
          console.log('❌ No new files provided. Usage: npm run journey:expand -- file1.ts file2.tsx');
          process.exit(1);
        }
        const expandSuccess = await JourneyFileTracker.expandJourney(newFiles);
        if (expandSuccess) {
          console.log('✅ Journey expansion completed');
        } else {
          console.log('❌ Journey expansion failed');
          process.exit(1);
        }
        break;
        
      case 'status':
        JourneyFileTracker.loadTrackingState();
        await JourneyFileTracker.loadExistingReports();
        console.log(JourneyFileTracker.getStatusReport());
        if (JourneyFileTracker.getDatabaseReport()) {
          console.log('\n' + JourneyFileTracker.getDatabaseSummary());
        }
        break;
        
      case 'test':
        console.log('🧪 Running journey tests with database tracking...');
        const testSuccess = await JourneyFileTracker.runJourneyTests();
        if (testSuccess) {
          console.log('✅ Journey tests completed');
          console.log(JourneyFileTracker.getDatabaseSummary());
        } else {
          console.log('❌ Journey tests failed');
          process.exit(1);
        }
        break;
        
      default:
        console.log(`
🎯 Journey File Tracker CLI

Usage:
  npm run journey:track          - Show current tracking status
  npm run journey:cleanup        - Run strict cleanup on tracked files
  npm run journey:expand -- file1.ts file2.tsx - Add files and run cleanup
  npm run journey:status         - Show detailed status with database info
  npm run journey:test           - Run journey tests with database tracking
  npm run journey:auto           - Full automated workflow
        `.trim());
        break;
    }
  };
  
  runCommand().catch(error => {
    console.error('❌ Command failed:', error);
    process.exit(1);
  });
}
