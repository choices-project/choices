#!/usr/bin/env node

/**
 * @fileoverview Clean up duplicate representative records
 * @version 1.0.0
 * @since 2025-10-25
 * @feature CIVICS_DUPLICATE_CLEANUP
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

/**
 * Clean up duplicate representative records
 */
async function cleanupDuplicates() {
  console.log('🧹 Cleaning up duplicate representative records...\n');
  
  try {
    // Find all representatives with duplicate canonical IDs
    const { data: duplicates, error: dupError } = await supabase
      .from('representatives_core')
      .select('canonical_id, id, name, created_at, data_quality_score')
      .not('canonical_id', 'is', null)
      .order('canonical_id, created_at');
    
    if (dupError) {
      console.error('❌ Error fetching duplicates:', dupError);
      return;
    }
    
    // Group by canonical_id
    const grouped = {};
    duplicates.forEach(rep => {
      if (!grouped[rep.canonical_id]) {
        grouped[rep.canonical_id] = [];
      }
      grouped[rep.canonical_id].push(rep);
    });
    
    // Find canonical IDs with duplicates
    const duplicateGroups = Object.entries(grouped).filter(([canonicalId, reps]) => reps.length > 1);
    
    console.log(`📊 Found ${duplicateGroups.length} canonical IDs with duplicates`);
    
    let totalDeleted = 0;
    
    for (const [canonicalId, reps] of duplicateGroups) {
      console.log(`\n🔍 Processing canonical ID: ${canonicalId}`);
      console.log(`   Found ${reps.length} duplicates`);
      
      // Keep the first record (oldest), delete the rest
      const sortedReps = reps.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const keepRep = sortedReps[0];
      const deleteReps = sortedReps.slice(1);
      
      console.log(`   Keeping: ID ${keepRep.id} (${keepRep.name}) - Quality: ${keepRep.data_quality_score}`);
      
      for (const deleteRep of deleteReps) {
        console.log(`   Deleting: ID ${deleteRep.id} (${deleteRep.name}) - Quality: ${deleteRep.data_quality_score}`);
        
        // Delete the duplicate record
        const { error: deleteError } = await supabase
          .from('representatives_core')
          .delete()
          .eq('id', deleteRep.id);
        
        if (deleteError) {
          console.error(`   ❌ Error deleting ID ${deleteRep.id}:`, deleteError.message);
        } else {
          console.log(`   ✅ Deleted ID ${deleteRep.id}`);
          totalDeleted++;
        }
      }
    }
    
    console.log(`\n✅ Cleanup complete! Deleted ${totalDeleted} duplicate records`);
    
    // Show final statistics
    const { data: finalCount, error: countError } = await supabase
      .from('representatives_core')
      .select('id', { count: 'exact' });
    
    if (!countError) {
      console.log(`📊 Final record count: ${finalCount.length}`);
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Run the cleanup
cleanupDuplicates().catch(console.error);
