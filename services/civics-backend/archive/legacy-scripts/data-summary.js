#!/usr/bin/env node

/**
 * Data Summary
 * 
 * Script to show a comprehensive summary of existing data
 * to understand what's already been processed
 */

// Load environment variables
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function showDataSummary() {
  console.log('📊 Civics Backend Data Summary');
  console.log('================================\n');

  try {
    // Representatives Core Summary
    const { data: reps, error: repsError } = await supabase
      .from('representatives_core')
      .select('level, state, is_active, created_at');

    if (repsError) {
      console.error('❌ Error fetching representatives:', repsError);
      return;
    }

    console.log('🏛️ Representatives Core:');
    console.log(`   Total Records: ${reps?.length || 0}`);
    
    if (reps && reps.length > 0) {
      // Count by level
      const levelCounts = {};
      const stateCounts = {};
      const activeCounts = { active: 0, inactive: 0 };
      
      reps.forEach(rep => {
        levelCounts[rep.level] = (levelCounts[rep.level] || 0) + 1;
        stateCounts[rep.state] = (stateCounts[rep.state] || 0) + 1;
        if (rep.is_active) activeCounts.active++;
        else activeCounts.inactive++;
      });

      console.log(`   By Level:`);
      Object.entries(levelCounts).forEach(([level, count]) => {
        console.log(`     - ${level}: ${count}`);
      });

      console.log(`   By Status:`);
      console.log(`     - Active: ${activeCounts.active}`);
      console.log(`     - Inactive: ${activeCounts.inactive}`);

      console.log(`   Top States:`);
      Object.entries(stateCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([state, count]) => {
          console.log(`     - ${state}: ${count}`);
        });
    }

    // Crosswalk Summary
    const { data: crosswalk, error: crosswalkError } = await supabase
      .from('id_crosswalk')
      .select('source, entity_type');

    if (crosswalkError) {
      console.error('❌ Error fetching crosswalk:', crosswalkError);
    } else {
      console.log(`\n🔗 ID Crosswalk:`);
      console.log(`   Total Records: ${crosswalk?.length || 0}`);
      
      if (crosswalk && crosswalk.length > 0) {
        const sourceCounts = {};
        const entityCounts = {};
        
        crosswalk.forEach(entry => {
          sourceCounts[entry.source] = (sourceCounts[entry.source] || 0) + 1;
          entityCounts[entry.entity_type] = (entityCounts[entry.entity_type] || 0) + 1;
        });

        console.log(`   By Source:`);
        Object.entries(sourceCounts).forEach(([source, count]) => {
          console.log(`     - ${source}: ${count}`);
        });

        console.log(`   By Entity Type:`);
        Object.entries(entityCounts).forEach(([type, count]) => {
          console.log(`     - ${type}: ${count}`);
        });
      }
    }

    // Recent Activity
    console.log(`\n📅 Recent Activity:`);
    if (reps && reps.length > 0) {
      const recent = reps
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      
      recent.forEach(rep => {
        const date = new Date(rep.created_at).toLocaleDateString();
        console.log(`   - ${rep.name} (${rep.level}, ${rep.state}) - ${date}`);
      });
    }

    console.log(`\n✅ Data summary complete!`);
    console.log(`\n💡 The pipeline will automatically skip existing records to prevent duplication.`);

  } catch (error) {
    console.error('❌ Error generating summary:', error);
  }
}

// Run the summary
if (require.main === module) {
  showDataSummary()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { showDataSummary };
