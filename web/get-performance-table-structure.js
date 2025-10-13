const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getTableStructures() {
  try {
    console.log('🔍 Getting table structures for performance optimization...');
    
    const tables = ['candidates', 'voting_records'];
    
    for (const tableName of tables) {
      console.log(`\n📊 Checking ${tableName} table structure:`);
      
      // Get column information
      const { data, error } = await supabase
        .rpc('get_table_columns', { table_name: tableName });
      
      if (error) {
        console.log(`❌ Error getting ${tableName} structure:`, error.message);
        
        // Fallback: try to get a sample record
        const { data: sampleData, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!sampleError && sampleData && sampleData.length > 0) {
          console.log(`✅ Sample record from ${tableName}:`);
          console.log('Columns:', Object.keys(sampleData[0]));
        } else {
          console.log(`❌ Could not get sample from ${tableName}:`, sampleError?.message);
        }
      } else {
        console.log(`✅ ${tableName} columns:`, data);
      }
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

getTableStructures();


