// web/scripts/test-sf-local-data.ts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

async function testSFData() {
  console.log('🔍 Testing SF local government data...\n');

  // Test SF local representatives
  const { data: sfReps, error: sfError } = await supabase
    .from('civics_representatives')
    .select('*')
    .eq('level', 'local')
    .eq('jurisdiction', 'San Francisco, CA')
    .order('office', { ascending: true });

  if (sfError) {
    console.error('❌ SF reps error:', sfError);
  } else {
    console.log(`✅ SF Local Representatives: ${sfReps.length || 0} records`);
    
    if (sfReps && sfReps.length > 0) {
      console.log('\n📋 SF Local Officials:');
      sfReps.forEach((rep, index) => {
        console.log(`  ${index + 1}. ${rep.name} - ${rep.office}`);
        if (rep.party) console.log(`     Party: ${rep.party}`);
        if (rep.contact?.email) console.log(`     Email: ${rep.contact.email}`);
        if (rep.contact?.website) console.log(`     Website: ${rep.contact.website}`);
        console.log('');
      });
    }
  }

  // Test SF divisions
  const { data: sfDivs, error: divError } = await supabase
    .from('civics_divisions')
    .select('*')
    .eq('level', 'local')
    .eq('state', 'CA');

  if (divError) {
    console.error('❌ SF divisions error:', divError);
  } else {
    console.log(`✅ SF Divisions: ${sfDivs.length || 0} records`);
    if (sfDivs && sfDivs.length > 0) {
      console.log('\n🏛️ SF Divisions:');
      sfDivs.forEach((div, index) => {
        console.log(`  ${index + 1}. ${div.name} (${div.chamber})`);
      });
    }
  }

  // Test by office type
  const { data: citywide, error: _cityError } = await supabase
    .from('civics_representatives')
    .select('*')
    .eq('level', 'local')
    .eq('jurisdiction', 'San Francisco, CA')
    .not('office', 'like', 'Supervisor%');

  const { data: supervisors, error: _supError } = await supabase
    .from('civics_representatives')
    .select('*')
    .eq('level', 'local')
    .eq('jurisdiction', 'San Francisco, CA')
    .like('office', 'Supervisor%');

  console.log('\n📊 SF Data Breakdown:');
  console.log(`  🏛️ Citywide Officials: ${citywide?.length || 0}`);
  console.log(`  👥 Board of Supervisors: ${supervisors?.length || 0}`);
  console.log(`  📋 Total SF Local: ${(citywide?.length || 0) + (supervisors?.length || 0)}`);

  console.log('\n🎉 SF local data test complete!');
}

testSFData().catch(e => { 
  console.error('❌ Test failed:', e); 
  process.exit(1); 
});


