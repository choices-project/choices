#!/usr/bin/env node

/**
 * Feature Flag Analysis Script
 * 
 * Analyzes which feature flags are disabled and provides recommendations
 */

const fs = require('fs');
const path = require('path');

// Read the feature flags file
const featureFlagsPath = path.join(__dirname, '../lib/core/feature-flags.ts');
const content = fs.readFileSync(featureFlagsPath, 'utf8');

// Extract feature flags using regex
const flagRegex = /(\w+):\s*(true|false)/g;
const flags = [];
let match;

while ((match = flagRegex.exec(content)) !== null) {
  flags.push({
    name: match[1],
    enabled: match[2] === 'true'
  });
}

// Categorize flags
const enabledFlags = flags.filter(flag => flag.enabled);
const disabledFlags = flags.filter(flag => !flag.enabled);

// Categorize disabled flags by type
const disabledByCategory = {
  future: [],
  social: [],
  experimental: [],
  performance: [],
  system: [],
  other: []
};

disabledFlags.forEach(flag => {
  const name = flag.name.toLowerCase();
  if (name.includes('automated') || name.includes('demographic') || name.includes('trending') || name.includes('advanced') || name.includes('media') || name.includes('narrative')) {
    disabledByCategory.future.push(flag);
  } else if (name.includes('social')) {
    disabledByCategory.social.push(flag);
  } else if (name.includes('experimental') || name.includes('oauth') || name.includes('device')) {
    disabledByCategory.experimental.push(flag);
  } else if (name.includes('performance') || name.includes('optimization')) {
    disabledByCategory.performance.push(flag);
  } else if (name.includes('international') || name.includes('accessibility') || name.includes('audit')) {
    disabledByCategory.system.push(flag);
  } else {
    disabledByCategory.other.push(flag);
  }
});

// Generate report
console.log('🔍 FEATURE FLAG ANALYSIS REPORT');
console.log('================================');
console.log(`📊 Total Flags: ${flags.length}`);
console.log(`✅ Enabled Flags: ${enabledFlags.length}`);
console.log(`❌ Disabled Flags: ${disabledFlags.length}`);
console.log('');

console.log('📋 DISABLED FLAGS BY CATEGORY:');
console.log('');

Object.entries(disabledByCategory).forEach(([category, flags]) => {
  if (flags.length > 0) {
    console.log(`🏷️  ${category.toUpperCase()} (${flags.length} flags):`);
    flags.forEach(flag => {
      console.log(`   - ${flag.name}`);
    });
    console.log('');
  }
});

console.log('💡 RECOMMENDATIONS:');
console.log('');

if (disabledByCategory.future.length > 0) {
  console.log('🚀 FUTURE FEATURES - Consider enabling for advanced users:');
  disabledByCategory.future.forEach(flag => {
    console.log(`   - ${flag.name}: Future enhancement`);
  });
  console.log('');
}

if (disabledByCategory.social.length > 0) {
  console.log('📱 SOCIAL FEATURES - Enable for better engagement:');
  disabledByCategory.social.forEach(flag => {
    console.log(`   - ${flag.name}: Social sharing capability`);
  });
  console.log('');
}

if (disabledByCategory.experimental.length > 0) {
  console.log('🧪 EXPERIMENTAL FEATURES - Enable for testing:');
  disabledByCategory.experimental.forEach(flag => {
    console.log(`   - ${flag.name}: Experimental feature`);
  });
  console.log('');
}

if (disabledByCategory.system.length > 0) {
  console.log('⚙️  SYSTEM FEATURES - Consider enabling:');
  disabledByCategory.system.forEach(flag => {
    console.log(`   - ${flag.name}: System enhancement`);
  });
  console.log('');
}

console.log('🎯 SUMMARY:');
console.log(`   - ${disabledFlags.length} out of ${flags.length} flags are disabled`);
console.log(`   - ${Math.round((disabledFlags.length / flags.length) * 100)}% of flags are disabled`);
console.log(`   - Consider enabling social and system features for better user experience`);

