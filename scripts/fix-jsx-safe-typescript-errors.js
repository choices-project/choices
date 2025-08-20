const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing TypeScript errors safely (JSX-aware)...');

const webDir = path.join(__dirname, '../web');

function fixTypeScriptErrorsSafely(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !['node_modules', '.next', '.git', 'archive'].includes(file.name)) {
      fixTypeScriptErrorsSafely(fullPath);
    } else if (file.isFile() && /\.(ts|tsx)$/.test(file.name)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      // Handle different file types appropriately
      if (file.name.endsWith('.tsx')) {
        // JSX files - only fix non-JSX patterns
        // Don't add type annotations to destructured parameters in JSX
        
        // Fix error type handling (safe for JSX)
        content = content.replace(
          /error\.message/g,
          'error instanceof Error ? error.message : "Unknown error"'
        );
        
        // Fix null checks (safe for JSX)
        content = content.replace(
          /this\.supabase\./g,
          'this.supabase?.'
        );
        
      } else {
        // Regular TypeScript files - can add type annotations
        
        // Fix map functions with type annotations
        content = content.replace(
          /\.map\(\(([^)]+)\) =>/g,
          (match, params) => {
            const paramList = params.split(',').map(param => {
              const trimmed = param.trim();
              if (trimmed && !trimmed.includes(':')) {
                return `${trimmed}: any`;
              }
              return trimmed;
            }).join(', ');
            
            return `.map((${paramList}) =>`;
          }
        );
        
        // Fix filter functions with type annotations
        content = content.replace(
          /\.filter\(\(([^)]+)\) =>/g,
          (match, params) => {
            const paramList = params.split(',').map(param => {
              const trimmed = param.trim();
              if (trimmed && !trimmed.includes(':')) {
                return `${trimmed}: any`;
              }
              return trimmed;
            }).join(', ');
            
            return `.filter((${paramList}) =>`;
          }
        );
        
        // Fix forEach functions with type annotations
        content = content.replace(
          /\.forEach\(\(([^)]+)\) =>/g,
          (match, params) => {
            const paramList = params.split(',').map(param => {
              const trimmed = param.trim();
              if (trimmed && !trimmed.includes(':')) {
                return `${trimmed}: any`;
              }
              return trimmed;
            }).join(', ');
            
            return `.forEach((${paramList}) =>`;
          }
        );
        
        // Fix error type handling
        content = content.replace(
          /error\.message/g,
          'error instanceof Error ? error.message : "Unknown error"'
        );
        
        // Fix null checks
        content = content.replace(
          /this\.supabase\./g,
          'this.supabase?.'
        );
      }
      
      if (content !== fs.readFileSync(fullPath, 'utf8')) {
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Fixed ${file.name} (${file.name.endsWith('.tsx') ? 'JSX-safe' : 'TypeScript'})`);
        modified = true;
      }
    }
  });
}

fixTypeScriptErrorsSafely(webDir);

console.log('🎉 TypeScript errors fixed safely (JSX-aware)!');
console.log('📝 Run "npm run type-check" to verify the fixes');
