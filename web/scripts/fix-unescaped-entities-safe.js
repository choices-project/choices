#!/usr/bin/env node

/**
 * Script to safely fix unescaped HTML entities in JSX
 * This addresses the root cause of react/no-unescaped-entities warnings
 * Only targets actual JSX text content, not import statements or string literals
 */

const fs = require('fs');
const path = require('path');

// Safe patterns to find and fix unescaped entities in JSX text content only
const SAFE_ENTITY_PATTERNS = [
  // Fix apostrophes in JSX text content (not in strings or imports)
  {
    pattern: /(>[^<]*?)'([^<]*?<)/g,
    replacement: '$1&apos;$2',
    description: 'unescaped apostrophe in JSX text'
  },
  // Fix quotes in JSX text content (not in strings or imports)
  {
    pattern: /(>[^<]*?)"([^<]*?<)/g,
    replacement: '$1&quot;$2',
    description: 'unescaped quote in JSX text'
  },
  // Fix specific common contractions in JSX text
  {
    pattern: /(>[^<]*?)What's([^<]*?<)/g,
    replacement: '$1What&apos;s$2',
    description: 'What\'s contraction in JSX'
  },
  {
    pattern: /(>[^<]*?)It's([^<]*?<)/g,
    replacement: '$1It&apos;s$2',
    description: 'It\'s contraction in JSX'
  },
  {
    pattern: /(>[^<]*?)That's([^<]*?<)/g,
    replacement: '$1That&apos;s$2',
    description: 'That\'s contraction in JSX'
  },
  {
    pattern: /(>[^<]*?)There's([^<]*?<)/g,
    replacement: '$1There&apos;s$2',
    description: 'There\'s contraction in JSX'
  },
  {
    pattern: /(>[^<]*?)Here's([^<]*?<)/g,
    replacement: '$1Here&apos;s$2',
    description: 'Here\'s contraction in JSX'
  },
  {
    pattern: /(>[^<]*?)Let's([^<]*?<)/g,
    replacement: '$1Let&apos;s$2',
    description: 'Let\'s contraction in JSX'
  },
  {
    pattern: /(>[^<]*?)We're([^<]*?<)/g,
    replacement: '$1We&apos;re$2',
    description: 'We\'re contraction in JSX'
  },
  {
    pattern: /(>[^<]*?)You're([^<]*?<)/g,
    replacement: '$1You&apos;re$2',
    description: 'You\'re contraction in JSX'
  },
  {
    pattern: /(>[^<]*?)They're([^<]*?<)/g,
    replacement: '$1They&apos;re$2',
    description: 'They\'re contraction in JSX'
  },
  {
    pattern: /(>[^<]*?)I'm([^<]*?<)/g,
    replacement: '$1I&apos;m$2',
    description: 'I\'m contraction in JSX'
  },
  {
    pattern: /(>[^<]*?)Don't([^<]*?<)/g,
    replacement: '$1Don&apos;t$2',
    description: 'Don\'t contraction in JSX'
  },
  {
    pattern: /(>[^<]*?)Can't([^<]*?<)/g,
    replacement: '$1Can&apos;t$2',
    description: 'Can\'t contraction in JSX'
  },
  {
    pattern: /(>[^<]*?)Won't([^<]*?<)/g,
    replacement: '$1Won&apos;t$2',
    description: 'Won\'t contraction in JSX'
  },
  {
    pattern: /(>[^<]*?)Isn't([^<]*?<)/g,
    replacement: '$1Isn&apos;t$2',
    description: 'Isn\'t contraction in JSX'
  },
  {
    pattern: /(>[^<]*?)Aren't([^<]*?<)/g,
    replacement: '$1Aren&apos;t$2',
    description: 'Aren\'t contraction in JSX'
  },
  {
    pattern: /(>[^<]*?)Haven't([^<]*?<)/g,
    replacement: '$1Haven&apos;t$2',
    description: 'Haven\'t contraction in JSX'
  },
  {
    pattern: /(>[^<]*?)Hasn't([^<]*?<)/g,
    replacement: '$1Hasn&apos;t$2',
    description: 'Hasn\'t contraction in JSX'
  },
  {
    pattern: /(>[^<]*?)Wouldn't([^<]*?<)/g,
    replacement: '$1Wouldn&apos;t$2',
    description: 'Wouldn\'t contraction in JSX'
  },
  {
    pattern: /(>[^<]*?)Couldn't([^<]*?<)/g,
    replacement: '$1Couldn&apos;t$2',
    description: 'Couldn\'t contraction in JSX'
  },
  {
    pattern: /(>[^<]*?)Shouldn't([^<]*?<)/g,
    replacement: '$1Shouldn&apos;t$2',
    description: 'Shouldn\'t contraction in JSX'
  }
];

// Files to process (components that commonly have unescaped entities)
const FILES_TO_PROCESS = [
  'components/onboarding/steps/CompleteStep.tsx',
  'components/onboarding/steps/PrivacyStep.tsx',
  'components/onboarding/steps/DemographicsStep.tsx',
  'components/onboarding/steps/ValuesStep.tsx',
  'app/polls/page.tsx',
  'app/dashboard/page.tsx',
  'app/profile/page.tsx',
  'app/account-settings/page.tsx',
  'components/onboarding/OnboardingFlow.tsx',
  'components/EnhancedFeedbackWidget.tsx',
  'components/polls/PollResults.tsx',
  'app/polls/[id]/page.tsx',
  'app/test-user-sync/page.tsx'
];

function fixUnescapedEntitiesSafe(filePath) {
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
    for (const { pattern, replacement, description } of SAFE_ENTITY_PATTERNS) {
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
  console.log('🔧 Safely fixing unescaped HTML entities in JSX text...\n');
  
  let fixedCount = 0;
  const totalFiles = FILES_TO_PROCESS.length;
  
  for (const filePath of FILES_TO_PROCESS) {
    console.log(`Processing: ${filePath}`);
    if (fixUnescapedEntitiesSafe(filePath)) {
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
    console.log(`   This addresses the root cause of react/no-unescaped-entities warnings safely.`);
  } else {
    console.log(`\nℹ️  No files needed fixing.`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixUnescapedEntitiesSafe };
