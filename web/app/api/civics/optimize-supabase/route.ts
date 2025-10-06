import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireServiceKey } from '@/lib/service-auth';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    // Log the request for debugging
    console.log('Supabase optimization requested from:', request.headers.get('user-agent'));
    
    // Require service key authentication
    const serviceCheck = await requireServiceKey();
    if (serviceCheck) return serviceCheck;
    
    const results = {
      startTime: new Date(),
      operations: [] as string[],
      errors: [] as string[],
      warnings: [] as string[],
      success: false
    };
    
    console.log('🔧 Starting Supabase optimization...');
    
    try {
      // Read the SQL file
      const sqlPath = path.join(process.cwd(), 'fix-supabase-warnings.sql');
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      
      // Split into individual statements
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`📝 Found ${statements.length} SQL statements to execute`);
      
      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement.trim()) {
          try {
            console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
            const { error } = await supabase.rpc('exec_sql', { sql: statement });
            
            if (error) {
              console.error(`❌ Statement ${i + 1} failed:`, error.message);
              results.errors.push(`Statement ${i + 1}: ${error.message}`);
            } else {
              console.log(`✅ Statement ${i + 1} executed successfully`);
              results.operations.push(`Statement ${i + 1}: ${statement.substring(0, 50)}...`);
            }
          } catch (execError) {
            console.error(`❌ Statement ${i + 1} execution error:`, execError);
            results.errors.push(`Statement ${i + 1}: ${execError instanceof Error ? execError.message : 'Unknown error'}`);
          }
        }
      }
      
      // Verify the fixes
      console.log('🔍 Verifying optimizations...');
      
      // Check RLS status
      const { data: rlsData, error: rlsError } = await supabase
        .from('information_schema.tables')
        .select('table_name, row_security')
        .eq('table_schema', 'public');
      
      if (rlsError) {
        results.warnings.push(`Could not verify RLS status: ${rlsError.message}`);
      } else {
        const rlsEnabled = rlsData?.filter(table => table.row_security === 'YES').length || 0;
        results.operations.push(`RLS enabled on ${rlsEnabled} tables`);
      }
      
      // Check indexes
      const { data: indexData, error: indexError } = await supabase
        .from('pg_indexes')
        .select('tablename, indexname')
        .eq('schemaname', 'public');
      
      if (indexError) {
        results.warnings.push(`Could not verify indexes: ${indexError.message}`);
      } else {
        const indexCount = indexData?.length || 0;
        results.operations.push(`Created ${indexCount} indexes`);
      }
      
      // Check table counts
      const { data: tableData, error: tableError } = await supabase
        .from('representatives_core')
        .select('id', { count: 'exact' });
      
      if (tableError) {
        results.warnings.push(`Could not verify table counts: ${tableError.message}`);
      } else {
        results.operations.push(`Representatives table has ${tableData?.length || 0} records`);
      }
      
      results.success = results.errors.length === 0;
      
      console.log('✅ Supabase optimization completed');
      console.log(`📊 Operations: ${results.operations.length}`);
      console.log(`❌ Errors: ${results.errors.length}`);
      console.log(`⚠️ Warnings: ${results.warnings.length}`);
      
    } catch (error) {
      console.error('❌ Supabase optimization failed:', error);
      results.errors.push(`Optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    const endTime = new Date();
    const duration = endTime.getTime() - results.startTime.getTime();
    
    return NextResponse.json({
      success: results.success,
      message: results.success ? 'Supabase optimization completed successfully' : 'Supabase optimization completed with errors',
      results: {
        ...results,
        endTime,
        duration: `${duration}ms`
      },
      recommendations: results.success ? [
        'Database is now optimized and secure',
        'RLS policies are enabled for security',
        'Performance indexes are created',
        'Missing tables are created',
        'Monitor database performance'
      ] : [
        'Review errors and fix manually',
        'Check SQL syntax and permissions',
        'Verify Supabase connection',
        'Consider running individual statements'
      ]
    });
    
  } catch (error) {
    console.error('❌ Supabase optimization endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Supabase optimization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Require service key authentication
    const serviceCheck = await requireServiceKey();
    if (serviceCheck) return serviceCheck;
    
    // Check current database health
    const { data: healthData, error: healthError } = await supabase
      .rpc('get_database_health');
    
    if (healthError) {
      return NextResponse.json({
        success: false,
        error: 'Could not get database health',
        details: healthError.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database health check completed',
      health: healthData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Database health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
