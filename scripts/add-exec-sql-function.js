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

async function addExecSqlFunction() {
  console.log('🔧 Adding exec_sql Function to Supabase');
  console.log('======================================\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('✅ Found Supabase credentials');
  console.log(`📡 URL: ${supabaseUrl}`);
  console.log(`🔑 Service Key: ${supabaseServiceKey.substring(0, 20)}...`);

  try {
    console.log('\n📋 Creating exec_sql function...');
    
    // Create the exec_sql function using direct SQL execution
    const execSqlFunction = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS json
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result json;
      BEGIN
        EXECUTE sql;
        result := '{"success": true, "message": "SQL executed successfully"}'::json;
        RETURN result;
      EXCEPTION
        WHEN OTHERS THEN
          result := json_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE
          );
          RETURN result;
      END;
      $$;
    `;

    // Use the PostgreSQL REST API to execute this directly
    const sqlUrl = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
    
    // First, try to create the function using a different approach
    // We'll use the PostgreSQL connection string approach
    const functionUrl = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
    
    // Since we can't use exec_sql to create itself, we need to use the dashboard
    console.log('⚠️  The exec_sql function needs to be created manually in the Supabase dashboard');
    console.log('\n📋 Manual Steps:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Create a new query');
    console.log('3. Copy and paste this SQL:');
    console.log('\n' + '='.repeat(60));
    console.log(execSqlFunction);
    console.log('='.repeat(60));
    console.log('\n4. Click "Run" to execute');
    console.log('5. Then run: node scripts/deploy-database-direct.js');
    
    console.log('\n🎯 Alternative: Use the dashboard for everything');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Copy the SQL from database/automated_polls_tables.sql');
    console.log('3. Run it to create tables');
    console.log('4. Copy the SQL from database/security_policies_fixed.sql');
    console.log('5. Run it to deploy security policies');
    
    console.log('\n✅ After either approach, your system will be fully deployed!');

  } catch (error) {
    console.error('❌ Failed to add exec_sql function:', error);
    console.log('\n💡 The exec_sql function is not available by default in Supabase');
    console.log('   You need to create it manually in the dashboard first');
    process.exit(1);
  }
}

addExecSqlFunction();
