#!/usr/bin/env node

/**
 * Development Environment Test
 * 
 * Tests the development server and basic functionality
 */

const http = require('http');
const https = require('https');
const { spawn } = require('child_process');
const path = require('path');

async function testDevelopmentEnvironment() {
  console.log('🔍 Testing Development Environment...\n');

  const baseUrl = 'http://localhost:3000';
  const testEndpoints = [
    '/',
    '/api/polls',
    '/admin/automated-polls',
    '/login',
    '/register'
  ];

  // Check if development server is running
  console.log('🚀 Checking development server...');
  
  try {
    const response = await makeRequest(baseUrl);
    console.log('✅ Development server is running');
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers['content-type']}`);
    
    // Check if it's returning HTML (not just JSON error)
    if (response.data && response.data.includes('<!DOCTYPE html>')) {
      console.log('✅ Server returning HTML content');
    } else {
      console.log('⚠️  Server not returning expected HTML content');
      console.log('   This might indicate a rendering issue');
    }

  } catch (error) {
    console.error('❌ Development server not accessible:', error.message);
    console.log('\n💡 To start the development server:');
    console.log('   cd web && npm run dev');
    return false;
  }

  // Test key endpoints
  console.log('\n🔗 Testing key endpoints...');
  
  for (const endpoint of testEndpoints) {
    try {
      const response = await makeRequest(`${baseUrl}${endpoint}`);
      console.log(`✅ ${endpoint}: ${response.status}`);
      
      // Check for common error patterns
      if (response.data) {
        if (response.data.includes('Error') || response.data.includes('error')) {
          console.log(`   ⚠️  ${endpoint} may have errors`);
        }
        if (response.data.includes('bare wireframes') || response.data.includes('loading')) {
          console.log(`   ⚠️  ${endpoint} showing loading/wireframe state`);
        }
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }

  // Test API endpoints specifically
  console.log('\n🔌 Testing API endpoints...');
  
  const apiEndpoints = [
    '/api/polls',
    '/api/user/get-id',
    '/api/database-status'
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const response = await makeRequest(`${baseUrl}${endpoint}`);
      console.log(`✅ ${endpoint}: ${response.status}`);
      
      // Check if it's returning JSON
      if (response.headers['content-type'] && response.headers['content-type'].includes('application/json')) {
        console.log(`   ✅ ${endpoint} returning JSON`);
      } else {
        console.log(`   ⚠️  ${endpoint} not returning JSON`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }

  // Check package.json for dependencies
  console.log('\n📦 Checking dependencies...');
  
  try {
    const packagePath = path.join(__dirname, '../web/package.json');
    const packageJson = require(packagePath);
    
    const requiredDeps = [
      'next',
      'react',
      'react-dom',
      '@supabase/supabase-js',
      'typescript'
    ];

    for (const dep of requiredDeps) {
      if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
        console.log(`✅ ${dep}: ${packageJson.dependencies[dep] || packageJson.devDependencies[dep]}`);
      } else {
        console.log(`❌ ${dep}: MISSING`);
      }
    }

  } catch (error) {
    console.error('❌ Error reading package.json:', error.message);
  }

  // Check for common issues
  console.log('\n🔍 Checking for common issues...');
  
  try {
    const response = await makeRequest(baseUrl);
    
    if (response.data) {
      const issues = [];
      
      if (response.data.includes('Module not found')) {
        issues.push('Missing dependencies');
      }
      
      if (response.data.includes('Cannot resolve')) {
        issues.push('Import resolution issues');
      }
      
      if (response.data.includes('TypeError')) {
        issues.push('JavaScript runtime errors');
      }
      
      if (response.data.includes('ReferenceError')) {
        issues.push('Undefined variable references');
      }
      
      if (response.data.includes('SyntaxError')) {
        issues.push('JavaScript syntax errors');
      }
      
      if (issues.length > 0) {
        console.log('⚠️  Potential issues detected:');
        issues.forEach(issue => console.log(`   - ${issue}`));
      } else {
        console.log('✅ No obvious issues detected');
      }
    }

  } catch (error) {
    console.log('⚠️  Could not check for common issues');
  }

  console.log('\n🎉 Development environment test completed!');
  return true;
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Run the test
testDevelopmentEnvironment().then(success => {
  process.exit(success ? 0 : 1);
});
