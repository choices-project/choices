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

async function checkIaTokensStructure() {
  console.log('🔍 Checking IA Tokens Table Structure');
  console.log('=====================================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  try {
    const testUrl = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
    
    // Check if table exists
    console.log('📋 Step 1: Checking if ia_tokens table exists...');
    
    const tableCheckResponse = await makeRequest(testUrl, {
      method: 'POST',
      token: supabaseServiceKey
    }, {
      sql: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'ia_tokens'
        ) as table_exists;
      `
    });

    console.log('Table check response:', tableCheckResponse.data);

    if (tableCheckResponse.status === 200 && tableCheckResponse.data.success) {
      console.log('✅ ia_tokens table exists');
      
      // Get table structure
      console.log('\n📋 Step 2: Getting table structure...');
      
      const structureResponse = await makeRequest(testUrl, {
        method: 'POST',
        token: supabaseServiceKey
      }, {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'ia_tokens'
          ORDER BY ordinal_position;
        `
      });

      console.log('Structure response:', structureResponse.data);
      
      // Try to get the actual data
      if (structureResponse.data && structureResponse.data.result) {
        console.log('📋 Actual table structure:');
        console.log(JSON.stringify(structureResponse.data.result, null, 2));
      }

      // Check for user-related columns
      console.log('\n📋 Step 3: Checking for user-related columns...');
      
      const userColumnsResponse = await makeRequest(testUrl, {
        method: 'POST',
        token: supabaseServiceKey
      }, {
        sql: `
          SELECT column_name, data_type
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'ia_tokens'
          AND (column_name LIKE '%user%' OR column_name LIKE '%stable%' OR column_name LIKE '%id%')
          ORDER BY column_name;
        `
      });

      console.log('User columns response:', userColumnsResponse.data);
      
      // Try to get the actual data
      if (userColumnsResponse.data && userColumnsResponse.data.result) {
        console.log('📋 Actual user-related columns:');
        console.log(JSON.stringify(userColumnsResponse.data.result, null, 2));
      }

    } else {
      console.log('❌ ia_tokens table does not exist');
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkIaTokensStructure();
