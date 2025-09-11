#!/usr/bin/env node

/**
 * Security Headers Test Script
 * 
 * Tests the security headers implementation by making requests to the local
 * development server and validating the presence and correctness of security headers.
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const TEST_URL = process.env.TEST_URL || 'http://localhost:3000';
const TIMEOUT = 5000;

// Expected security headers
const EXPECTED_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'x-xss-protection': '1; mode=block',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': /camera=\(\)/,
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
  'origin-agent-cluster': '?1',
};

// CSP-specific headers (one should be present)
const CSP_HEADERS = [
  'content-security-policy',
  'content-security-policy-report-only'
];

// HSTS header (only in production)
const HSTS_HEADER = 'strict-transport-security';

// Trusted Types header
const TRUSTED_TYPES_HEADER = 'trusted-types';

// Test paths
const TEST_PATHS = [
  '/',
  '/api/health',
  '/_next/static/test.js',
];

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'Security-Headers-Test/1.0',
      },
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

function validateHeader(headers, headerName, expectedValue) {
  const actualValue = headers[headerName.toLowerCase()];
  
  if (!actualValue) {
    return { valid: false, message: `Missing header: ${headerName}` };
  }

  if (expectedValue instanceof RegExp) {
    if (!expectedValue.test(actualValue)) {
      return { valid: false, message: `Header ${headerName} doesn't match pattern: ${expectedValue}` };
    }
  } else if (actualValue !== expectedValue) {
    return { valid: false, message: `Header ${headerName} has wrong value. Expected: ${expectedValue}, Got: ${actualValue}` };
  }

  return { valid: true, message: `Header ${headerName} is correct` };
}

function validateCSP(headers) {
  const cspHeader = CSP_HEADERS.find(header => headers[header]);
  
  if (!cspHeader) {
    return { valid: false, message: 'No CSP header found (neither Content-Security-Policy nor Content-Security-Policy-Report-Only)' };
  }

  const cspValue = headers[cspHeader];
  
  // Basic CSP validation
  const requiredDirectives = ['default-src', 'script-src', 'style-src'];
  const missingDirectives = requiredDirectives.filter(directive => !cspValue.includes(directive));
  
  if (missingDirectives.length > 0) {
    return { valid: false, message: `CSP missing required directives: ${missingDirectives.join(', ')}` };
  }

  return { valid: true, message: `CSP header (${cspHeader}) is present and valid` };
}

function validateTrustedTypes(headers) {
  const trustedTypes = headers[TRUSTED_TYPES_HEADER];
  
  if (!trustedTypes) {
    return { valid: false, message: 'Missing Trusted-Types header' };
  }

  return { valid: true, message: 'Trusted-Types header is present' };
}

function validateHSTS(headers, isProduction) {
  const hsts = headers[HSTS_HEADER];
  
  if (isProduction && !hsts) {
    return { valid: false, message: 'Missing HSTS header in production' };
  }

  if (hsts && !hsts.includes('max-age=')) {
    return { valid: false, message: 'HSTS header missing max-age directive' };
  }

  return { valid: true, message: isProduction ? 'HSTS header is present and valid' : 'HSTS header correctly absent in development' };
}

async function testPath(path) {
  const url = `${TEST_URL}${path}`;
  log(`Testing ${colorize('cyan', url)}`, 'info');
  
  try {
    const response = await makeRequest(url);
    
    if (response.statusCode >= 400) {
      log(`HTTP ${response.statusCode} for ${path}`, 'warning');
      return { path, success: false, error: `HTTP ${response.statusCode}` };
    }

    const results = [];
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Test basic security headers
    for (const [headerName, expectedValue] of Object.entries(EXPECTED_HEADERS)) {
      const result = validateHeader(response.headers, headerName, expectedValue);
      results.push({ header: headerName, ...result });
    }
    
    // Test CSP
    const cspResult = validateCSP(response.headers);
    results.push({ header: 'CSP', ...cspResult });
    
    // Test Trusted Types
    const trustedTypesResult = validateTrustedTypes(response.headers);
    results.push({ header: 'Trusted-Types', ...trustedTypesResult });
    
    // Test HSTS
    const hstsResult = validateHSTS(response.headers, isProduction);
    results.push({ header: 'HSTS', ...hstsResult });
    
    const validCount = results.filter(r => r.valid).length;
    const totalCount = results.length;
    
    log(`Results for ${path}: ${validCount}/${totalCount} headers valid`, validCount === totalCount ? 'success' : 'warning');
    
    // Log individual results
    results.forEach(result => {
      const status = result.valid ? 'success' : 'error';
      log(`  ${result.header}: ${result.message}`, status);
    });
    
    return { path, success: validCount === totalCount, results };
    
  } catch (error) {
    log(`Error testing ${path}: ${error.message}`, 'error');
    return { path, success: false, error: error.message };
  }
}

async function main() {
  log('🔒 Starting Security Headers Test', 'info');
  log(`Target URL: ${colorize('cyan', TEST_URL)}`, 'info');
  log(`Environment: ${colorize('yellow', process.env.NODE_ENV || 'development')}`, 'info');
  log('', 'info');
  
  const results = [];
  
  for (const path of TEST_PATHS) {
    const result = await testPath(path);
    results.push(result);
    log('', 'info');
  }
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  log('📊 Test Summary', 'info');
  log(`Successful tests: ${colorize('green', successful)}/${colorize('cyan', total)}`, 'info');
  
  if (successful === total) {
    log('🎉 All security headers tests passed!', 'success');
    process.exit(0);
  } else {
    log('❌ Some security headers tests failed', 'error');
    process.exit(1);
  }
}

// Handle CLI execution
if (require.main === module) {
  main().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { testPath, validateHeader, validateCSP, validateTrustedTypes, validateHSTS };
