#!/usr/bin/env node

/**
 * COMPREHENSIVE Codebase Database Usage Analysis
 * Maps ALL database interactions in the codebase
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

async function analyzeCodebaseDatabaseUsage() {
  console.log('🔍 ANALYZING CODEBASE DATABASE USAGE');
  console.log('====================================\n');

  const analysis = {
    extraction_date: new Date().toISOString(),
    total_files_analyzed: 0,
    database_interactions: {
      supabase_calls: [],
      table_usage: {},
      api_endpoints: [],
      authentication_flows: [],
      admin_functions: [],
      background_jobs: []
    },
    summary: {
      total_supabase_calls: 0,
      unique_tables_used: 0,
      api_endpoints_with_db: 0,
      auth_flows: 0,
      admin_functions: 0
    }
  };

  try {
    // 1. Analyze all TypeScript/JavaScript files
    console.log('📁 SCANNING CODEBASE FILES...');
    const files = getAllCodeFiles('web');
    console.log(`Found ${files.length} code files to analyze`);

    for (const file of files) {
      console.log(`\n📄 Analyzing: ${file}`);
      const content = readFileSync(file, 'utf8');
      const fileAnalysis = analyzeFile(file, content);
      
      if (fileAnalysis.hasDatabaseUsage) {
        analysis.database_interactions.supabase_calls.push(...fileAnalysis.supabase_calls);
        analysis.database_interactions.api_endpoints.push(...fileAnalysis.api_endpoints);
        analysis.database_interactions.authentication_flows.push(...fileAnalysis.auth_flows);
        analysis.database_interactions.admin_functions.push(...fileAnalysis.admin_functions);
        
        // Update table usage
        fileAnalysis.table_usage.forEach(table => {
          if (!analysis.database_interactions.table_usage[table]) {
            analysis.database_interactions.table_usage[table] = [];
          }
          analysis.database_interactions.table_usage[table].push(file);
        });
      }
      
      analysis.total_files_analyzed++;
    }

    // 2. Generate comprehensive analysis
    console.log('\n📊 GENERATING ANALYSIS REPORTS...');
    
    // Update summary
    analysis.summary.total_supabase_calls = analysis.database_interactions.supabase_calls.length;
    analysis.summary.unique_tables_used = Object.keys(analysis.database_interactions.table_usage).length;
    analysis.summary.api_endpoints_with_db = analysis.database_interactions.api_endpoints.length;
    analysis.summary.auth_flows = analysis.database_interactions.authentication_flows.length;
    analysis.summary.admin_functions = analysis.database_interactions.admin_functions.length;

    // Generate documentation
    const codebaseDoc = generateCodebaseDocumentation(analysis);
    writeFileSync('database/CODEBASE_DATABASE_USAGE_ANALYSIS.md', codebaseDoc);
    
    // Generate JSON data
    writeFileSync('database/codebase_database_usage.json', JSON.stringify(analysis, null, 2));
    
    // Generate table usage report
    const tableUsageDoc = generateTableUsageReport(analysis);
    writeFileSync('database/TABLE_USAGE_REPORT.md', tableUsageDoc);
    
    console.log('\n✅ CODEBASE DATABASE USAGE ANALYSIS COMPLETED!');
    console.log(`📊 Total files analyzed: ${analysis.total_files_analyzed}`);
    console.log(`📊 Total Supabase calls: ${analysis.summary.total_supabase_calls}`);
    console.log(`📊 Unique tables used: ${analysis.summary.unique_tables_used}`);
    console.log(`📝 Documentation generated: database/CODEBASE_DATABASE_USAGE_ANALYSIS.md`);
    console.log(`📄 JSON data generated: database/codebase_database_usage.json`);
    console.log(`📋 Table usage report: database/TABLE_USAGE_REPORT.md`);

  } catch (error) {
    console.error('❌ Codebase analysis failed:', error);
  }
}

function getAllCodeFiles(dir) {
  const files = [];
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!['node_modules', '.next', 'dist', 'build'].includes(item)) {
        files.push(...getAllCodeFiles(fullPath));
      }
    } else if (stat.isFile()) {
      const ext = extname(item);
      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

function analyzeFile(filePath, content) {
  const analysis = {
    file: filePath,
    hasDatabaseUsage: false,
    supabase_calls: [],
    table_usage: [],
    api_endpoints: [],
    auth_flows: [],
    admin_functions: []
  };

  // 1. Find all supabase.from() calls
  const supabaseFromRegex = /supabase\.from\(['"`]([^'"`]+)['"`]\)/g;
  let match;
  while ((match = supabaseFromRegex.exec(content)) !== null) {
    analysis.hasDatabaseUsage = true;
    analysis.supabase_calls.push({
      type: 'supabase.from',
      table: match[1],
      line: getLineNumber(content, match.index),
      context: getContext(content, match.index)
    });
    
    if (!analysis.table_usage.includes(match[1])) {
      analysis.table_usage.push(match[1]);
    }
  }

  // 2. Find all supabase.rpc() calls
  const supabaseRpcRegex = /supabase\.rpc\(['"`]([^'"`]+)['"`]\)/g;
  while ((match = supabaseRpcRegex.exec(content)) !== null) {
    analysis.hasDatabaseUsage = true;
    analysis.supabase_calls.push({
      type: 'supabase.rpc',
      function: match[1],
      line: getLineNumber(content, match.index),
      context: getContext(content, match.index)
    });
  }

  // 3. Find all database operations
  const dbOpsRegex = /\.(select|insert|update|delete|upsert)\(/g;
  while ((match = dbOpsRegex.exec(content)) !== null) {
    analysis.hasDatabaseUsage = true;
    analysis.supabase_calls.push({
      type: 'database_operation',
      operation: match[1],
      line: getLineNumber(content, match.index),
      context: getContext(content, match.index)
    });
  }

  // 4. Identify API endpoints
  if (filePath.includes('/api/') && (filePath.includes('/route.ts') || filePath.includes('/route.js'))) {
    analysis.api_endpoints.push({
      endpoint: filePath,
      has_database: analysis.hasDatabaseUsage,
      tables_used: analysis.table_usage
    });
  }

  // 5. Identify authentication flows
  if (filePath.includes('/auth/') || content.includes('webauthn') || content.includes('authentication')) {
    analysis.auth_flows.push({
      file: filePath,
      has_database: analysis.hasDatabaseUsage,
      tables_used: analysis.table_usage
    });
  }

  // 6. Identify admin functions
  if (filePath.includes('/admin/') || content.includes('admin') || content.includes('service_role')) {
    analysis.admin_functions.push({
      file: filePath,
      has_database: analysis.hasDatabaseUsage,
      tables_used: analysis.table_usage
    });
  }

  return analysis;
}

function getLineNumber(content, index) {
  return content.substring(0, index).split('\n').length;
}

function getContext(content, index, contextLength = 100) {
  const start = Math.max(0, index - contextLength);
  const end = Math.min(content.length, index + contextLength);
  return content.substring(start, end).replace(/\n/g, ' ').trim();
}

function generateCodebaseDocumentation(analysis) {
  let doc = `# 🔍 Codebase Database Usage Analysis

**Generated**: ${new Date().toISOString()}  
**Total Files Analyzed**: ${analysis.total_files_analyzed}  
**Total Supabase Calls**: ${analysis.summary.total_supabase_calls}  
**Unique Tables Used**: ${analysis.summary.unique_tables_used}

## 📊 **SUMMARY STATISTICS**

- **Total Files Analyzed**: ${analysis.total_files_analyzed}
- **Total Supabase Calls**: ${analysis.summary.total_supabase_calls}
- **Unique Tables Used**: ${analysis.summary.unique_tables_used}
- **API Endpoints with DB**: ${analysis.summary.api_endpoints_with_db}
- **Authentication Flows**: ${analysis.summary.auth_flows}
- **Admin Functions**: ${analysis.summary.admin_functions}

## 📋 **TABLE USAGE ANALYSIS**

### **Tables Used in Codebase**
| Table | Usage Count | Files | Operations |
|-------|-------------|-------|------------|
`;

  Object.entries(analysis.database_interactions.table_usage).forEach(([table, files]) => {
    const usageCount = analysis.database_interactions.supabase_calls.filter(call => 
      call.table === table
    ).length;
    
    const operations = analysis.database_interactions.supabase_calls
      .filter(call => call.table === table)
      .map(call => call.type)
      .filter((value, index, self) => self.indexOf(value) === index)
      .join(', ');
    
    doc += `| ${table} | ${usageCount} | ${files.length} | ${operations} |\n`;
  });

  doc += `\n## 🔍 **DETAILED USAGE BY FILE**\n\n`;

  analysis.database_interactions.supabase_calls.forEach(call => {
    doc += `### **${call.type}**\n`;
    doc += `- **File**: ${call.file}\n`;
    doc += `- **Line**: ${call.line}\n`;
    doc += `- **Context**: ${call.context}\n\n`;
  });

  return doc;
}

function generateTableUsageReport(analysis) {
  let doc = `# 📊 Table Usage Report

**Generated**: ${new Date().toISOString()}

## 📋 **TABLE USAGE SUMMARY**

| Table | Usage Count | Files | Primary Operations |
|-------|-------------|-------|-------------------|
`;

  Object.entries(analysis.database_interactions.table_usage).forEach(([table, files]) => {
    const usageCount = analysis.database_interactions.supabase_calls.filter(call => 
      call.table === table
    ).length;
    
    const operations = analysis.database_interactions.supabase_calls
      .filter(call => call.table === table)
      .map(call => call.type)
      .filter((value, index, self) => self.indexOf(value) === index)
      .join(', ');
    
    doc += `| ${table} | ${usageCount} | ${files.length} | ${operations} |\n`;
  });

  doc += `\n## 📁 **FILES USING EACH TABLE**\n\n`;

  Object.entries(analysis.database_interactions.table_usage).forEach(([table, files]) => {
    doc += `### **${table}**\n\n`;
    files.forEach(file => {
      doc += `- ${file}\n`;
    });
    doc += `\n`;
  });

  return doc;
}

analyzeCodebaseDatabaseUsage();
