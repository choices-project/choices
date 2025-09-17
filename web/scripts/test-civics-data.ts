// web/scripts/test-civics-data.ts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

async function testData() {
  console.log('🔍 Testing civics data...\n');

  // Test divisions
  const { data: divisions, error: divError } = await supabase
    .from('civics_divisions')
    .select('*')
    .limit(5);

  if (divError) {
    console.error('❌ Divisions error:', divError);
  } else {
    console.log(`✅ Divisions: ${divisions?.length || 0} records`);
    if (divisions && divisions.length > 0) {
      console.log('   Sample:', divisions[0]);
    }
  }

  // Test representatives
  const { data: reps, error: repError } = await supabase
    .from('civics_representatives')
    .select('*')
    .limit(5);

  if (repError) {
    console.error('❌ Representatives error:', repError);
  } else {
    console.log(`✅ Representatives: ${reps?.length || 0} records`);
    if (reps && reps.length > 0) {
      console.log('   Sample:', {
        name: reps[0].name,
        office: reps[0].office,
        level: reps[0].level,
        jurisdiction: reps[0].jurisdiction
      });
    }
  }

  // Test by state
  const { data: caReps, error: caError } = await supabase
    .from('civics_representatives')
    .select('*')
    .eq('jurisdiction', 'US')
    .eq('level', 'federal')
    .limit(10);

  if (caError) {
    console.error('❌ CA reps error:', caError);
  } else {
    console.log(`✅ CA Federal Reps: ${caReps?.length || 0} records`);
    if (caReps && caReps.length > 0) {
      console.log('   Sample CA rep:', {
        name: caReps[0].name,
        office: caReps[0].office,
        party: caReps[0].party
      });
    }
  }

  // Count by level
  const { data: levelCounts, error: levelError } = await supabase
    .from('civics_representatives')
    .select('level')
    .not('level', 'is', null);

  if (levelError) {
    console.error('❌ Level counts error:', levelError);
  } else {
    const counts = levelCounts?.reduce((acc: any, rep: any) => {
      acc[rep.level] = (acc[rep.level] || 0) + 1;
      return acc;
    }, {});
    console.log('✅ Level counts:', counts);
  }

  console.log('\n🎉 Data test complete!');
}

testData().catch(e => { 
  console.error('❌ Test failed:', e); 
  process.exit(1); 
});


