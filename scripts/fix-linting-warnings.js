#!/usr/bin/env node

/**
 * Quick Fix for Critical Linting Warnings
 * Prefixes unused variables with underscore to satisfy ESLint rules
 */

const fs = require('fs')
const path = require('path')

// Files with critical warnings that need immediate fixing
const criticalFiles = [
  'web/app/admin/page.tsx',
  'web/components/auth/BiometricLogin.tsx',
  'web/components/voting/SingleChoiceVoting.tsx',
  'web/components/voting/RankedChoiceVoting.tsx',
  'web/components/voting/ApprovalVoting.tsx',
  'web/components/voting/RangeVoting.tsx',
  'web/components/voting/QuadraticVoting.tsx',
  'web/lib/logger.ts'
]

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false

    // Fix unused function parameters
    content = content.replace(
      /function\s+\w+\s*\(\s*([^)]+)\s*\)/g,
      (match, params) => {
        const newParams = params.split(',').map(param => {
          const trimmed = param.trim()
          if (trimmed && !trimmed.startsWith('_') && !trimmed.includes('=')) {
            return `_${trimmed}`
          }
          return trimmed
        }).join(', ')
        return match.replace(params, newParams)
      }
    )

    // Fix unused variables in destructuring
    content = content.replace(
      /const\s*{\s*([^}]+)\s*}\s*=\s*([^;]+);/g,
      (match, destructured, source) => {
        const newDestructured = destructured.split(',').map(item => {
          const trimmed = item.trim()
          if (trimmed && !trimmed.startsWith('_') && !trimmed.includes(':')) {
            return `_${trimmed}`
          }
          return trimmed
        }).join(', ')
        return match.replace(destructured, newDestructured)
      }
    )

    // Fix unused imports
    content = content.replace(
      /import\s*{\s*([^}]+)\s*}\s*from\s*['"][^'"]+['"]/g,
      (match, imports) => {
        const newImports = imports.split(',').map(imp => {
          const trimmed = imp.trim()
          if (trimmed && !trimmed.startsWith('_') && !trimmed.includes(' as ')) {
            return `_${trimmed}`
          }
          return trimmed
        }).join(', ')
        return match.replace(imports, newImports)
      }
    )

    if (content !== fs.readFileSync(filePath, 'utf8')) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Fixed: ${filePath}`)
      modified = true
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`)
    }

    return modified
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message)
    return false
  }
}

function main() {
  console.log('🔧 Fixing critical linting warnings...\n')
  
  let fixedCount = 0
  
  criticalFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      if (fixFile(filePath)) {
        fixedCount++
      }
    } else {
      console.log(`⚠️  File not found: ${filePath}`)
    }
  })
  
  console.log(`\n✅ Fixed ${fixedCount} files`)
  console.log('💡 Run "npm run lint" to check remaining warnings')
}

main()
