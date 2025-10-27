#!/usr/bin/env tsx

/**
 * Documentation Maintenance Script
 * Comprehensive documentation health check and maintenance
 */

import fs from 'fs';
import path from 'path';

interface DocHealth {
  file: string;
  title: string;
  lastUpdated: string;
  version: string;
  category: string;
  daysSinceUpdate: number;
  needsUpdate: boolean;
  hasRequiredSections: boolean;
  linkCount: number;
  deadLinks: number;
  healthScore: number;
}

class DocumentationMaintainer {
  private docsDir = './docs';
  private requiredSections = {
    core: ['Overview', 'Features', 'Getting Started'],
    feature: ['Overview', 'Features', 'API Reference'],
    development: ['Overview', 'Setup', 'Testing'],
    strategy: ['Overview', 'Implementation', 'Status']
  };
  
  async maintainDocumentation() {
    console.log('🔧 Starting documentation maintenance...');
    
    const healthChecks = await this.performHealthChecks();
    await this.generateHealthReport(healthChecks);
    await this.performMaintenanceTasks(healthChecks);
    
    console.log('✅ Documentation maintenance complete!');
  }
  
  private async performHealthChecks(): Promise<DocHealth[]> {
    const healthChecks: DocHealth[] = [];
    const docFiles = await this.scanDocumentationFiles();
    
    for (const docFile of docFiles) {
      const health = await this.checkDocumentationHealth(docFile);
      healthChecks.push(health);
    }
    
    return healthChecks;
  }
  
  private async scanDocumentationFiles(): Promise<string[]> {
    const files: string[] = [];
    
    const scanDir = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    };
    
