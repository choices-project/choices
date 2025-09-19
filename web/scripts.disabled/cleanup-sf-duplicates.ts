// web/scripts/cleanup-sf-duplicates.ts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

async function cleanupDuplicates() {
  console.log('🧹 Cleaning up SF local duplicate data...');

  // First, let's see what we have
  const { data: allSF, error: fetchError } = await supabase
    .from('civics_representatives')
    .select('*')
    .eq('level', 'local')
    .eq('jurisdiction', 'San Francisco, CA')
    .order('office', { ascending: true });

  if (fetchError) {
    console.error('❌ Fetch error:', fetchError);
    return;
  }

  console.log(`📊 Found ${allSF.length || 0} SF local records`);

  // Group by office to find duplicates
  const officeGroups = allSF.reduce((acc: any, rep: any) => {
    if (!acc[rep.office]) acc[rep.office] = [];
    acc[rep.office].push(rep);
    return acc;
  }, {}) || {};

  // Find offices with duplicates
  const duplicates = Object.entries(officeGroups).filter(([_office, reps]: [string, any]) => reps.length > 1);

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!');
    return;
  }

  console.log(`🔍 Found ${duplicates.length} offices with duplicates:`);
  duplicates.forEach(([office, reps]: [string, any]) => {
    console.log(`  📋 ${office}: ${reps.length} records`);
    reps.forEach((rep: any, i: number) => {
      console.log(`    ${i + 1}. ${rep.name} (ID: ${rep.id})`);
    });
  });

  // For Mayor office, keep only Daniel Lurie (the current one)
  const mayorRecords = officeGroups['Mayor'] || [];
  if (mayorRecords.length > 1) {
    console.log('\n🏛️ Cleaning up Mayor duplicates...');
    
    // Keep Daniel Lurie, remove London Breed
    const danielLurie = mayorRecords.find((r: any) => r.name === 'Daniel Lurie');
    const londonBreed = mayorRecords.find((r: any) => r.name === 'London Breed');
    
    if (danielLurie && londonBreed) {
      console.log(`  ✅ Keeping: ${danielLurie.name} (ID: ${danielLurie.id})`);
      console.log(`  🗑️ Removing: ${londonBreed.name} (ID: ${londonBreed.id})`);
      
      const { error: deleteError } = await supabase
        .from('civics_representatives')
        .delete()
        .eq('id', londonBreed.id);
      
      if (deleteError) {
        console.error('❌ Delete error:', deleteError);
      } else {
        console.log('  ✅ Successfully removed London Breed');
      }
    }
  }

  // Check for any other duplicates and clean them up
  for (const [office, reps] of duplicates) {
    if (office === 'Mayor') continue; // Already handled
    
    console.log(`\n🔍 Cleaning up ${office} duplicates...`);
    
    // Keep the most recent one (highest ID or most recent timestamp)
    const sortedReps = (reps as any[]).sort((a: any, b: any) => {
      if (a.raw_payload?.last_updated && b.raw_payload?.last_updated) {
        return new Date(b.raw_payload.last_updated).getTime() - new Date(a.raw_payload.last_updated).getTime();
      }
      return b.id - a.id; // Fallback to ID
    });
    
    const keepRep = sortedReps[0];
    const removeReps = sortedReps.slice(1);
    
    console.log(`  ✅ Keeping: ${keepRep.name} (ID: ${keepRep.id})`);
    
    for (const rep of removeReps) {
      console.log(`  🗑️ Removing: ${rep.name} (ID: ${rep.id})`);
      
      const { error: deleteError } = await supabase
        .from('civics_representatives')
        .delete()
        .eq('id', rep.id);
      
      if (deleteError) {
        console.error('❌ Delete error:', deleteError);
      } else {
        console.log('  ✅ Successfully removed');
      }
    }
  }

  console.log('\n🎉 Duplicate cleanup complete!');
}

cleanupDuplicates().catch(e => { 
  console.error('❌ Cleanup failed:', e); 
  process.exit(1); 
});


