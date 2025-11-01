/**
 * ESLint Timeout Configuration
 * 
 * This configuration adds timeout settings to prevent ESLint from getting stuck
 * and consuming excessive resources.
 */

module.exports = {
  // ESLint timeout settings
  timeout: 300000, // 5 minutes maximum
  maxWarnings: 0,
  
  // Performance optimizations
  cache: true,
  cacheLocation: '.eslintcache',
  
  // File processing limits
  maxFiles: 1000, // Maximum files to process in one run
  
  // Memory limits
  maxMemory: '2GB',
  
  // Parallel processing limits
  maxWorkers: '50%', // Use up to 50% of available CPU cores
  
  // Additional safety measures
  bail: false, // Don't stop on first error
  failOnError: true,
  failOnWarning: false,
};
