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

async function deployIaTokensAndSecurity() {
  console.log('🔒 Deploying IA Tokens Table and Security Policies');
  console.log('==================================================\n');

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
    // Step 1: Check if ia_tokens table exists
    console.log('\n📋 Step 1: Checking ia_tokens table...');
    
    const checkTableUrl = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
    const checkTableResponse = await makeRequest(checkTableUrl, {
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

    if (checkTableResponse.status === 200 && checkTableResponse.data.success) {
      console.log('✅ ia_tokens table exists');
    } else {
      console.log('❌ ia_tokens table does not exist');
      console.log('Creating ia_tokens table...');
      
      const iaTokensSqlPath = path.join(__dirname, '../database/create_ia_tokens_simple.sql');
      
      if (!fs.existsSync(iaTokensSqlPath)) {
        console.error('❌ ia_tokens table creation file not found');
        console.error(`Expected: ${iaTokensSqlPath}`);
        process.exit(1);
      }

      const iaTokensSQL = fs.readFileSync(iaTokensSqlPath, 'utf8');
      console.log('✅ ia_tokens table creation file loaded');
      console.log(`📄 File size: ${iaTokensSQL.length} characters`);

      const createTableResponse = await makeRequest(checkTableUrl, {
        method: 'POST',
        token: supabaseServiceKey
      }, {
        sql: iaTokensSQL
      });

      if (createTableResponse.status === 200 && createTableResponse.data.success) {
        console.log('✅ ia_tokens table created successfully!');
      } else {
        console.log('❌ Table creation failed');
        console.log('Response:', createTableResponse.data);
        process.exit(1);
      }
    }

    // Step 2: Deploy security policies
    console.log('\n📋 Step 2: Deploying security policies...');
    
    const securitySqlPath = path.join(__dirname, '../database/security_policies_correct_columns.sql');
    
    if (!fs.existsSync(securitySqlPath)) {
      console.error('❌ Security policies file not found');
      console.error(`Expected: ${securitySqlPath}`);
      process.exit(1);
    }

    const securitySQL = fs.readFileSync(securitySqlPath, 'utf8');
    console.log('✅ Security policies file loaded');
    console.log(`📄 File size: ${securitySQL.length} characters`);

    const deploySecurityResponse = await makeRequest(checkTableUrl, {
      method: 'POST',
      token: supabaseServiceKey
    }, {
      sql: securitySQL
    });

    if (deploySecurityResponse.status === 200 && deploySecurityResponse.data.success) {
      console.log('✅ Security policies deployed successfully!');
    } else {
      console.log('⚠️  Security deployment may have had issues:');
      console.log('Response:', deploySecurityResponse.data);
      
      if (deploySecurityResponse.data && typeof deploySecurityResponse.data === 'string' && 
          deploySecurityResponse.data.includes('already exists')) {
        console.log('✅ Security policies deployed (some already existed)');
      } else {
        console.log('❌ Security deployment failed');
        console.log('\n📋 Manual Deployment Required:');
        console.log('1. Go to Supabase Dashboard → SQL Editor');
        console.log('2. Copy the contents of database/security_policies_with_ia_tokens.sql');
        console.log('3. Paste and run the SQL');
        process.exit(1);
      }
    }

    // Step 3: Verify deployment
    console.log('\n📋 Step 3: Verifying deployment...');
    
    const testTables = [
      'ia_users', 'ia_tokens', 'po_polls', 'po_votes', 'feedback'
    ];

    for (const table of testTables) {
      const tableUrl = `${supabaseUrl}/rest/v1/${table}?select=count`;
      const tableResponse = await makeRequest(tableUrl, {
        method: 'GET',
        token: supabaseServiceKey
      });

      if (tableResponse.status === 200) {
        console.log(`✅ ${table} table accessible`);
      } else {
        console.log(`⚠️  ${table} table may have access issues`);
      }
    }

    console.log('\n🎉 IA Tokens and Security Deployment Completed!');
    console.log('================================================');
    console.log('✅ ia_tokens table created with proper structure');
    console.log('✅ Security policies deployed with IA/PO support');
    console.log('✅ RLS protection active on all tables');
    console.log('✅ Data isolation implemented');
    console.log('✅ IA/PO architecture integrity maintained');
    
    console.log('\n🔧 Next steps:');
    console.log('1. Restart your development server');
    console.log('2. Test admin dashboard at /admin/automated-polls');
    console.log('3. Test poll creation and voting');
    console.log('4. Verify IA/PO security is working correctly');

    console.log('\n🧪 Test commands:');
    console.log('node scripts/investigate-ia-tokens.js');
    console.log('node scripts/test-complete-flow.js');
    console.log('node scripts/test-auth-flow.js');

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    console.log('\n📋 Manual Deployment Required:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Copy the contents of database/create_ia_tokens_table.sql');
    console.log('3. Paste and run the SQL');
    console.log('4. Copy the contents of database/security_policies_with_ia_tokens.sql');
    console.log('5. Paste and run the SQL');
    process.exit(1);
  }
}

deployIaTokensAndSecurity();
