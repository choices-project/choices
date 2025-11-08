#!/usr/bin/env tsx
/**
 * Cleanup Duplicate Records Script
 *
 * Removes duplicate George Whitesides records and other duplicates
 *
 * Created: October 28, 2025
 * Status: ✅ CLEANUP
 */
import dotenv from 'dotenv';
import { createSupabaseClient } from '../lib/index.js';
// Load environment variables
dotenv.config({ path: '.env.local' });
async function cleanupDuplicates() {
    console.log('🧹 Starting Duplicate Cleanup');
    console.log('============================');
    try {
        // Initialize Supabase client
        const supabase = await createSupabaseClient();
        console.log('✅ Supabase client initialized');
        // Check current count
        const { count: beforeCount } = await supabase
            .from('representatives_core')
            .select('*', { count: 'exact', head: true });
        console.log(`📊 Before cleanup: ${beforeCount} records`);
        // Delete all George Whitesides duplicates
        console.log('🗑️  Deleting George Whitesides duplicates...');
        const { error: deleteError } = await supabase
            .from('representatives_core')
            .delete()
            .eq('canonical_id', 'person_george_whitesides_California_27');
        if (deleteError) {
            console.error('Error deleting George Whitesides duplicates:', deleteError);
        }
        else {
            console.log('✅ George Whitesides duplicates deleted');
        }
        // Delete any other records with "unknown" in the canonical_id
        console.log('🗑️  Deleting unknown name duplicates...');
        const { error: unknownDeleteError } = await supabase
            .from('representatives_core')
            .delete()
            .like('canonical_id', '%unknown%');
        if (unknownDeleteError) {
            console.error('Error deleting unknown name duplicates:', unknownDeleteError);
        }
        else {
            console.log('✅ Unknown name duplicates deleted');
        }
        // Check final count
        const { count: afterCount } = await supabase
            .from('representatives_core')
            .select('*', { count: 'exact', head: true });
        console.log(`📊 After cleanup: ${afterCount} records`);
        console.log(`🗑️  Removed: ${(beforeCount || 0) - (afterCount || 0)} duplicate records`);
        // Show sample of remaining records
        const { data: sample, error: sampleError } = await supabase
            .from('representatives_core')
            .select('id, name, canonical_id, state, level')
            .limit(5)
            .order('created_at', { ascending: false });
        if (sampleError) {
            console.error('Error fetching sample:', sampleError);
        }
        else {
            console.log('\n📋 Sample of remaining records:');
            sample?.forEach(record => {
                console.log(`   ${record.id}: ${record.name} (${record.canonical_id}) - ${record.state} ${record.level}`);
            });
        }
        console.log('\n✅ Cleanup completed successfully!');
    }
    catch (error) {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    }
}
// Run the cleanup
cleanupDuplicates().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=cleanup-duplicates.js.map