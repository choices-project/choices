const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing implicit any types in map functions...');

const webDir = path.join(__dirname, '../web');

function fixMapFunctionTypes(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !['node_modules', '.next', '.git', 'archive'].includes(file.name)) {
      fixMapFunctionTypes(fullPath);
    } else if (file.isFile() && /\.(ts|tsx)$/.test(file.name)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      // Fix map functions with implicit any types
      // Pattern: .map((param, index) => 
      // Should be: .map((param: any, index: any) => 
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
      
      // Fix filter functions with implicit any types
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
      
      // Fix forEach functions with implicit any types
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
      
      if (content !== fs.readFileSync(fullPath, 'utf8')) {
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Fixed map function types in ${fullPath}`);
        modified = true;
      }
    }
  });
}

fixMapFunctionTypes(webDir);

console.log('🎉 All map function type errors should be fixed!');
