#!/usr/bin/env node

/**
 * Fix All Imports Script
 * 
 * This script fixes all import paths after the reorganization to ensure
 * the build works correctly.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing all import paths after reorganization...');

// Define the import path mappings
const importMappings = [
  // Component imports
  { from: /@\/components\/([^/]+)\/([^/]+)/g, to: '@/components/features/$1/$2' },
  { from: /@\/components\/(SimpleChart|ProfessionalChart|SimpleBarChart|FancyCharts)/g, to: '@/components/charts/$1' },
  { from: /@\/components\/(ClientOnly|OptimizedImage|VirtualScroll|BiasFreePromise|FeatureWrapper|GlobalNavigation|HeroSection|SiteMessages)/g, to: '@/components/ui/layout/$1' },
  { from: /@\/components\/(FeedbackWidget|EnhancedFeedbackWidget)/g, to: '@/components/ui/feedback/$1' },
  { from: /@\/components\/(PollCard|CreatePoll|VotingInterface|FeaturedPolls|TierSystem)/g, to: '@/components/features/polls/$1' },
  { from: /@\/components\/(AnalyticsDashboard|Dashboard|EnhancedDashboard|DemographicVisualization|TopicAnalysis|UserEngagement)/g, to: '@/components/features/admin/$1' },
  { from: /@\/components\/(BiometricSetup|BiometricLogin|BiometricError|DeviceList|PrivacyLevelIndicator|PrivacyLevelSelector|SocialLoginButtons)/g, to: '@/components/features/auth/$1' },
  { from: /@\/components\/(PWAComponents|PWAUserProfile|PWAVotingInterface|PWAInstaller)/g, to: '@/components/features/onboarding/$1' },
  
  // Library imports
  { from: /@\/lib\/logger/g, to: '@/lib/utils/logger' },
  { from: /@\/lib\/webauthn/g, to: '@/lib/auth/webauthn' },
  { from: /@\/lib\/auth-utils/g, to: '@/lib/auth/auth-utils' },
  { from: /@\/lib\/client-session/g, to: '@/lib/auth/client-session' },
  { from: /@\/lib\/csrf-client/g, to: '@/lib/auth/csrf-client' },
  { from: /@\/lib\/device-flow/g, to: '@/lib/auth/device-flow' },
  { from: /@\/lib\/social-auth-config/g, to: '@/lib/auth/social-auth-config' },
  { from: /@\/lib\/service-role-admin/g, to: '@/lib/auth/service-role-admin' },
  
  // Performance imports
  { from: /@\/lib\/performance-monitor/g, to: '@/lib/performance/performance-monitor' },
  { from: /@\/lib\/performance-monitor-simple/g, to: '@/lib/performance/performance-monitor-simple' },
  { from: /@\/lib\/performance/g, to: '@/lib/performance/performance' },
  
  // Privacy imports
  { from: /@\/lib\/differential-privacy/g, to: '@/lib/privacy/differential-privacy' },
  { from: /@\/lib\/hybrid-privacy/g, to: '@/lib/privacy/hybrid-privacy' },
  { from: /@\/lib\/zero-knowledge-proofs/g, to: '@/lib/privacy/zero-knowledge-proofs' },
  
  // Service imports
  { from: /@\/lib\/poll-service/g, to: '@/lib/services/poll-service' },
  { from: /@\/lib\/automated-polls/g, to: '@/lib/services/automated-polls' },
  { from: /@\/lib\/hybrid-voting-service/g, to: '@/lib/services/hybrid-voting-service' },
  { from: /@\/lib\/poll-narrative-system/g, to: '@/lib/services/poll-narrative-system' },
  { from: /@\/lib\/real-time-news-service/g, to: '@/lib/services/real-time-news-service' },
  { from: /@\/lib\/media-bias-analysis/g, to: '@/lib/services/media-bias-analysis' },
  { from: /@\/lib\/github-issue-integration/g, to: '@/lib/services/github-issue-integration' },
  
  // Utility imports
  { from: /@\/lib\/utils/g, to: '@/lib/utils/utils' },
  { from: /@\/lib\/browser-utils/g, to: '@/lib/utils/browser-utils' },
  { from: /@\/lib\/mock-data/g, to: '@/lib/utils/mock-data' },
  { from: /@\/lib\/api/g, to: '@/lib/utils/api' },
  { from: /@\/lib\/admin-hooks/g, to: '@/lib/utils/admin-hooks' },
  { from: /@\/lib\/admin-store/g, to: '@/lib/utils/admin-store' },
  { from: /@\/lib\/feedback-tracker/g, to: '@/lib/utils/feedback-tracker' },
  { from: /@\/lib\/module-loader/g, to: '@/lib/utils/module-loader' },
  { from: /@\/lib\/ssr-polyfills/g, to: '@/lib/utils/ssr-polyfills' },
  { from: /@\/lib\/pwa-utils/g, to: '@/lib/utils/pwa-utils' },
  { from: /@\/lib\/pwa-auth-integration/g, to: '@/lib/utils/pwa-auth-integration' },
  
  // Config imports
  { from: /@\/lib\/database-config/g, to: '@/lib/config/database-config' },
  { from: /@\/lib\/database-optimizer/g, to: '@/lib/config/database-optimizer' },
  { from: /@\/lib\/feature-flags/g, to: '@/lib/config/feature-flags' },
  { from: /@\/lib\/rate-limit/g, to: '@/lib/config/rate-limit' },
  { from: /@\/lib\/error-handler/g, to: '@/lib/config/error-handler' },
  { from: /@\/lib\/errors/g, to: '@/lib/config/errors' },
  { from: /@\/lib\/dpop/g, to: '@/lib/config/dpop' },
  { from: /@\/lib\/dpop-middleware/g, to: '@/lib/config/dpop-middleware' },
  
  // Testing imports
  { from: /@\/lib\/testing-suite/g, to: '@/lib/testing/testing-suite' },
  { from: /@\/lib\/comprehensive-testing-runner/g, to: '@/lib/testing/comprehensive-testing-runner' },
  { from: /@\/lib\/cross-platform-testing/g, to: '@/lib/testing/cross-platform-testing' },
  { from: /@\/lib\/mobile-compatibility-testing/g, to: '@/lib/testing/mobile-compatibility-testing' },
];

// Function to fix imports in a file
function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    importMappings.forEach(mapping => {
      const newContent = content.replace(mapping.from, mapping.to);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed imports in: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Find all TypeScript and TSX files
function findTsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.next')) {
      files.push(...findTsFiles(fullPath));
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
try {
  const webDir = path.join(__dirname, '..', 'web');
  const tsFiles = findTsFiles(webDir);
  
  console.log(`📁 Found ${tsFiles.length} TypeScript files to check`);
  
  let fixedCount = 0;
  tsFiles.forEach(file => {
    if (fixImportsInFile(file)) {
      fixedCount++;
    }
  });
  
  console.log(`🎉 Fixed imports in ${fixedCount} files!`);
  console.log('🔨 Now testing build...');
  
  // Test the build
  try {
    execSync('cd web && npm run build', { stdio: 'inherit' });
    console.log('✅ Build successful! All imports fixed.');
  } catch (error) {
    console.log('⚠️  Build still has issues. Check the output above.');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
