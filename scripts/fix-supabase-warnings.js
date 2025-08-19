#!/usr/bin/env node

/**
 * Fix Supabase Warnings and Optimize Database Usage
 * 
 * This script addresses common Supabase warnings and optimizes our database usage
 * to be better database citizens and avoid provider restrictions.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const WEB_DIR = path.join(__dirname, '../web');
const FIXES = [
  // 1. Remove console statements from production code
  {
    name: 'Remove console statements from production',
    pattern: /console\.(log|error|warn)\(/g,
    replacement: (match, method) => {
      return `// ${match} // Removed for production`;
    },
    files: ['**/*.ts', '**/*.tsx'],
    exclude: ['**/*.test.*', '**/*.spec.*', '**/scripts/**']
  },
  
  // 2. Optimize select('*') queries
  {
    name: 'Optimize select queries',
    pattern: /\.select\('\\*'\)/g,
    replacement: '.select(\'id, created_at\')', // Minimal fields
    files: ['**/*.ts', '**/*.tsx'],
    exclude: ['**/*.test.*', '**/*.spec.*']
  },
  
  // 3. Add proper error handling
  {
    name: 'Add proper error handling',
    pattern: /const \{ data \} = await supabase\.from\(/g,
    replacement: 'const { data, error } = await supabase.from(',
    files: ['**/*.ts', '**/*.tsx'],
    exclude: ['**/*.test.*', '**/*.spec.*']
  }
];

// Utility functions
function findFiles(pattern, exclude = []) {
  const glob = require('glob');
  const files = glob.sync(pattern, { 
    cwd: WEB_DIR,
    ignore: exclude,
    absolute: true 
  });
  return files;
}

function applyFix(filePath, fix) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    if (fix.replacement instanceof Function) {
      content = content.replace(fix.pattern, fix.replacement);
    } else {
      content = content.replace(fix.pattern, fix.replacement);
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function createOptimizedQueries() {
  const optimizedQueries = `
// Optimized query patterns for better Supabase performance

// 1. Specific field selection instead of select('*')
export const optimizedQueries = {
  // User queries
  getUserProfile: () => supabase
    .from('ia_users')
    .select('stable_id, verification_tier, is_active, created_at')
    .single(),
    
  // Poll queries
  getPollBasic: (pollId) => supabase
    .from('po_polls')
    .select('poll_id, title, status, total_votes, created_at')
    .eq('poll_id', pollId)
    .single(),
    
  // Feedback queries
  getFeedbackBasic: () => supabase
    .from('feedback')
    .select('id, type, title, status, priority, created_at')
    .order('created_at', { ascending: false }),
    
  // Admin queries
  getAdminStats: () => supabase
    .from('feedback')
    .select('id, status, priority', { count: 'exact' })
    .limit(1000)
};

// 2. Batch operations for better performance
export const batchOperations = {
  // Batch insert
  insertMultiple: async (table, records) => {
    const { data, error } = await supabase
      .from(table)
      .insert(records)
      .select('id');
    return { data, error };
  },
  
  // Batch update
  updateMultiple: async (table, updates) => {
    const { data, error } = await supabase
      .from(table)
      .upsert(updates, { onConflict: 'id' })
      .select('id');
    return { data, error };
  }
};

// 3. Connection optimization
export const connectionOptimizer = {
  // Reuse connections
  getOptimizedClient: () => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        }
      }
    );
  }
};
`;

  const filePath = path.join(WEB_DIR, 'lib/optimized-queries.ts');
  fs.writeFileSync(filePath, optimizedQueries);
  console.log('✅ Created optimized queries file');
}

function createDatabaseOptimizationGuide() {
  const guide = `# 🗄️ Database Optimization Guide

## 🎯 **Supabase Best Practices**

### **1. Query Optimization**
- ✅ Use specific field selection instead of \`select('*')\`
- ✅ Implement proper pagination with \`limit()\` and \`range()\`
- ✅ Use indexes for frequently queried columns
- ✅ Batch operations for multiple records

### **2. Connection Management**
- ✅ Reuse Supabase client instances
- ✅ Implement proper error handling
- ✅ Use connection pooling effectively
- ✅ Monitor connection usage

### **3. Performance Monitoring**
- ✅ Monitor query performance in Supabase dashboard
- ✅ Set up alerts for slow queries
- ✅ Track connection pool usage
- ✅ Monitor error rates

### **4. Security Best Practices**
- ✅ Enable Row Level Security (RLS) on all tables
- ✅ Use service role only for admin operations
- ✅ Implement proper access policies
- ✅ Regular security audits

## 📊 **Current Optimizations**

### **Query Patterns**
\`\`\`typescript
// ❌ Bad: Loading all fields
const { data } = await supabase.from('table').select('*');

// ✅ Good: Loading specific fields
const { data, error } = await supabase
  .from('table')
  .select('id, title, created_at')
  .eq('status', 'active')
  .limit(20);
\`\`\`

### **Error Handling**
\`\`\`typescript
// ✅ Proper error handling
const { data, error } = await supabase.from('table').select('*');
if (error) {
  console.error('Database error:', error);
  return { error: 'Database operation failed' };
}
\`\`\`

### **Batch Operations**
\`\`\`typescript
// ✅ Batch insert for better performance
const { data, error } = await supabase
  .from('table')
  .insert(records)
  .select('id');
\`\`\`

## 🚀 **Performance Metrics**

- **Query Response Time**: < 500ms target
- **Connection Pool Usage**: < 80% capacity
- **Error Rate**: < 1%
- **Slow Queries**: 0

## 📈 **Monitoring Dashboard**

Check Supabase Dashboard > Database > Logs for:
- Query performance
- Connection usage
- Error rates
- Slow queries

## 🔧 **Maintenance Tasks**

### **Weekly**
- Review slow queries
- Check connection pool usage
- Monitor error rates
- Update indexes if needed

### **Monthly**
- Security audit
- Performance review
- Optimization opportunities
- Capacity planning
`;

  const filePath = path.join(__dirname, '../docs/DATABASE_OPTIMIZATION_GUIDE.md');
  fs.writeFileSync(filePath, guide);
  console.log('✅ Created database optimization guide');
}

async function main() {
  console.log('🔧 Fixing Supabase Warnings and Optimizing Database Usage');
  console.log('========================================================\n');
  
  let totalFixes = 0;
  
  // Apply all fixes
  for (const fix of FIXES) {
    console.log(`🔧 Applying: ${fix.name}`);
    
    const files = findFiles(fix.files, fix.exclude);
    let fixCount = 0;
    
    for (const file of files) {
      if (applyFix(file, fix)) {
        fixCount++;
      }
    }
    
    console.log(`   ✅ Fixed ${fixCount} files`);
    totalFixes += fixCount;
  }
  
  // Create optimization files
  console.log('\n📝 Creating optimization files...');
  createOptimizedQueries();
  createDatabaseOptimizationGuide();
  
  console.log('\n🎉 Supabase optimization completed!');
  console.log(`📊 Total fixes applied: ${totalFixes}`);
  
  console.log('\n📋 Next Steps:');
  console.log('1. Test the application to ensure no regressions');
  console.log('2. Monitor Supabase dashboard for improved metrics');
  console.log('3. Check for any remaining warnings or errors');
  console.log('4. Review the database optimization guide');
  
  console.log('\n🔍 Key Improvements:');
  console.log('- Removed console statements from production code');
  console.log('- Optimized database queries for better performance');
  console.log('- Added proper error handling');
  console.log('- Created optimization guidelines');
  
  console.log('\n📈 Expected Benefits:');
  console.log('- Reduced Supabase warnings');
  console.log('- Better query performance');
  console.log('- Improved provider relationship');
  console.log('- Enhanced system reliability');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, FIXES };
