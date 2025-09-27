#!/usr/bin/env node

/**
 * Test Civics Address Lookup Feature
 * This script tests the civics address lookup functionality
 */

const fetch = require('node-fetch');

async function testCivicsAddressLookup() {
  console.log('🧪 Testing Civics Address Lookup Feature...\n');

  const testAddresses = [
    '123 Main St, Springfield, IL 62704',
    '1600 Pennsylvania Avenue NW, Washington, DC 20500',
    '1 Hacker Way, Menlo Park, CA 94025'
  ];

  for (const address of testAddresses) {
    console.log(`📍 Testing address: ${address}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/v1/civics/address-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ Success: ${JSON.stringify(data, null, 2)}`);
      } else {
        console.log(`❌ Error (${response.status}): ${data.error}`);
      }
    } catch (error) {
      console.log(`💥 Network Error: ${error.message}`);
    }
    
    console.log('---\n');
  }
}

// Check if we're in the right directory
const fs = require('fs');
if (!fs.existsSync('package.json')) {
  console.error('❌ Please run this script from the web directory');
  process.exit(1);
}

console.log('🚀 Starting Civics Feature Test...\n');
console.log('Make sure your development server is running on http://localhost:3000\n');

testCivicsAddressLookup().catch(console.error);
