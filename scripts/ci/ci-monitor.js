#!/usr/bin/env node

/**
 * CI Pipeline Monitor
 * Monitors GitHub Actions and Vercel deployment status
 * Provides real-time feedback on CI/CD pipeline health
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  GITHUB_REPO: 'choices-project/choices',
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  VERCEL_TOKEN: process.env.VERCEL_TOKEN,
  POLL_INTERVAL: 30000, // 30 seconds
  MAX_RETRIES: 10
};

class CIMonitor {
  constructor() {
    this.lastStatus = null;
    this.retryCount = 0;
    this.isMonitoring = false;
  }

  // Make HTTP request with promise
  makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, data });
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  // Get GitHub Actions status
  async getGitHubActionsStatus() {
    if (!CONFIG.GITHUB_TOKEN) {
      console.log('⚠️  GITHUB_TOKEN not set - skipping GitHub Actions check');
      return null;
    }

    try {
      const url = `https://api.github.com/repos/${CONFIG.GITHUB_REPO}/actions/runs?per_page=5`;
      const options = {
        headers: {
          'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
          'User-Agent': 'CI-Monitor'
        }
      };

      const response = await this.makeRequest(url, options);
      
      if (response.status === 200) {
        const runs = response.data.workflow_runs;
        const latestRun = runs[0];
        
        return {
          status: latestRun.conclusion || latestRun.status,
          name: latestRun.name,
          branch: latestRun.head_branch,
          commit: latestRun.head_commit.message,
          url: latestRun.html_url,
          createdAt: new Date(latestRun.created_at)
        };
      }
    } catch (error) {
      console.error('❌ Error fetching GitHub Actions status:', error.message);
    }
    
    return null;
  }

  // Get Vercel deployment status
  async getVercelDeploymentStatus() {
    if (!CONFIG.VERCEL_TOKEN) {
      console.log('⚠️  VERCEL_TOKEN not set - skipping Vercel deployment check');
      return null;
    }

    try {
      const url = 'https://api.vercel.com/v6/deployments?limit=5';
      const options = {
        headers: {
          'Authorization': `Bearer ${CONFIG.VERCEL_TOKEN}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await this.makeRequest(url, options);
      
      if (response.status === 200) {
        const deployments = response.data.deployments;
        const latestDeployment = deployments[0];
        
        return {
          status: latestDeployment.readyState,
          url: latestDeployment.url,
          branch: latestDeployment.gitSource?.ref,
          commit: latestDeployment.gitSource?.sha,
          createdAt: new Date(latestDeployment.createdAt)
        };
      }
    } catch (error) {
      console.error('❌ Error fetching Vercel deployment status:', error.message);
    }
    
    return null;
  }

  // Check local build status
  async checkLocalBuild() {
    try {
      const webDir = path.join(process.cwd(), 'web');
      if (!fs.existsSync(webDir)) {
        return { status: 'error', message: 'web directory not found' };
      }

      // Check if package.json exists
      const packageJsonPath = path.join(webDir, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        return { status: 'error', message: 'package.json not found' };
      }

      // Check if node_modules exists
      const nodeModulesPath = path.join(webDir, 'node_modules');
      if (!fs.existsSync(nodeModulesPath)) {
        return { status: 'warning', message: 'node_modules not found - run npm install' };
      }

      return { status: 'success', message: 'Local environment ready' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  // Format status for display
  formatStatus(status, type) {
    const statusIcons = {
      success: '✅',
      failure: '❌',
      error: '❌',
      warning: '⚠️',
      pending: '⏳',
      in_progress: '🔄',
      queued: '⏳',
      ready: '✅',
      building: '🏗️',
      canceled: '🚫'
    };

    const icon = statusIcons[status] || '❓';
    return `${icon} ${type}: ${status}`;
  }

  // Display status information
  displayStatus(githubStatus, vercelStatus, localStatus) {
    console.clear();
    console.log('🔍 CI Pipeline Monitor');
    console.log('=====================');
    console.log(`📅 ${new Date().toLocaleString()}`);
    console.log('');

    // GitHub Actions Status
    if (githubStatus) {
      console.log(this.formatStatus(githubStatus.status, 'GitHub Actions'));
      console.log(`   Workflow: ${githubStatus.name}`);
      console.log(`   Branch: ${githubStatus.branch}`);
      console.log(`   Commit: ${githubStatus.commit.substring(0, 50)}...`);
      console.log(`   URL: ${githubStatus.url}`);
      console.log('');
    }

    // Vercel Deployment Status
    if (vercelStatus) {
      console.log(this.formatStatus(vercelStatus.status, 'Vercel Deployment'));
      console.log(`   URL: ${vercelStatus.url}`);
      console.log(`   Branch: ${vercelStatus.branch}`);
      console.log(`   Status: ${vercelStatus.status}`);
      console.log('');
    }

    // Local Build Status
    if (localStatus) {
      console.log(this.formatStatus(localStatus.status, 'Local Environment'));
      console.log(`   ${localStatus.message}`);
      console.log('');
    }

    // Overall Status
    const allStatuses = [githubStatus?.status, vercelStatus?.status, localStatus?.status];
    const hasFailures = allStatuses.some(s => s === 'failure' || s === 'error');
    const hasWarnings = allStatuses.some(s => s === 'warning');
    
    if (hasFailures) {
      console.log('🚨 CRITICAL: Pipeline failures detected!');
    } else if (hasWarnings) {
      console.log('⚠️  WARNING: Some issues detected');
    } else {
      console.log('✅ HEALTHY: All systems operational');
    }

    console.log('');
    console.log('Press Ctrl+C to stop monitoring');
  }

  // Start monitoring
  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('⚠️  Monitoring already in progress');
      return;
    }

    this.isMonitoring = true;
    console.log('🚀 Starting CI Pipeline Monitor...');
    console.log('');

    const monitor = async () => {
      try {
        const [githubStatus, vercelStatus, localStatus] = await Promise.all([
          this.getGitHubActionsStatus(),
          this.getVercelDeploymentStatus(),
          this.checkLocalBuild()
        ]);

        this.displayStatus(githubStatus, vercelStatus, localStatus);
        this.retryCount = 0;
      } catch (error) {
        console.error('❌ Monitoring error:', error.message);
        this.retryCount++;
        
        if (this.retryCount >= CONFIG.MAX_RETRIES) {
          console.error('🚨 Max retries reached. Stopping monitor.');
          this.stopMonitoring();
          return;
        }
      }

      if (this.isMonitoring) {
        setTimeout(monitor, CONFIG.POLL_INTERVAL);
      }
    };

    monitor();
  }

  // Stop monitoring
  stopMonitoring() {
    this.isMonitoring = false;
    console.log('\n🛑 CI Pipeline Monitor stopped');
  }
}

// CLI Interface
async function main() {
  const monitor = new CIMonitor();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    monitor.stopMonitoring();
    process.exit(0);
  });

  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔍 CI Pipeline Monitor

Usage:
  node ci-monitor.js [options]

Options:
  --help, -h     Show this help message
  --once         Run once and exit (don't monitor continuously)
  --local-only   Only check local environment
  --github-only  Only check GitHub Actions
  --vercel-only  Only check Vercel deployments

Environment Variables:
  GITHUB_TOKEN   GitHub personal access token
  VERCEL_TOKEN   Vercel API token

Examples:
  node ci-monitor.js                    # Start continuous monitoring
  node ci-monitor.js --once             # Check once and exit
  node ci-monitor.js --local-only       # Only check local build
    `);
    return;
  }

  if (args.includes('--once')) {
    // Run once and exit
    const [githubStatus, vercelStatus, localStatus] = await Promise.all([
      monitor.getGitHubActionsStatus(),
      monitor.getVercelDeploymentStatus(),
      monitor.checkLocalBuild()
    ]);
    
    monitor.displayStatus(githubStatus, vercelStatus, localStatus);
    return;
  }

  if (args.includes('--local-only')) {
    const localStatus = await monitor.checkLocalBuild();
    monitor.displayStatus(null, null, localStatus);
    return;
  }

  // Start continuous monitoring
  await monitor.startMonitoring();
}

// Run the monitor
if (require.main === module) {
  main().catch(console.error);
}

module.exports = CIMonitor;
