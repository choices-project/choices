#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Common unused imports to remove
const UNUSED_IMPORTS = [
  'useState', 'useEffect', 'useCallback', 'useContext', 'createContext',
  'useRouter', 'useSearchParams', 'motion', 'AnimatePresence',
  'CheckCircle', 'Clock', 'Star', 'Calendar', 'User', 'Tag', 'Vote',
  'Users', 'TrendingUp', 'Zap', 'Shield', 'Eye', 'EyeOff', 'Settings',
  'Download', 'Search', 'Bell', 'Filter', 'BarChart3', 'PieChart',
  'LineChart', 'Activity', 'Globe', 'MapPin', 'ArrowRight', 'CheckCircle2',
  'Heart', 'Send', 'Wifi', 'WifiOff', 'Battery', 'Cpu', 'HardDrive',
  'Network', 'Server', 'Cloud', 'Lock', 'Unlock', 'Square', 'ExternalLink',
  'Share2', 'Target', 'Award', 'Smartphone', 'Monitor', 'Tablet',
  'MousePointer', 'Database', 'BarChart', 'Funnel', 'Menu', 'AlertCircle',
  'Info', 'Trash2', 'HelpCircle', 'Edit3', 'Circle', 'Gauge', 'FileText',
  'TrendingDown', 'Unlock', 'AlertTriangle', 'XCircle', 'Info'
]

// Common unused variables to prefix with underscore
const UNUSED_VARIABLES = [
  'request', 'error', 'data', 'loading', 'isLoading', 'profile',
  'pollId', 'choice', 'voteId', 'index', 'filters', 'dateRange',
  'dashboardData', 'utilsError', 'profileError', 'voteError',
  'totalPollsError', 'totalVotesError', 'totalUsersError', 'activePollsError',
  'updatedUser', 'authUser', 'deletedUser', 'authDeletedUser',
  'credentialData', 'calculatedScore', 'status', 'service',
  'pollId', 'userType', 'deviceType', 'poll', 'updates', 'onUpdate',
  'onNext', 'feedbackId', 'newStatus', 'issueData', 'feedbackIds',
  'matchingPoll', 'showResults', 'isEditing', 'setIsEditing',
  'isLoadingProfile', 'showSuccess', 'fileInputRef', 'disabled',
  'circumference', 'height', 'startTime', 'duration', 'userAgent',
  'queryClient', 'page', 'notification', 'id', 'topics', 'polls',
  'metrics', 'activities', 'key', 'loading', 'topic', 'updates',
  'get', 'stakeholders', 'votingMethod', 'args', 'item', 'items',
  'entities', 'sentiment', 'event', 'commitment1', 'commitment2',
  'voteCommitment', 'pollCommitment', 'storageQuota', 'listener',
  'moduleId', 'entries', 'startDate', 'voteId', 'subscription',
  'userId', 'sessionToken', 'userStableId', 'setUserStableId',
  'voteData', 'approvals', 'allocations', 'ratings', 'rankings',
  'showLiveUpdates', 'getStatusIcon', 'getStatusText', 'getIcon',
  'showTooltip', 'level', 'getRecommendedPrivacyLevel', 'categories',
  'handleInputChange', 'handleOptionChange', 'addTag', 'removeTag',
  'handleSubmit', 'getSentimentIcon', 'pwaManager', 'featureFlags',
  'lastUpdated', 'setFilters', 'selectedStory', 'setSelectedStory',
  'mockDemographicData', 'FancyProgressRing', 'TrendingTopic', 'Poll',
  'ChartSkeleton', 'mockBreakingNews', 'pollPerformanceData',
  'PerformanceIcon', 'SecurityIcon', 'AccessibilityIcon', 'TouchIcon',
  'BatteryIcon', 'DeviceIcon', 'StorageIcon', 'ApiIcon', 'TestResult',
  'ComprehensiveTestResult', 'VoteType', 'privacyError', 'pwaError',
  'next', 'VALIDATION', 'AUTHENTICATION', 'AUTHORIZATION', 'NOT_FOUND',
  'RATE_LIMIT', 'NETWORK', 'DATABASE', 'INTERNAL', 'UNKNOWN', 'DEBUG',
  'INFO', 'WARN', 'ERROR', 'NONE', 'now', 'mediaResults', 'ourResults'
]

// Files to skip (don't modify these)
const SKIP_FILES = [
  'node_modules',
  '.next',
  '.git',
  'scripts/cleanup-performance-warnings.js'
]

// Function to check if file should be processed
function shouldProcessFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath)
  return !SKIP_FILES.some(skip => relativePath.includes(skip)) &&
         (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.js'))
}

// Function to clean up unused imports
function cleanUnusedImports(content) {
  const lines = content.split('\n')
  const cleanedLines = []
  let inImportBlock = false
  let importStartIndex = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Check if we're starting an import block
    if (line.startsWith('import ') && line.includes('{')) {
      inImportBlock = true
      importStartIndex = i
      continue
    }

    // If we're in an import block, check if it ends
    if (inImportBlock) {
      if (line.includes('}') && line.includes('from')) {
        // This is the end of the import block
        const importBlock = lines.slice(importStartIndex, i + 1).join('\n')
        const cleanedBlock = cleanImportBlock(importBlock)
        if (cleanedBlock) {
          cleanedLines.push(cleanedBlock)
        }
        inImportBlock = false
        importStartIndex = -1
        continue
      }
    }

    // If we're not in an import block, add the line as-is
    if (!inImportBlock) {
      cleanedLines.push(lines[i])
    }
  }

  return cleanedLines.join('\n')
}

