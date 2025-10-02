const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  console.log('🔄 Creating Missing Tables for Candidate Cards');
  console.log('==============================================');
  console.log('');
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('phase2/CREATE_MISSING_TABLES.sql', 'utf8');
    console.log('📁 Reading CREATE_MISSING_TABLES.sql');
    console.log('📊 SQL Content Length:', sqlContent.length, 'characters');
    console.log('');
    
    // Execute the SQL directly
    console.log('🔄 Executing SQL against Supabase...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ SQL execution failed:', error.message);
      console.log('🔧 Trying alternative approach...');
      
      // Try executing individual statements
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log('📋 Found', statements.length, 'SQL statements to execute individually');
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          console.log('🔄 Executing statement', i + 1 + '/' + statements.length);
          console.log('SQL:', statement.substring(0, 100) + '...');
          
          try {
            const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement });
            if (stmtError) {
              console.log('❌ Statement failed:', stmtError.message);
            } else {
              console.log('✅ Success');
            }
          } catch (err) {
            console.log('❌ Statement exception:', err.message);
          }
          console.log('');
        }
      }
    } else {
      console.log('✅ SQL executed successfully');
      console.log('📊 Result:', data);
    }
    
    console.log('');
    console.log('🎉 Table creation process completed!');
    console.log('=====================================');
    console.log('');
    console.log('Next steps:');
    console.log('- Verify tables were created');
    console.log('- Populate tables with sample data');
    console.log('- Test candidate cards functionality');
    console.log('');
    
  } catch (error) {
    console.error('❌ Table creation failed:', error.message);
    console.log('');
    console.log('🔧 Manual approach needed:');
    console.log('1. Copy the SQL from CREATE_MISSING_TABLES.sql');
    console.log('2. Run it directly in Supabase SQL Editor');
    console.log('3. Verify tables are created');
    console.log('');
    process.exit(1);
  }
}

createTables();