    scanDir(this.docsDir);
    return files;
  }
  
  private async checkDocumentationHealth(filePath: string): Promise<DocHealth> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const stats = fs.statSync(filePath);
    
    // Extract metadata
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const lastUpdatedMatch = content.match(/\*\*Last Updated:\*\*\s+(.+)$/m);
    const versionMatch = content.match(/\*\*Version:\*\*\s+(.+)$/m);
    
    // Determine category
    let category = 'core';
    if (filePath.includes('features/')) category = 'feature';
    else if (filePath.includes('TESTING') || filePath.includes('TROUBLESHOOTING') || filePath.includes('CONTRIBUTING')) category = 'development';
    else if (filePath.includes('STRATEGY') || filePath.includes('IMPLEMENTATION')) category = 'strategy';
    
    const lastUpdated = lastUpdatedMatch?.[1] || stats.mtime.toISOString().split('T')[0];
    const daysSinceUpdate = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
    
    // Check required sections
    const hasRequiredSections = this.checkRequiredSections(content, category);
    
    // Check links
    const links = this.extractLinks(content);
    const deadLinks = await this.countDeadLinks(links);
    
    // Calculate health score
    const healthScore = this.calculateHealthScore({
      daysSinceUpdate,
      hasRequiredSections,
      linkCount: links.length,
      deadLinks
    });
    
    return {
      file: filePath,
      title: titleMatch?.[1] || 'Untitled',
      lastUpdated,
      version: versionMatch?.[1] || '1.0.0',
      category,
      daysSinceUpdate: Math.round(daysSinceUpdate),
      needsUpdate: daysSinceUpdate > 30,
      hasRequiredSections,
      linkCount: links.length,
      deadLinks,
      healthScore
    };
  }
  
  private checkRequiredSections(content: string, category: string): boolean {
    const required = this.requiredSections[category as keyof typeof this.requiredSections] || [];
    
    for (const section of required) {
      if (!content.includes(section)) {
        return false;
      }
    }
    
    return true;
  }
  
  private extractLinks(content: string): Array<{ url: string; text: string }> {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links: Array<{ url: string; text: string }> = [];
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      links.push({
        text: match[1],
        url: match[2]
      });
    }
    
    return links;
  }
  
  private async countDeadLinks(links: Array<{ url: string; text: string }>): Promise<number> {
    let deadCount = 0;
    
    for (const link of links) {
      try {
        // Skip local links and anchors
        if (link.url.startsWith('#') || link.url.startsWith('/') || link.url.startsWith('./')) {
          continue;
        }
        
        // Skip mailto and tel links
        if (link.url.startsWith('mailto:') || link.url.startsWith('tel:')) {
          continue;
        }
        
        const response = await fetch(link.url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) {
          deadCount++;
        }
      } catch (error) {
        deadCount++;
      }
    }
    
    return deadCount;
  }
  
  private calculateHealthScore(metrics: {
    daysSinceUpdate: number;
    hasRequiredSections: boolean;
    linkCount: number;
    deadLinks: number;
  }): number {
    let score = 100;
    
    // Deduct points for age
    if (metrics.daysSinceUpdate > 30) score -= 20;
    if (metrics.daysSinceUpdate > 90) score -= 30;
    if (metrics.daysSinceUpdate > 180) score -= 40;
    
    // Deduct points for missing sections
    if (!metrics.hasRequiredSections) score -= 25;
    
    // Deduct points for dead links
    if (metrics.deadLinks > 0) {
      const deadLinkPercentage = (metrics.deadLinks / metrics.linkCount) * 100;
      score -= Math.min(deadLinkPercentage * 2, 30);
    }
    
    return Math.max(score, 0);
  }
  
  private async generateHealthReport(healthChecks: DocHealth[]) {
    const reportPath = './docs/documentation-health-report.md';
    
    let report = `# 🏥 Documentation Health Report\n\n`;
    report += `**Generated**: ${new Date().toISOString()}\n\n`;
    
    // Overall health summary
    const totalFiles = healthChecks.length;
    const averageHealth = healthChecks.reduce((sum, h) => sum + h.healthScore, 0) / totalFiles;
    const filesNeedingUpdate = healthChecks.filter(h => h.needsUpdate).length;
    const filesWithDeadLinks = healthChecks.filter(h => h.deadLinks > 0).length;
    const filesMissingSections = healthChecks.filter(h => !h.hasRequiredSections).length;
    
    report += `## 📊 Overall Health Summary\n\n`;
    report += `- **Total Files**: ${totalFiles}\n`;
    report += `- **Average Health Score**: ${Math.round(averageHealth)}/100\n`;
    report += `- **Files Needing Update**: ${filesNeedingUpdate}\n`;
    report += `- **Files with Dead Links**: ${filesWithDeadLinks}\n`;
    report += `- **Files Missing Sections**: ${filesMissingSections}\n\n`;
    
    // Health by category
    const categories = healthChecks.reduce((acc, health) => {
      if (!acc[health.category]) {
        acc[health.category] = [];
      }
      acc[health.category].push(health);
      return acc;
    }, {} as Record<string, DocHealth[]>);
    
    for (const [category, categoryHealth] of Object.entries(categories)) {
      const categoryAverage = categoryHealth.reduce((sum, h) => sum + h.healthScore, 0) / categoryHealth.length;
      
      report += `## ${category.charAt(0).toUpperCase() + category.slice(1)} Documentation\n\n`;
      report += `- **Average Health Score**: ${Math.round(categoryAverage)}/100\n`;
      report += `- **Files**: ${categoryHealth.length}\n\n`;
      
      // Sort by health score (lowest first)
      categoryHealth.sort((a, b) => a.healthScore - b.healthScore);
      
      for (const health of categoryHealth) {
        const status = health.healthScore >= 80 ? '✅' : health.healthScore >= 60 ? '⚠️' : '🚨';
        
        report += `### ${status} ${health.title}\n`;
        report += `- **File**: ${health.file}\n`;
        report += `- **Health Score**: ${health.healthScore}/100\n`;
        report += `- **Last Updated**: ${health.lastUpdated} (${health.daysSinceUpdate} days ago)\n`;
        report += `- **Version**: ${health.version}\n`;
        report += `- **Links**: ${health.linkCount} total, ${health.deadLinks} dead\n`;
        report += `- **Required Sections**: ${health.hasRequiredSections ? '✅ Complete' : '❌ Missing'}\n\n`;
      }
    }
    
    // Files needing immediate attention
    const urgentFiles = healthChecks.filter(h => h.healthScore < 60);
    if (urgentFiles.length > 0) {
      report += `## 🚨 Files Needing Immediate Attention\n\n`;
      
      for (const health of urgentFiles) {
        report += `- **${health.title}**: Health score ${health.healthScore}/100\n`;
        report += `  - File: ${health.file}\n`;
        report += `  - Issues: ${health.needsUpdate ? 'Needs update, ' : ''}${health.deadLinks > 0 ? `${health.deadLinks} dead links, ` : ''}${!health.hasRequiredSections ? 'Missing sections' : ''}\n\n`;
      }
    }
    
    fs.writeFileSync(reportPath, report);
  }
  
  private async performMaintenanceTasks(healthChecks: DocHealth[]) {
    console.log('🔧 Performing maintenance tasks...');
    
    // Update files that need updates
    const filesToUpdate = healthChecks.filter(h => h.needsUpdate);
    
    for (const health of filesToUpdate) {
      await this.updateDocumentationFile(health);
    }
    
    // Fix common issues
    const filesWithIssues = healthChecks.filter(h => h.healthScore < 80);
    
    for (const health of filesWithIssues) {
      await this.fixCommonIssues(health);
    }
    
    console.log('✅ Maintenance tasks complete!');
  }
  
  private async updateDocumentationFile(health: DocHealth) {
    const content = fs.readFileSync(health.file, 'utf-8');
    const currentDate = new Date().toISOString().split('T')[0];
    
    let updatedContent = content;
    
    // Update last updated date
    updatedContent = updatedContent.replace(
      /\*\*Last Updated:\*\*\s+.+$/m,
      `**Last Updated**: ${currentDate}`
    );
    
    // Update version if needed
    if (health.daysSinceUpdate > 90) {
      const newVersion = this.incrementVersion(health.version);
      updatedContent = updatedContent.replace(
        /\*\*Version:\*\*\s+.+$/m,
        `**Version**: ${newVersion}`
      );
    }
    
    fs.writeFileSync(health.file, updatedContent);
    console.log(`📝 Updated ${health.file}`);
  }
  
  private async fixCommonIssues(health: DocHealth) {
    const content = fs.readFileSync(health.file, 'utf-8');
    let updatedContent = content;
    let modified = false;
    
    // Fix missing required sections
    if (!health.hasRequiredSections) {
      const required = this.requiredSections[health.category as keyof typeof this.requiredSections] || [];
      
      for (const section of required) {
        if (!updatedContent.includes(section)) {
          // Add missing section
          const sectionContent = `\n## ${section}\n\n<!-- TODO: Add ${section} content -->\n`;
          updatedContent += sectionContent;
          modified = true;
        }
      }
    }
    
    // Fix common formatting issues
    updatedContent = updatedContent
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .replace(/[ \t]+$/gm, '') // Remove trailing whitespace
      .replace(/\n\n\n/g, '\n\n'); // Normalize spacing
    
    if (modified) {
      fs.writeFileSync(health.file, updatedContent);
      console.log(`🔧 Fixed issues in ${health.file}`);
    }
  }
  
  private incrementVersion(version: string): string {
    const [major, minor, patch] = version.split('.').map(Number);
    return `${major}.${minor + 1}.${patch}`;
  }
}

// Run the maintainer
const maintainer = new DocumentationMaintainer();
maintainer.maintainDocumentation().catch(console.error);
