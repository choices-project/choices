#!/usr/bin/env node

/**
 * Environment File Safety Check
 * 
 * This script prevents accidental overwriting of .env.local files
 * and ensures proper handling of sensitive configuration.
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../web/.env.local');

function checkEnvFile() {
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  web/.env.local does not exist');
    console.log('📝 This is normal for new setups');
    return { exists: false, hasRealValues: false };
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const hasRealValues = !content.includes('your_') && !content.includes('here');
  
  if (hasRealValues) {
    console.log('✅ web/.env.local exists with real values');
    console.log('🚨 CRITICAL: This file contains sensitive information');
    console.log('🚨 NEVER overwrite this file without explicit confirmation');
  } else {
    console.log('⚠️  web/.env.local exists but contains placeholder values');
  }

  return { exists: true, hasRealValues };
}

function requireConfirmation(action) {
  console.log('\n🚨 SAFETY CHECK REQUIRED');
  console.log('========================');
  console.log(`Action: ${action}`);
  console.log('This will modify sensitive configuration files.');
  console.log('');
  
  // In a real implementation, this would prompt for confirmation
  // For now, we'll just warn and require manual intervention
  console.log('❌ SAFETY PROTOCOL: Manual confirmation required');
  console.log('Please manually confirm this action is safe.');
  console.log('');
  
  return false;
}

// Export for use in other scripts
module.exports = { checkEnvFile, requireConfirmation };

// Run check if called directly
if (require.main === module) {
  checkEnvFile();
}
