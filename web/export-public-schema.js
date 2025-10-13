const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function exportPublicSchema() {
  try {
    logger.info('🔍 Querying public schema tables...');
    
    // Query to get all public schema tables with their structure
    const { data, error } = await supabase.rpc('get_public_schema_info');
    
    if (error) {
      console.error('Error querying schema:', error);
      
      // Fallback: try a direct SQL query
      logger.info('🔄 Trying direct SQL query...');
      const { data: directData, error: directError } = await supabase
        .from('information_schema.tables')
        .select('*')
        .eq('table_schema', 'public');
        
      if (directError) {
        console.error('Direct query error:', directError);
        return;
      }
      
      logger.info('📊 Found public tables:', directData);
      return;
    }
    
    logger.info('✅ Schema exported successfully');
    logger.info(JSON.stringify(data, null, 2));
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

exportPublicSchema();