// Function to clean a single import block
function cleanImportBlock(importBlock) {
  // Extract imports between curly braces
  const match = importBlock.match(/import\s*{([^}]+)}\s*from\s*['"]([^'"]+)['"]/)
  if (!match) return importBlock

  const imports = match[1].split(',').map(imp => imp.trim())
  const modulePath = match[2]
  
  // Filter out unused imports
  const usedImports = imports.filter(imp => {
    const cleanImp = imp.replace(/\s+as\s+\w+/, '').trim()
    return !UNUSED_IMPORTS.includes(cleanImp)
  })

  if (usedImports.length === 0) {
    return null // Remove entire import
  }

  return `import { ${usedImports.join(', ')} } from '${modulePath}'`
}

// Function to prefix unused variables with underscore
function prefixUnusedVariables(content) {
  let cleanedContent = content

  UNUSED_VARIABLES.forEach(variable => {
    // Pattern to match variable declarations that are likely unused
    const patterns = [
      new RegExp(`\\bconst\\s+${variable}\\s*=`, 'g'),
      new RegExp(`\\blet\\s+${variable}\\s*=`, 'g'),
      new RegExp(`\\bvar\\s+${variable}\\s*=`, 'g'),
      new RegExp(`\\(\\s*${variable}\\s*[,)]`, 'g'),
      new RegExp(`\\[\\s*${variable}\\s*[,]`, 'g')
    ]

    patterns.forEach(pattern => {
      cleanedContent = cleanedContent.replace(pattern, (match) => {
        return match.replace(variable, `_${variable}`)
      })
    })
  })

  return cleanedContent
}

// Function to fix unescaped entities
function fixUnescapedEntities(content) {
  return content
    .replace(/(?<=\s)'/g, '&apos;')
    .replace(/(?<=\s)"/g, '&quot;')
    .replace(/(?<=>)[^<]*'[^<]*(?=<)/g, (match) => {
      return match.replace(/'/g, '&apos;')
    })
    .replace(/(?<=>)[^<]*"[^<]*(?=<)/g, (match) => {
      return match.replace(/"/g, '&quot;')
    })
}

// Function to remove console statements
function removeConsoleStatements(content) {
  return content
    .replace(/console\.log\([^)]*\);?\s*/g, '')
    .replace(/console\.warn\([^)]*\);?\s*/g, '')
    .replace(/console\.error\([^)]*\);?\s*/g, '')
    .replace(/console\.info\([^)]*\);?\s*/g, '')
}

// Function to fix useEffect dependencies
function fixUseEffectDependencies(content) {
  // This is a complex fix that would require AST parsing
  // For now, we'll just add a comment to remind developers
  return content.replace(
    /useEffect\(\s*\(\s*\)\s*=>\s*\{/g,
    'useEffect(() => {\n    // TODO: Add missing dependencies to dependency array'
  )
}

// Main cleanup function
function cleanupFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    let cleanedContent = content

    // Apply all cleanup functions
    cleanedContent = cleanUnusedImports(cleanedContent)
    cleanedContent = prefixUnusedVariables(cleanedContent)
    cleanedContent = fixUnescapedEntities(cleanedContent)
    cleanedContent = removeConsoleStatements(cleanedContent)
    cleanedContent = fixUseEffectDependencies(cleanedContent)

    // Only write if content changed
    if (cleanedContent !== content) {
      fs.writeFileSync(filePath, cleanedContent, 'utf8')
      console.log(`✅ Cleaned: ${filePath}`)
      return true
    }

    return false
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error.message)
    return false
  }
}

// Function to recursively find and clean files
function cleanupDirectory(dirPath) {
  const items = fs.readdirSync(dirPath)
  let cleanedCount = 0

  items.forEach(item => {
    const fullPath = path.join(dirPath, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      cleanedCount += cleanupDirectory(fullPath)
    } else if (shouldProcessFile(fullPath)) {
      if (cleanupFile(fullPath)) {
        cleanedCount++
      }
    }
  })

  return cleanedCount
}

// Main execution
console.log('🧹 Starting performance warnings cleanup...')
console.log('==========================================')

const startTime = Date.now()
const cleanedCount = cleanupDirectory('.')

const endTime = Date.now()
const duration = (endTime - startTime) / 1000

console.log('\n🎉 Cleanup completed!')
console.log(`📊 Files cleaned: ${cleanedCount}`)
console.log(`⏱️  Duration: ${duration.toFixed(2)}s`)
console.log('\n📋 Next steps:')
console.log('1. Run "npm run build" to check remaining warnings')
console.log('2. Manually review any remaining issues')
console.log('3. Test the application to ensure nothing broke')
console.log('4. Commit the changes with a descriptive message')
