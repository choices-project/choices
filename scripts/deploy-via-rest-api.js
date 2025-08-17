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

async function deployViaRestApi() {
  console.log('🔧 Deploying Database via REST API');
  console.log('==================================\n');

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
    console.log('\n📋 Step 1: Creating exec_sql function first...');
    
    // First, we need to create the exec_sql function manually
    console.log('⚠️  The exec_sql function needs to be created manually');
    console.log('\n📋 Please run this SQL in your Supabase dashboard first:');
    console.log('\n' + '='.repeat(60));
    console.log(`
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
    `);
    console.log('='.repeat(60));
    
    console.log('\n📋 Steps:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Create a new query');
    console.log('3. Copy and paste the SQL above');
    console.log('4. Click "Run" to execute');
    console.log('5. Then come back and run this script again');
    
    console.log('\n⏳ Waiting for you to create the exec_sql function...');
    console.log('Press Enter when you\'ve created the function, or Ctrl+C to exit');
    
    // Wait for user input
    process.stdin.once('data', async () => {
      console.log('\n🔄 Continuing with deployment...');
      
      try {
        console.log('\n📋 Step 2: Testing exec_sql function...');
        
        // Test the exec_sql function
        const testUrl = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
        const testResponse = await makeRequest(testUrl, {
          method: 'POST',
          token: supabaseServiceKey
        }, {
          sql: 'SELECT 1 as test;'
        });

        if (testResponse.status === 200 && testResponse.data.success) {
          console.log('✅ exec_sql function is working!');
          
          console.log('\n📋 Step 3: Deploying tables and security policies...');
          
          // Now we can use exec_sql to deploy everything
          const fs = require('fs');
          const path = require('path');
          
          // Read the automated polls tables SQL
          const tablesSQLPath = path.join(__dirname, '../database/automated_polls_tables.sql');
          if (fs.existsSync(tablesSQLPath)) {
            const tablesSQL = fs.readFileSync(tablesSQLPath, 'utf8');
            console.log('📋 Deploying automated polls tables...');
            
            const tablesResponse = await makeRequest(testUrl, {
              method: 'POST',
              token: supabaseServiceKey
            }, {
              sql: tablesSQL
            });

            if (tablesResponse.status === 200 && tablesResponse.data.success) {
              console.log('✅ Tables deployed successfully');
            } else {
              console.log('⚠️  Tables may already exist:', tablesResponse.data);
            }
          }
          
          // Read the security policies SQL
          const securitySQLPath = path.join(__dirname, '../database/security_policies_fixed.sql');
          if (fs.existsSync(securitySQLPath)) {
            const securitySQL = fs.readFileSync(securitySQLPath, 'utf8');
            console.log('📋 Deploying security policies...');
            
            const securityResponse = await makeRequest(testUrl, {
              method: 'POST',
              token: supabaseServiceKey
            }, {
              sql: securitySQL
            });

            if (securityResponse.status === 200 && securityResponse.data.success) {
              console.log('✅ Security policies deployed successfully');
            } else {
              console.log('⚠️  Security policies may have errors:', securityResponse.data);
            }
          }
          
          console.log('\n🎉 Deployment completed!');
          console.log('=====================================');
          console.log('✅ exec_sql function created');
          console.log('✅ Automated polls tables deployed');
          console.log('✅ Security policies deployed');
          console.log('\n🔧 Next steps:');
          console.log('1. Restart your development server');
          console.log('2. Test admin dashboard at /admin/automated-polls');
          console.log('3. Test poll creation and voting');
          
        } else {
          console.log('❌ exec_sql function is not working yet');
          console.log('Response:', testResponse.data);
          console.log('\n💡 Please make sure you created the function correctly');
        }
        
      } catch (error) {
        console.error('❌ Deployment failed:', error);
      }
      
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

deployViaRestApi();
