import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(request: NextRequest) {
  try {
    console.log('Getting complete database schema with service key...');
    
    const schema = {
      tables: [],
      columns: [],
      constraints: [],
      indexes: [],
      rlsPolicies: [],
      sequences: [],
      functions: [],
      triggers: [],
      views: [],
      extensions: [],
      tableStats: []
    };
    
    // 1. Get all tables using raw SQL
    try {
      const { data: tables, error } = await supabase
        .rpc('exec_sql', { 
          sql: "SELECT * FROM pg_tables WHERE schemaname = 'public'" 
        });
      
      if (!error && tables) {
        schema.tables = tables;
      }
    } catch (e) {
      console.log('Tables query failed:', e);
    }
    
    // 2. Get all columns using raw SQL
    try {
      const { data: columns, error } = await supabase
        .rpc('exec_sql', { 
          sql: "SELECT * FROM information_schema.columns WHERE table_schema = 'public'" 
        });
      
      if (!error && columns) {
        schema.columns = columns;
      }
    } catch (e) {
      console.log('Columns query failed:', e);
    }
    
    // 3. Get all constraints using raw SQL
    try {
      const { data: constraints, error } = await supabase
        .rpc('exec_sql', { 
          sql: "SELECT * FROM information_schema.table_constraints WHERE table_schema = 'public'" 
        });
      
      if (!error && constraints) {
        schema.constraints = constraints;
      }
    } catch (e) {
      console.log('Constraints query failed:', e);
    }
    
    // 4. Get all indexes using raw SQL
    try {
      const { data: indexes, error } = await supabase
        .rpc('exec_sql', { 
          sql: "SELECT * FROM pg_indexes WHERE schemaname = 'public'" 
        });
      
      if (!error && indexes) {
        schema.indexes = indexes;
      }
    } catch (e) {
      console.log('Indexes query failed:', e);
    }
    
    // 5. Get all RLS policies using raw SQL
    try {
      const { data: policies, error } = await supabase
        .rpc('exec_sql', { 
          sql: "SELECT * FROM pg_policies WHERE schemaname = 'public'" 
        });
      
      if (!error && policies) {
        schema.rlsPolicies = policies;
      }
    } catch (e) {
      console.log('RLS policies query failed:', e);
    }
    
    // 6. Get all sequences using raw SQL
    try {
      const { data: sequences, error } = await supabase
        .rpc('exec_sql', { 
          sql: "SELECT * FROM information_schema.sequences WHERE sequence_schema = 'public'" 
        });
      
      if (!error && sequences) {
        schema.sequences = sequences;
      }
    } catch (e) {
      console.log('Sequences query failed:', e);
    }
    
    // 7. Get all functions using raw SQL
    try {
      const { data: functions, error } = await supabase
        .rpc('exec_sql', { 
          sql: "SELECT * FROM information_schema.routines WHERE routine_schema = 'public'" 
        });
      
      if (!error && functions) {
        schema.functions = functions;
      }
    } catch (e) {
      console.log('Functions query failed:', e);
    }
    
    // 8. Get all triggers using raw SQL
    try {
      const { data: triggers, error } = await supabase
        .rpc('exec_sql', { 
          sql: "SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public'" 
        });
      
      if (!error && triggers) {
        schema.triggers = triggers;
      }
    } catch (e) {
      console.log('Triggers query failed:', e);
    }
    
    // 9. Get all views using raw SQL
    try {
      const { data: views, error } = await supabase
        .rpc('exec_sql', { 
          sql: "SELECT * FROM information_schema.views WHERE table_schema = 'public'" 
        });
      
      if (!error && views) {
        schema.views = views;
      }
    } catch (e) {
      console.log('Views query failed:', e);
    }
    
    // 10. Get all extensions using raw SQL
    try {
      const { data: extensions, error } = await supabase
        .rpc('exec_sql', { 
          sql: "SELECT * FROM pg_extension" 
        });
      
      if (!error && extensions) {
        schema.extensions = extensions;
      }
    } catch (e) {
      console.log('Extensions query failed:', e);
    }
    
    // 11. Get table statistics using raw SQL
    try {
      const { data: stats, error } = await supabase
        .rpc('exec_sql', { 
          sql: "SELECT * FROM pg_stat_user_tables WHERE schemaname = 'public'" 
        });
      
      if (!error && stats) {
        schema.tableStats = stats;
      }
    } catch (e) {
      console.log('Table stats query failed:', e);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Complete database schema retrieved',
      schema,
      summary: {
        totalTables: schema.tables.length,
        totalColumns: schema.columns.length,
        totalConstraints: schema.constraints.length,
        totalIndexes: schema.indexes.length,
        totalRLSPolicies: schema.rlsPolicies.length,
        totalSequences: schema.sequences.length,
        totalFunctions: schema.functions.length,
        totalTriggers: schema.triggers.length,
        totalViews: schema.views.length,
        totalExtensions: schema.extensions.length,
        totalTableStats: schema.tableStats.length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Schema retrieval failed:', error);
    return NextResponse.json({
      success: false,
      error: `Schema retrieval failed: ${error}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
