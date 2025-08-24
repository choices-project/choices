#!/usr/bin/env node

/**
 * Final script to fix remaining unescaped HTML entities
 * This addresses the root cause of react/no-unescaped-entities warnings
 */

const fs = require('fs');
const path = require('path');

// Comprehensive patterns to find and fix unescaped entities
const ENTITY_PATTERNS = [
  // Fix apostrophes in JSX text content (more comprehensive)
  {
    pattern: /(>[^<]*?)'([^<]*?<)/g,
    replacement: '$1&apos;$2',
    description: 'unescaped apostrophe in JSX text'
  },
  // Fix quotes in JSX text content (more comprehensive)
  {
    pattern: /(>[^<]*?)"([^<]*?<)/g,
    replacement: '$1&quot;$2',
    description: 'unescaped quote in JSX text'
  },
  // Fix apostrophes in JSX attributes
  {
    pattern: /(\s[a-zA-Z-]+=)"([^"]*?)'([^"]*?)"/g,
    replacement: '$1"$2&apos;$3"',
    description: 'unescaped apostrophe in JSX attributes'
  },
  // Fix quotes in JSX attributes
  {
    pattern: /(\s[a-zA-Z-]+=)"([^"]*?)"([^"]*?)"/g,
    replacement: '$1"$2&quot;$3"',
    description: 'unescaped quote in JSX attributes'
  },
  // Fix common contractions and possessives (comprehensive list)
  {
    pattern: /What's/g,
    replacement: 'What&apos;s',
    description: 'What\'s contraction'
  },
  {
    pattern: /It's/g,
    replacement: 'It&apos;s',
    description: 'It\'s contraction'
  },
  {
    pattern: /That's/g,
    replacement: 'That&apos;s',
    description: 'That\'s contraction'
  },
  {
    pattern: /There's/g,
    replacement: 'There&apos;s',
    description: 'There\'s contraction'
  },
  {
    pattern: /Here's/g,
    replacement: 'Here&apos;s',
    description: 'Here\'s contraction'
  },
  {
    pattern: /Let's/g,
    replacement: 'Let&apos;s',
    description: 'Let\'s contraction'
  },
  {
    pattern: /We're/g,
    replacement: 'We&apos;re',
    description: 'We\'re contraction'
  },
  {
    pattern: /You're/g,
    replacement: 'You&apos;re',
    description: 'You\'re contraction'
  },
  {
    pattern: /They're/g,
    replacement: 'They&apos;re',
    description: 'They\'re contraction'
  },
  {
    pattern: /I'm/g,
    replacement: 'I&apos;m',
    description: 'I\'m contraction'
  },
  {
    pattern: /Don't/g,
    replacement: 'Don&apos;t',
    description: 'Don\'t contraction'
  },
  {
    pattern: /Can't/g,
    replacement: 'Can&apos;t',
    description: 'Can\'t contraction'
  },
  {
    pattern: /Won't/g,
    replacement: 'Won&apos;t',
    description: 'Won\'t contraction'
  },
  {
    pattern: /Isn't/g,
    replacement: 'Isn&apos;t',
    description: 'Isn\'t contraction'
  },
  {
    pattern: /Aren't/g,
    replacement: 'Aren&apos;t',
    description: 'Aren\'t contraction'
  },
  {
    pattern: /Haven't/g,
    replacement: 'Haven&apos;t',
    description: 'Haven\'t contraction'
  },
  {
    pattern: /Hasn't/g,
    replacement: 'Hasn&apos;t',
    description: 'Hasn\'t contraction'
  },
  {
    pattern: /Wouldn't/g,
    replacement: 'Wouldn&apos;t',
    description: 'Wouldn\'t contraction'
  },
  {
    pattern: /Couldn't/g,
    replacement: 'Couldn&apos;t',
    description: 'Couldn\'t contraction'
  },
  {
    pattern: /Shouldn't/g,
    replacement: 'Shouldn&apos;t',
    description: 'Shouldn\'t contraction'
  },
  {
    pattern: /Doesn't/g,
    replacement: 'Doesn&apos;t',
    description: 'Doesn\'t contraction'
  },
  {
    pattern: /Didn't/g,
    replacement: 'Didn&apos;t',
    description: 'Didn\'t contraction'
  },
  {
    pattern: /Wasn't/g,
    replacement: 'Wasn&apos;t',
    description: 'Wasn\'t contraction'
  },
  {
    pattern: /Weren't/g,
    replacement: 'Weren&apos;t',
    description: 'Weren\'t contraction'
  },
  {
    pattern: /You'll/g,
    replacement: 'You&apos;ll',
    description: 'You\'ll contraction'
  },
  {
    pattern: /We'll/g,
    replacement: 'We&apos;ll',
    description: 'We\'ll contraction'
  },
  {
    pattern: /They'll/g,
    replacement: 'They&apos;ll',
    description: 'They\'ll contraction'
  },
  {
    pattern: /I'll/g,
    replacement: 'I&apos;ll',
    description: 'I\'ll contraction'
  },
  {
    pattern: /He'll/g,
    replacement: 'He&apos;ll',
    description: 'He\'ll contraction'
  },
  {
    pattern: /She'll/g,
    replacement: 'She&apos;ll',
    description: 'She\'ll contraction'
  }
];

