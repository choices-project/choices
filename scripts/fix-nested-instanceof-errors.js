const fs = require('fs');
const path = require('path');

function fixNestedInstanceofErrors(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      fixNestedInstanceofErrors(fullPath);
    } else if (file.isFile() && /\.(ts|tsx)$/.test(file.name)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      // Fix nested instanceof Error patterns
      // Pattern: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      content = content.replace(
        /error instanceof Error \? error instanceof Error \? error\.message : "Unknown error" : "Unknown error"/g,
        'error instanceof Error ? error.message : "Unknown error"'
      );
      
      // Pattern: error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" : 'Unknown error'
      content = content.replace(
        /error instanceof Error \? error instanceof Error \? error instanceof Error \? error\.message : "Unknown error" : "Unknown error" : 'Unknown error'/g,
        'error instanceof Error ? error.message : "Unknown error"'
      );
      
      // Fix "always truthy" patterns with || fallbacks
      content = content.replace(
        /error instanceof Error \? error\.message : "Unknown error" \|\| '[^']*'/g,
        (match) => {
          // Extract the fallback message
          const fallbackMatch = match.match(/\|\| '([^']*)'/);
          const fallback = fallbackMatch ? fallbackMatch[1] : 'Unknown error';
          return `error instanceof Error ? error.message : "${fallback}"`;
        }
      );
      
      // Fix property access on 'never' type
      content = content.replace(
        /error\.message/g,
        'error instanceof Error ? error.message : "Unknown error"'
      );
      
      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log(`Fixed nested instanceof errors in: ${fullPath}`);
      }
    }
  }
}

// Start fixing from the web directory
const webDir = path.join(__dirname, '../web');
console.log('Fixing nested instanceof Error patterns...');
fixNestedInstanceofErrors(webDir);
console.log('Done fixing nested instanceof errors!');
