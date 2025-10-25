#!/usr/bin/env node

/**
 * Data Migration Script: JSONB to Normalized Tables
 * 
 * Migrates existing JSONB data from representatives_core to normalized tables.
 * This script handles the transition from JSONB columns to relational structure.
 * 
 * Created: January 25, 2025
 * Status: ✅ ACTIVE
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role for data migration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

/**
 * Main migration function
 */
async function migrateJsonbToNormalized() {
  console.log('🔄 Starting JSONB to normalized tables migration...');
  
  try {
    // Step 1: Get all representatives with JSONB data
    console.log('📊 Fetching representatives with JSONB data...');
    const { data: representatives, error: fetchError } = await supabase
      .from('representatives_core')
      .select(`
        id,
        name,
        enhanced_contacts,
        enhanced_photos,
        enhanced_activity,
        enhanced_social_media
      `)
      .not('enhanced_contacts', 'is', null)
      .not('enhanced_contacts', 'eq', '[]');

    if (fetchError) {
      throw new Error(`Failed to fetch representatives: ${fetchError.message}`);
    }

    console.log(`📋 Found ${representatives?.length || 0} representatives with JSONB data`);

    if (!representatives || representatives.length === 0) {
      console.log('✅ No JSONB data found to migrate');
      return;
    }

    // Step 2: Migrate each representative's data
    let migratedCount = 0;
    let errorCount = 0;

    for (const rep of representatives) {
      try {
        console.log(`🔄 Migrating data for ${rep.name} (ID: ${rep.id})`);
        
        // Migrate contacts
        if (rep.enhanced_contacts && Array.isArray(rep.enhanced_contacts)) {
          await migrateContacts(rep.id, rep.enhanced_contacts);
        }

        // Migrate photos
        if (rep.enhanced_photos && Array.isArray(rep.enhanced_photos)) {
          await migratePhotos(rep.id, rep.enhanced_photos);
        }

        // Migrate activity
        if (rep.enhanced_activity && Array.isArray(rep.enhanced_activity)) {
          await migrateActivity(rep.id, rep.enhanced_activity);
        }

        // Migrate social media
        if (rep.enhanced_social_media && Array.isArray(rep.enhanced_social_media)) {
          await migrateSocialMedia(rep.id, rep.enhanced_social_media);
        }

        migratedCount++;
        console.log(`✅ Successfully migrated ${rep.name}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating ${rep.name}: ${error.message}`);
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Successfully migrated: ${migratedCount} representatives`);
    console.log(`❌ Errors: ${errorCount} representatives`);
    console.log(`📋 Total processed: ${representatives.length} representatives`);

  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

/**
 * Migrate contacts data
 */
async function migrateContacts(representativeId, contacts) {
  for (const contact of contacts) {
    const { error } = await supabase
      .from('representative_contacts')
      .insert({
        representative_id: representativeId,
        contact_type: contact.type || 'email',
        value: contact.value || '',
        is_verified: contact.isVerified || contact.is_verified || false,
        source: contact.source || 'migration',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.log(`⚠️  Error inserting contact: ${error.message}`);
    }
  }
}

/**
 * Migrate photos data
 */
async function migratePhotos(representativeId, photos) {
  for (const photo of photos) {
    const { error } = await supabase
      .from('representative_photos')
      .insert({
        representative_id: representativeId,
        url: photo.url || '',
        is_primary: photo.isPrimary || photo.is_primary || false,
        source: photo.source || 'migration',
        alt_text: photo.altText || photo.alt_text || null,
        attribution: photo.attribution || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.log(`⚠️  Error inserting photo: ${error.message}`);
    }
  }
}

/**
 * Migrate activity data
 */
async function migrateActivity(representativeId, activities) {
  for (const activity of activities) {
    const { error } = await supabase
      .from('representative_activity')
      .insert({
        representative_id: representativeId,
        type: activity.type || 'biography',
        title: activity.title || '',
        description: activity.description || '',
        date: activity.date || new Date().toISOString(),
        source: activity.source || 'migration',
        metadata: activity.metadata || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.log(`⚠️  Error inserting activity: ${error.message}`);
    }
  }
}

/**
 * Migrate social media data
 */
async function migrateSocialMedia(representativeId, socialMedia) {
  for (const social of socialMedia) {
    const { error } = await supabase
      .from('representative_social_media')
      .insert({
        representative_id: representativeId,
        platform: social.platform || 'twitter',
        handle: social.handle || '',
        url: social.url || '',
        is_verified: social.verified || social.is_verified || false,
        is_primary: social.primary || social.is_primary || false,
        follower_count: social.followersCount || social.follower_count || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.log(`⚠️  Error inserting social media: ${error.message}`);
    }
  }
}

/**
 * Clean up JSONB columns after migration
 */
async function cleanupJsonbColumns() {
  console.log('🧹 Cleaning up JSONB columns...');
  
  try {
    // Note: This would require ALTER TABLE statements
    // For safety, we'll just log what would be done
    console.log('📝 To clean up JSONB columns, run these SQL commands:');
    console.log('ALTER TABLE representatives_core DROP COLUMN IF EXISTS enhanced_contacts;');
    console.log('ALTER TABLE representatives_core DROP COLUMN IF EXISTS enhanced_photos;');
    console.log('ALTER TABLE representatives_core DROP COLUMN IF EXISTS enhanced_activity;');
    console.log('ALTER TABLE representatives_core DROP COLUMN IF EXISTS enhanced_social_media;');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateJsonbToNormalized()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = {
  migrateJsonbToNormalized,
  migrateContacts,
  migratePhotos,
  migrateActivity,
  migrateSocialMedia,
  cleanupJsonbColumns
};
