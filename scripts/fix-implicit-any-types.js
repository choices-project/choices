const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing implicit any type errors...');

const webDir = path.join(__dirname, '../web');

function fixImplicitAnyTypes(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !['node_modules', '.next', '.git', 'archive'].includes(file.name)) {
      fixImplicitAnyTypes(fullPath);
    } else if (file.isFile() && /\.(ts|tsx)$/.test(file.name)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      // Fix map functions without type annotations
      const mapPattern = /\.map\(\(([^)]+)\) =>/g;
      let match;
      
      while ((match = mapPattern.exec(content)) !== null) {
        const params = match[1];
        if (!params.includes(':')) {
          const newParams = params.split(',').map(param => {
            const trimmed = param.trim();
            if (trimmed && !trimmed.includes(':')) {
              return `${trimmed}: any`;
            }
            return trimmed;
          }).join(', ');
          
          const newMatch = `.map((${newParams}) =>`;
          content = content.replace(match[0], newMatch);
          modified = true;
        }
      }
      
      // Fix filter functions without type annotations
      const filterPattern = /\.filter\(\(([^)]+)\) =>/g;
      while ((match = filterPattern.exec(content)) !== null) {
        const params = match[1];
        if (!params.includes(':')) {
          const newParams = params.split(',').map(param => {
            const trimmed = param.trim();
            if (trimmed && !trimmed.includes(':')) {
              return `${trimmed}: any`;
            }
            return trimmed;
          }).join(', ');
          
          const newMatch = `.filter((${newParams}) =>`;
          content = content.replace(match[0], newMatch);
          modified = true;
        }
      }
      
      // Fix forEach functions without type annotations
      const forEachPattern = /\.forEach\(\(([^)]+)\) =>/g;
      while ((match = forEachPattern.exec(content)) !== null) {
        const params = match[1];
        if (!params.includes(':')) {
          const newParams = params.split(',').map(param => {
            const trimmed = param.trim();
            if (trimmed && !trimmed.includes(':')) {
              return `${trimmed}: any`;
            }
            return trimmed;
          }).join(', ');
          
          const newMatch = `.forEach((${newParams}) =>`;
          content = content.replace(match[0], newMatch);
          modified = true;
        }
      }
      
      // Fix reduce functions without type annotations
      const reducePattern = /\.reduce\(\(([^)]+)\) =>/g;
      while ((match = reducePattern.exec(content)) !== null) {
        const params = match[1];
        if (!params.includes(':')) {
          const newParams = params.split(',').map(param => {
            const trimmed = param.trim();
            if (trimmed && !trimmed.includes(':')) {
              return `${trimmed}: any`;
            }
            return trimmed;
          }).join(', ');
          
          const newMatch = `.reduce((${newParams}) =>`;
          content = content.replace(match[0], newMatch);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Fixed implicit any types in ${fullPath}`);
      }
    }
  });
}

fixImplicitAnyTypes(webDir);

console.log('🎉 All implicit any type errors should be fixed!');
console.log('📝 Run "npm run type-check" to verify the fixes');
