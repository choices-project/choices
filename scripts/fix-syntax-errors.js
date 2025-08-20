const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing syntax errors from incorrect null check placement...');

const filesToFix = [
  '../web/lib/real-time-news-service.ts',
  '../web/lib/poll-narrative-system.ts',
  '../web/lib/media-bias-analysis.ts',
  '../web/lib/hybrid-voting-service.ts'
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix the syntax error: const { ... } = if (!this.supabase) { ... }
    // Should be: if (!this.supabase) { ... } const { ... } = await this.supabase
    content = content.replace(
      /const \{ ([^}]+) \} = if \(!this\.supabase\) \{ throw new Error\('Supabase client not available'\); \}/g,
      'if (!this.supabase) { throw new Error(\'Supabase client not available\'); }\n    const { $1 } = await this.supabase'
    );
    
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed syntax errors in ${filePath}`);
  }
});

console.log('🎉 All syntax errors should be fixed!');
