#!/usr/bin/env node

/**
 * Component Usage Analysis Script
 * 
 * Analyzes component usage across the codebase to identify:
 * - Unused components
 * - Import patterns
 * - Bundle size optimization opportunities
 * - Dead code elimination targets
 * 
 * Created: October 26, 2025
 * Status: ✅ IMPLEMENTATION READY
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const WEB_DIR = '/Users/alaughingkitsune/src/Choices/web';
const COMPONENT_DIRS = [
  'components',
  'features',
  'app'
];

const EXCLUDE_DIRS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  'coverage',
  'tests',
  'test',
  '__tests__'
];

// ============================================================================
// MAIN ANALYSIS CLASS
// ============================================================================

class ComponentUsageAnalyzer {
  constructor() {
    this.components = new Map();
    this.usage = new Map();
    this.allFiles = [];
  }

  /**
   * Scan all TypeScript/React files
   */
  scanAllFiles() {
    console.log('🔍 Scanning files...');
    
    for (const dir of COMPONENT_DIRS) {
      const dirPath = path.join(WEB_DIR, dir);
      if (fs.existsSync(dirPath)) {
        this.scanDirectory(dirPath);
      }
    }
    
    console.log(`📁 Found ${this.allFiles.length} files`);
  }

  /**
   * Recursively scan directory
   */
  scanDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!EXCLUDE_DIRS.some(exclude => fullPath.includes(exclude))) {
          this.scanDirectory(fullPath);
        }
      } else if (this.isComponentFile(item)) {
        this.allFiles.push(fullPath);
      }
    }
  }

  /**
   * Check if file is a component file
   */
  isComponentFile(filename) {
    return filename.endsWith('.tsx') || filename.endsWith('.ts');
  }

  /**
   * Analyze all components
   */
  analyzeComponents() {
    console.log('🔧 Analyzing components...');
    
    for (const filePath of this.allFiles) {
      if (this.isComponentFile(path.basename(filePath))) {
        const componentInfo = this.analyzeComponent(filePath);
        if (componentInfo) {
          this.components.set(componentInfo.name, componentInfo);
        }
      }
    }
    
    console.log(`📦 Analyzed ${this.components.size} components`);
  }

  /**
   * Analyze a single component
   */
  analyzeComponent(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const stats = fs.statSync(filePath);
      
      const name = this.extractComponentName(filePath, content);
      if (!name) return null;
      
      const exports = this.extractExports(content);
      const imports = this.extractImports(content);
      
      return {
        name,
        filePath: path.relative(WEB_DIR, filePath),
        size: stats.size,
        exports,
        imports,
        isExported: exports.length > 0,
        lastModified: stats.mtime
      };
    } catch (error) {
      console.warn(`⚠️  Error analyzing ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Extract component name from file
   */
  extractComponentName(filePath, content) {
    // Try to extract from default export
    const defaultExportMatch = content.match(/export\s+default\s+function\s+(\w+)/);
    if (defaultExportMatch) {
      return defaultExportMatch[1];
    }
    
    // Try to extract from named export
    const namedExportMatch = content.match(/export\s+function\s+(\w+)/);
    if (namedExportMatch) {
      return namedExportMatch[1];
    }
    
    // Try to extract from const export
    const constExportMatch = content.match(/export\s+const\s+(\w+)/);
    if (constExportMatch) {
      return constExportMatch[1];
    }
    
    // Fallback to filename
    const filename = path.basename(filePath, path.extname(filePath));
    return filename;
  }

  /**
   * Extract exports from content
   */
  extractExports(content) {
    const exports = [];
    
    // Default exports
    const defaultExports = content.match(/export\s+default\s+(\w+)/g);
    if (defaultExports) {
      exports.push(...defaultExports.map(exp => exp.replace('export default ', '')));
    }
    
    // Named exports
    const namedExports = content.match(/export\s+function\s+(\w+)/g);
    if (namedExports) {
      exports.push(...namedExports.map(exp => exp.replace('export function ', '')));
    }
    
    // Const exports
    const constExports = content.match(/export\s+const\s+(\w+)/g);
    if (constExports) {
      exports.push(...constExports.map(exp => exp.replace('export const ', '')));
    }
    
    return exports;
  }

  /**
   * Extract imports from content
   */
  extractImports(content) {
    const imports = [];
    
    // Import statements
    const importMatches = content.match(/import.*from\s+['"]([^'"]+)['"]/g);
    if (importMatches) {
      imports.push(...importMatches.map(imp => imp.match(/from\s+['"]([^'"]+)['"]/)?.[1] || ''));
    }
    
    return imports.filter(imp => imp.length > 0);
  }

  /**
   * Analyze component usage
   */
  analyzeUsage() {
    console.log('📊 Analyzing usage...');
    
    for (const [componentName, componentInfo] of this.components) {
      const usageInfo = this.findComponentUsage(componentName, componentInfo);
      this.usage.set(componentName, usageInfo);
    }
    
    console.log('✅ Usage analysis complete');
  }

  /**
   * Find usage of a specific component
   */
  findComponentUsage(componentName, componentInfo) {
    const usageFiles = [];
    const importPatterns = [];
    let usageCount = 0;
    
    for (const filePath of this.allFiles) {
      if (filePath === componentInfo.filePath) continue; // Skip self-reference
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for imports
        const importPattern = new RegExp(`import.*${componentName}.*from`, 'g');
        const importMatches = content.match(importPattern);
        
        if (importMatches) {
          usageFiles.push(path.relative(WEB_DIR, filePath));
          importPatterns.push(...importMatches);
          usageCount += importMatches.length;
        }
        
        // Check for direct usage
        const usagePattern = new RegExp(`<${componentName}[\\s>]`, 'g');
        const usageMatches = content.match(usagePattern);
        
        if (usageMatches) {
          usageFiles.push(path.relative(WEB_DIR, filePath));
          usageCount += usageMatches.length;
        }
        
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    return {
      componentName,
      usageCount,
      usageFiles: [...new Set(usageFiles)], // Remove duplicates
      importPatterns: [...new Set(importPatterns)],
      isUsed: usageCount > 0
    };
  }

  /**
   * Generate analysis report
   */
  generateReport() {
    const totalComponents = this.components.size;
    const usedComponents = Array.from(this.usage.values()).filter(u => u.isUsed).length;
    const unusedComponents = totalComponents - usedComponents;
    
    const deadCodeSize = Array.from(this.components.values())
      .filter(comp => !this.usage.get(comp.name)?.isUsed)
      .reduce((total, comp) => total + comp.size, 0);
    
    const optimizationOpportunities = this.identifyOptimizationOpportunities();
    const recommendations = this.generateRecommendations();
    
    return {
      totalComponents,
      usedComponents,
      unusedComponents,
      deadCodeSize,
      optimizationOpportunities,
      recommendations,
      generatedAt: new Date()
    };
  }

  /**
   * Identify optimization opportunities
   */
  identifyOptimizationOpportunities() {
    const opportunities = [];
    
    for (const [componentName, componentInfo] of this.components) {
      const usageInfo = this.usage.get(componentName);
      
      if (!usageInfo?.isUsed && componentInfo.isExported) {
        opportunities.push({
          type: 'unused-component',
          component: componentName,
          potentialSavings: componentInfo.size,
          difficulty: 'low',
          description: `Component ${componentName} is exported but never used`,
          action: `Remove ${componentName} component or find usage`
        });
      }
      
      if (componentInfo.size > 10000) { // 10KB
        opportunities.push({
          type: 'large-file',
          component: componentName,
          potentialSavings: componentInfo.size * 0.3,
          difficulty: 'medium',
          description: `Component ${componentName} is large (${componentInfo.size} bytes)`,
          action: `Optimize ${componentName} component or split into smaller parts`
        });
      }
    }
    
    return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    const totalComponents = this.components.size;
    const usedComponents = Array.from(this.usage.values()).filter(u => u.isUsed).length;
    const unusedComponents = totalComponents - usedComponents;
    
    const deadCodeSize = Array.from(this.components.values())
      .filter(comp => !this.usage.get(comp.name)?.isUsed)
      .reduce((total, comp) => total + comp.size, 0);
    
    if (unusedComponents > 0) {
      recommendations.push(`Remove ${unusedComponents} unused components (${deadCodeSize} bytes)`);
    }
    
    const largeFiles = Array.from(this.components.values())
      .filter(comp => comp.size > 10000)
      .map(comp => comp.name);
    
    if (largeFiles.length > 0) {
      recommendations.push(`Optimize large components: ${largeFiles.join(', ')}`);
    }
    
    recommendations.push('Implement dynamic imports for chart components');
    recommendations.push('Consider code splitting for analytics components');
    recommendations.push('Review and optimize Recharts implementations');
    recommendations.push('Use tree shaking to eliminate unused code');
    
    return recommendations;
  }

  /**
   * Print detailed report
   */
  printReport() {
    const report = this.generateReport();
    
    console.log('\n📊 COMPONENT USAGE ANALYSIS REPORT');
    console.log('=====================================');
    console.log(`Total Components: ${report.totalComponents}`);
    console.log(`Used Components: ${report.usedComponents} (${((report.usedComponents / report.totalComponents) * 100).toFixed(1)}%)`);
    console.log(`Unused Components: ${report.unusedComponents} (${((report.unusedComponents / report.totalComponents) * 100).toFixed(1)}%)`);
    console.log(`Dead Code Size: ${report.deadCodeSize} bytes (${(report.deadCodeSize / 1024).toFixed(1)} KB)`);
    
    console.log('\n🎯 OPTIMIZATION OPPORTUNITIES');
    console.log('==============================');
    report.optimizationOpportunities.slice(0, 10).forEach((opp, index) => {
      console.log(`${index + 1}. ${opp.type.toUpperCase()}: ${opp.component}`);
      console.log(`   Potential Savings: ${opp.potentialSavings} bytes`);
      console.log(`   Difficulty: ${opp.difficulty}`);
      console.log(`   Action: ${opp.action}`);
      console.log('');
    });
    
    console.log('💡 RECOMMENDATIONS');
    console.log('==================');
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    console.log('\n📅 Report generated:', report.generatedAt.toISOString());
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

if (require.main === module) {
  console.log('🚀 Starting Component Usage Analysis...');
  
  try {
    const analyzer = new ComponentUsageAnalyzer();
    analyzer.scanAllFiles();
    analyzer.analyzeComponents();
    analyzer.analyzeUsage();
    analyzer.printReport();
    
    console.log('\n✅ Analysis complete!');
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

module.exports = ComponentUsageAnalyzer;