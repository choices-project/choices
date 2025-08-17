#!/usr/bin/env node

require('dotenv').config({ path: './web/.env.local' });

const https = require('https');
const { URL } = require('url');

async function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.token}`,
        'apikey': options.token,
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testExecSql() {
  console.log('🧪 Testing exec_sql Function');
  console.log('============================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  try {
    // Test 1: Simple query
    console.log('📋 Test 1: Simple SELECT query...');
    const testUrl = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
    
    const simpleResponse = await makeRequest(testUrl, {
      method: 'POST',
      token: supabaseServiceKey
    }, {
      sql: 'SELECT 1 as test;'
    });

    console.log('Response:', simpleResponse.data);

    // Test 2: Create table query
    console.log('\n📋 Test 2: CREATE TABLE query...');
    
    const createTableResponse = await makeRequest(testUrl, {
      method: 'POST',
      token: supabaseServiceKey
    }, {
      sql: `
        CREATE TABLE IF NOT EXISTS test_table (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    console.log('Response:', createTableResponse.data);

    // Test 3: Check if table was created
    console.log('\n📋 Test 3: Check if table exists...');
    
    const checkTableResponse = await makeRequest(testUrl, {
      method: 'POST',
      token: supabaseServiceKey
    }, {
      sql: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'test_table'
        ) as table_exists;
      `
    });

    console.log('Response:', checkTableResponse.data);

    // Test 4: Drop test table
    console.log('\n📋 Test 4: Clean up test table...');
    
    const dropTableResponse = await makeRequest(testUrl, {
      method: 'POST',
      token: supabaseServiceKey
    }, {
      sql: 'DROP TABLE IF EXISTS test_table;'
    });

    console.log('Response:', dropTableResponse.data);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testExecSql();
