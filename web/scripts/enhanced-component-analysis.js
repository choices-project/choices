/**
 * Enhanced Component Usage Analysis
 * 
 * This script performs a more accurate analysis of component usage by:
 * 1. Checking actual import statements
 * 2. Verifying component exports
 * 3. Identifying truly unused vs. undetected components
 * 
 * Created: October 26, 2025
 * Updated: October 26, 2025
 */

const fs = require('fs');
const path = require('path');

class EnhancedComponentAnalyzer {
  constructor() {
    this.components = new Map();
    this.imports = new Map();
    this.exports = new Map();
    this.usage = new Map();
  }

  /**
   * Scan all TypeScript/JavaScript files for imports and exports
   */
  scanFiles() {
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
   * Analyze a single file for imports and exports
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

      // Extract named exports
      const exportMatches = content.match(/export\s+(?:const|function|class|interface|type)\s+(\w+)/g);
      if (exportMatches) {
        for (const match of exportMatches) {
          const exportName = match.match(/export\s+(?:const|function|class|interface|type)\s+(\w+)/)[1];
          this.exports.set(exportName, filePath);
        }
      }

      // Extract default exports
      const defaultExportMatches = content.match(/export\s+default\s+(\w+)/g);
      if (defaultExportMatches) {
        for (const match of defaultExportMatches) {
          const exportName = match.match(/export\s+default\s+(\w+)/)[1];
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
      console.warn(`Error analyzing file ${filePath}:`, error.message);
    }
  }

  /**
   * Identify truly unused components
   */
  identifyUnusedComponents() {
    const unused = [];
    const potentiallyUnused = [];

    // Check components that were flagged as unused by the original script
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

      if (!isExported && !isUsed && !isImported) {
        unused.push({
          name: component,
          reason: 'Not exported, not used, not imported',
          confidence: 'high'
        });
      } else if (!isUsed && !isImported) {
        potentiallyUnused.push({
          name: component,
          reason: 'Exported but not used or imported',
          confidence: 'medium'
        });
      } else {
        console.log(`✅ ${component} is being used (exports: ${isExported}, usage: ${isUsed}, imports: ${isImported})`);
      }
    }

    return { unused, potentiallyUnused };
  }

  /**
   * Generate enhanced analysis report
   */
  generateReport() {
    console.log('🔍 Enhanced Component Usage Analysis');
    console.log('=====================================');
    
    this.scanFiles();
    
    const { unused, potentiallyUnused } = this.identifyUnusedComponents();
    
    console.log(`\n📊 Analysis Results:`);
    console.log(`Total Exports Found: ${this.exports.size}`);
    console.log(`Total Imports Found: ${this.imports.size}`);
    console.log(`Total Usage Patterns: ${this.usage.size}`);
    
    console.log(`\n❌ Truly Unused Components (${unused.length}):`);
    unused.forEach(comp => {
      console.log(`  - ${comp.name}: ${comp.reason} (${comp.confidence} confidence)`);
    });
    
    console.log(`\n⚠️  Potentially Unused Components (${potentiallyUnused.length}):`);
    potentiallyUnused.forEach(comp => {
      console.log(`  - ${comp.name}: ${comp.reason} (${comp.confidence} confidence)`);
    });

    console.log(`\n💡 Recommendations:`);
    if (unused.length > 0) {
      console.log(`1. Archive ${unused.length} truly unused components`);
    }
    if (potentiallyUnused.length > 0) {
      console.log(`2. Review ${potentiallyUnused.length} potentially unused components`);
    }
    console.log(`3. Focus on components with high confidence for archival`);
    
    return { unused, potentiallyUnused };
  }
}

// Run the analysis
const analyzer = new EnhancedComponentAnalyzer();
const results = analyzer.generateReport();

console.log('\n✅ Enhanced analysis complete!');
