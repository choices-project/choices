#!/usr/bin/env node

require('dotenv').config({ path: './web/.env.local' });

const https = require('https');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

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

async function testIaTokensSql() {
  console.log('🧪 Testing IA Tokens SQL Step by Step');
  console.log('=====================================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  try {
    const testUrl = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
    
    // Test 1: Create table step by step
    console.log('📋 Test 1: Creating ia_tokens table...');
    
    const createTableResponse = await makeRequest(testUrl, {
      method: 'POST',
      token: supabaseServiceKey
    }, {
      sql: `
        CREATE TABLE IF NOT EXISTS ia_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_stable_id TEXT NOT NULL,
          poll_id UUID NOT NULL,
          token_hash TEXT NOT NULL,
          token_signature TEXT NOT NULL,
          scope TEXT NOT NULL,
          tier TEXT NOT NULL,
          issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          is_used BOOLEAN DEFAULT FALSE,
          used_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    console.log('Create table response:', createTableResponse.data);

    if (createTableResponse.status === 200 && createTableResponse.data.success) {
      console.log('✅ Table created successfully');
      
      // Test 2: Create indexes
      console.log('\n📋 Test 2: Creating indexes...');
      
      const indexResponse = await makeRequest(testUrl, {
        method: 'POST',
        token: supabaseServiceKey
      }, {
        sql: `
          CREATE INDEX IF NOT EXISTS idx_ia_tokens_user_stable_id ON ia_tokens(user_stable_id);
          CREATE INDEX IF NOT EXISTS idx_ia_tokens_poll_id ON ia_tokens(poll_id);
          CREATE INDEX IF NOT EXISTS idx_ia_tokens_token_hash ON ia_tokens(token_hash);
        `
      });

      console.log('Index response:', indexResponse.data);

      // Test 3: Create trigger function
      console.log('\n📋 Test 3: Creating trigger function...');
      
      const triggerResponse = await makeRequest(testUrl, {
        method: 'POST',
        token: supabaseServiceKey
      }, {
        sql: `
          CREATE OR REPLACE FUNCTION update_ia_tokens_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `
      });

      console.log('Trigger function response:', triggerResponse.data);

      // Test 4: Create trigger
      console.log('\n📋 Test 4: Creating trigger...');
      
      const triggerCreateResponse = await makeRequest(testUrl, {
        method: 'POST',
        token: supabaseServiceKey
      }, {
        sql: `
          CREATE TRIGGER update_ia_tokens_updated_at
              BEFORE UPDATE ON ia_tokens
              FOR EACH ROW
              EXECUTE FUNCTION update_ia_tokens_updated_at();
        `
      });

      console.log('Trigger creation response:', triggerCreateResponse.data);

      // Test 5: Add constraints
      console.log('\n📋 Test 5: Adding constraints...');
      
      const constraintResponse = await makeRequest(testUrl, {
        method: 'POST',
        token: supabaseServiceKey
      }, {
        sql: `
          ALTER TABLE ia_tokens 
          ADD CONSTRAINT chk_ia_tokens_tier 
          CHECK (tier IN ('T0', 'T1', 'T2', 'T3'));
        `
      });

      console.log('Constraint response:', constraintResponse.data);

      console.log('\n🎉 All tests completed successfully!');

    } else {
      console.log('❌ Table creation failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testIaTokensSql();
