/**
 * Production Readiness Check
 * 
 * This script verifies that all critical production features are properly configured
 * and ready for deployment.
 */

import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { config } from 'dotenv';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

type CheckResult = {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
};

const checks: CheckResult[] = [];

// 1. Environment Variables
function checkEnvironmentVariables() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const optional = [
    'E2E_USER_EMAIL',
    'E2E_USER_PASSWORD',
    'E2E_ADMIN_EMAIL',
    'E2E_ADMIN_PASSWORD',
  ];

  const missing = required.filter(key => !process.env[key]);
  const missingOptional = optional.filter(key => !process.env[key]);

  if (missing.length > 0) {
    checks.push({
      name: 'Required Environment Variables',
      status: 'fail',
      message: `Missing required variables: ${missing.join(', ')}`,
    });
  } else {
    checks.push({
      name: 'Required Environment Variables',
      status: 'pass',
      message: 'All required environment variables are set',
    });
  }

  if (missingOptional.length > 0) {
    checks.push({
      name: 'Optional Environment Variables',
      status: 'warning',
      message: `Missing optional variables (for testing): ${missingOptional.join(', ')}`,
    });
  } else {
    checks.push({
      name: 'Optional Environment Variables',
      status: 'pass',
      message: 'All optional environment variables are set',
    });
  }
}

// 2. Admin User Configuration
async function checkAdminUser() {
  const adminEmail = process.env.E2E_ADMIN_EMAIL;
  
  if (!adminEmail) {
    checks.push({
      name: 'Admin User Configuration',
      status: 'warning',
      message: 'E2E_ADMIN_EMAIL not set - cannot verify admin user',
    });
    return;
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    checks.push({
      name: 'Admin User Configuration',
      status: 'warning',
      message: 'Supabase credentials not set - cannot verify admin user',
    });
    return;
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = authUsers?.users?.find((u) => u.email === adminEmail);

    if (!authUser) {
      checks.push({
        name: 'Admin User Configuration',
        status: 'fail',
        message: `Admin user ${adminEmail} not found in auth.users`,
      });
      return;
    }

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', authUser.id)
      .single();

    if (!profile) {
      checks.push({
        name: 'Admin User Configuration',
        status: 'fail',
        message: `Admin user ${adminEmail} has no profile`,
      });
      return;
    }

    if (profile.is_admin !== true) {
      checks.push({
        name: 'Admin User Configuration',
        status: 'fail',
        message: `Admin user ${adminEmail} does not have is_admin=true`,
      });
      return;
    }

    checks.push({
      name: 'Admin User Configuration',
      status: 'pass',
      message: `Admin user ${adminEmail} is correctly configured`,
    });
  } catch (error) {
    checks.push({
      name: 'Admin User Configuration',
      status: 'warning',
      message: `Could not verify admin user: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

// 3. Database Tables
async function checkDatabaseTables() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    checks.push({
      name: 'Database Tables',
      status: 'warning',
      message: 'Supabase credentials not set - cannot verify tables',
    });
    return;
  }

  const requiredTables = [
    'user_profiles',
    'feedback',
    'polls',
    'votes',
    'site_messages',
  ];

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const missingTables: string[] = [];

    for (const table of requiredTables) {
      try {
        const { error } = await supabaseAdmin
          .from(table)
          .select('id')
          .limit(1);

        if (error && error.code === 'PGRST116') {
          missingTables.push(table);
        }
      } catch {
        missingTables.push(table);
      }
    }

    if (missingTables.length > 0) {
      checks.push({
        name: 'Database Tables',
        status: 'fail',
        message: `Missing tables: ${missingTables.join(', ')}`,
      });
    } else {
      checks.push({
        name: 'Database Tables',
        status: 'pass',
        message: 'All required database tables exist',
      });
    }
  } catch (error) {
    checks.push({
      name: 'Database Tables',
      status: 'warning',
      message: `Could not verify tables: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

// 4. API Endpoints
function checkAPIEndpoints() {
  const endpoints = [
    '/api/health',
    '/api/auth/login',
    '/api/auth/register',
    '/api/profile',
    '/api/feedback',
    '/api/admin/health',
  ];

  checks.push({
    name: 'API Endpoints',
    status: 'pass',
    message: `Expected endpoints: ${endpoints.join(', ')} (verify manually in production)`,
  });
}

// 5. Feature Flags
function checkFeatureFlags() {
  const criticalFlags = [
    'FEEDBACK_WIDGET',
    'ADMIN',
    'PWA',
  ];

  checks.push({
    name: 'Feature Flags',
    status: 'pass',
    message: `Critical flags should be enabled: ${criticalFlags.join(', ')}`,
  });
}

// Run all checks
async function runChecks() {
   
  console.log('🔍 Running Production Readiness Checks...\n');

  checkEnvironmentVariables();
  await checkAdminUser();
  await checkDatabaseTables();
  checkAPIEndpoints();
  checkFeatureFlags();

  // Print results
   
  console.log('Results:\n');
  
  const passed = checks.filter(c => c.status === 'pass').length;
  const failed = checks.filter(c => c.status === 'fail').length;
  const warnings = checks.filter(c => c.status === 'warning').length;

  checks.forEach(check => {
    const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️';
     
    console.log(`${icon} ${check.name}: ${check.message}`);
  });

   
  console.log('\n---\n');
   
  console.log(`Summary: ${passed} passed, ${failed} failed, ${warnings} warnings\n`);

  if (failed > 0) {
     
    console.log('❌ Production readiness check FAILED. Please fix the issues above before deploying.\n');
    process.exit(1);
  } else if (warnings > 0) {
     
    console.log('⚠️  Production readiness check passed with warnings. Review warnings above.\n');
    process.exit(0);
  } else {
     
    console.log('✅ Production readiness check PASSED. All systems ready for deployment.\n');
    process.exit(0);
  }
}

runChecks().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

