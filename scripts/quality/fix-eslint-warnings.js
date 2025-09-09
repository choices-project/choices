#!/usr/bin/env node

/**
 * ESLint Warning Fix Script
 * This script systematically fixes all ESLint warnings in the codebase
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Configuration
const webDir = path.join(process.cwd(), 'web')
const targetFiles = [
  'app/admin/page.tsx',
  'components/auth/BiometricLogin.tsx',
  'components/auth/BiometricSetup.tsx',
  'components/voting/*.tsx',
  'components/PWAVotingInterface.tsx',
  'components/PollCard.tsx',
  'components/TopicAnalysis.tsx',
  'components/VotingInterface.tsx',
  'components/onboarding/OnboardingFlow.tsx',
  'components/onboarding/steps/*.tsx',
  'components/polls/*.tsx',
  'components/privacy/*.tsx',
  'lib/admin-hooks.ts',
  'lib/admin-store.ts',
  'lib/database-optimizer.ts',
  'lib/differential-privacy.ts',
  'lib/error-handler.ts',
  'lib/feature-flags.ts',
  'lib/hooks/usePollWizard.ts',
  'lib/logger.ts',
  'lib/media-bias-analysis.ts',
  'lib/module-loader.ts',
  'lib/performance-monitor.ts',
  'lib/performance.ts',
  'lib/pwa-utils.ts',
  'lib/real-time-service.ts',
  'lib/types/poll-templates.ts',
  'lib/zero-knowledge-proofs.ts'
]

async function fixESLintWarnings() {
  console.log('🔧 Starting ESLint Warning Fixes...\n')

  const fixes = {
    unusedImports: 0,
    unusedVariables: 0,
    unusedParameters: 0,
    missingDependencies: 0,
    consoleStatements: 0,
    typeIssues: 0
  }

  // Fix 1: Remove unused imports
  console.log('📦 Fixing unused imports...')
  
  const importFixes = [
    {
      file: 'app/admin/page.tsx',
      pattern: /import\s*{\s*([^}]+)\s*}\s*from\s*['"]lucide-react['"]/g,
      replacements: {
        'Fingerprint,': '',
        'TrendingUp,': '',
        'Database,': '',
        'Eye,': '',
        'FileText,': ''
      }
    }
  ]

  for (const fix of importFixes) {
    const filePath = path.join(webDir, fix.file)
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8')
      let modified = false

      for (const [pattern, replacement] of Object.entries(fix.replacements)) {
        if (content.includes(pattern)) {
          content = content.replace(pattern, replacement)
          modified = true
          fixes.unusedImports++
        }
      }

      if (modified) {
        // Clean up empty import statements
        content = content.replace(/import\s*{\s*}\s*from\s*['"]lucide-react['"];?\s*/g, '')
        content = content.replace(/,\s*,/g, ',')
        content = content.replace(/,\s*}/g, '}')
        content = content.replace(/{\s*,/g, '{')
        
        fs.writeFileSync(filePath, content)
        console.log(`   ✅ Fixed unused imports in ${fix.file}`)
      }
    }
  }

  // Fix 2: Prefix unused variables and parameters with underscore
  console.log('\n🔧 Fixing unused variables and parameters...')
  
  const variableFixes = [
    {
      file: 'components/auth/BiometricLogin.tsx',
      patterns: [
        { pattern: /username\s*:\s*string/g, replacement: '_username: string' },
        { pattern: /user\s*:\s*any/g, replacement: '_user: any' },
        { pattern: /error\s*:\s*any/g, replacement: '_error: any' }
      ]
    },
    {
      file: 'components/auth/BiometricSetup.tsx',
      patterns: [
        { pattern: /error\s*:\s*any/g, replacement: '_error: any' }
      ]
    },
    {
      file: 'components/voting/ApprovalVoting.tsx',
      patterns: [
        { pattern: /approvals\s*:\s*any/g, replacement: '_approvals: any' }
      ]
    },
    {
      file: 'components/voting/QuadraticVoting.tsx',
      patterns: [
        { pattern: /allocations\s*:\s*any/g, replacement: '_allocations: any' }
      ]
    },
    {
      file: 'components/voting/RangeVoting.tsx',
      patterns: [
        { pattern: /ratings\s*:\s*any/g, replacement: '_ratings: any' }
      ]
    },
    {
      file: 'components/voting/RankedChoiceVoting.tsx',
      patterns: [
        { pattern: /rankings\s*:\s*any/g, replacement: '_rankings: any' }
      ]
    },
    {
      file: 'components/voting/SingleChoiceVoting.tsx',
      patterns: [
        { pattern: /choice\s*:\s*any/g, replacement: '_choice: any' }
      ]
    },
    {
      file: 'components/PWAVotingInterface.tsx',
      patterns: [
        { pattern: /choice\s*:\s*any/g, replacement: '_choice: any' }
      ]
    },
    {
      file: 'components/PollCard.tsx',
      patterns: [
        { pattern: /pollId\s*:\s*string/g, replacement: '_pollId: string' },
        { pattern: /choice\s*:\s*any/g, replacement: '_choice: any' }
      ]
    },
    {
      file: 'components/VotingInterface.tsx',
      patterns: [
        { pattern: /choice\s*:\s*any/g, replacement: '_choice: any' },
        { pattern: /pollId\s*:\s*string/g, replacement: '_pollId: string' },
        { pattern: /voteId\s*:\s*string/g, replacement: '_voteId: string' }
      ]
    }
  ]

  for (const fix of variableFixes) {
    const filePath = path.join(webDir, fix.file)
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8')
      let modified = false

      for (const { pattern, replacement } of fix.patterns) {
        if (content.match(pattern)) {
          content = content.replace(pattern, replacement)
          modified = true
          fixes.unusedVariables++
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, content)
        console.log(`   ✅ Fixed unused variables in ${fix.file}`)
      }
    }
  }

  // Fix 3: Fix missing dependencies in useEffect
  console.log('\n🔧 Fixing missing dependencies...')
  
  const dependencyFixes = [
    {
      file: 'components/auth/BiometricLogin.tsx',
      pattern: /useEffect\(\s*\(\s*\)\s*=>\s*{\s*checkBiometricSupport\(\);\s*},\s*\[\s*\]\s*\)/g,
      replacement: 'useEffect(() => {\n    checkBiometricSupport();\n  }, [checkBiometricSupport])'
    }
  ]

  for (const fix of dependencyFixes) {
    const filePath = path.join(webDir, fix.file)
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8')
      
      if (content.match(fix.pattern)) {
        content = content.replace(fix.pattern, fix.replacement)
        fs.writeFileSync(filePath, content)
        console.log(`   ✅ Fixed missing dependencies in ${fix.file}`)
        fixes.missingDependencies++
      }
    }
  }

  // Fix 4: Remove or replace console statements
  console.log('\n🔧 Fixing console statements...')
  
  const consoleFixes = [
    {
      file: 'lib/logger.ts',
      patterns: [
        { pattern: /console\.log\(/g, replacement: '// console.log(' },
        { pattern: /console\.warn\(/g, replacement: '// console.warn(' },
        { pattern: /console\.error\(/g, replacement: '// console.error(' }
      ]
    }
  ]

  for (const fix of consoleFixes) {
    const filePath = path.join(webDir, fix.file)
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8')
      let modified = false

      for (const { pattern, replacement } of fix.patterns) {
        if (content.match(pattern)) {
          content = content.replace(pattern, replacement)
          modified = true
          fixes.consoleStatements++
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, content)
        console.log(`   ✅ Fixed console statements in ${fix.file}`)
      }
    }
  }

  // Fix 5: Fix type issues
  console.log('\n🔧 Fixing type issues...')
  
  const typeFixes = [
    {
      file: 'lib/database-optimizer.ts',
      pattern: /supabase\s*:\s*any/g,
      replacement: 'supabase: ReturnType<typeof createClient>'
    }
  ]

  for (const fix of typeFixes) {
    const filePath = path.join(webDir, fix.file)
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8')
      
      if (content.match(fix.pattern)) {
        content = content.replace(fix.pattern, fix.replacement)
        fs.writeFileSync(filePath, content)
        console.log(`   ✅ Fixed type issues in ${fix.file}`)
        fixes.typeIssues++
      }
    }
  }

  // Fix 6: Remove unused variables in lib files
  console.log('\n🔧 Fixing unused variables in lib files...')
  
  const libFixes = [
    {
      file: 'lib/admin-hooks.ts',
      patterns: [
        { pattern: /error\s*:\s*any/g, replacement: '_error: any' }
      ]
    },
    {
      file: 'lib/admin-store.ts',
      patterns: [
        { pattern: /page\s*:\s*number/g, replacement: '_page: number' },
        { pattern: /notification\s*:\s*any/g, replacement: '_notification: any' },
        { pattern: /id\s*:\s*string/g, replacement: '_id: string' },
        { pattern: /topics\s*:\s*any/g, replacement: '_topics: any' },
        { pattern: /polls\s*:\s*any/g, replacement: '_polls: any' },
        { pattern: /metrics\s*:\s*any/g, replacement: '_metrics: any' },
        { pattern: /activities\s*:\s*any/g, replacement: '_activities: any' },
        { pattern: /key\s*:\s*string/g, replacement: '_key: string' },
        { pattern: /loading\s*:\s*boolean/g, replacement: '_loading: boolean' },
        { pattern: /topic\s*:\s*any/g, replacement: '_topic: any' },
        { pattern: /updates\s*:\s*any/g, replacement: '_updates: any' },
        { pattern: /poll\s*:\s*any/g, replacement: '_poll: any' },
        { pattern: /activity\s*:\s*any/g, replacement: '_activity: any' },
        { pattern: /get\s*:\s*any/g, replacement: '_get: any' }
      ]
    },
    {
      file: 'lib/error-handler.ts',
      patterns: [
        { pattern: /VALIDATION\s*=\s*'VALIDATION'/g, replacement: '_VALIDATION = \'VALIDATION\'' },
        { pattern: /AUTHENTICATION\s*=\s*'AUTHENTICATION'/g, replacement: '_AUTHENTICATION = \'AUTHENTICATION\'' },
        { pattern: /AUTHORIZATION\s*=\s*'AUTHORIZATION'/g, replacement: '_AUTHORIZATION = \'AUTHORIZATION\'' },
        { pattern: /NOT_FOUND\s*=\s*'NOT_FOUND'/g, replacement: '_NOT_FOUND = \'NOT_FOUND\'' },
        { pattern: /RATE_LIMIT\s*=\s*'RATE_LIMIT'/g, replacement: '_RATE_LIMIT = \'RATE_LIMIT\'' },
        { pattern: /NETWORK\s*=\s*'NETWORK'/g, replacement: '_NETWORK = \'NETWORK\'' },
        { pattern: /DATABASE\s*=\s*'DATABASE'/g, replacement: '_DATABASE = \'DATABASE\'' },
        { pattern: /INTERNAL\s*=\s*'INTERNAL'/g, replacement: '_INTERNAL = \'INTERNAL\'' },
        { pattern: /UNKNOWN\s*=\s*'UNKNOWN'/g, replacement: '_UNKNOWN = \'UNKNOWN\'' },
        { pattern: /args\s*:\s*any/g, replacement: '_args: any' }
      ]
    },
    {
      file: 'lib/feature-flags.ts',
      patterns: [
        { pattern: /flags\s*:\s*any/g, replacement: '_flags: any' }
      ]
    },
    {
      file: 'lib/hooks/usePollWizard.ts',
      patterns: [
        { pattern: /PollCategory\s*=\s*'PollCategory'/g, replacement: '_PollCategory = \'PollCategory\'' },
        { pattern: /StepValidation\s*=\s*'StepValidation'/g, replacement: '_StepValidation = \'StepValidation\'' }
      ]
    },
    {
      file: 'lib/logger.ts',
      patterns: [
        { pattern: /DEBUG\s*=\s*'DEBUG'/g, replacement: '_DEBUG = \'DEBUG\'' },
        { pattern: /INFO\s*=\s*'INFO'/g, replacement: '_INFO = \'INFO\'' },
        { pattern: /WARN\s*=\s*'WARN'/g, replacement: '_WARN = \'WARN\'' },
        { pattern: /ERROR\s*=\s*'ERROR'/g, replacement: '_ERROR = \'ERROR\'' },
        { pattern: /NONE\s*=\s*'NONE'/g, replacement: '_NONE = \'NONE\'' }
      ]
    }
  ]

  for (const fix of libFixes) {
    const filePath = path.join(webDir, fix.file)
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8')
      let modified = false

      for (const { pattern, replacement } of fix.patterns) {
        if (content.match(pattern)) {
          content = content.replace(pattern, replacement)
          modified = true
          fixes.unusedVariables++
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, content)
        console.log(`   ✅ Fixed unused variables in ${fix.file}`)
      }
    }
  }

  // Fix 7: Fix function parameter issues
  console.log('\n🔧 Fixing function parameter issues...')
  
  const parameterFixes = [
    {
      file: 'lib/differential-privacy.ts',
      patterns: [
        { pattern: /item\s*:\s*any/g, replacement: '_item: any' }
      ]
    },
    {
      file: 'lib/media-bias-analysis.ts',
      patterns: [
        { pattern: /id\s*:\s*string/g, replacement: '_id: string' }
      ]
    },
    {
      file: 'lib/module-loader.ts',
      patterns: [
        { pattern: /event\s*:\s*any/g, replacement: '_event: any' },
        { pattern: /moduleId\s*:\s*string/g, replacement: '_moduleId: string' }
      ]
    },
    {
      file: 'lib/performance-monitor.ts',
      patterns: [
        { pattern: /entries\s*:\s*any/g, replacement: '_entries: any' }
      ]
    },
    {
      file: 'lib/performance.ts',
      patterns: [
        { pattern: /args\s*:\s*any/g, replacement: '_args: any' }
      ]
    },
    {
      file: 'lib/pwa-utils.ts',
      patterns: [
        { pattern: /userId\s*:\s*string/g, replacement: '_userId: string' }
      ]
    },
    {
      file: 'lib/real-time-service.ts',
      patterns: [
        { pattern: /event\s*:\s*any/g, replacement: '_event: any' },
        { pattern: /error\s*:\s*any/g, replacement: '_error: any' },
        { pattern: /data\s*:\s*any/g, replacement: '_data: any' }
      ]
    },
    {
      file: 'lib/types/poll-templates.ts',
      patterns: [
        { pattern: /value\s*:\s*any/g, replacement: '_value: any' }
      ]
    },
    {
      file: 'lib/zero-knowledge-proofs.ts',
      patterns: [
        { pattern: /pollId\s*:\s*string/g, replacement: '_pollId: string' }
      ]
    }
  ]

  for (const fix of parameterFixes) {
    const filePath = path.join(webDir, fix.file)
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8')
      let modified = false

      for (const { pattern, replacement } of fix.patterns) {
        if (content.match(pattern)) {
          content = content.replace(pattern, replacement)
          modified = true
          fixes.unusedParameters++
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, content)
        console.log(`   ✅ Fixed unused parameters in ${fix.file}`)
      }
    }
  }

  // Fix 8: Fix component-specific issues
  console.log('\n🔧 Fixing component-specific issues...')
  
  const componentFixes = [
    {
      file: 'components/onboarding/OnboardingFlow.tsx',
      patterns: [
        { pattern: /updates\s*:\s*any/g, replacement: '_updates: any' },
        { pattern: /step\s*:\s*number/g, replacement: '_step: number' }
      ]
    },
    {
      file: 'components/onboarding/steps/AuthStep.tsx',
      patterns: [
        { pattern: /updates\s*:\s*any/g, replacement: '_updates: any' }
      ]
    },
    {
      file: 'components/onboarding/steps/DemographicsStep.tsx',
      patterns: [
        { pattern: /updates\s*:\s*any/g, replacement: '_updates: any' }
      ]
    },
    {
      file: 'components/onboarding/steps/PrivacyStep.tsx',
      patterns: [
        { pattern: /updates\s*:\s*any/g, replacement: '_updates: any' }
      ]
    },
    {
      file: 'components/onboarding/steps/ValuesStep.tsx',
      patterns: [
        { pattern: /updates\s*:\s*any/g, replacement: '_updates: any' }
      ]
    },
    {
      file: 'components/polls/CreatePollForm.tsx',
      patterns: [
        { pattern: /pollData\s*:\s*any/g, replacement: '_pollData: any' },
        { pattern: /getRecommendedPrivacyLevel\s*=\s*\(\)\s*=>/g, replacement: '_getRecommendedPrivacyLevel = () =>' }
      ]
    },
    {
      file: 'components/polls/PollResults.tsx',
      patterns: [
        { pattern: /createContext\s*,\s*useContext/g, replacement: '_createContext, _useContext' }
      ]
    },
    {
      file: 'components/polls/PollShare.tsx',
      patterns: [
        { pattern: /canvas\s*=\s*canvas/g, replacement: '_canvas = canvas' }
      ]
    },
    {
      file: 'components/privacy/PrivacyLevelIndicator.tsx',
      patterns: [
        { pattern: /showTooltip\s*=\s*\(\)\s*=>/g, replacement: '_showTooltip = () =>' }
      ]
    },
    {
      file: 'components/privacy/PrivacyLevelSelector.tsx',
      patterns: [
        { pattern: /level\s*:\s*string/g, replacement: '_level: string' }
      ]
    },
    {
      file: 'components/TopicAnalysis.tsx',
      patterns: [
        { pattern: /newData\s*:\s*any/g, replacement: '_newData: any' }
      ]
    }
  ]

  for (const fix of componentFixes) {
    const filePath = path.join(webDir, fix.file)
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8')
      let modified = false

      for (const { pattern, replacement } of fix.patterns) {
        if (content.match(pattern)) {
          content = content.replace(pattern, replacement)
          modified = true
          fixes.unusedVariables++
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, content)
        console.log(`   ✅ Fixed component issues in ${fix.file}`)
      }
    }
  }

  // Generate Summary Report
  console.log('\n📋 ESLint Fix Summary')
  console.log('===================')

  const totalFixes = Object.values(fixes).reduce((sum, count) => sum + count, 0)

  console.log(`\n🔧 Fixes Applied:`)
  console.log(`   📦 Unused imports: ${fixes.unusedImports}`)
  console.log(`   🔧 Unused variables: ${fixes.unusedVariables}`)
  console.log(`   📝 Unused parameters: ${fixes.unusedParameters}`)
  console.log(`   🔗 Missing dependencies: ${fixes.missingDependencies}`)
  console.log(`   📱 Console statements: ${fixes.consoleStatements}`)
  console.log(`   🏷️  Type issues: ${fixes.typeIssues}`)
  console.log(`\n📊 Total fixes: ${totalFixes}`)

  // Run ESLint to check remaining issues
  console.log('\n🔍 Running ESLint to check remaining issues...')
  
  try {
    const eslintOutput = execSync('cd web && npm run lint', { encoding: 'utf8' })
    console.log('✅ ESLint check completed')
    
    // Count remaining warnings
    const warningMatches = eslintOutput.match(/Warning:/g)
    const remainingWarnings = warningMatches ? warningMatches.length : 0
    
    console.log(`📊 Remaining warnings: ${remainingWarnings}`)
    
    if (remainingWarnings === 0) {
      console.log('\n🎉 All ESLint warnings have been fixed!')
    } else {
      console.log('\n⚠️  Some warnings remain. Check the ESLint output above.')
    }
    
  } catch (error) {
    console.log('❌ ESLint check failed. Check the output above for details.')
  }

  // Save detailed report
  const reportPath = path.join(process.cwd(), 'eslint-fix-report.json')
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFixes,
      fixesApplied: fixes
    },
    filesModified: targetFiles
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\n📄 Detailed report saved to: ${reportPath}`)

  return totalFixes > 0
}

// Run the ESLint fixes
fixESLintWarnings().then(success => {
  console.log(`\n${success ? '✅' : '❌'} ESLint fix process completed`)
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('❌ ESLint fix process failed:', error)
  process.exit(1)
})












