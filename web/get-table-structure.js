const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getTableStructure() {
  try {
    console.log('🔍 Getting representatives_core table structure...');
    
    // Get a sample record to see the structure
    const { data, error } = await supabase
      .from('representatives_core')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('📊 Sample record structure:');
      console.log(JSON.stringify(data[0], null, 2));
      
      // Check for enhanced JSONB columns
      const record = data[0];
      console.log('\n🔍 Enhanced data columns:');
      console.log('enhanced_contacts:', record.enhanced_contacts ? '✅ Present' : '❌ Missing');
      console.log('enhanced_photos:', record.enhanced_photos ? '✅ Present' : '❌ Missing');
      console.log('enhanced_activity:', record.enhanced_activity ? '✅ Present' : '❌ Missing');
      console.log('enhanced_social_media:', record.enhanced_social_media ? '✅ Present' : '❌ Missing');
      
      if (record.enhanced_contacts) {
        console.log('\n📞 Enhanced contacts sample:', record.enhanced_contacts);
      }
      if (record.enhanced_photos) {
        console.log('\n📸 Enhanced photos sample:', record.enhanced_photos);
      }
      if (record.enhanced_activity) {
        console.log('\n📋 Enhanced activity sample:', record.enhanced_activity);
      }
    }
    
    // Get count of records
    const { count, error: countError } = await supabase
      .from('representatives_core')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`\n📊 Total records in representatives_core: ${count}`);
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

getTableStructure();
