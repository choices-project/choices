#!/usr/bin/env tsx

/**
 * Documentation Update Script
 * Automatically updates documentation dates, versions, and validates content
 */

import fs from 'fs';
import path from 'path';

interface DocFile {
  path: string;
  lastModified: Date;
  content: string;
  metadata: DocMetadata;
}

interface DocMetadata {
  title: string;
  lastUpdated: string;
  version: string;
  status: string;
  category: 'core' | 'feature' | 'development' | 'strategy';
}

class DocumentationUpdater {
  private docsDir = './docs';
  private archiveDir = './docs/archive';
  
  async updateAllDocumentation() {
    console.log('🔄 Starting documentation update...');
    
    const docFiles = await this.scanDocumentationFiles();
    
    for (const docFile of docFiles) {
      await this.updateDocumentationFile(docFile);
    }
    
    await this.validateLinks();
    await this.archiveOutdatedContent();
    await this.generateDocumentationReport();
    
    console.log('✅ Documentation update complete!');
  }
  
  private async scanDocumentationFiles(): Promise<DocFile[]> {
    const files: DocFile[] = [];
    
    const scanDir = async (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const metadata = this.extractMetadata(content);
          
          files.push({
            path: fullPath,
            lastModified: fs.statSync(fullPath).mtime,
            content,
            metadata
          });
        }
      }
    };
    
    await scanDir(this.docsDir);
    return files;
  }
  
  private extractMetadata(content: string): DocMetadata {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const lastUpdatedMatch = content.match(/\*\*Last Updated:\*\*\s+(.+)$/m);
    const versionMatch = content.match(/\*\*Version:\*\*\s+(.+)$/m);
    const statusMatch = content.match(/\*\*Status:\*\*\s+(.+)$/m);
    
    // Determine category from path
    let category: DocMetadata['category'] = 'core';
    if (content.includes('features/')) category = 'feature';
    else if (content.includes('TESTING') || content.includes('TROUBLESHOOTING') || content.includes('CONTRIBUTING')) category = 'development';
    else if (content.includes('STRATEGY') || content.includes('IMPLEMENTATION')) category = 'strategy';
    
    return {
      title: titleMatch?.[1] || 'Untitled',
      lastUpdated: lastUpdatedMatch?.[1] || new Date().toISOString().split('T')[0],
      version: versionMatch?.[1] || '1.0.0',
      status: statusMatch?.[1] || 'Unknown',
      category
    };
  }
  
  private async updateDocumentationFile(docFile: DocFile) {
    const currentDate = new Date().toISOString().split('T')[0];
    const needsUpdate = this.shouldUpdateFile(docFile);
    
    if (needsUpdate) {
      console.log(`📝 Updating ${docFile.path}...`);
      
      let updatedContent = docFile.content;
      
      // Update last updated date
      updatedContent = updatedContent.replace(
        /\*\*Last Updated:\*\*\s+.+$/m,
        `**Last Updated**: ${currentDate}`
      );
      
      // Update version if needed
      if (this.shouldIncrementVersion(docFile)) {
        const newVersion = this.incrementVersion(docFile.metadata.version);
        updatedContent = updatedContent.replace(
          /\*\*Version:\*\*\s+.+$/m,
          `**Version**: ${newVersion}`
        );
      }
      
      // Write updated content
      fs.writeFileSync(docFile.path, updatedContent);
      
      console.log(`✅ Updated ${docFile.path}`);
    }
  }
  
  private shouldUpdateFile(docFile: DocFile): boolean {
    const lastUpdated = new Date(docFile.metadata.lastUpdated);
    const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    
    // Update if more than 30 days old
    return daysSinceUpdate > 30;
  }
  
  private shouldIncrementVersion(docFile: DocFile): boolean {
    // Increment version for core docs if they haven't been updated in 90 days
    const lastUpdated = new Date(docFile.metadata.lastUpdated);
    const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    
    return docFile.metadata.category === 'core' && daysSinceUpdate > 90;
  }
  
  private incrementVersion(version: string): string {
    const [major, minor, patch] = version.split('.').map(Number);
    return `${major}.${minor + 1}.${patch}`;
  }
  
  private async validateLinks() {
    console.log('🔗 Validating links...');
    
    const docFiles = await this.scanDocumentationFiles();
    
    for (const docFile of docFiles) {
      const links = this.extractLinks(docFile.content);
      
      for (const link of links) {
        try {
          const result = await this.validateLink(link.url);
          
          if (result.status === 'dead') {
            console.warn(`⚠️  Dead link found in ${docFile.path}: ${link.url}`);
            await this.reportDeadLink(docFile.path, link.url);
          }
        } catch (error) {
          console.warn(`⚠️  Error checking link ${link.url}: ${error.message}`);
        }
      }
    }
    
    console.log('✅ Link validation complete!');
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
  
  private async validateLink(url: string): Promise<{ status: 'alive' | 'dead' | 'unknown' }> {
    try {
      // Skip local links and anchors
      if (url.startsWith('#') || url.startsWith('/') || url.startsWith('./')) {
        return { status: 'alive' };
      }
      
      // Skip mailto and tel links
      if (url.startsWith('mailto:') || url.startsWith('tel:')) {
        return { status: 'alive' };
      }
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      
      return {
        status: response.ok ? 'alive' : 'dead'
      };
    } catch (error) {
      return { status: 'dead' };
    }
  }
  
  private async reportDeadLink(filePath: string, url: string) {
    const reportPath = './docs/link-validation-report.md';
    const report = `## Dead Link Report\n\n**File**: ${filePath}\n**URL**: ${url}\n**Date**: ${new Date().toISOString()}\n\n`;
    
    if (fs.existsSync(reportPath)) {
      fs.appendFileSync(reportPath, report);
    } else {
      fs.writeFileSync(reportPath, `# 🔗 Link Validation Report\n\n${report}`);
    }
  }
  
  private async archiveOutdatedContent() {
    console.log('📦 Archiving outdated content...');
    
    const docFiles = await this.scanDocumentationFiles();
    const archiveThreshold = 365; // 1 year
    
    for (const docFile of docFiles) {
      const lastUpdated = new Date(docFile.metadata.lastUpdated);
      const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate > archiveThreshold && docFile.metadata.category === 'strategy') {
        await this.archiveFile(docFile);
      }
    }
    
    console.log('✅ Archiving complete!');
  }
  
  private async archiveFile(docFile: DocFile) {
    const archivePath = path.join(this.archiveDir, path.basename(docFile.path));
    
    // Create archive directory if it doesn't exist
    if (!fs.existsSync(this.archiveDir)) {
      fs.mkdirSync(this.archiveDir, { recursive: true });
    }
    
    // Move file to archive
    fs.renameSync(docFile.path, archivePath);
    
    console.log(`📦 Archived ${docFile.path} to ${archivePath}`);
  }
  
  private async generateDocumentationReport() {
    console.log('📊 Generating documentation report...');
    
    const docFiles = await this.scanDocumentationFiles();
    const report = this.generateReport(docFiles);
    
    fs.writeFileSync('./docs/documentation-report.md', report);
    
    console.log('✅ Documentation report generated!');
  }
  
  private generateReport(docFiles: DocFile[]): string {
    const categories = docFiles.reduce((acc, file) => {
      if (!acc[file.metadata.category]) {
        acc[file.metadata.category] = [];
      }
      acc[file.metadata.category].push(file);
      return acc;
    }, {} as Record<string, DocFile[]>);
    
    let report = `# 📊 Documentation Report\n\n`;
    report += `**Generated**: ${new Date().toISOString()}\n\n`;
    report += `## Summary\n\n`;
    report += `- **Total Files**: ${docFiles.length}\n`;
    report += `- **Core Documentation**: ${categories.core?.length || 0}\n`;
    report += `- **Feature Documentation**: ${categories.feature?.length || 0}\n`;
    report += `- **Development Documentation**: ${categories.development?.length || 0}\n`;
    report += `- **Strategy Documentation**: ${categories.strategy?.length || 0}\n\n`;
    
    for (const [category, files] of Object.entries(categories)) {
      report += `## ${category.charAt(0).toUpperCase() + category.slice(1)} Documentation\n\n`;
      
      for (const file of files) {
        const lastUpdated = new Date(file.metadata.lastUpdated);
        const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
        
        report += `### ${file.metadata.title}\n`;
        report += `- **File**: ${file.path}\n`;
        report += `- **Version**: ${file.metadata.version}\n`;
        report += `- **Status**: ${file.metadata.status}\n`;
        report += `- **Last Updated**: ${file.metadata.lastUpdated} (${Math.round(daysSinceUpdate)} days ago)\n`;
        report += `- **Needs Update**: ${daysSinceUpdate > 30 ? '⚠️ Yes' : '✅ No'}\n\n`;
      }
    }
    
    return report;
  }
}

// Run the updater
const updater = new DocumentationUpdater();
updater.updateAllDocumentation().catch(console.error);
