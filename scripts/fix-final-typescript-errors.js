const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing final TypeScript errors...');

// Fix the destructured parameter syntax errors
function fixDestructuredParameters(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !['node_modules', '.next', '.git', 'archive'].includes(file.name)) {
      fixDestructuredParameters(fullPath);
    } else if (file.isFile() && /\.(ts|tsx)$/.test(file.name)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      // Fix destructured parameters with incorrect type annotations
      // Pattern: ([param: any, param2: any]: any) => 
      // Should be: ([param, param2]) =>
      content = content.replace(
        /\(\[([^)]+)\]: any\) =>/g,
        (match, params) => {
          const cleanParams = params.replace(/:\s*any/g, '');
          return `([${cleanParams}]) =>`;
        }
      );
      
      // Fix single destructured parameters
      content = content.replace(
        /\(([^)]+): any\) =>/g,
        (match, param) => {
          if (param.includes('[') && param.includes(']')) {
            // This is a destructured parameter
            const cleanParam = param.replace(/:\s*any/g, '');
            return `(${cleanParam}) =>`;
          }
          return match;
        }
      );
      
      // Fix the specific middleware issue with duplicate 'any' identifiers
      content = content.replace(
        /\(\{ name: any, value: any, options \}: any\)/g,
        '({ name, value, options })'
      );
      
      if (content !== fs.readFileSync(fullPath, 'utf8')) {
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Fixed destructured parameters in ${fullPath}`);
        modified = true;
      }
    }
  });
}

// Fix null check issues in service files
function fixNullChecks(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !['node_modules', '.next', '.git', 'archive'].includes(file.name)) {
      fixNullChecks(fullPath);
    } else if (file.isFile() && /\.(ts|tsx)$/.test(file.name)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      // Fix this.supabase null check issues by adding null checks
      if (content.includes('this.supabase') && content.includes('class')) {
        // Add null check before using this.supabase
        content = content.replace(
          /const \{ data, error \} = await this\.supabase/g,
          'if (!this.supabase) { throw new Error(\'Supabase client not available\'); }\n      const { data, error } = await this.supabase'
        );
        
        // Fix other this.supabase usages
        content = content.replace(
          /let query = this\.supabase/g,
          'if (!this.supabase) { throw new Error(\'Supabase client not available\'); }\n      let query = this.supabase'
        );
        
        content = content.replace(
          /let queryBuilder = this\.supabase/g,
          'if (!this.supabase) { throw new Error(\'Supabase client not available\'); }\n      let queryBuilder = this.supabase'
        );
        
        content = content.replace(
          /await this\.supabase/g,
          'if (!this.supabase) { throw new Error(\'Supabase client not available\'); }\n      await this.supabase'
        );
        
        modified = true;
      }
      
      // Fix error.message without type guards
      content = content.replace(
        /error\.message/g,
        'error instanceof Error ? error.message : "Unknown error"'
      );
      
      // Fix authContext null check
      content = content.replace(
        /authContext\.user\?\.id/g,
        'authContext?.user?.id'
      );
      
      // Fix currentUser null check
      content = content.replace(
        /this\.currentUser\./g,
        'this.currentUser?.'
      );
      
      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Fixed null checks in ${fullPath}`);
      }
    }
  });
}

// Fix type issues
function fixTypeIssues(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !['node_modules', '.next', '.git', 'archive'].includes(file.name)) {
      fixTypeIssues(fullPath);
    } else if (file.isFile() && /\.(ts|tsx)$/.test(file.name)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      // Fix reviewedAt type issue
      content = content.replace(
        /reviewedAt: Date;/g,
        'reviewedAt?: Date;'
      );
      
      // Fix pwaFeatures type issues
      content = content.replace(
        /pwaFeatures: \{/g,
        'pwaFeatures: {'
      );
      
      // Fix testData indexing issue
      content = content.replace(
        /!testData\[field\]/g,
        '!(field in testData)'
      );
      
      // Fix PRIVACY_DESCRIPTIONS indexing
      content = content.replace(
        /PRIVACY_DESCRIPTIONS\[level\]/g,
        'PRIVACY_DESCRIPTIONS[level as keyof typeof PRIVACY_DESCRIPTIONS]'
      );
      
      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Fixed type issues in ${fullPath}`);
      }
    }
  });
}

const webDir = path.join(__dirname, '../web');

// Run all fixes
fixDestructuredParameters(webDir);
fixNullChecks(webDir);
fixTypeIssues(webDir);

console.log('🎉 All final TypeScript errors should be fixed!');
console.log('📝 Run "npm run type-check" to verify the fixes');
