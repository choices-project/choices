#!/usr/bin/env node

/**
 * Update Database Types Script
 * 
 * Automatically updates database types from Supabase schema
 * Ensures types are always current and synchronized
 * 
 * Created: October 26, 2025
 * Status: IMPLEMENTING
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const TYPES_DIR = path.join(__dirname, '..', 'web', 'types');
const DATABASE_TYPES_FILE = path.join(TYPES_DIR, 'database.types.ts');
const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'types');

/**
 * Update database types from Supabase schema
 */
async function updateDatabaseTypes() {
  console.log('🔄 Updating database types...');
  
  try {
    // 1. Create backup of current types
    await createBackup();
    
    // 2. Generate new types from Supabase
    console.log('📡 Fetching latest schema from Supabase...');
    
    // Try remote first, then local
    let newTypes;
    try {
      newTypes = execSync('npx supabase gen types typescript --project-id YOUR_PROJECT_ID', { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '..')
      });
    } catch (error) {
      console.log('⚠️ Remote generation failed, trying local...');
      try {
        newTypes = execSync('npx supabase gen types typescript --local', { 
          encoding: 'utf8',
          cwd: path.join(__dirname, '..')
        });
      } catch (localError) {
        console.log('⚠️ Local generation failed, using existing types...');
        newTypes = currentTypes; // Use existing types
      }
    }
    
    // 3. Check if types have changed
    const currentTypes = fs.existsSync(DATABASE_TYPES_FILE) 
      ? fs.readFileSync(DATABASE_TYPES_FILE, 'utf8')
      : '';
    
    if (newTypes === currentTypes) {
      console.log('✅ Database types are already current');
      return;
    }
    
    // 4. Write new types
    fs.writeFileSync(DATABASE_TYPES_FILE, newTypes);
    
    // 5. Check for breaking changes
    const breakingChanges = await detectBreakingChanges(currentTypes, newTypes);
    if (breakingChanges.length > 0) {
      console.log('⚠️ Breaking changes detected:');
      breakingChanges.forEach(change => {
        console.log(`  - ${change.type}: ${change.name} (${change.severity})`);
      });
      
      // Create migration guide
      await createMigrationGuide(breakingChanges);
    }
    
    // 6. Update type imports
    await updateTypeImports();
    
    console.log('✅ Database types updated successfully');
    
  } catch (error) {
    console.error('❌ Failed to update database types:', error.message);
    process.exit(1);
  }
}

/**
 * Create backup of current types
 */
async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, timestamp);
  
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }
  
  if (fs.existsSync(DATABASE_TYPES_FILE)) {
    fs.copyFileSync(DATABASE_TYPES_FILE, path.join(backupPath, 'database.types.ts'));
    console.log(`📦 Backup created: ${backupPath}`);
  }
}

/**
 * Detect breaking changes between old and new types
 */
async function detectBreakingChanges(oldTypes, newTypes) {
  const breakingChanges = [];
  
  // Extract type definitions
  const oldTypeDefinitions = extractTypeDefinitions(oldTypes);
  const newTypeDefinitions = extractTypeDefinitions(newTypes);
  
  // Check for removed types
  for (const oldType of oldTypeDefinitions) {
    const newType = newTypeDefinitions.find(t => t.name === oldType.name);
    if (!newType) {
      breakingChanges.push({
        type: 'removed',
        name: oldType.name,
        severity: 'high'
      });
    }
  }
  
  // Check for changed types
  for (const newType of newTypeDefinitions) {
    const oldType = oldTypeDefinitions.find(t => t.name === newType.name);
    if (oldType && JSON.stringify(oldType) !== JSON.stringify(newType)) {
      breakingChanges.push({
        type: 'changed',
        name: newType.name,
        severity: 'medium'
      });
    }
  }
  
  return breakingChanges;
}

/**
 * Extract type definitions from TypeScript code
 */
function extractTypeDefinitions(code) {
  const types = [];
  
  // Match interface definitions
  const interfaceRegex = /interface\s+(\w+)\s*\{([^}]+)\}/g;
  let match;
  
  while ((match = interfaceRegex.exec(code)) !== null) {
    const name = match[1];
    const body = match[2];
    
    const properties = [];
    const propertyRegex = /(\w+)(\?)?:\s*([^;]+)/g;
    let propMatch;
    
    while ((propMatch = propertyRegex.exec(body)) !== null) {
      properties.push({
        name: propMatch[1],
        optional: !!propMatch[2],
        type: propMatch[3].trim()
      });
    }
    
    types.push({
      name,
      type: 'interface',
      properties
    });
  }
  
  // Match type definitions
  const typeRegex = /type\s+(\w+)\s*=\s*([^;]+)/g;
  
  while ((match = typeRegex.exec(code)) !== null) {
    types.push({
      name: match[1],
      type: 'type',
      definition: match[2].trim()
    });
  }
  
  return types;
}

/**
 * Create migration guide for breaking changes
 */
async function createMigrationGuide(breakingChanges) {
  const guide = `# 🔄 TYPE MIGRATION GUIDE

**Generated:** ${new Date().toISOString()}
**Breaking Changes:** ${breakingChanges.length}

## Breaking Changes

${breakingChanges.map(change => `
### ${change.name} (${change.severity})
- **Type:** ${change.type}
- **Impact:** ${change.severity === 'high' ? 'High - Requires code changes' : 'Medium - Review required'}
- **Action:** ${change.type === 'removed' ? 'Remove usage of this type' : 'Review and update usage'}
`).join('\n')}

## Migration Steps

1. **Review Breaking Changes**: Check each breaking change above
2. **Update Code**: Update any code that uses the changed types
3. **Test Changes**: Run tests to ensure everything works
4. **Deploy**: Deploy the updated code

## Support

If you need help with migration, check the documentation or contact the development team.
`;

  const guidePath = path.join(__dirname, '..', 'MIGRATION_GUIDE.md');
  fs.writeFileSync(guidePath, guide);
  console.log(`📋 Migration guide created: ${guidePath}`);
}

/**
 * Update type imports across the codebase
 */
async function updateTypeImports() {
  console.log('🔗 Updating type imports...');
  
  // Find all TypeScript files that import database types
  const files = execSync('find web -name "*.ts" -o -name "*.tsx" | grep -v node_modules', { 
    encoding: 'utf8' 
  }).trim().split('\n');
  
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    
    let content = fs.readFileSync(file, 'utf8');
    let updated = false;
    
    // Update imports from old database types to new centralized types
    if (content.includes('from \'../types/database\'')) {
      content = content.replace(/from '\.\.\/types\/database'/g, 'from \'@/types/database\'');
      updated = true;
    }
    
    if (content.includes('from \'./types/database\'')) {
      content = content.replace(/from '\.\/types\/database'/g, 'from \'@/types/database\'');
      updated = true;
    }
    
    if (updated) {
      fs.writeFileSync(file, content);
      console.log(`  ✅ Updated imports in ${file}`);
    }
  }
}

/**
 * Validate that types are current
 */
async function validateTypes() {
  console.log('🔍 Validating types...');
  
  try {
    // Check if database types are current
    const currentTypes = execSync('npx supabase gen types typescript --local', { 
      encoding: 'utf8',
      cwd: path.join(__dirname, '..')
    });
    
    const existingTypes = fs.existsSync(DATABASE_TYPES_FILE) 
      ? fs.readFileSync(DATABASE_TYPES_FILE, 'utf8')
      : '';
    
    if (currentTypes !== existingTypes) {
      console.log('❌ Database types are out of date');
      return false;
    }
    
    console.log('✅ All types are current');
    return true;
    
  } catch (error) {
    console.error('❌ Type validation failed:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'update':
      await updateDatabaseTypes();
      break;
    case 'validate':
      await validateTypes();
      break;
    case 'help':
      console.log(`
Usage: node scripts/update-database-types.js [command]

Commands:
  update   - Update database types from Supabase schema
  validate - Validate that types are current
  help     - Show this help message

Examples:
  node scripts/update-database-types.js update
  node scripts/update-database-types.js validate
      `);
      break;
    default:
      console.log('❌ Unknown command. Use "help" for usage information.');
      process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  updateDatabaseTypes,
  validateTypes,
  detectBreakingChanges,
  extractTypeDefinitions
};
