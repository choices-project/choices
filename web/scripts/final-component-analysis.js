/**
 * Final Component Usage Analysis - Next.js Aware
 * 
 * This script performs the final analysis accounting for Next.js file-based routing
 * and identifies truly unused components vs. page components that are auto-routed.
 * 
 * Created: October 26, 2025
 * Updated: October 26, 2025
 */

const fs = require('fs');
const path = require('path');

class NextJSAwareAnalyzer {
  constructor() {
    this.pageComponents = new Set();
    this.layoutComponents = new Set();
    this.imports = new Map();
    this.exports = new Map();
    this.usage = new Map();
    this.trulyUnused = [];
    this.pageComponentsFound = [];
  }

  /**
   * Identify Next.js page and layout components
   */
  identifyNextJSComponents() {
    const findNextJSFiles = (dir, type) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          findNextJSFiles(filePath, type);
        } else if (file === 'page.tsx' || file === 'page.ts') {
          this.pageComponents.add(filePath);
          this.pageComponentsFound.push({
            path: filePath,
            route: this.getRouteFromPath(filePath),
            type: 'page'
          });
        } else if (file === 'layout.tsx' || file === 'layout.ts') {
          this.layoutComponents.add(filePath);
          this.pageComponentsFound.push({
            path: filePath,
            route: this.getRouteFromPath(filePath),
            type: 'layout'
          });
        }
      }
    };

    findNextJSFiles('app', 'page');
  }

  /**
   * Convert file path to route
   */
  getRouteFromPath(filePath) {
    return filePath
      .replace('app/', '/')
      .replace('/page.tsx', '')
      .replace('/page.ts', '')
      .replace('/layout.tsx', '')
      .replace('/layout.ts', '');
  }

  /**
   * Scan for actual imports and usage
   */
  scanForImports() {
    const scanDirectory = (dir) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          scanDirectory(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
          this.analyzeFile(filePath);
        }
      }
    };

    scanDirectory('.');
  }

  /**
   * Analyze a single file
   */
  analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract imports
      const importMatches = content.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
      if (importMatches) {
        for (const match of importMatches) {
          const importPath = match.match(/from\s+['"]([^'"]+)['"]/)[1];
          this.imports.set(importPath, (this.imports.get(importPath) || 0) + 1);
        }
      }

      // Extract exports
      const exportMatches = content.match(/export\s+(?:const|function|class|interface|type)\s+(\w+)/g);
      if (exportMatches) {
        for (const match of exportMatches) {
          const exportName = match.match(/export\s+(?:const|function|class|interface|type)\s+(\w+)/)[1];
          this.exports.set(exportName, filePath);
        }
      }

      // Track component usage
      const componentMatches = content.match(/<(\w+)/g);
      if (componentMatches) {
        for (const match of componentMatches) {
          const componentName = match.match(/<(\w+)/)[1];
          this.usage.set(componentName, (this.usage.get(componentName) || 0) + 1);
        }
      }

    } catch (error) {
      // Ignore errors
    }
  }

  /**
   * Identify truly unused components (excluding Next.js pages)
   */
  identifyTrulyUnused() {
    const flaggedUnused = [
      'SophisticatedAnalytics',
      'MobileCandidateCard', 
      'fecService',
      'EditProfilePage',
      'AnalyticsPage',
      'SystemSettingsPage',
      'CreatePollPage',
      'getPWAAnalytics'
    ];

    for (const component of flaggedUnused) {
      const isExported = this.exports.has(component);
      const isUsed = this.usage.has(component) && this.usage.get(component) > 0;
      const isImported = Array.from(this.imports.keys()).some(importPath => 
        importPath.includes(component.toLowerCase()) || importPath.includes(component)
      );
      const isNextJSPage = this.pageComponentsFound.some(page => 
        page.path.includes(component.toLowerCase()) || page.path.includes(component)
      );

      if (isNextJSPage) {
        console.log(`✅ ${component} is a Next.js page component (auto-routed)`);
      } else if (!isExported && !isUsed && !isImported) {
        this.trulyUnused.push({
          name: component,
          reason: 'Not exported, not used, not imported',
          confidence: 'high'
        });
      } else if (!isUsed && !isImported) {
        this.trulyUnused.push({
          name: component,
          reason: 'Exported but not used or imported',
          confidence: 'medium'
        });
      } else {
        console.log(`✅ ${component} is being used (exports: ${isExported}, usage: ${isUsed}, imports: ${isImported})`);
      }
    }
  }

  /**
   * Generate final report
   */
  generateFinalReport() {
    console.log('🎯 Final Component Usage Analysis - Next.js Aware');
    console.log('================================================');
    
    this.identifyNextJSComponents();
    this.scanForImports();
    this.identifyTrulyUnused();
    
    console.log(`\n📊 Analysis Results:`);
    console.log(`Next.js Page Components: ${this.pageComponents.size}`);
    console.log(`Next.js Layout Components: ${this.layoutComponents.size}`);
    console.log(`Total Exports Found: ${this.exports.size}`);
    console.log(`Total Imports Found: ${this.imports.size}`);
    console.log(`Total Usage Patterns: ${this.usage.size}`);
    
    console.log(`\n📄 Next.js Page Components Found:`);
    this.pageComponentsFound.forEach(page => {
      console.log(`  - ${page.route} (${page.type})`);
    });
    
    console.log(`\n❌ Truly Unused Components (${this.trulyUnused.length}):`);
    this.trulyUnused.forEach(comp => {
      console.log(`  - ${comp.name}: ${comp.reason} (${comp.confidence} confidence)`);
    });

    console.log(`\n💡 Final Recommendations:`);
    if (this.trulyUnused.length > 0) {
      console.log(`1. Archive ${this.trulyUnused.length} truly unused components`);
      console.log(`2. Estimated savings: ~${this.trulyUnused.length * 20}KB`);
    } else {
      console.log(`1. No truly unused components found!`);
      console.log(`2. All flagged components are either Next.js pages or actively used`);
    }
    
    console.log(`3. Focus on optimizing existing implementations rather than removing components`);
    console.log(`4. Consider bundle splitting for large components`);
    
    return { trulyUnused: this.trulyUnused, pageComponents: this.pageComponentsFound };
  }
}

// Run the final analysis
const analyzer = new NextJSAwareAnalyzer();
const results = analyzer.generateFinalReport();

console.log('\n✅ Final analysis complete!');