// All TypeScript/TSX files to process
const FILES_TO_PROCESS = [
  'app/dashboard/page.tsx',
  'app/profile/page.tsx',
  'app/polls/page.tsx',
  'app/account-settings/page.tsx',
  'app/polls/[id]/page.tsx',
  'app/test-user-sync/page.tsx',
  'components/onboarding/steps/CompleteStep.tsx',
  'components/onboarding/steps/PrivacyStep.tsx',
  'components/onboarding/steps/DemographicsStep.tsx',
  'components/onboarding/steps/ValuesStep.tsx',
  'components/onboarding/OnboardingFlow.tsx',
  'components/EnhancedFeedbackWidget.tsx',
  'components/polls/PollResults.tsx',
  'app/login/page.tsx',
  'app/register/page.tsx',
  'app/advanced-privacy/page.tsx',
  'app/comprehensive-testing/page.tsx',
  'app/admin/feedback/page.tsx',
  'app/admin/feedback/enhanced/page.tsx'
];

function fixUnescapedEntitiesFinal(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    let changesMade = 0;
    
    // Apply each pattern
    for (const { pattern, replacement, description } of ENTITY_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        changesMade += matches.length;
        console.log(`   - Fixed ${matches.length} ${description}(s)`);
      }
    }
    
    // Check if content actually changed
    if (content === originalContent) {
      console.log(`ℹ️  No unescaped entities found in: ${filePath}`);
      return false;
    }

    // Write the fixed content
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${changesMade} unescaped entities in: ${filePath}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Final fixing of unescaped HTML entities...\n');
  
  let fixedCount = 0;
  const totalFiles = FILES_TO_PROCESS.length;
  
  for (const filePath of FILES_TO_PROCESS) {
    console.log(`Processing: ${filePath}`);
    if (fixUnescapedEntitiesFinal(filePath)) {
      fixedCount++;
    }
    console.log(''); // Empty line for readability
  }
  
  console.log(`📊 Summary:`);
  console.log(`   Files processed: ${totalFiles}`);
  console.log(`   Files fixed: ${fixedCount}`);
  console.log(`   Files unchanged: ${totalFiles - fixedCount}`);
  
  if (fixedCount > 0) {
    console.log(`\n🎉 Successfully fixed ${fixedCount} files!`);
    console.log(`   This addresses the root cause of react/no-unescaped-entities warnings.`);
  } else {
    console.log(`\nℹ️  No files needed fixing.`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixUnescapedEntitiesFinal };
