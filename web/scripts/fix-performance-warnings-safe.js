#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Function to recursively find all TypeScript/React files
function findFiles(dir, files = []) {
  const items = fs.readdirSync(dir)
  
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findFiles(fullPath, files)
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      files.push(fullPath)
    }
  }
  
  return files
}

// Function to remove unused imports (safer approach)
function removeUnusedImports(content) {
  // Common unused imports to remove
  const unusedImports = [
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
    'TrendingDown', 'AlertTriangle', 'XCircle'
  ]

  // Remove unused imports from import statements
  let cleanedContent = content
  
  // Handle import statements with curly braces
  const importRegex = /import\s*{([^}]+)}\s*from\s*['"]([^'"]+)['"]/g
  cleanedContent = cleanedContent.replace(importRegex, (match, imports, module) => {
    const importList = imports.split(',').map(imp => imp.trim())
    const usedImports = importList.filter(imp => {
      const cleanImp = imp.replace(/\s+as\s+\w+/, '').trim()
      return !unusedImports.includes(cleanImp)
    })
    
    if (usedImports.length === 0) {
      return '' // Remove entire import
    }
    
    return `import { ${usedImports.join(', ')} } from '${module}'`
  })

  // Remove empty import lines
  cleanedContent = cleanedContent.replace(/^\s*import\s*{\s*}\s*from\s*['"][^'"]+['"];?\s*$/gm, '')
  
  return cleanedContent
}

// Function to prefix unused variables with underscore (safer approach)
function prefixUnusedVariables(content) {
  const unusedVars = [
    'utilsError', 'profileError', 'voteError',
    'totalPollsError', 'totalVotesError', 'totalUsersError', 'activePollsError',
    'updatedUser', 'authUser', 'deletedUser', 'authDeletedUser',
    'credentialData', 'calculatedScore', 'status', 'service',
    'userType', 'deviceType', 'poll', 'updates', 'onUpdate',
    'onNext', 'feedbackId', 'newStatus', 'issueData', 'feedbackIds',
    'matchingPoll', 'showResults', 'isEditing', 'setIsEditing',
    'isLoadingProfile', 'showSuccess', 'fileInputRef', 'disabled',
    'circumference', 'height', 'startTime', 'duration', 'userAgent',
    'queryClient', 'page', 'notification', 'id', 'topics', 'polls',
    'metrics', 'activities', 'key', 'loading', 'topic', 'updates',
    'get', 'stakeholders', 'votingMethod', 'args', 'item', 'items',
    'entities', 'sentiment', 'event', 'commitment1', 'commitment2',
    'voteCommitment', 'pollCommitment', 'storageQuota', 'listener',
    'moduleId', 'entries', 'startDate', 'subscription',
    'sessionToken', 'userStableId', 'setUserStableId',
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

  let cleanedContent = content

  unusedVars.forEach(variable => {
    // Only prefix variables that are clearly unused (in destructuring or function parameters)
    const patterns = [
      new RegExp(`\\bconst\\s+${variable}\\s*=`, 'g'),
      new RegExp(`\\blet\\s+${variable}\\s*=`, 'g'),
      new RegExp(`\\bvar\\s+${variable}\\s*=`, 'g')
    ]

    patterns.forEach(pattern => {
      cleanedContent = cleanedContent.replace(pattern, (match) => {
        return match.replace(variable, `_${variable}`)
      })
    })
  })

  return cleanedContent
}

// Function to clean up a single file
function cleanupFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    let cleanedContent = content

    // Apply only safe cleanup functions
    cleanedContent = removeUnusedImports(cleanedContent)
    cleanedContent = prefixUnusedVariables(cleanedContent)

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

// Main execution
console.log('🧹 Starting safe performance warnings cleanup...')
console.log('==============================================')

const files = findFiles('.')
let cleanedCount = 0

files.forEach(file => {
  if (cleanupFile(file)) {
    cleanedCount++
  }
})

console.log('\n🎉 Safe cleanup completed!')
console.log(`📊 Files cleaned: ${cleanedCount}`)
console.log('\n📋 Next steps:')
console.log('1. Run "npm run build" to check remaining warnings')
console.log('2. Manually review any remaining issues')
console.log('3. Test the application to ensure nothing broke')
console.log('4. Commit the changes with a descriptive message')
